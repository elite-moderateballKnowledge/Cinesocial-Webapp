const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const verifyToken = require('../middleware/auth');

router.get('/movie/:movieId', reviewController.getMovieReviews);
router.get('/counts', reviewController.getReviewCountPerMovie);
router.post('/', verifyToken, reviewController.addReview);
router.put('/pin/:activityId', verifyToken, reviewController.pinReview);
router.put('/:activityId', verifyToken, reviewController.editReview);
router.delete('/:activityId', verifyToken, reviewController.deleteReview);

module.exports = router;

