import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3001,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [tailwindcss(), react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'zustand'],
            'vendor-ui': ['lucide-react', 'recharts'],
            'vendor-data': ['@supabase/supabase-js'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          }
        }
      },
      sourcemap: false,
      target: 'es2022',
    }
  };
});
