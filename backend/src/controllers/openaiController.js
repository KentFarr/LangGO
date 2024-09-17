// generateMnemonics.js
console.log('openaiController.js is loaded');

const OpenAI = require('openai');
const dotenv = require('dotenv');
const admin = require('../../config/firebaseConfig');

const uuid = require('uuid');

dotenv.config();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const calculateNextReviewDate = (currentInterval) => {
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + currentInterval); // Add days to current date
  return nextReviewDate;
};

// Function to generate mnemonics
const generateMnemonics = async (req, res) => {
  const { topWords } = req.body;

  console.log("generateMnemonics called"); 

  console.log('Top words received from frontend:', topWords); 

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Authorization header missing or invalid');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  console.log('Extracted token from header:', token); 

  const prompt = `
  Make five flashcards with mnemonics for the following words: ${topWords.join(', ')}. 
  Also, provide 5 additional words related to the content with mnemonics.
  Make sure the additional words are just as difficult as the original words.
  Name the additional words "relatedWords" and provide the word and mnemonic for each.
  Make sure the mnemonics are easy to remember and have the english meaning and spelling of the word in them.
  Respond in the following JSON format:
  {
    "flashcards": [
      { "word": "word1", "mnemonic": "mnemonic1" },
      { "word": "word2", "mnemonic": "mnemonic2" },
      ...
    ],
    "relatedWords": [
      { "word": "relatedWord1", "mnemonic": "mnemonic1" },
      { "word": "relatedWord2", "mnemonic": "mnemonic2" },
      ...
    ]
  }
  Ensure the response is valid JSON without any additional text.
  `;

  console.log('Prompt sent to OpenAI:', prompt); 

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log('Decoded token UID:', uid); 

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Generate Flashcards bot. Format each message the same.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 1,
    });

    console.log('Full response from OpenAI:', JSON.stringify(completion, null, 2)); // Log the full response

    if (!completion || !completion.choices || !completion.choices[0].message) {
      console.error('Unexpected response format from OpenAI:', completion);
      return res.status(500).json({ error: 'Unexpected response format from OpenAI.' });
    }

    let responseContent = completion.choices[0].message.content.trim();
    console.log('Raw response content from OpenAI:', responseContent); 

    // Extract JSON content
    const jsonStartIndex = responseContent.indexOf('{');
    const jsonEndIndex = responseContent.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      responseContent = responseContent.substring(jsonStartIndex, jsonEndIndex + 1);
    } else {
      console.error('JSON content not found in the response.');
      return res.status(500).send('Invalid response format from OpenAI.');
    }

    console.log('Extracted JSON content:', responseContent); 

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return res.status(500).send('Failed to parse response from OpenAI.');
    }

    console.log('Parsed jsonResponse:', JSON.stringify(jsonResponse, null, 2)); 

    // Validate the structure of jsonResponse
    if (
      !Array.isArray(jsonResponse.flashcards) ||
      !Array.isArray(jsonResponse.relatedWords)
    ) {
      console.error('Invalid structure in jsonResponse:', jsonResponse);
      return res.status(500).send('Invalid structure in OpenAI response.');
    }

    const initializeReviewData = (flashcard, index, type) => {
      const initialReviewInterval = 1;
      const nextReviewDate = calculateNextReviewDate(initialReviewInterval);
      const id = uuid.v4(); 

      console.log(`Generated id for ${type} [${index}]:`, id); 

      const newFlashcard = {
        ...flashcard,
        id,
        nextReviewDate: nextReviewDate.toISOString(),
        reviewInterval: initialReviewInterval,
      };

      console.log(`New ${type} flashcard with id [${index}]:`, newFlashcard); 

      return newFlashcard;
    };

    const flashcards = jsonResponse.flashcards.map((flashcard, index) =>
      initializeReviewData(flashcard, index, 'flashcard')
    );
    const relatedWords = jsonResponse.relatedWords.map((flashcard, index) =>
      initializeReviewData(flashcard, index, 'relatedWord')
    );

    console.log('Final flashcards to be sent:', JSON.stringify(flashcards, null, 2)); 
    console.log('Final relatedWords to be sent:', JSON.stringify(relatedWords, null, 2)); 

    const mnemonicsData = {
      flashcards,
      relatedWords,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = admin.firestore();
    await db.collection('users').doc(uid).collection('mnemonics').add(mnemonicsData);

    console.log('Data saved to Firestore for user:', uid); 

    res.json({ flashcards, relatedWords });
  } catch (error) {
    console.error('Error generating mnemonics:', error);
    res.status(500).send('Failed to generate mnemonics.');
  }
};

module.exports = { generateMnemonics };
