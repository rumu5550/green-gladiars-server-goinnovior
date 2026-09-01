const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Run MongoDB connection test
require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Green Gladiators API Server!',
    status: 'Running',
    timestamp: new Date(),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Green Gladiators Server running on port ${PORT}`);
});
