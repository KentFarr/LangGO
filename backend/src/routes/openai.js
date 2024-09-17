const express = require('express');
const { generateMnemonics } = require('../controllers/openaiController'); // Import the controller

const router = express.Router();

// Route for generating mnemonics
router.post('/generate-mnemonics', generateMnemonics);

module.exports = router;
