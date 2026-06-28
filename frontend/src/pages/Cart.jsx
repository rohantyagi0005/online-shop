import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';

const Cart = ({ cart, onUpdateCartQty, onRemoveFromCart, onClearCart }) => {
  const navigate = useNavigate();

  const totalAmount = cart.reduce((sum, item) => {
    const price = item.discount_price !== null ? item.discount_price : item.price;
    return sum + (parseFloat(price) * item.quantity);
  }, 0);

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Pickup Cart</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review the items in your basket before selecting a pickup slot</p>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <span className="text-5xl">🛒</span>
          <h2 className="font-extrabold text-xl">Your Cart is Empty</h2>
          <p className="text-slate-400 text-sm max-w-sm">Looks like you haven't added any products to your cart yet. Visit our shop catalog to browse items.</p>
          <Link to="/products" className="bg-primary text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-primary/20">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{cart.length} item(s)</span>
              <button 
                onClick={onClearCart}
                className="text-xs text-rose-500 hover:underline font-bold flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Cart
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {cart.map(item => {
                const itemPrice = item.discount_price !== null ? item.discount_price : item.price;
                const mainImage = item.images && item.images[0] ? item.images[0] : 'https://picsum.photos/400/400?random=' + item.id;
                
                return (
                  <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition-colors">
                    {/* Product Image */}
                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={mainImage} alt={item.name} className="object-cover w-full h-full" />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.category}</span>
                      <h3 className="font-bold text-sm truncate text-slate-800 dark:text-slate-100">{item.name}</h3>
                      <span className="text-xs text-slate-400 font-medium">Stock left: {item.stock_quantity}</span>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                      <button 
                        onClick={() => onUpdateCartQty(item.id, item.quantity - 1)}
                        className="p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 font-bold text-xs">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateCartQty(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        className="p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Pricing */}
                    <div className="text-right flex flex-col gap-1 flex-shrink-0 min-w-[70px]">
                      <span className="font-extrabold text-sm">${(parseFloat(itemPrice) * item.quantity).toFixed(2)}</span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-400">?{parseFloat(itemPrice).toFixed(2)} each</span>
                      )}
                    </div>

                    {/* Remove */}
                    <button 
                      onClick={() => onRemoveFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Summary */}
          <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col gap-6 sticky top-24">
            <h3 className="font-extrabold text-lg tracking-wide border-b border-slate-100 dark:border-slate-800 pb-3">Summary</h3>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal</span>
                <span>?{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span>Pickup Fee</span>
                <span className="text-emerald-500 font-bold">FREE</span>
              </div>
              <div className="flex justify-between font-extrabold text-base pt-2">
                <span>Total Amount</span>
                <span className="text-primary">?{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
              📌 Order must be collected from our store. Payment can be settled cash during pickup, or paid online beforehand.
            </div>

            <button 
              onClick={handleCheckoutClick}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group w-full"
            >
              Select Pickup Details <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
