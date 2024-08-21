const express = require('express');
const router = express.Router();
const { active} = require('../controllers/active');

// Route to create a new order
router.post('/ready', active);


module.exports = router;