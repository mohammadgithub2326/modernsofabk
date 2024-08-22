const express = require('express');
const router = express.Router();
const { active} = require('../controllers/active');

// Route to create a new order
router.get('/ready', active);


module.exports = router;