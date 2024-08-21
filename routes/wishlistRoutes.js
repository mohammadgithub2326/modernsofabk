const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

router.post('/addtowishlist', wishlistController.addProductToWishlist);

router.post('/getWishlist', wishlistController.getWishlist);

router.post('/removefromwishlist', wishlistController.removeProductFromWishlist); 

router.post('/downloadWishlist',wishlistController.downloadWishlistPDF)

module.exports = router;
