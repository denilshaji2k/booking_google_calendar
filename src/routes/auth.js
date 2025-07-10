const express = require('express');
const router = express.Router();
const { getTokenFromCode, oauth2Client } = require('../services/googleAuth');

// Add initial auth endpoint
router.get('/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// Google OAuth callback route
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing' });
    }

    // Exchange code for tokens
    const tokens = await getTokenFromCode(code);
    
    // Set the credentials
    oauth2Client.setCredentials(tokens);

    res.json({ 
      success: true, 
      message: 'Authentication successful! You can now use the calendar API.'
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

module.exports = router; 