const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders } = require('../controllers/orderController');

// Route to create a new order
router.post('/create', createOrder);

// Route to get all orders for the current user
router.get('/userorders', getUserOrders);

module.exports = router;
