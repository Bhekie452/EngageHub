const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Modular handlers
const handleApp = require('./src/server-api/app.cjs');
const handleUtils = require('./src/server-api/utils.cjs');
const handleFacebookAuth = require('./src/server-api/facebook-auth.cjs');

// Route Mappings
app.all('/api/app', handleApp);

// Utils handler supports both query and path format
app.all('/api/utils', handleUtils);
app.all('/api/utils/:endpoint', (req, res) => {
  req.query.endpoint = req.params.endpoint;
  return handleUtils(req, res);
});

// Facebook Auth routes - keeping both for legacy support
app.all('/api/facebook-auth', handleFacebookAuth);

app.get('/api/auth', async (req, res) => {
  const { provider } = req.query;
  if (provider === 'facebook') return handleFacebookAuth(req, res);
  return res.status(404).json({ error: 'Provider not found' });
});

app.post('/api/auth', async (req, res) => {
  const { provider, action } = req.query;
  if (provider === 'facebook' && action === 'token') return handleFacebookAuth(req, res);
  return res.status(404).json({ error: 'Action not found' });
});

const PORT = process.env.PORT || 3002;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  ANY /api/app');
  console.log('  ANY /api/utils?endpoint=...');
  console.log('  ANY /api/utils/:endpoint');
  console.log('  ANY /api/facebook-auth');
});
