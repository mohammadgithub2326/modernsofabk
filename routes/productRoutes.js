const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyToken = require("../utils/authMiddleWear");
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

router.post('/addproduct',upload.array('images', 4), productController.addProduct);
router.put('/updateproduct', verifyToken, productController.updateProduct);
router.delete('/deleteproduct',verifyToken, productController.deleteProduct); 
router.post('/getproduct', productController.getProductById);
router.get('/getallproducts', productController.getAllProducts); 

module.exports = router;
