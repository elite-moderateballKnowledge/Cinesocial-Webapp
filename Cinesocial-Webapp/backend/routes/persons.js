const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');

router.get('/:id', personController.getPersonById);

module.exports = router;
