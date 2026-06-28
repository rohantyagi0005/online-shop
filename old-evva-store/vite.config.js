import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        home: 'home.html',
        shop: 'shop.html',
        orders: 'orders.html',
        recentlyViewed: 'recently-viewed.html'
      }
    }
  }
});
