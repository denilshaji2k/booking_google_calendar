const { google } = require('googleapis');

// Add token storage
let storedTokens = null;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes needed for Calendar and Meet
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

async function setupGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing required Google OAuth credentials in .env file');
  }

  // Generate auth URL for initial setup
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to ensure refresh token
  });
  
  console.log('\n=== Google Calendar Authentication Setup ===');
  console.log('1. Make sure you have set up your Google Cloud Project');
  console.log('2. Ensure you have enabled Google Calendar API and Google Meet API');
  console.log('3. Visit this URL to authorize the application:');
  console.log('\n', authUrl, '\n');
  console.log('After authorization, you will be redirected to the callback URL');
  console.log('The application will then exchange the code for access tokens');
  console.log('==========================================\n');
}

async function getTokenFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  storedTokens = tokens;
  oauth2Client.setCredentials(tokens);
  return tokens;
}

async function refreshAccessToken() {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    storedTokens = credentials;
    oauth2Client.setCredentials(credentials);
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

// Add token middleware
async function checkAndRefreshToken(req, res, next) {
  try {
    if (!storedTokens) {
      throw new Error('No access token available. Please authenticate first.');
    }

    // Check if token is expired or about to expire
    const expiryDate = new Date(storedTokens.expiry_date);
    if (expiryDate <= new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      storedTokens = credentials;
      oauth2Client.setCredentials(credentials);
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required. Please authenticate first.' });
  }
}

// Get authenticated calendar client
function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

module.exports = {
  setupGoogleAuth,
  getTokenFromCode,
  refreshAccessToken,
  getCalendarClient,
  oauth2Client,
  checkAndRefreshToken
}; 