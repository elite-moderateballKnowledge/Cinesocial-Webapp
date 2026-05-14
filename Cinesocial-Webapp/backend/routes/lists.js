const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const verifyToken = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/watchlist', verifyToken, listController.getWatchlist);
router.post('/watchlist', verifyToken, listController.addToWatchlist);
router.put('/watchlist/status', verifyToken, listController.updateWatchStatus);
router.delete('/watchlist/:movieId', verifyToken, listController.removeFromWatchlist);
router.get('/user/:id', listController.getUserLists);
router.get('/my-lists', verifyToken, listController.getUserLists);
router.get('/public', listController.getPublicLists);
router.get('/public/ranked', listController.getPublicListsRanked);
router.get('/unlisted-movies', listController.getMoviesNotInAnyList);
router.post('/', verifyToken, listController.createList);
router.get('/:id', optionalAuth, listController.getListById);
router.post('/:id/movies', verifyToken, listController.addMovieToList);
router.delete('/:id/movies/:movieId', verifyToken, listController.removeMovieFromList);

module.exports = router;

