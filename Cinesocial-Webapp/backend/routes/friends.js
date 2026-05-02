const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, friendController.getFriends);
router.post('/', verifyToken, friendController.addFriend);

module.exports = router;
