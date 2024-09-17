const express = require('express');
const { getFlashcardsForReview, updateFlashcardReview } = require('../controllers/reviewController');
const router = express.Router();

// Route to fetch flashcards that need to be reviewed
router.get('/review/:uid', getFlashcardsForReview);

// Route to update the review status of a flashcard
router.post('/review/:uid/:flashcardId', updateFlashcardReview);

module.exports = router;
