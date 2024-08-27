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

// Fix the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate-mnemonics', async (req, res) => {
  const { topWords } = req.body;

  const prompt = `
  make five flashcards with mnemonics for the following words: ${topWords.join(', ')}. 
  Also, provide 5 additional words related to the content with mnemonics. 
  Respond with a JSON format where each flashcard has the word and its mnemonic.
  Name the additional words "relatedWords" and provide the word and mnemonic for each.`;

  console.log("Received request from frontend: " + topWords);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        { role: 'system', content: 'You are a Generate Flashcards bot. Format each message the same' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 1,
    });

    // Log the full response for debugging purposes
    console.log("Full response from OpenAI:", completion);

    // Check if the completion object contains choices and message
    if (!completion || !completion.choices || !completion.choices[0].message) {
      console.error('Unexpected response format:', completion);
      return res.status(500).json({ error: 'Unexpected response format from OpenAI.' });
    }

    // Extract the response content and clean it up
    let responseContent = completion.choices[0].message.content.trim();


    // Remove any Markdown-style code block delimiters (e.g., ```json ... ```)
    if (responseContent.startsWith("```json")) {
      responseContent = responseContent.slice(7, -3).trim(); // Remove the leading ```json and trailing ```
    } else if (responseContent.startsWith("```") && responseContent.endsWith("```")) {
      responseContent = responseContent.slice(3, -3).trim(); // Remove the leading and trailing ```
    }

    console.log("Cleaned response content from OpenAI: " + responseContent);

    // Parse the response content as JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return res.status(500).send('Failed to parse response from OpenAI');
    }

    // Send the parsed JSON response to the frontend
    res.json(jsonResponse);

  } catch (error) {
    console.error('Error generating mnemonics:', error);
    res.status(500).send('Failed to generate mnemonics');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
