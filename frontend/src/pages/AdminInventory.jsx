import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Plus, Edit2, Trash2, Copy, Eye, EyeOff, Save, FolderPlus, ArrowLeft, Image } from 'lucide-react';

const AdminInventory = () => {
  const { token } = useAuth();
  const { settings, fetchSettings } = useSettings();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'form', 'bulk', 'categories'

  // Form states
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    discount_price: '',
    stock_quantity: '0',
    is_hidden: false
  });
  const [formFiles, setFormFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
  // Bulk stock state
  const [bulkStocks, setBulkStocks] = useState({}); // { productId: stockQty }

  // Add Category state
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products?includeHidden=true&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        
        // Populate bulk stocks mapping
        const stocks = {};
        data.products.forEach(p => {
          stocks[p.id] = p.stock_quantity;
        });
        setBulkStocks(stocks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setFormData({
      name: '',
      description: '',
      category: settings.categories[0] || '',
      price: '',
      discount_price: '',
      stock_quantity: '0',
      is_hidden: false
    });
    setFormFiles([]);
    setExistingImages([]);
    setImagesToDelete([]);
    setFormError('');
    setFormSuccess('');
  };

  const handleEditClick = (p) => {
    setEditId(p.id);
    setFormData({
      name: p.name,
      description: p.description || '',
      category: p.category,
      price: p.price,
      discount_price: p.discount_price || '',
      stock_quantity: String(p.stock_quantity),
      is_hidden: p.is_hidden === 1 || p.is_hidden === true
    });
    setExistingImages(p.images || []);
    setFormFiles([]);
    setImagesToDelete([]);
    setActiveTab('form');
  };

  const handleDuplicate = async (id) => {
    if (!window.confirm("Duplicate this product?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Product duplicated successfully.");
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product? This action is irreversible.")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Product deleted successfully.");
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const body = new FormData();
    body.append('name', formData.name);
    body.append('description', formData.description);
    body.append('category', formData.category);
    body.append('price', formData.price);
    body.append('stock_quantity', formData.stock_quantity);
    body.append('is_hidden', formData.is_hidden);
    if (formData.discount_price) {
      body.append('discount_price', formData.discount_price);
    }

    if (formFiles.length > 0) {
      for (const file of formFiles) {
        body.append('images', file);
      }
    }

    if (editId) {
      // Append deleted images list
      if (imagesToDelete.length > 0) {
        imagesToDelete.forEach(img => body.append('delete_images', img));
      }
    }

    const url = editId 
      ? `${import.meta.env.VITE_API_URL}/products/${editId}`
      : `${import.meta.env.VITE_API_URL}/products`;

    const method = editId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body
      });
      const data = await response.json();
      if (response.ok) {
        setFormSuccess(editId ? "Product updated successfully." : "Product created successfully.");
        fetchProducts();
        setTimeout(() => {
          resetForm();
          setActiveTab('list');
        }, 1500);
      } else {
        setFormError(data.message || "Failed to save product.");
      }
    } catch (err) {
      setFormError("Server connection issue.");
    }
  };

  const handleBulkStockSubmit = async () => {
    const updates = Object.entries(bulkStocks).map(([id, stock]) => ({
      id: parseInt(id),
      stock: parseInt(stock)
    }));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products/bulk/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
      if (response.ok) {
        alert("Stock levels updated successfully.");
        fetchProducts();
        setActiveTab('list');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const updatedCategories = [...(settings.categories || []), newCategoryName.trim()];
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories: updatedCategories })
      });
      if (response.ok) {
        setNewCategoryName('');
        fetchSettings();
        alert("Category added successfully.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    const updatedCategories = settings.categories.filter(c => c !== catName);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories: updatedCategories })
      });
      if (response.ok) {
        fetchSettings();
        alert("Category deleted successfully.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-sans">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Inventory Manager</h1>
          <p className="text-xs text-slate-500 mt-0.5">Control products lists, categories, and adjust live stock levels</p>
        </div>
        <button 
          onClick={() => { resetForm(); setActiveTab('form'); }}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-primary/10"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-3 transition-colors relative ${activeTab === 'list' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Products List
        </button>
        <button 
          onClick={() => setActiveTab('bulk')}
          className={`pb-3 transition-colors relative ${activeTab === 'bulk' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Bulk Stock Update
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`pb-3 transition-colors relative ${activeTab === 'categories' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Manage Categories
        </button>
      </div>

      {/* Products List Tab */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4">Hidden</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {products.map(p => {
                  const mainImage = p.images && p.images[0] ? p.images[0] : 'https://picsum.photos/100/100?random=' + p.id;
                  const isOutOfStock = p.stock_quantity === 0;
                  const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={mainImage} alt="" className="h-10 w-10 object-cover rounded-lg border border-slate-200 bg-slate-100 dark:bg-slate-800" />
                        <div>
                          <span className="font-bold block text-slate-800 dark:text-slate-100">{p.name}</span>
                          <span className="text-[10px] text-slate-400">ID: {p.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{p.category}</td>
                      <td className="px-6 py-4">
                        {p.discount_price ? (
                          <div className="flex flex-col">
                            <span className="font-bold">?{parseFloat(p.discount_price).toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 line-through">?{parseFloat(p.price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="font-bold">?{parseFloat(p.price).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded border border-rose-100 dark:border-rose-900/50">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded border border-amber-100 dark:border-amber-900/50">{p.stock_quantity} left</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-100 dark:border-emerald-900/50">{p.stock_quantity} available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {p.is_hidden ? (
                          <EyeOff className="h-4 w-4 text-rose-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-emerald-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                        <button onClick={() => handleEditClick(p)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary rounded-xl transition-all" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDuplicate(p.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-500 rounded-xl transition-all" title="Duplicate">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-all" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Add/Edit Form Tab */}
      {activeTab === 'form' && (
        <form onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <button type="button" onClick={() => { resetForm(); setActiveTab('list'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-extrabold text-base">{editId ? "Edit Product" : "Create Product"}</h2>
          </div>

          {formError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl text-xs text-rose-500 font-bold leading-relaxed">
              ⚠️ {formError}
            </div>
          )}

          {formSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl text-xs text-emerald-500 font-bold leading-relaxed">
              💡 {formSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product Name</label>
              <input 
                type="text" 
                placeholder="Name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                required
              >
                <option value="">Select Category</option>
                {settings.categories && settings.categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Discount Price ($) (Optional)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={formData.discount_price}
                onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Stock Quantity</label>
              <input 
                type="number" 
                placeholder="0" 
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <label className="flex items-center gap-2 cursor-pointer pt-4 text-sm font-semibold select-none">
                <input 
                  type="checkbox" 
                  checked={formData.is_hidden}
                  onChange={(e) => setFormData({ ...formData, is_hidden: e.target.checked })}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary"
                /> Hide Product from Shop Catalog
              </label>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product Description</label>
              <textarea 
                rows="4" 
                placeholder="Product description..." 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none"
              ></textarea>
            </div>

            {/* Images Panel */}
            <div className="flex flex-col gap-3 md:col-span-2 mt-4">
              <h3 className="font-bold uppercase tracking-wider text-slate-500">Product Images</h3>
              
              {/* Existing Images edit */}
              {editId && existingImages.length > 0 && (
                <div className="flex flex-col gap-2 mb-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Existing Images (click to remove)</span>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((img, idx) => {
                      const isDeleted = imagesToDelete.includes(img);
                      return (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (isDeleted) {
                              setImagesToDelete(imagesToDelete.filter(i => i !== img));
                            } else {
                              setImagesToDelete([...imagesToDelete, img]);
                            }
                          }}
                          className={`relative h-20 w-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${isDeleted ? 'border-rose-500 opacity-40' : 'border-slate-200 hover:border-rose-500'}`}
                        >
                          <img src={img} alt="" className="object-cover w-full h-full" />
                          {isDeleted && (
                            <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center text-[10px] text-rose-500 font-extrabold">DELETED</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload input files */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Upload New Images (Drag & Drop)</span>
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-primary dark:hover:border-primary flex flex-col items-center justify-center text-center cursor-pointer transition-colors gap-2 select-none">
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFormFiles([...formFiles, ...Array.from(e.target.files)]);
                      }
                    }}
                    className="hidden" 
                  />
                  <Image className="h-10 w-10 text-slate-400" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Choose images or drag them here</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, or WEBP. Max size 5MB.</span>
                </label>
              </div>

              {/* Temp Files layout */}
              {formFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Pending Images to Upload</span>
                  <div className="flex flex-wrap gap-3">
                    {formFiles.map((file, idx) => (
                      <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 group">
                        <img src={URL.createObjectURL(file)} alt="" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => setFormFiles(formFiles.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button 
              type="button" 
              onClick={() => { resetForm(); setActiveTab('list'); }}
              className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="h-4 w-4" /> Save Product
            </button>
          </div>
        </form>
      )}

      {/* Bulk Stock Tab */}
      {activeTab === 'bulk' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-extrabold text-sm">Bulk Update Stock Levels</h2>
            <button 
              onClick={handleBulkStockSubmit}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 text-xs">
            {products.map(p => {
              const mainImage = p.images && p.images[0] ? p.images[0] : 'https://picsum.photos/100/100?random=' + p.id;
              return (
                <div key={p.id} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-3">
                    <img src={mainImage} alt="" className="h-10 w-10 object-cover rounded-lg" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{p.name}</span>
                      <span className="text-[10px] text-slate-400 block">{p.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Stock Qty:</span>
                    <input 
                      type="number" 
                      value={bulkStocks[p.id] !== undefined ? bulkStocks[p.id] : p.stock_quantity}
                      onChange={(e) => setBulkStocks({ ...bulkStocks, [p.id]: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-center font-bold text-xs w-20 outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-extrabold text-sm">Product Categories Manager</h2>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md">
            <input 
              type="text" 
              placeholder="Add new category (e.g. Greeting Cards)" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none flex-1"
              required
            />
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1">
              <FolderPlus className="h-4 w-4" /> Add
            </button>
          </form>

          {/* Categories list */}
          <div className="flex flex-col gap-3 max-w-lg mt-4">
            <h3 className="font-bold uppercase tracking-wider text-slate-500">Active Categories</h3>
            <div className="flex flex-col gap-2">
              {settings.categories && settings.categories.map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
