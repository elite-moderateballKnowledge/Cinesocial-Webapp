const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, partyController.getActiveParties);
router.post('/', verifyToken, partyController.createParty);

module.exports = router;
