const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS to allow requests from your frontend
app.use(cors());
app.use(express.json());

// fix the api key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate-mnemonics', async (req, res) => {
  const { topWords } = req.body;

  const prompt = `
  Create mnemonics for the following words: ${topWords.join(', ')}.
  Also, provide 5 additional unique words related to the content.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use 'gpt-4' if you have access
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
      
    } );
    console.log("sent request to openai")

    const response = completion.choices[0].message?.content?.trim() || 'No response from AI';
    const parts = response.split('\n').filter(line => line.trim() !== '');

    const mnemonics = parts.slice(0, topWords.length);
    const additionalWords = parts.slice(topWords.length, topWords.length + 5);

    res.json({ mnemonics, additionalWords });
    console.log("sent response to frontend" + mnemonics + additionalWords)
  } catch (error) {
    console.error('Error generating mnemonics:', error);
    res.status(500).json({ error: 'Failed to generate mnemonics.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
