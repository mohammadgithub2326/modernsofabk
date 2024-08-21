const mongoose = require('mongoose');

// Define the product schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model from the schema
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
