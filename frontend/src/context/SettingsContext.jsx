import React, { createContext, useState, useEffect, useContext } from 'react';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shop_name: "Gift & Stationery Haven",
    shop_logo: "",
    shop_banner: "",
    theme_color: "#7b4dff",
    theme_color_secondary: "#00d4ff",
    contact_number: "",
    whatsapp_number: "",
    address: "",
    google_maps_link: "",
    shop_timings: "",
    social_instagram: "",
    social_facebook: "",
    about_text: "",
    terms_conditions: "",
    privacy_policy: "",
    categories: []
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync theme variables to DOM document
  useEffect(() => {
    if (settings.theme_color) {
      document.documentElement.style.setProperty('--primary-color', settings.theme_color);
      // Make a slightly darker version for active/hover states
      const darkerHex = darkenColor(settings.theme_color, 20);
      document.documentElement.style.setProperty('--primary-color-dark', darkerHex);
    }
    if (settings.theme_color_secondary) {
      document.documentElement.style.setProperty('--secondary-color', settings.theme_color_secondary);
    }
  }, [settings]);

  // Color darken helper
  function darkenColor(hex, percent) {
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
      hex = hex.replace(/(.)/g, '$1$1');
    }
    let r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    r = Math.max(0, Math.min(255, r - (r * percent / 100)));
    g = Math.max(0, Math.min(255, g - (g * percent / 100)));
    b = Math.max(0, Math.min(255, b - (b * percent / 100)));

    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  }

  const updateSettings = async (newSettings, token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        // Reload settings
        await fetchSettings();
        return { success: true };
      } else {
        const errData = await response.json();
        return { success: false, message: errData.message || "Failed to update settings." };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: "Server connection failed." };
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, fetchSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
