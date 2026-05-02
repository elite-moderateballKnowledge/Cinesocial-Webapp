const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const verifyToken = require('../middleware/auth');

router.get('/watchlist', verifyToken, listController.getWatchlist);
router.post('/watchlist', verifyToken, listController.addToWatchlist);
router.get('/user/:id', listController.getUserLists);
router.get('/my-lists', verifyToken, listController.getUserLists);

module.exports = router;
