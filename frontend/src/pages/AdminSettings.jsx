import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Save, AlertCircle, Check, KeyRound, QrCode, ImagePlus, Eye, EyeOff, User, Lock, Mail, IndianRupee, X, MapPin, Navigation, Search, Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const { token, user, refreshSession } = useAuth();
  const { settings, updateSettings } = useSettings();

  // ─── Branding Form ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_logo: '',
    shop_banner: '',
    theme_color: '#7b4dff',
    theme_color_secondary: '#00d4ff',
    contact_number: '',
    whatsapp_number: '',
    address: '',
    shop_lat: '',
    shop_lng: '',
    shop_timings: '',
    social_instagram: '',
    social_facebook: '',
    about_text: '',
    terms_conditions: '',
    privacy_policy: ''
  });

  // ─── Location Picker State ────────────────────────────────────────────
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const searchLocation = async () => {
    if (!locationSearch.trim()) return;
    setLocationSearching(true);
    setLocationError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setLocationError('No location found. Try a more specific address.');
      } else {
        const { lat, lon, display_name } = data[0];
        setFormData(prev => ({
          ...prev,
          shop_lat: lat,
          shop_lng: lon,
          address: display_name
        }));
        setLocationError('');
      }
    } catch {
      setLocationError('Search failed. Check your internet connection.');
    } finally {
      setLocationSearching(false);
    }
  };

  const useGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS not available in your browser.');
      return;
    }
    setGpsLoading(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            shop_lat: String(latitude),
            shop_lng: String(longitude),
            address: data.display_name || `${latitude}, ${longitude}`
          }));
        } catch {
          setFormData(prev => ({ ...prev, shop_lat: String(latitude), shop_lng: String(longitude) }));
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setLocationError('Could not get GPS location. Please allow location access.');
        setGpsLoading(false);
      }
    );
  };

  const [brandError, setBrandError] = useState('');
  const [brandSuccess, setBrandSuccess] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        shop_name: settings.shop_name || '',
        shop_logo: settings.shop_logo || '',
        shop_banner: settings.shop_banner || '',
        theme_color: settings.theme_color || '#7b4dff',
        theme_color_secondary: settings.theme_color_secondary || '#00d4ff',
        contact_number: settings.contact_number || '',
        whatsapp_number: settings.whatsapp_number || '',
        address: settings.address || '',
        shop_lat: settings.shop_lat || '',
        shop_lng: settings.shop_lng || '',
        shop_timings: settings.shop_timings || '',
        social_instagram: settings.social_instagram || '',
        social_facebook: settings.social_facebook || '',
        about_text: settings.about_text || '',
        terms_conditions: settings.terms_conditions || '',
        privacy_policy: settings.privacy_policy || ''
      });
    }
  }, [settings]);

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    setBrandError('');
    setBrandSuccess('');
    const res = await updateSettings(formData, token);
    if (res.success) {
      setBrandSuccess("Settings updated successfully! Changes are immediately active.");
      window.scrollTo(0, 0);
    } else {
      setBrandError(res.message || "Failed to save settings.");
    }
  };

  // ─── Credentials Form ────────────────────────────────────────────────────────
  const [credForm, setCredForm] = useState({
    new_name: '',
    new_email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleCredSubmit = async (e) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess('');

    if (credForm.new_password && credForm.new_password !== credForm.confirm_password) {
      return setCredError("New passwords don't match.");
    }
    if (!credForm.current_password) {
      return setCredError("Current password is required.");
    }

    const payload = { current_password: credForm.current_password };
    if (credForm.new_name) payload.new_name = credForm.new_name;
    if (credForm.new_email) payload.new_email = credForm.new_email;
    if (credForm.new_password) payload.new_password = credForm.new_password;

    setCredLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setCredError(data.message || "Failed to update credentials.");
      } else {
        setCredSuccess("Credentials updated! You are now logged in with your new details.");
        if (data.token && data.user) {
          refreshSession(data.token, data.user);
        }
        setCredForm({ new_name: '', new_email: '', current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      setCredError("Network error. Please try again.");
    } finally {
      setCredLoading(false);
    }
  };

  // ─── QR Code & UPI Manager ────────────────────────────────────────────────────
  const qrFileRef = useRef(null);
  const [upiId, setUpiId] = useState('');
  const [qrImagePreview, setQrImagePreview] = useState(null); // base64 preview
  const [qrSaveSuccess, setQrSaveSuccess] = useState('');
  const [qrSaveError, setQrSaveError] = useState('');
  const [qrSaving, setQrSaving] = useState(false);

  useEffect(() => {
    if (settings?.upi_id) setUpiId(settings.upi_id);
    if (settings?.qr_image) setQrImagePreview(settings.qr_image);
  }, [settings]);

  const handleQrImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setQrSaveError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrImagePreview(ev.target.result);
      setQrSaveError('');
    };
    reader.readAsDataURL(file);
  };

  const saveQrSettings = async () => {
    setQrSaveError('');
    setQrSaveSuccess('');
    if (!upiId && !qrImagePreview) {
      return setQrSaveError('Please enter a UPI ID or upload a QR image.');
    }
    setQrSaving(true);
    const payload = {};
    if (upiId) payload.upi_id = upiId;
    if (qrImagePreview) payload.qr_image = qrImagePreview;
    const res = await updateSettings(payload, token);
    if (res.success) {
      setQrSaveSuccess('Payment QR & UPI ID saved successfully!');
    } else {
      setQrSaveError(res.message || 'Failed to save.');
    }
    setQrSaving(false);
  };

  return (
    <div className="flex flex-col gap-8 pb-12 w-full font-sans max-w-5xl mx-auto">

      {/* BRANDING SETTINGS */}
      <form onSubmit={handleBrandSubmit} className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Shop Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage branding, credentials, and custom QR codes without touching code</p>
          </div>
          <button type="submit"
            className="bg-primary hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-primary/10">
            <Save className="h-4 w-4" /> Save Branding
          </button>
        </div>

        {brandError && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl text-xs text-rose-500 font-bold flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {brandError}
          </div>
        )}
        {brandSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl text-xs text-emerald-500 font-bold flex items-start gap-2">
            <Check className="h-5 w-5 flex-shrink-0" /> {brandSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-xs">
          {/* Left: Branding & Theme */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
            <h3 className="font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider text-slate-400">1. Store Branding & Theme</h3>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500">Shop Name</label>
              <input type="text" value={formData.shop_name} onChange={e => setFormData({ ...formData, shop_name: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-slate-500">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formData.theme_color} onChange={e => setFormData({ ...formData, theme_color: e.target.value })}
                    className="h-10 w-12 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent" />
                  <input type="text" value={formData.theme_color} onChange={e => setFormData({ ...formData, theme_color: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold outline-none flex-1" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-slate-500">Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formData.theme_color_secondary} onChange={e => setFormData({ ...formData, theme_color_secondary: e.target.value })}
                    className="h-10 w-12 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent" />
                  <input type="text" value={formData.theme_color_secondary} onChange={e => setFormData({ ...formData, theme_color_secondary: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold outline-none flex-1" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500">Banner Image URL</label>
              <input type="text" placeholder="https://..." value={formData.shop_banner} onChange={e => setFormData({ ...formData, shop_banner: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500">About the Shop</label>
              <textarea rows="4" value={formData.about_text} onChange={e => setFormData({ ...formData, about_text: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none leading-relaxed" />
            </div>
          </div>

          {/* Right: Contact, Timings, Policy */}
          <div className="flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
              <h3 className="font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider text-slate-400">2. Contact Info & Timings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-bold uppercase tracking-wider text-slate-500">Contact Number</label>
                  <input type="text" value={formData.contact_number} onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold uppercase tracking-wider text-slate-500">WhatsApp Contact</label>
                  <input type="text" value={formData.whatsapp_number} onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
                </div>
              </div>

              {/* Location Picker */}
              <div className="flex flex-col gap-3">
                <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Shop Location on Map
                </label>

                {/* Search box */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search your shop address e.g. Main Bazaar, Delhi..."
                      value={locationSearch}
                      onChange={e => setLocationSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pl-10 outline-none text-xs"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                  <button type="button" onClick={searchLocation} disabled={locationSearching}
                    className="bg-primary hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50">
                    {locationSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {locationSearching ? '' : 'Find'}
                  </button>
                  <button type="button" onClick={useGpsLocation} disabled={gpsLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50">
                    {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                    {gpsLoading ? '' : 'My GPS'}
                  </button>
                </div>

                {locationError && (
                  <p className="text-rose-500 font-bold text-[10px] flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {locationError}
                  </p>
                )}

                {/* Map Preview */}
                {formData.shop_lat && formData.shop_lng ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md" style={{ height: 220 }}>
                      <iframe
                        title="Shop Location Preview"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.shop_lng)-0.005}%2C${parseFloat(formData.shop_lat)-0.005}%2C${parseFloat(formData.shop_lng)+0.005}%2C${parseFloat(formData.shop_lat)+0.005}&layer=mapnik&marker=${formData.shop_lat}%2C${formData.shop_lng}`}
                      />
                    </div>
                    <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3">
                      <MapPin className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider">Pinned Location</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{formData.address}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">{parseFloat(formData.shop_lat).toFixed(6)}, {parseFloat(formData.shop_lng).toFixed(6)}</p>
                      </div>
                      <button type="button"
                        onClick={() => setFormData(prev => ({ ...prev, shop_lat: '', shop_lng: '', address: '' }))}
                        className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 h-[120px] flex flex-col items-center justify-center gap-2 text-slate-400">
                    <MapPin className="h-8 w-8" />
                    <p className="text-[10px] font-bold">Search your address above or tap "My GPS" to pin your shop</p>
                  </div>
                )}

                {/* Manual address override */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Display Address (shown to customers)</label>
                  <input type="text" value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Edit the address displayed to customers..."
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none text-xs" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-slate-500">Shop Timings</label>
                <textarea rows="3" value={formData.shop_timings} onChange={e => setFormData({ ...formData, shop_timings: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none leading-relaxed" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
              <h3 className="font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider text-slate-400">3. Terms & Policy</h3>
              <div className="flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-slate-500">Terms & Conditions</label>
                <textarea rows="3" value={formData.terms_conditions} onChange={e => setFormData({ ...formData, terms_conditions: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none leading-relaxed" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-slate-500">Privacy Policy</label>
                <textarea rows="3" value={formData.privacy_policy} onChange={e => setFormData({ ...formData, privacy_policy: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none leading-relaxed" />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* CHANGE CREDENTIALS */}
      <form onSubmit={handleCredSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm text-xs">

        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">4. Change Login Credentials</h3>
              <p className="text-slate-400 mt-0.5">Update your admin account name, email, or password securely</p>
            </div>
          </div>
          {user && (
            <div className="text-right hidden sm:block">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Currently logged in as</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{user.email}</span>
            </div>
          )}
        </div>

        {credError && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 p-3 rounded-xl text-rose-500 font-bold flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {credError}
          </div>
        )}
        {credSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 p-3 rounded-xl text-emerald-500 font-bold flex items-start gap-2">
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" /> {credSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> New Display Name <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <input type="text" placeholder={user?.name || 'Owner Name'}
              value={credForm.new_name}
              onChange={e => setCredForm({ ...credForm, new_name: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> New Login Email <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <input type="email" placeholder={user?.email || 'admin@yourshop.com'}
              value={credForm.new_email}
              onChange={e => setCredForm({ ...credForm, new_email: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> New Password <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input type={showNewPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={credForm.new_password}
                onChange={e => setCredForm({ ...credForm, new_password: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none w-full pr-10" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Confirm New Password
            </label>
            <input type="password" placeholder="Re-enter new password"
              value={credForm.confirm_password}
              onChange={e => setCredForm({ ...credForm, confirm_password: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-5">
          <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> Current Password <span className="text-rose-500">*</span>
            <span className="text-[9px] text-slate-400 normal-case tracking-normal font-normal ml-1">(required to verify identity before saving)</span>
          </label>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <input type={showCurrentPw ? 'text' : 'password'} placeholder="Enter your current password"
                value={credForm.current_password}
                onChange={e => setCredForm({ ...credForm, current_password: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none w-full pr-10" />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button type="submit" disabled={credLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50">
              {credLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {credLoading ? 'Updating...' : 'Update Credentials'}
            </button>
          </div>
        </div>
      </form>

      {/* QR CODE & UPI MANAGER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm text-xs">

        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">5. Payment QR & UPI</h3>
            <p className="text-slate-400 mt-0.5">Upload your payment QR image from gallery and add your UPI ID — displayed to customers at checkout</p>
          </div>
        </div>

        {qrSaveError && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 p-3 rounded-xl text-rose-500 font-bold flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {qrSaveError}
          </div>
        )}
        {qrSaveSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 p-3 rounded-xl text-emerald-500 font-bold flex items-start gap-2">
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" /> {qrSaveSuccess}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Controls */}
          <div className="flex-1 flex flex-col gap-6">

            {/* UPI ID */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5" /> UPI Payment ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="yourshop@upi  or  yourshop@paytm  or  9876543210@ybl"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pl-10 outline-none font-semibold"
                />
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400">Customers will see this UPI ID on the checkout page to make payment before pickup.</p>
            </div>

            {/* QR Upload */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ImagePlus className="h-3.5 w-3.5" /> Payment QR Code Image
              </label>
              <input
                type="file"
                ref={qrFileRef}
                accept="image/*"
                className="hidden"
                onChange={handleQrImageUpload}
              />
              <button
                type="button"
                onClick={() => qrFileRef.current?.click()}
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5 rounded-xl px-5 py-4 text-slate-500 dark:text-slate-400 font-bold transition-all w-full justify-center"
              >
                <ImagePlus className="h-5 w-5" />
                {qrImagePreview ? 'Change QR Image from Gallery' : 'Upload QR Image from Gallery'}
              </button>
              <p className="text-[10px] text-slate-400">Select the QR code image you already have from Google Pay, PhonePe, Paytm, or any UPI app. Supports JPG, PNG, WEBP.</p>
            </div>

            <button
              type="button"
              onClick={saveQrSettings}
              disabled={qrSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 self-start"
            >
              <Save className="h-4 w-4" />
              {qrSaving ? 'Saving...' : 'Save Payment Info'}
            </button>
          </div>

          {/* QR Preview */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">QR Preview</span>
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700" style={{ width: 200, height: 200 }}>
              {qrImagePreview ? (
                <>
                  <img src={qrImagePreview} alt="Payment QR" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => { setQrImagePreview(null); if (qrFileRef.current) qrFileRef.current.value = ''; }}
                    className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-2">
                  <QrCode className="h-14 w-14" />
                  <span className="text-[10px] font-bold text-center px-4">Upload your QR image</span>
                </div>
              )}
            </div>
            {upiId && (
              <div className="text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">UPI ID</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{upiId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
