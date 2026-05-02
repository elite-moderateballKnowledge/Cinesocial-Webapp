const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const verifyToken = require('../middleware/auth');

router.get('/', subscriptionController.getPlans);
router.post('/subscribe', verifyToken, subscriptionController.subscribe);

module.exports = router;
