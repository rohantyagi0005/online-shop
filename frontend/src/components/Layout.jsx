import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { ShoppingBag, User, LogOut, Sun, Moon, Menu, X, Shield, MessageSquare, Search } from 'lucide-react';

const Layout = ({ children, cartCount }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  // Hide header/footer if in admin dashboard
  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{settings.shop_name} <span className="text-sm font-normal text-slate-400">Dashboard</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold">{user?.name}</span>
            </div>
            <Link to="/" className="text-sm text-primary hover:underline font-medium">Customer Site</Link>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Admin Sidebar Navigation */}
          <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-2">
            <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isCurrentPath('/admin') ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <Shield className="h-5 w-5" />
              <span className="font-medium text-sm">Dashboard Overview</span>
            </Link>
            <Link to="/admin/inventory" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isCurrentPath('/admin/inventory') ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <ShoppingBag className="h-5 w-5" />
              <span className="font-medium text-sm">Inventory Manager</span>
            </Link>
            <Link to="/admin/orders" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isCurrentPath('/admin/orders') ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <ShoppingBag className="h-5 w-5" />
              <span className="font-medium text-sm">Orders Pickup</span>
            </Link>
            <Link to="/admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isCurrentPath('/admin/settings') ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <Sun className="h-5 w-5" />
              <span className="font-medium text-sm">Shop Settings</span>
            </Link>
            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 block mb-2">Logged in as {user?.role.toUpperCase()}</span>
            </div>
          </aside>

          {/* Admin Main Workspace */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Customer Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 group">
                <ShoppingBag className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {settings.shop_name}
                </span>
              </Link>
            </div>

            {/* Navigation Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 w-80 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search gifts, books, stationery..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
            </form>

            {/* Actions & Links */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <Link to="/" className={`text-sm font-semibold hover:text-primary transition-colors ${isCurrentPath('/') ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>Home</Link>
                <Link to="/products" className={`text-sm font-semibold hover:text-primary transition-colors ${isCurrentPath('/products') ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>Products</Link>
                {user ? (
                  <>
                    <Link to="/orders" className={`text-sm font-semibold hover:text-primary transition-colors ${isCurrentPath('/orders') ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>My Orders</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="text-sm font-semibold text-primary-dark dark:text-primary hover:underline flex items-center gap-1">
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    )}
                  </>
                ) : (
                  <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Login</Link>
                )}
              </nav>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700"></div>

              {/* Theme & Cart Buttons */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <Link to="/cart" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-secondary text-slate-950 font-bold text-xs h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {user && (
                  <button 
                    onClick={() => { logout(); navigate('/login'); }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Icon */}
            <div className="flex md:hidden items-center gap-4">
              <Link to="/cart" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-slate-950 font-bold text-xs h-5 w-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-4 animate-fadeIn">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200"
              />
            </form>
            <nav className="flex flex-col gap-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-xl font-medium text-sm ${isCurrentPath('/') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Home</Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-xl font-medium text-sm ${isCurrentPath('/products') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Products</Link>
              {user ? (
                <>
                  <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-xl font-medium text-sm ${isCurrentPath('/orders') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>My Orders</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-xl font-semibold text-primary hover:bg-primary/10 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={() => { logout(); setMobileMenuOpen(false); navigate('/login'); }}
                    className="px-3 py-2 rounded-xl font-medium text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Login</Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Customer Main Layout */}
      <main className="flex-1">
        {children}
      </main>

      {/* Customer Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <span className="font-extrabold text-xl text-primary">{settings.shop_name}</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">{settings.about_text}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-4">Shop Timings</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{settings.shop_timings}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-4">Contact Info</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Phone: {settings.contact_number}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">WhatsApp: {settings.whatsapp_number}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Address: {settings.address}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link to="/products" className="text-slate-500 hover:text-primary transition-colors">Browse Products</Link>
              <a href={settings.google_maps_link} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-primary transition-colors">Find on Google Maps</a>
              <Link to="/login" className="text-slate-500 hover:text-primary transition-colors">My Account</Link>
            </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {settings.shop_name}. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:underline">Terms & Conditions</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </footer>
      
      {/* Permanent WhatsApp floating action button */}
      <a 
        href={`https://wa.me/${settings.whatsapp_number?.replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-emerald-600 transition-all z-40 flex items-center justify-center"
        aria-label="Contact on WhatsApp"
      >
        <MessageSquare className="h-6 w-6" />
      </a>
    </div>
  );
};

export default Layout;
