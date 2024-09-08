const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const openaiRoutes = require('./src/routes/openai'); // Import OpenAI routes

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for requests from the frontend
app.use(cors());
app.use(express.json());

// Use OpenAI routes
app.use('/openai', openaiRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
