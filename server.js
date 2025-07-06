// server.js - Clean server with SMS integration
const express = require('express');
const path = require('path');
const axios = require('axios');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// SMS Configuration
const SMS_USERNAME   = process.env.SMS_USERNAME   || "Lekh09";
const SMS_APIKEY     = process.env.SMS_APIKEY     || "409DC-16CCF";
const SMS_SENDER     = process.env.SMS_SENDER     || "MORORE";
const SMS_ROUTE      = process.env.SMS_ROUTE      || "OTP";
const SMS_TEMPLATEID = process.env.SMS_TEMPLATEID || "1707174419181876651";

// Helper to mask phone
function maskPhone(phone) {
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'tap-race-game-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main game file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'TapRaceGame.html'));
});

// SMS OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  const { name, phone, otp } = req.body;
  
  if (!name || !phone || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Name, phone, and OTP are required.'
    });
  }

  // Store in session for verification
  req.session.name = name;
  req.session.phone = phone;
  req.session.generatedOTP = otp;
  
  console.log('🔐 Generated OTP:', otp);
  console.log('📤 Sending SMS to:', phone);

  // Format phone number
  let rawPhone = phone.trim().replace(/\D/g, '');
  if (!rawPhone.startsWith('91')) rawPhone = '91' + rawPhone;

  // SMS API parameters
  const params = new URLSearchParams({
    username:   SMS_USERNAME,
    apikey:     SMS_APIKEY,
    apirequest: "Text",
    sender:     SMS_SENDER,
    mobile:     rawPhone,
    message:    `Hi, ${otp} is the Survey Code which you had requested, it is valid for 10 mins. MORORE`,
    route:      SMS_ROUTE,
    TemplateID: SMS_TEMPLATEID,
    format:     "JSON"
  });

  const smsUrl = `http://123.108.46.13/sms-panel/api/http/index.php?${params.toString()}`;
  console.log('🔗 SMS URL:', smsUrl);

  try {
    const resp = await axios.get(smsUrl, { timeout: 10000 });
    console.log('📣 SMS gateway response:', resp.data);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      timestamp: new Date().toISOString(),
      smsResponse: resp.data
    });
  } catch (err) {
    console.error('❌ SMS send failed:', err.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// OTP verification endpoint
app.post('/api/verify-otp', (req, res) => {
  const { otp } = req.body;
  
  if (!req.session.generatedOTP) {
    return res.status(400).json({
      success: false,
      error: 'No OTP session found. Please request a new OTP.'
    });
  }

  console.log('🔍 Verifying OTP:', otp, 'against', req.session.generatedOTP);
  
  if (otp === req.session.generatedOTP) {
    console.log('✅ OTP verification successful for:', req.session.phone);
    
    res.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        name: req.session.name,
        phone: req.session.phone
      },
      timestamp: new Date().toISOString()
    });
  } else {
    console.log('❌ OTP verification failed for:', req.session.phone);
    
    res.status(400).json({
      success: false,
      error: 'Invalid OTP. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// Save user data endpoint
app.post('/api/save-user', (req, res) => {
  const { name, phone, timestamp } = req.body;
  
  console.log('💾 Save User Request:');
  console.log(`  Name: ${name}`);
  console.log(`  Phone: ${phone}`);
  console.log(`  Timestamp: ${timestamp}`);
  
  res.json({
    success: true,
    message: 'User saved successfully',
    userId: `user_${phone}`,
    timestamp: new Date().toISOString()
  });
});

// Save game result endpoint
app.post('/api/save-game-result', (req, res) => {
  const { phone, name, gameMode, result, timestamp } = req.body;
  
  console.log('🎮 Game Result:');
  console.log(`  Player: ${name} (${phone})`);
  console.log(`  Mode: ${gameMode}`);
  console.log(`  Result: ${result}`);
  console.log(`  Timestamp: ${timestamp}`);
  
  res.json({
    success: true,
    message: 'Game result saved successfully',
    gameId: `game_${Date.now()}`,
    timestamp: new Date().toISOString()
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
  console.log(`🚀 Tap Race Development Server running on http://localhost:${PORT}`);
  console.log('📱 SMS Integration Status:');
  console.log(`   Username: ${SMS_USERNAME}`);
  console.log(`   Sender: ${SMS_SENDER}`);
  console.log(`   Route: ${SMS_ROUTE}`);
  console.log('📝 API endpoints available:');
  console.log('   POST /api/send-otp - Send SMS OTP');
  console.log('   POST /api/verify-otp - Verify OTP');
  console.log('   POST /api/save-user - Save user data');
  console.log('   POST /api/save-game-result - Save game results');
  console.log('');
  console.log('🔧 SMS credentials loaded from environment variables');
  console.log('💡 Make sure to set SMS_APIKEY and other credentials if needed');
});