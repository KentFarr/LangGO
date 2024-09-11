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

// Use OpenAI routes
app.use('/openai', openaiRoutes);

// Middleware for logging API requests
app.use('/api', (req, res, next) => {
  console.log(`Request made to: ${req.path}`);
  next();
}, reviewRoutes);

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Catch-all handler: Send index.html for any other request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
