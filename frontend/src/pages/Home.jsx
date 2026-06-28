import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Clock, Phone, MapPin, MessageSquare, ArrowRight, Star, Heart, TrendingUp } from 'lucide-react';

const Home = () => {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log visit IP for analytics
    fetch(`${import.meta.env.VITE_API_URL}/analytics/visitors/log`, { method: 'POST' }).catch(() => {});

    const fetchHomeProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products?limit=8`);
        if (response.ok) {
          const data = await response.json();
          // Mockingfeatured, newArrivals, bestSellers lists from the same products for simplicity
          setFeatured(data.products.slice(0, 4));
          setNewArrivals(data.products.slice(2, 6));
          setBestSellers(data.products.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-24 px-4 sm:px-6 lg:px-8 flex items-center min-h-[500px]">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${settings.shop_banner || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1400'})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto w-full z-10 flex flex-col gap-6">
          <span className="text-primary font-bold tracking-wider uppercase text-sm">Welcome to our shop</span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl">
            Your Local Destination for <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Gifts & Stationery</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            Explore our curated collections of stationery, toys, cosmetics, festival decors, and unique gifts. Secure pickup in-store.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Link to="/products" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 group">
              Shop Collection <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={settings.google_maps_link} target="_blank" rel="noopener noreferrer" className="bg-slate-800/80 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-bold border border-slate-700 transition-all">
              Find Store
            </a>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Explore Categories</h2>
          <p className="text-slate-500 dark:text-slate-400">Discover premium selections handpicked for you</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {settings.categories && settings.categories.map((cat, idx) => (
            <Link 
              key={idx} 
              to={`/products?category=${encodeURIComponent(cat)}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 hover:border-primary dark:hover:border-primary hover:shadow-xl transition-all group"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm tracking-wide">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-12">
        {/* Featured Products */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-500 fill-rose-500" /> Featured Products
              </h2>
              <p className="text-sm text-slate-500">Selected trending items you'll love</p>
            </div>
            <Link to="/products" className="text-sm text-primary font-bold hover:underline">View All &rarr;</Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-80 rounded-2xl shimmer"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* New Arrivals & Best Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* New Arrivals */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> New Arrivals
            </h3>
            <div className="flex flex-col gap-4">
              {loading ? (
                [1, 2].map(n => <div key={n} className="h-24 rounded-2xl shimmer"></div>)
              ) : (
                newArrivals.map(product => (
                  <ProductRow key={product.id} product={product} />
                ))
              )}
            </div>
          </div>

          {/* Best Sellers */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Best Sellers
            </h3>
            <div className="flex flex-col gap-4">
              {loading ? (
                [1, 2].map(n => <div key={n} className="h-24 rounded-2xl shimmer"></div>)
              ) : (
                bestSellers.map(product => (
                  <ProductRow key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Info Sections: Timings, Address, Maps */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-extrabold tracking-tight">Visit Our Store</h2>
              <p className="text-slate-500 dark:text-slate-400">Stop by to pick up your orders and browse our physical shelves</p>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Store Timings</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{settings.shop_timings}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Location Address</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{settings.address}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Customer Support</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{settings.contact_number}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <a 
                href={`https://wa.me/${settings.whatsapp_number?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <MessageSquare className="h-5 w-5" /> Chat via WhatsApp
              </a>
            </div>
          </div>

          {/* Map Location — uses pinned shop coordinates from settings */}
          <div className="flex flex-col gap-3">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl h-[320px] relative">
              {settings.shop_lat && settings.shop_lng ? (
                <iframe
                  title="Store Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(settings.shop_lng)-0.006}%2C${parseFloat(settings.shop_lat)-0.006}%2C${parseFloat(settings.shop_lng)+0.006}%2C${parseFloat(settings.shop_lat)+0.006}&layer=mapnik&marker=${settings.shop_lat}%2C${settings.shop_lng}`}
                />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <MapPin className="h-12 w-12" />
                  <p className="font-bold text-sm">Shop location not set yet</p>
                  <p className="text-xs">Owner can pin the location in Admin → Settings</p>
                </div>
              )}
            </div>
            {settings.shop_lat && settings.shop_lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${settings.shop_lat},${settings.shop_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold py-3 rounded-2xl text-sm transition-all"
              >
                <MapPin className="h-4 w-4" /> Get Directions on Google Maps
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

// Sub-Component: Product Card Grid Item
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

// Sub-Component: Product Row List Item
const ProductRow = ({ product }) => {
  const mainImage = product.images && product.images[0] ? product.images[0] : 'https://picsum.photos/400/400?random=' + product.id;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Link to={`/products/${product.id}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-3 flex items-center gap-4 hover:border-primary dark:hover:border-primary transition-all group">
      <div className="relative h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
        <img 
          src={mainImage} 
          alt={product.name} 
          className="object-cover w-full h-full"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
            <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded">OOS</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{product.category}</span>
        <h4 className="font-bold text-sm truncate text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{product.name}</h4>
        <div className="flex items-center gap-2">
          {product.discount_price ? (
            <>
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">?{parseFloat(product.discount_price).toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 line-through">?{parseFloat(product.price).toFixed(2)}</span>
            </>
          ) : (
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">?{parseFloat(product.price).toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default Home;
