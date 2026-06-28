import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, TrendingUp, Users, ShoppingCart, DollarSign, Package, Bell, RefreshCw, FileText, Download } from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [graphs, setGraphs] = useState(null);
  const [lists, setLists] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportType, setExportType] = useState('daily'); // daily, weekly, monthly
  
  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/analytics/dashboard`, { headers });
      const graphsRes = await fetch(`${import.meta.env.VITE_API_URL}/analytics/graphs`, { headers });
      const listsRes = await fetch(`${import.meta.env.VITE_API_URL}/analytics/lists`, { headers });
      const notifRes = await fetch(`${import.meta.env.VITE_API_URL}/analytics/notifications`, { headers });

      if (statsRes.ok && graphsRes.ok && listsRes.ok && notifRes.ok) {
        setStats(await statsRes.json());
        setGraphs(await graphsRes.json());
        setLists(await listsRes.json());
        setNotifications(await notifRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleNotificationDismiss = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analytics/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        // Reload notifications
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (format) => {
    // Redirects directly to download link
    const url = `${import.meta.env.VITE_API_URL}/analytics/reports/export?format=${format}&type=${exportType}&token=${token}`;
    // Simple window open to trigger download
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="h-12 w-48 rounded shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-32 rounded-3xl shimmer"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[350px] rounded-3xl shimmer"></div>
          <div className="h-[350px] rounded-3xl shimmer"></div>
        </div>
      </div>
    );
  }

  // Format currencies helper
  const formatCurrency = (val) => `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-8 pb-12 w-full font-sans">
      {/* Title Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Overview Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time indicators, visitor traffic logs, and sales metrics</p>
          </div>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
        </button>
      </div>

      {/* Stats Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Visitors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Visitors</span>
            <span className="text-2xl font-extrabold">{stats?.visitors.total}</span>
            <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
              <span>Today: <strong className="text-primary font-extrabold">{stats?.visitors.today}</strong></span>
              <span>Active: <strong className="text-emerald-500 font-extrabold">{stats?.visitors.active}</strong></span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Sales Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders Summary</span>
            <span className="text-2xl font-extrabold">{stats?.orders.total}</span>
            <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
              <span>Pending: <strong className="text-amber-500 font-extrabold">{stats?.orders.pending}</strong></span>
              <span>Paid: <strong className="text-emerald-500 font-extrabold">{stats?.orders.paid}</strong></span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="h-6 w-6" />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</span>
            <span className="text-2xl font-extrabold text-primary">{formatCurrency(stats?.revenue)}</span>
            <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
              <span>Daily: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats?.sales.daily)}</strong></span>
              <span>Weekly: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats?.sales.weekly)}</strong></span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Valuation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inventory Value</span>
            <span className="text-2xl font-extrabold">{formatCurrency(stats?.inventoryValue)}</span>
            <span className="text-[10px] text-slate-400 mt-1">Valuation of in-stock items</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* Main Charts & Notifications Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Charts & Graphs Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Traffic Performance (Visitor Logs)
            </h3>
            {/* Custom SVG Line Chart representation */}
            <div className="h-[250px] w-full flex items-end pt-4 select-none relative">
              {graphs?.visitors.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">No visitor records found.</div>
              ) : (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="flex-1 w-full flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2 relative">
                    <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                      {/* Generate polyline coordinates dynamically */}
                      {(() => {
                        const maxVal = Math.max(...(graphs?.visitors.map(d => d.value) || [10]));
                        const points = graphs?.visitors.map((d, i) => {
                          const x = (i / (graphs.visitors.length - 1)) * 100;
                          const y = 100 - (d.value / (maxVal || 1)) * 80; // Scale height to 80% max
                          return `${x}%,${y}%`;
                        }).join(' ');
                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="var(--primary-color, #7b4dff)"
                              strokeWidth="3"
                              points={points.replace(/%/g, '')}
                              className="w-full h-full"
                              style={{ vectorEffect: 'non-scaling-stroke' }}
                            />
                            {/* Area shape */}
                            <polygon
                              fill="url(#area-gradient)"
                              opacity="0.1"
                              points={`0,100 ${points.replace(/%/g, '')} 100,100`}
                              style={{ vectorEffect: 'non-scaling-stroke' }}
                            />
                            <defs>
                              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--primary-color, #7b4dff)" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  {/* Labels */}
                  <div className="flex justify-between items-center pt-2 text-[10px] font-bold text-slate-400">
                    {graphs?.visitors.map((d, i) => (
                      <span key={i}>{new Date(d.label).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sales List Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Best Selling */}
            <div className="flex flex-col gap-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Best Selling Products</h4>
              <div className="flex flex-col gap-3">
                {lists?.bestSellers.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No sales recorded yet.</span>
                ) : (
                  lists?.bestSellers.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.name}</span>
                      <span className="font-bold text-primary">{item.sold} sold ({formatCurrency(item.revenue)})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Least Selling */}
            <div className="flex flex-col gap-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Least Selling Products</h4>
              <div className="flex flex-col gap-3">
                {lists?.leastSellers.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No items available.</span>
                ) : (
                  lists?.leastSellers.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.name}</span>
                      <span className="font-semibold text-rose-500">{item.sold} sold</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Export Tools Panel */}
        <div className="flex flex-col gap-6">
          {/* Unread System Alerts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4 h-[350px]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> System Alerts
              </h3>
              <button 
                onClick={handleNotificationDismiss}
                className="text-[10px] text-rose-500 font-bold hover:underline"
              >
                Dismiss All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
              {notifications.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No alerts logged.</div>
              ) : (
                notifications.map((notif) => {
                  const iconColor = notif.type.includes('stock') ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary';
                  return (
                    <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-2xl border text-xs leading-relaxed ${notif.is_read ? 'opacity-50 border-slate-100 dark:border-slate-800' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10'}`}>
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{new Date(notif.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Exporter Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Export Financial Reports
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Report Range</label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'weekly', 'monthly'].map(t => (
                    <button
                      key={t}
                      onClick={() => setExportType(t)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase border transition-all ${exportType === t ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={() => handleExport('pdf')}
                  className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Download className="h-4 w-4" /> PDF Report
                </button>
                <button 
                  onClick={() => handleExport('excel')}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/15 transition-all"
                >
                  <Download className="h-4 w-4" /> Excel Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
