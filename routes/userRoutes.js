const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

console.log("route.js  entered ")

router.post('/register', userController.registerUser);
router.get('/approve', userController.approve);
router.get('/reject', userController.reject);

router.post('/login', userController.login); 
// Route to get user profile
router.get('/getprofile', userController.getUserProfile);

// Route to update user profile
router.put('/updateprofile', userController.updateUserProfile);
console.log("arived at login route")

// Route to change password
router.post('/changepassword', userController.changePassword);


// Route to forgot password
router.post('/forgot-password', userController.forgotPassword);

module.exports = router;
