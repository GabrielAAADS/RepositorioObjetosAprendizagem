const express = require('express');
const { sendFeedback } = require('../controllers/feedbackController');
const router = express.Router();

router.post('/feedback', sendFeedback);

module.exports = router;
