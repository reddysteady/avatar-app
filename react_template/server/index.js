// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const instagramRoutes = require('./routes/instagram');
const ragRoutes = require('./routes/rag');
const { PORT } = require('./config');
const { initializeSupabaseSchema } = require('./services/supabaseClient');
const { openaiClient } = require('./services/openaiClient');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Initialize services
openaiClient.initialize();

// Initialize Supabase schema if enabled
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  initializeSupabaseSchema()
    .then(success => {
      if (success) {
        console.log('Supabase schema initialized successfully');
      } else {
        console.warn('Failed to initialize Supabase schema');
      }
    })
    .catch(err => console.error('Error initializing Supabase schema:', err));
}

// API Routes
app.use('/api/instagram', instagramRoutes);
app.use('/api/rag', ragRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;