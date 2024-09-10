const OpenAI = require('openai');
const dotenv = require('dotenv');
const admin = require('../../config/firebaseConfig');

dotenv.config();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to calculate the next review date based on the current review interval
const calculateNextReviewDate = (currentInterval) => {
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + currentInterval); // Add days to current date
  return nextReviewDate;
};

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
  Make sure the additional words are just as difficult as the original words.
  Respond with a JSON format where each flashcard has the word and its mnemonic.
  Name the additional words "relatedWords" and provide the word and mnemonic for each.
  Make sure the mnemonics are easy to remember and have the english meaning and spelling of the word in them.`;

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

    console.log("Full response from OpenAI:", completion);

    if (!completion || !completion.choices || !completion.choices[0].message) {
      console.error('Unexpected response format:', completion);
      return res.status(500).json({ error: 'Unexpected response format from OpenAI.' });
    }

    let responseContent = completion.choices[0].message.content.trim();

    if (responseContent.startsWith("```json")) {
      responseContent = responseContent.slice(7, -3).trim();
    } else if (responseContent.startsWith("```") && responseContent.endsWith("```")) {
      responseContent = responseContent.slice(3, -3).trim();
    }

    console.log("Cleaned response content from OpenAI:", responseContent);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return res.status(500).send('Failed to parse response from OpenAI.');
    }

    // Function to initialize next review date and interval
    const initializeReviewData = (flashcard) => {
      const initialReviewInterval = 1;  // Initial interval set to 1 day
      const nextReviewDate = calculateNextReviewDate(initialReviewInterval);
      return {
        ...flashcard,
        nextReviewDate: nextReviewDate.toISOString(),
        reviewInterval: initialReviewInterval,
      };
    };

    // Initialize each flashcard with its own review date and interval
    const flashcards = jsonResponse.flashcards.map(initializeReviewData);
    const relatedWords = jsonResponse.relatedWords.map(initializeReviewData);

    const mnemonicsData = {
      flashcards,
      relatedWords,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = admin.firestore();
    await db.collection('users').doc(uid).collection('mnemonics').add(mnemonicsData);

    res.json(jsonResponse);

  } catch (error) {
    console.error('Error generating mnemonics:', error);
    res.status(500).send('Failed to generate mnemonics.');
  }
};

module.exports = { generateMnemonics };

