import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

const Products = () => {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  
  // Local state for sidebar filters
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const selectedCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'default';
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 12,
          includeHidden: 'false'
        });

        if (selectedCategory && selectedCategory !== 'All') {
          queryParams.append('category', selectedCategory);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        if (searchParams.get('minPrice')) {
          queryParams.append('minPrice', searchParams.get('minPrice'));
        }
        if (searchParams.get('maxPrice')) {
          queryParams.append('maxPrice', searchParams.get('maxPrice'));
        }
        if (currentSort && currentSort !== 'default') {
          queryParams.append('sort', currentSort);
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/products?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products);
          setPagination({
            currentPage: data.pagination.currentPage,
            totalPages: data.pagination.totalPages
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [searchParams, currentPage, selectedCategory, searchQuery, currentSort]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === 'All' || value === 'default') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset page to 1 on filter modification
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleApplyPriceFilter = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (minPrice) newParams.set('minPrice', minPrice);
    else newParams.delete('minPrice');

    if (maxPrice) newParams.set('maxPrice', maxPrice);
    else newParams.delete('maxPrice');

    newParams.delete('page');
    setSearchParams(newParams);
    setShowFiltersMobile(false);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      {/* Header and Page Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Our Collection</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Browse and filter high-quality stationery, gift wrapping, toys & more</p>
        </div>

        {/* Search input in products view */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search products..." 
            defaultValue={searchQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParam('search', e.target.value);
              }
            }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-5 py-2.5 pl-12 text-sm focus:border-primary outline-none transition-colors"
          />
          <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex gap-8 relative items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl gap-8 sticky top-24">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-base flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
            </span>
            <button onClick={handleClearFilters} className="text-xs text-rose-500 font-bold hover:underline">Clear All</button>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-wide">Categories</h3>
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-2">
              <button 
                onClick={() => updateParam('category', 'All')}
                className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${selectedCategory === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                All Categories
              </button>
              {settings.categories && settings.categories.map((cat, idx) => (
                <button 
                  key={idx}
                  onClick={() => updateParam('category', cat)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${selectedCategory === cat ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <form onSubmit={handleApplyPriceFilter} className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-wide">Price Range</h3>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary text-center"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary text-center"
              />
            </div>
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2 rounded-xl transition-all shadow-md shadow-primary/10">
              Apply
            </button>
          </form>
        </aside>

        {/* Content Workspace */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Controls Bar (Sorting, Mobile Filter toggle) */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-3xl">
            <button 
              onClick={() => setShowFiltersMobile(true)}
              className="lg:hidden flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-bold transition-all"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Showing {products.length} products
            </span>

            {/* Sorting */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select 
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="default">Default Sorting</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Grid Products Display */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-80 rounded-3xl shimmer"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <span className="text-4xl">📦</span>
              <h3 className="font-extrabold text-lg">No Products Found</h3>
              <p className="text-slate-400 text-sm max-w-sm">We couldn't find any products matching your criteria. Try adjusting your query or price filters.</p>
              <button onClick={handleClearFilters} className="bg-primary text-white font-bold text-xs px-6 py-2 rounded-full shadow-md shadow-primary/20">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button 
                onClick={() => updateParam('page', currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:border-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => updateParam('page', pageNum)}
                  className={`h-8 w-8 rounded-xl font-bold text-xs transition-colors ${currentPage === pageNum ? 'bg-primary text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary'}`}
                >
                  {pageNum}
                </button>
              ))}
              <button 
                onClick={() => updateParam('page', currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:border-primary transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter Slideover */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-80 h-full bg-white dark:bg-slate-900 p-6 flex flex-col gap-6 animate-slideLeft shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-base">Filters</span>
              <button onClick={() => setShowFiltersMobile(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-sm tracking-wide">Categories</h3>
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => { updateParam('category', 'All'); setShowFiltersMobile(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${selectedCategory === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    All Categories
                  </button>
                  {settings.categories && settings.categories.map((cat, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { updateParam('category', cat); setShowFiltersMobile(false); }}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${selectedCategory === cat ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleApplyPriceFilter} className="flex flex-col gap-3">
                <h3 className="font-bold text-sm tracking-wide">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md">
                  Apply Filters
                </button>
              </form>
              <button onClick={() => { handleClearFilters(); setShowFiltersMobile(false); }} className="text-xs text-rose-500 font-bold border border-rose-200 py-2.5 rounded-xl">
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-Component: Product Card Grid Item (Duplicate declaration from Home.jsx scope,
// to make the components decoupled and self-contained)
const ProductCard = ({ product }) => {
  const mainImage = product.images && product.images[0] ? product.images[0] : 'https://picsum.photos/400/400?random=' + product.id;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Link to={`/products/${product.id}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col h-full">
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img 
          src={mainImage} 
          alt={product.name} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.discount_price && (
          <span className="absolute top-4 left-4 bg-rose-500 text-white font-bold text-xs px-3 py-1 rounded-full">
            Sale
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-500 text-white font-extrabold text-sm px-4 py-1.5 rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-2">
        <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{product.category}</span>
        <h3 className="font-bold text-sm line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="mt-auto flex items-center gap-2 pt-2">
          {product.discount_price ? (
            <>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">?{parseFloat(product.discount_price).toFixed(2)}</span>
              <span className="text-xs text-slate-400 line-through">?{parseFloat(product.price).toFixed(2)}</span>
            </>
          ) : (
            <span className="font-extrabold text-slate-900 dark:text-slate-100">?{parseFloat(product.price).toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default Products;
