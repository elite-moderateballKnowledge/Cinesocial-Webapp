const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyAdminToken = require('../middleware/adminAuth');

router.post('/login', adminController.login);
router.post('/ban', verifyAdminToken, adminController.banUser);

module.exports = router;
