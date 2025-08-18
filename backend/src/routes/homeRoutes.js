const express = require('express');
const { getFeatured, getTagCloud, getRandom } = require('../controllers/homeController');
const router = express.Router();

router.get('/home/featured', getFeatured);
router.get('/home/tag-cloud', getTagCloud);
router.get('/home/random', getRandom);

module.exports = router;
