import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock Facebook pages data
const mockFacebookPages = [
  {
    pageId: "123456789012345",
    pageName: "My Restaurant",
    pageAccessToken: "EAACZAE...mock_token_1",
    category: "Restaurant",
    instagramBusinessAccountId: "987654321",
    hasInstagram: true,
    fanCount: 2500
  },
  {
    pageId: "234567890123456", 
    pageName: "My Gym",
    pageAccessToken: "EAACZAE...mock_token_2",
    category: "Gym/Fitness Center",
    instagramBusinessAccountId: null,
    hasInstagram: false,
    fanCount: 1200
  },
  {
    pageId: "345678901234567",
    pageName: "My Store",
    pageAccessToken: "EAACZAE...mock_token_3", 
    category: "Shopping",
    instagramBusinessAccountId: "876543210",
    hasInstagram: true,
    fanCount: 3500
  }
];

// Mock Facebook API endpoints
app.all('/api/facebook', (req, res) => {
  const { action } = req.query;
  const method = req.method;

  console.log(`🔧 Mock API: ${method} /api/facebook?action=${action}`);

  switch (action) {
    case 'list-pages':
      if (method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      // Mock successful pages response
      return res.json({
        success: true,
        pages: mockFacebookPages,
        count: mockFacebookPages.length,
        message: `Found ${mockFacebookPages.length} Facebook pages`
      });

    case 'connect-page':
      if (method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { pageId, pageName, workspaceId } = req.body;
      
      if (!pageId || !pageName || !workspaceId) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'pageId, pageName, and workspaceId are required'
        });
      }

      // Mock successful page connection
      return res.json({
        success: true,
        pageConnection: {
          id: 'mock-connection-' + Date.now(),
          pageId,
          pageName,
          workspaceId,
          connectedAt: new Date().toISOString()
        },
        message: `Successfully connected to ${pageName}`
      });

    case 'diagnostics':
      if (method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      return res.json({
        success: true,
        message: 'Mock Facebook API is running',
        timestamp: new Date().toISOString(),
        environment: 'development'
      });

    default:
      return res.status(400).json({
        error: 'Invalid action parameter',
        availableActions: ['list-pages', 'connect-page', 'diagnostics']
      });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Mock Facebook API'
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  GET  /api/facebook?action=diagnostics');
  console.log('  GET  /api/facebook?action=list-pages');
  console.log('  POST /api/facebook?action=connect-page');
  console.log('  GET  /api/health');
  console.log('');
  console.log('🎭 Mock Data:');
  mockFacebookPages.forEach((page, index) => {
    console.log(`  ${index + 1}. ${page.pageName} (${page.category}) ${page.hasInstagram ? '📸' : ''}`);
  });
});
