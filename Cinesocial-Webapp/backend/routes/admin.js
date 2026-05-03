const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyAdminToken = require('../middleware/adminAuth');

router.post('/login', adminController.login);
router.put('/ban', adminController.banUser);
router.post('/movie', adminController.addMovie);
router.get('/activity', adminController.getCombinedActivity);
router.get('/system-report', adminController.getSystemReport);

module.exports = router;
