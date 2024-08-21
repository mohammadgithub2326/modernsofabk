const Product = require('../models/product');
const User = require('../models/user');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const {uploadImagesToDrive}=require("../utils/uploadimagestodrive")
const {transporter} = require("../utils/transporter")
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');

dotenv.config();

console.log("entered the product controller ")




exports.addProduct = async (req, res) => {
    try {
        console.log('Received addProduct request'  +req.headers.authorization +" "+ req.body.name);
        console.log(process.env.JWT_ACCESS_SECRET);

        const accessToken = req?.headers?.authorization?.split(' ')[1];
        if (!accessToken) {
            console.log('Access token missing');
            return res.status(403).json({ message: 'Access Denied' });
        }

        let payload;
        try {
            console.log("entered jwt verification "+ accessToken)
            payload = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            console.log('Access token verified. Payload:', payload);
        } catch (err) {
            console.log('Access token invalid, checking refresh token');
            const refreshToken = req?.headers?.x-refresh-token;
            if (!refreshToken) {
                console.log('Refresh token missing');
                return res.status(403).json({ message: 'Access Denied' });
            }
            try {
                const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                console.log('Refresh token verified. Payload:', decodedRefresh);
                const newAccessToken = jwt.sign({ user: decodedRefresh.user }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
                res.setHeader('x-new-access-token', newAccessToken);
                payload = decodedRefresh;
            } catch (err) {
                console.log('Refresh token invalid:', err.message);
                return res.status(403).json({ message: 'Access Denied' });
            }
        }

        if (payload.type !== 'owner') {
            console.log('User is not an owner');
            return res.status(403).json({ message: 'Only owners can add products' });
        }
        console.log('User is  an owner');

        const { name, description, category, addedBy } = req.body;
        console.log(req.files+ " above  are the image urls");

        const files = req.files;
         console.log(files)

        if (files.length > 4) {
            console.log('Too many images uploaded');
            return res.status(400).json({ message: 'Only 4 images are allowed per product' });
        }

        console.log('Checking if product already exists');
        const existingProduct = await Product.findOne({ name,description });
        if (existingProduct) {
            console.log('Product already exists');
            return res.status(400).json({ message: 'Product already exists' });
        }

        const imageUrls = await uploadImagesToDrive(files);
        if(imageUrls.length === 0){
            console.log("no usrls got from uploadimagestodrive method "  + imageUrls)
            return res.status(401).json({ message: 'no image urls are generatedd from uploadimagestodrive method' });
        }
        console.log('Saving product to database');
        const product = new Product({ name, description, category, images: imageUrls, addedBy });
        await product.save();

        console.log('Sending confirmation email');
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EMAIL,
        //         pass: process.env.PASSWORD,
        //     },
        // });

        const mailOptions = {
            from: process.env.EMAIL,
            to: 'g.s.dadanoor@gmail.com',
            subject: 'Product Added Successfully',
            text: ` the Product  with details ${name} ${description,files,category} has been added successfully.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');

        res.status(201).json({ message: 'Product added successfully', product });

    } catch (error) {
        console.error('Error in addProduct:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}; 


exports.updateProduct = async (req, res) => {
    const accessToken = req.headers['authorization'];
    const refreshToken = req.headers['x-refresh-token'];
    const { productId, images, productDescription, category } = req.body;

    console.log('Entered update method');

    try {
        console.log('Verifying access token...');
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const userId = decodedAccessToken.userId;
        console.log('Access token verified');

        console.log('Fetching user details...');
        const user = await User.findById(userId);

        if (!user || user.type !== 'admin') {
            return res.status(403).json({ status: 'fail', message: 'Only admin can update products' });
        }

        console.log('Fetching product details...');
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ status: 'fail', message: 'Product not found' });
        }

        console.log('Updating product details...');
        if (images) product.images = images;
        if (productDescription) product.productDescription = productDescription;
        if (category) product.category = category;

        await product.save();

        res.status(200).json({ status: 'success', message: 'Product successfully updated' });
    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const userId = decodedRefreshToken.userId;

                console.log('Fetching user details...');
                const user = await User.findById(userId);

                if (!user || user.type !== 'admin') {
                    return res.status(403).json({ status: 'fail', message: 'Only admin can update products' });
                }

                console.log('Fetching product details...');
                const product = await Product.findById(productId);

                if (!product) {
                    return res.status(404).json({ status: 'fail', message: 'Product not found' });
                }

                console.log('Updating product details...');
                if (images) product.images = images;
                if (productDescription) product.productDescription = productDescription;
                if (category) product.category = category;

                await product.save();

                res.status(200).json({ status: 'success', message: 'Product successfully updated' });

            } catch (refreshError) {
                console.error('Error verifying refresh token:', refreshError);
                return res.status(403).json({ status: 'fail', message: 'Invalid refresh token' });
            }
        } else {
            console.error('Error verifying access token:', error);
            return res.status(403).json({ status: 'fail', message: 'Invalid access token' });
        }
    }
};

exports.deleteProduct = async (req, res) => {
    console.log("Entered delete method");

    const accessToken = req.headers['authorization'];
    const refreshToken = req.headers['x-refresh-token'];
    const { productId, confirmation } = req.body;

    try {
        console.log('Verifying access token...');
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const userId = decodedAccessToken.userId;
        console.log('Access token verified');

        console.log('Fetching user details...');
        const user = await User.findById(userId);

        if (!user || user.type !== 'admin') {
            return res.status(403).json({ status: 'fail', message: 'Only admin can delete products' });
        }

        console.log('Fetching product details...');
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ status: 'fail', message: 'Product not found' });
        }

        if (!confirmation || confirmation.toLowerCase() !== 'yes') {
            return res.status(400).json({ status: 'fail', message: 'Deletion not confirmed' });
        }

        console.log('Deleting product...');
        await product.deleteOne();

        res.status(200).json({ status: 'success', message: 'Product successfully deleted' });
    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const userId = decodedRefreshToken.userId;

                console.log('Fetching user details...');
                const user = await User.findById(userId);

                if (!user || user.type !== 'admin') {
                    return res.status(403).json({ status: 'fail', message: 'Only admin can delete products' });
                }

                console.log('Fetching product details...');
                const product = await Product.findById(productId);

                if (!product) {
                    return res.status(404).json({ status: 'fail', message: 'Product not found' });
                }

                if (!confirmation || confirmation.toLowerCase() !== 'yes') {
                    return res.status(400).json({ status: 'fail', message: 'Deletion not confirmed' });
                }

                console.log('Deleting product...');
                await product.deleteOne();

                res.status(200).json({ status: 'success', message: 'Product successfully deleted' });

            } catch (refreshError) {
                console.error('Error verifying refresh token:', refreshError);
                return res.status(403).json({ status: 'fail', message: 'Invalid refresh token' });
            }
        } else {
            console.error('Error verifying access token:', error);
            return res.status(403).json({ status: 'fail', message: 'Invalid access token' });
        }
    }
};

exports.getAllProducts = async (req, res) => {
    console.log("entered getall products method")
    try {
        const products = await Product.find();
        res.status(200).json({
            status: 'success',
            message: 'Products successfully fetched',
            data: products
        });
        console.log(products)
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ status: 'fail', message: 'Server error', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    console.log("entered the getproductbyid  method")
    try {
        const { productId } = req.body;
        console.log(productId)
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
            console.log("product not found")
        }

        res.status(200).json(product
            );
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};