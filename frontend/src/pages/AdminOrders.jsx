import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, Phone, CheckCircle, Package, Archive, XCircle, ChevronDown, Check } from 'lucide-react';

const AdminOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Detail modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter && statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (paymentFilter && paymentFilter !== 'All') queryParams.append('paymentStatus', paymentFilter);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setOrders(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, paymentFilter, token]);

  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    setModalLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${order.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrderItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusUpdate = async (id, payload) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        // Reload details if modal is open
        if (selectedOrder && selectedOrder.id === id) {
          const updatedOrder = { ...selectedOrder, ...payload };
          setSelectedOrder(updatedOrder);
        }
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-sans text-xs relative">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Orders & Pickups</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track in-store pickups, update payment statuses, and review invoices</p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Search order #, customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pl-10 outline-none"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>

        {/* Pickup Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pickup Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-semibold outline-none cursor-pointer"
          >
            <option value="All">All Pickup Statuses</option>
            <option value="pending">Pending</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="collected">Collected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-semibold outline-none cursor-pointer"
          >
            <option value="All">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="h-96 w-full rounded-3xl shimmer"></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <span className="text-3xl">📥</span>
          <h3 className="font-extrabold text-base">No Orders Found</h3>
          <p className="text-slate-400 max-w-xs">No customer reservations matches the specified search queries or filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Order Number</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Pickup Time</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Pickup Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {orders.map(order => {
                  const pickupDate = new Date(order.pickup_date).toLocaleDateString();
                  
                  const statusStyles = {
                    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-500 border border-amber-200 dark:border-amber-900/50',
                    ready_for_pickup: 'bg-primary/10 text-primary border border-primary/20',
                    collected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-900/50',
                    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-500 border border-rose-200 dark:border-rose-900/50'
                  };

                  const paymentStyles = {
                    pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
                    paid: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
                    refunded: 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  };

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{order.order_number}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold">{order.customer_name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{order.customer_phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 font-bold"><Calendar className="h-3 w-3 text-slate-400" /> {pickupDate}</span>
                          <span className="text-[10px] text-slate-400 font-medium pl-4">{order.pickup_time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-slate-100">?{parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 font-bold rounded uppercase border ${paymentStyles[order.payment_status]}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 font-bold rounded-full uppercase border ${statusStyles[order.order_status]}`}>
                          {order.order_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOrderClick(order)}
                          className="text-primary hover:underline font-bold text-xs"
                        >
                          Manage Pickup
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

      {/* Manage Pickup Details Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn">
            
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Manage Order {selectedOrder.order_number}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 max-h-[500px]">
              
              {/* Pickup slots */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Customer Name</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Customer Phone</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{selectedOrder.customer_phone}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target Pickup Date</span>
                  <span className="font-bold text-slate-700 dark:text-slate-350">{new Date(selectedOrder.pickup_date).toLocaleDateString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target Time Slot</span>
                  <span className="font-bold text-slate-700 dark:text-slate-350">{selectedOrder.pickup_time}</span>
                </div>
              </div>

              {/* Status Update Controls */}
              <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pickup Action Workflow</span>
                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, { order_status: 'ready_for_pickup' })}
                    disabled={selectedOrder.order_status === 'ready_for_pickup' || selectedOrder.order_status === 'collected' || selectedOrder.order_status === 'cancelled'}
                    className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-30"
                  >
                    <Package className="h-4 w-4" /> Ready for Pickup
                  </button>

                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, { order_status: 'collected', payment_status: 'paid' })}
                    disabled={selectedOrder.order_status === 'collected' || selectedOrder.order_status === 'cancelled'}
                    className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-50 hover:text-white font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-30"
                  >
                    <CheckCircle className="h-4 w-4" /> Handed Over / Collected
                  </button>

                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, { order_status: 'cancelled', payment_status: selectedOrder.payment_status === 'paid' ? 'refunded' : selectedOrder.payment_status })}
                    disabled={selectedOrder.order_status === 'cancelled' || selectedOrder.order_status === 'collected'}
                    className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-50 hover:text-white font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-30"
                  >
                    <XCircle className="h-4 w-4" /> Cancel Order
                  </button>
                </div>

                {/* Settle payments details */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Status Adjustment</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder.id, { payment_status: 'paid' })}
                      disabled={selectedOrder.payment_status === 'paid'}
                      className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 font-bold px-3.5 py-1.5 rounded-lg border border-emerald-500/20 disabled:opacity-30 transition-all"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder.id, { payment_status: 'refunded' })}
                      disabled={selectedOrder.payment_status !== 'paid'}
                      className="bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-bold px-3.5 py-1.5 rounded-lg border border-rose-500/20 disabled:opacity-30 transition-all"
                    >
                      Mark as Refunded
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Items in Order</span>
                {modalLoading ? (
                  <div className="h-20 w-full rounded-2xl shimmer"></div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/10">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.product_name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Qty: {item.quantity} | ?{parseFloat(item.price).toFixed(2)} each</span>
                        </div>
                        <span className="font-extrabold text-slate-850 dark:text-slate-100">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between font-extrabold text-base pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Total Invoice</span>
                      <span className="text-primary">?{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
