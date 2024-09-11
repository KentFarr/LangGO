const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const openaiRoutes = require('./src/routes/openai'); // Import OpenAI routes
const reviewRoutes = require('./src/routes/review'); // Import review routes
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for requests from the frontend
app.use(cors());
app.use(express.json());

// Serve the static files from the React frontend app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API Routes
app.use('/openai', openaiRoutes);
app.use('/api', reviewRoutes);

// All remaining requests should be redirected to the React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
