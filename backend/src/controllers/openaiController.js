const OpenAI = require('openai');
const dotenv = require('dotenv');
const admin = require('../../config/firebaseConfig');

dotenv.config();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to generate mnemonics
const generateMnemonics = async (req, res) => {
  const { topWords } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  const prompt = `
  Make five flashcards with mnemonics for the following words: ${topWords.join(', ')}. 
  Also, provide 5 additional words related to the content with mnemonics. 
  Respond with a JSON format where each flashcard has the word and its mnemonic.
  Name the additional words "relatedWords" and provide the word and mnemonic for each.`;

  console.log("Received request from frontend:", topWords);

  try {

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log("Decoded token:", decodedToken);

    // Generate mnemonics using OpenAI's GPT-4 model
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        { role: 'system', content: 'You are a Generate Flashcards bot. Format each message the same.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 1,
    });

    // Log full response for debugging
    console.log("Full response from OpenAI:", completion);

    if (!completion || !completion.choices || !completion.choices[0].message) {
      console.error('Unexpected response format:', completion);
      return res.status(500).json({ error: 'Unexpected response format from OpenAI.' });
    }

    let responseContent = completion.choices[0].message.content.trim();

    // Clean up response content (removing Markdown code block delimiters)
    if (responseContent.startsWith("```json")) {
      responseContent = responseContent.slice(7, -3).trim();
    } else if (responseContent.startsWith("```") && responseContent.endsWith("```")) {
      responseContent = responseContent.slice(3, -3).trim();
    }

    console.log("Cleaned response content from OpenAI:", responseContent);

    // Parse the response content as JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return res.status(500).send('Failed to parse response from OpenAI.');
    }

    const flashcards = jsonResponse.flashcards;
    const relatedWords = jsonResponse.relatedWords;

    const mnemonicsData = {
      flashcards,
      relatedWords,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };


    const db = admin.firestore();
    await db.collection('users').doc(uid).collection('mnemonics').add(mnemonicsData);

    // Send the parsed JSON response to the frontend
    res.json(jsonResponse);

  } catch (error) {
    console.error('Error generating mnemonics:', error);
    res.status(500).send('Failed to generate mnemonics.');
  }
};

module.exports = { generateMnemonics };
