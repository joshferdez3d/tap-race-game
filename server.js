// server.js - Updated for client API integration
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main game file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'TapRaceGame.html'));
});

// Configuration endpoint to set client API details
app.post('/api/config', (req, res) => {
  const { apiBaseURL, outletQR } = req.body;
  
  console.log('⚙️ Configuration received:');
  console.log(`  API Base URL: ${apiBaseURL}`);
  console.log(`  Outlet QR: ${outletQR}`);
  
  // This endpoint allows you to dynamically configure the client API
  // The frontend can call this to update API settings
  res.json({
    success: true,
    message: 'Configuration updated successfully',
    config: {
      apiBaseURL,
      outletQR
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tap Race Game Server is running',
    timestamp: new Date().toISOString(),
    clientAPI: 'Integrated with client Laravel API'
  });
});

// Handle favicon.ico request
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    method: req.method,
    url: req.url
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Tap Race Game Server running on http://localhost:${PORT}`);
  console.log('🔗 Integrated with Client Laravel API:');
  console.log('   - Customer Signup (OTP Generation)');
  console.log('   - Customer Verify (OTP Verification)');
  console.log('   - Customer Game Result Saving');
  console.log('');
  console.log('📝 Available endpoints:');
  console.log('   GET  / - Main game interface');
  console.log('   POST /api/config - Configure API settings');
  console.log('   GET  /api/health - Health check');
  console.log('');
  console.log('🎮 Game now uses client API for all operations');
  console.log('💡 Make sure client API server is running on port 8000');
});