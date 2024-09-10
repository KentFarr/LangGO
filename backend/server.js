const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const openaiRoutes = require('./src/routes/openai'); // Import OpenAI routes
const reviewRoutes = require('./src/routes/review'); // Import review routes

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for requests from the frontend
app.use(cors());
app.use(express.json());

// Use OpenAI routes
app.use('/openai', openaiRoutes);

app.use('/api', (req, res, next) => {
  console.log(`Request made to: ${req.path}`);
  next();
}, reviewRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
