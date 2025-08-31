const express = require('express');
const { getCurrent, getHistory, upsert, getCommunity } = require('../controllers/ratingsController');
const auth = require('../middlewares/auth');
const authOptional = require('../middlewares/authOptional');
const router = express.Router();

router.get('/current', authOptional, getCurrent);
router.get('/history', auth, getHistory);
router.get('/community', getCommunity);  
router.post('/', auth, upsert);

module.exports = router;
