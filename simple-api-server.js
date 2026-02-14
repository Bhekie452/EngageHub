import express from 'express';
import cors from 'cors';

// Import API handlers
import facebookHandler from './api/facebook.js';
const { handleTikTokWebhook } = require('./api/tiktok.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Facebook API routes
app.all('/api/facebook', facebookHandler);

// TikTok webhook route
app.post('/api/tiktok/webhook', handleTikTokWebhook);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Simple API server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  ALL  /api/facebook/*');
  console.log('  POST /api/tiktok/webhook');
  console.log('  GET  /api/health');
});
