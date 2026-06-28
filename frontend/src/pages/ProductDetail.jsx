import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Plus, Minus, Check, AlertTriangle, XCircle } from 'lucide-react';

const ProductDetail = ({ onAddToCart }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data.product);
          setSimilar(data.similarProducts);
          setActiveImage(data.product.images && data.product.images[0] ? data.product.images[0] : 'https://picsum.photos/600/600?random=' + data.product.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    setQuantity(1); // reset qty on page navigate
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="aspect-square rounded-3xl shimmer"></div>
        <div className="flex flex-col gap-6 py-6">
          <div className="h-6 w-24 rounded shimmer"></div>
          <div className="h-10 w-3/4 rounded shimmer"></div>
          <div className="h-8 w-32 rounded shimmer"></div>
          <div className="h-24 w-full rounded shimmer"></div>
          <div className="h-12 w-48 rounded shimmer"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center gap-4">
        <span className="text-4xl">🔍</span>
        <h2 className="font-extrabold text-xl">Product Not Found</h2>
        <p className="text-slate-400 text-sm max-w-sm">The product you are looking for might have been deleted or hidden by the store owner.</p>
        <Link to="/products" className="bg-primary text-white font-bold px-6 py-2.5 rounded-full shadow-lg">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleQtyIncrease = () => {
    if (quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleQtyDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity);
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16 relative">
      {/* Toast Alert */}
      {addedToCartToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp font-semibold text-sm">
          <Check className="h-5 w-5 text-emerald-500 fill-emerald-500/20" /> Added {quantity} item(s) to pickup cart!
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Details Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Left Column: Images Gallery */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl relative">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="object-cover w-full h-full"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-rose-500 text-white font-extrabold text-sm px-6 py-2 rounded-full shadow-2xl">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 pr-2">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`h-20 w-20 bg-white dark:bg-slate-900 border-2 rounded-xl overflow-hidden flex-shrink-0 transition-all ${activeImage === img ? 'border-primary' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                >
                  <img src={img} alt="" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Descriptions & Add to Cart */}
        <div className="flex flex-col gap-6 py-4">
          {/* Category & Stock Status Tag */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">{product.category}</span>
            {isOutOfStock ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-900/50">
                <XCircle className="h-4 w-4" /> Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                <AlertTriangle className="h-4 w-4" /> Only {product.stock_quantity} left
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <Check className="h-4 w-4" /> Available In-Store
              </span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">{product.name}</h1>

          {/* Pricing */}
          <div className="flex items-center gap-4">
            {product.discount_price ? (
              <>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">?{parseFloat(product.discount_price).toFixed(2)}</span>
                <span className="text-lg text-slate-400 line-through">?{parseFloat(product.price).toFixed(2)}</span>
                <span className="bg-rose-500/10 text-rose-500 text-xs font-bold px-2 py-1 rounded-md">
                  Save ${(parseFloat(product.price) - parseFloat(product.discount_price)).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">?{parseFloat(product.price).toFixed(2)}</span>
            )}
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm tracking-wide text-slate-700 dark:text-slate-300">Description</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {product.description || 'No description provided.'}
            </p>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

          {/* Quantity and Actions */}
          {!isOutOfStock && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Qty</span>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-2 py-1.5">
                  <button 
                    onClick={handleQtyDecrease} 
                    disabled={quantity <= 1}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-5 font-bold text-sm min-w-[45px] text-center">{quantity}</span>
                  <button 
                    onClick={handleQtyIncrease} 
                    disabled={quantity >= product.stock_quantity}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full pt-6">
                <button 
                  onClick={handleAddToCartClick}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="h-5 w-5" /> Add for Pickup
                </button>
              </div>
            </div>
          )}

          {isOutOfStock && (
            <button 
              disabled 
              className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed font-bold py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-sm"
            >
              Temporarily Unavailable
            </button>
          )}

          {/* Pickup restriction disclaimer */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            💡 <strong>Store Pickup Only:</strong> This shop does not provide home delivery. You will choose a pickup date & time at checkout to collect your items from our store.
          </div>
        </div>
      </section>

      {/* Similar Products */}
      {similar && similar.length > 0 && (
        <section className="flex flex-col gap-6 border-t border-slate-200 dark:border-slate-800 pt-16">
          <h2 className="text-xl font-bold">Similar Products You Might Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similar.map(item => (
              <Link 
                key={item.id} 
                to={`/products/${item.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col gap-3 hover:border-primary transition-all group"
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                  <img src={item.main_image || 'https://picsum.photos/400/400?random=' + item.id} alt="" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h4 className="font-bold text-sm truncate text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</h4>
                <span className="font-extrabold text-sm">?{parseFloat(item.price).toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
