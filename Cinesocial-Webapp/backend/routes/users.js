const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/auth');

router.get('/me', verifyToken, userController.getProfile);
router.get('/:id', userController.getProfile);
router.put('/me', verifyToken, userController.updateProfile);

module.exports = router;
