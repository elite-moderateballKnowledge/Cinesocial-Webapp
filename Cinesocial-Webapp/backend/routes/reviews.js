const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const verifyToken = require('../middleware/auth');

router.get('/movie/:movieId', reviewController.getMovieReviews);
router.post('/', verifyToken, reviewController.addReview);
router.put('/pin/:activityId', verifyToken, reviewController.pinReview);

module.exports = router;
