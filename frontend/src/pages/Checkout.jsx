import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, CreditCard, DollarSign, Calendar } from 'lucide-react';

const Checkout = ({ cart, onClearCart }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'online'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = cart.reduce((sum, item) => {
    const price = item.discount_price !== null ? item.discount_price : item.price;
    return sum + (parseFloat(price) * item.quantity);
  }, 0);

  // Generate tomorrow's date as min date
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !pickupDate || !pickupTime) {
      setError("Please fill in all the details.");
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      payment_method: paymentMethod,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        onClearCart();
        navigate(`/order-confirmation?orderId=${data.orderId}&orderNumber=${data.orderNumber}`);
      } else {
        setError(data.message || "Failed to process order.");
      }
    } catch (err) {
      setError("Server connection issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center gap-4">
        <h2 className="font-extrabold text-xl">No items to checkout</h2>
        <Link to="/products" className="bg-primary text-white px-6 py-2.5 rounded-full font-bold">
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      <Link to="/cart" className="text-slate-500 hover:text-primary transition-colors flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" /> Back to Cart
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pickup Checkout</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Specify your details and scheduled pickup slot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Checkout Details Form */}
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-2 flex flex-col gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl">
          <h2 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">1. Contact & Pickup Details</h2>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl text-xs text-rose-500 font-bold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer Name</label>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mobile Phone Number</label>
              <input 
                type="tel" 
                placeholder="Phone (e.g. +12345678)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" /> Pickup Date
              </label>
              <input 
                type="date" 
                min={getMinDate()}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" /> Pickup Time Slot
              </label>
              <input 
                type="time" 
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <h2 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 mt-6">2. Choose Payment Method</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
            >
              <div className="h-10 w-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Pay on Pickup</h4>
                <p className="text-xs text-slate-400 mt-1">Settle payment in cash or card at the store counter</p>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
            >
              <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Pay Online (Simulation)</h4>
                <p className="text-xs text-slate-400 mt-1">Mock online payment processor integration</p>
              </div>
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? "Confirming Order..." : "Confirm & Place Pickup Order"}
          </button>
        </form>

        {/* Side Panel Summary */}
        <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col gap-6">
          <h3 className="font-extrabold text-base border-b border-slate-100 dark:border-slate-800 pb-3">Basket Details</h3>
          
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
            {cart.map(item => {
              const price = item.discount_price !== null ? item.discount_price : item.price;
              return (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="font-bold truncate block text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-slate-400 text-[10px]">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">${(parseFloat(price) * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between font-extrabold text-base">
            <span>Total to Pay</span>
            <span className="text-primary">?{totalAmount.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
