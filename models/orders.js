const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    uniqueId: {
        type: String,
        unique: true,
        required: true
    }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
