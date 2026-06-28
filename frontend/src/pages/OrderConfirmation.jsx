import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Calendar, Clock, Phone, FileText, ArrowRight } from 'lucide-react';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setDetails(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center justify-center gap-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="text-sm text-slate-400">Loading receipt details...</span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center flex flex-col items-center gap-4">
        <h2 className="font-extrabold text-xl">Receipt Details Not Found</h2>
        <Link to="/" className="bg-primary text-white px-6 py-2.5 rounded-full font-bold">
          Go Home
        </Link>
      </div>
    );
  }

  const { order, items } = details;
  const qrString = order.qr_code || order.order_number;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      {/* Success Badge */}
      <div className="flex flex-col items-center text-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl">
        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
          <Check className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Order Confirmed!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Thank you, your pickup reservation has been successfully placed</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 rounded-full border border-slate-100 dark:border-slate-800 mt-2 font-bold text-sm tracking-wide">
          Order ID: <span className="text-primary">{order.order_number}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* QR Code Presentation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 shadow-lg">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
            <QRCodeSVG value={qrString} size={180} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Pickup QR Code</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Present this QR code to the cashier during store collection to load your reservation.</p>
          </div>
        </div>

        {/* Pickup Details Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-lg">
          <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">Pickup Instructions</h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 text-sm">
              <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">Scheduled Date</span>
                <span className="text-slate-500 dark:text-slate-400">{new Date(order.pickup_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Clock className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">Scheduled Time</span>
                <span className="text-slate-500 dark:text-slate-400">{order.pickup_time}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Phone className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">Customer Support Contact</span>
                <span className="text-slate-500 dark:text-slate-400">{order.customer_phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">Payment Selection</span>
                <span className="text-slate-500 dark:text-slate-400 uppercase">{order.payment_method} ({order.payment_status})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Invoice List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-lg flex flex-col gap-6">
        <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">Itemized Receipt</h3>
        
        <div className="flex flex-col gap-4">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.product_name}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Qty: {item.quantity} | ?{parseFloat(item.price).toFixed(2)} each</span>
              </div>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
          
          <div className="flex justify-between font-extrabold text-base pt-2">
            <span>Total Bill</span>
            <span className="text-primary">?{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <Link to="/orders" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
          View Order History <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
