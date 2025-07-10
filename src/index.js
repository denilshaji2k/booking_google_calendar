require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { setupGoogleAuth, checkAndRefreshToken } = require('./services/googleAuth');
const appointmentRoutes = require('./routes/appointments');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/appointments', checkAndRefreshToken, appointmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize Google Auth
setupGoogleAuth().catch(console.error);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 