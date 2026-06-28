import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, QrCode, ArrowRight } from 'lucide-react';

const Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/my-orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="text-sm text-slate-400">Loading order history...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">My Pickup Orders</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View your order receipts and presentation QR codes for pickup verification</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <span className="text-5xl">🛍️</span>
          <h2 className="font-extrabold text-xl">No Orders Found</h2>
          <p className="text-slate-400 text-sm max-w-sm">You haven't placed any pickup orders yet. Explore our catalog and add items for pickup.</p>
          <Link to="/products" className="bg-primary text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-primary/20">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => {
            const dateStr = new Date(order.created_at).toLocaleDateString();
            const pickupDateStr = new Date(order.pickup_date).toLocaleDateString();

            const statusColors = {
              pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-500 border border-amber-200 dark:border-amber-900/50',
              ready_for_pickup: 'bg-primary/10 text-primary border border-primary/20',
              collected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-900/50',
              cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-500 border border-rose-200 dark:border-rose-900/50'
            };

            const paymentColors = {
              pending: 'bg-amber-500/10 text-amber-500',
              paid: 'bg-emerald-500/10 text-emerald-500',
              refunded: 'bg-rose-500/10 text-rose-500'
            };

            return (
              <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all">
                {/* Order Summary & Identity */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{order.order_number}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${statusColors[order.order_status]}`}>
                      {order.order_status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${paymentColors[order.payment_status]}`}>
                      {order.payment_status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Ordered {dateStr}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Pickup Scheduled: {pickupDateStr} at {order.pickup_time}</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-lg mt-1">
                    Items: <span className="font-normal text-slate-500">{order.items_summary || 'No description available'}</span>
                  </p>
                </div>

                {/* Bill Amount & QR Link */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                  <div className="text-left md:text-right flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400 font-bold">Total Amount</span>
                    <span className="font-extrabold text-base text-slate-800 dark:text-slate-100">?{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>

                  <Link 
                    to={`/order-confirmation?orderId=${order.id}&orderNumber=${order.order_number}`}
                    className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all"
                  >
                    <QrCode className="h-4 w-4 text-primary" /> View QR <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
