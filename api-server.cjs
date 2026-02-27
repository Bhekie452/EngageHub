const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Wrapper to bridge CJS and ESM
const bridge = (modulePath) => async (req, res) => {
  try {
    const mod = await import(modulePath);
    const handler = mod.default || mod;
    return await handler(req, res);
  } catch (err) {
    console.error(`Error loading ESM module ${modulePath}:`, err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

// Route Mappings using the bridge to load ESM handlers
app.all('/api/app', bridge('./src/server-api/app.js'));

// Utils handler supports both query and path format
app.all('/api/utils', bridge('./src/server-api/utils.js'));
app.all('/api/utils/:endpoint', (req, res) => {
  req.query.endpoint = req.params.endpoint;
  return bridge('./src/server-api/utils.js')(req, res);
});

// Facebook Auth routes
app.all('/api/facebook-auth', bridge('./src/server-api/facebook-auth.js'));

app.get('/api/auth', async (req, res) => {
  const { provider } = req.query;
  if (provider === 'facebook') return bridge('./src/server-api/facebook-auth.js')(req, res);
  return res.status(404).json({ error: 'Provider not found' });
});

app.post('/api/auth', async (req, res) => {
  const { provider, action } = req.query;
  if (provider === 'facebook' && action === 'token') return bridge('./src/server-api/facebook-auth.js')(req, res);
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
