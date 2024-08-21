const jwt = require('jsonwebtoken');
const Order = require('../models/orders');
const User = require('../models/user');
const Product = require('../models/product');
const { v4: uuidv4 } = require('uuid');
const {transporter} =require('../utils/transporter')

exports.createOrder = async (req, res) => {
    console.log('Received request to create an order');
    const { userId, productId } = req.body;

    const accessToken = req.headers['authorization'];
    const refreshToken = req.headers['x-refresh-token'];
        console.log("this is a request body :" + req.body)
        console.log("this is a request headers :" + req.headers)

    try {
        console.log('Verifying access token...');
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const verifiedUserId = decodedAccessToken.userId;
        console.log('Access token verified');

        if (verifiedUserId !== userId) {
            return res.status(403).json({ status: 'fail', message: 'User verification failed' });
        }

        console.log('Checking if user exists...');
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        console.log('Checking if product exists...');
        const product = await Product.findById(productId);
        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ status: 'fail', message: 'Product not found' });
        }

        console.log('Checking for existing order...');
        const existingOrder = await Order.findOne({ userId, productId });
        if (existingOrder) {
            console.log('Order already exists for this product and user');
            return res.status(409).json({ status: 'fail', message: 'Order already exists for this product' });
        }

        console.log('Creating new order...');
        const order = new Order({
            userId,
            productId,
            uniqueId: uuidv4(),
        });
        await order.save();

        console.log('Sending email notification...');
        sendOrderConfirmationEmail(order, user.email);

        console.log('Order created successfully');
        return res.status(201).json({ status: 'success', data: order });

    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const verifiedUserId = decodedRefreshToken.userId;

                if (verifiedUserId !== userId) {
                    return res.status(403).json({ status: 'fail', message: 'User verification failed' });
                }

                // Repeat the process here...

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

function sendOrderConfirmationEmail(order, userEmail) {
    

    const mailOptions = {
        from: 'g.s.dadanoor@gmail.com',
        to: 'g.s.dadanoor@gmail.com',  // Send a copy to yourself as well
        subject: 'Order Confirmation',
        text: `Order Details:\n\nProduct ID: ${order.productId}\nOrder ID: ${order.uniqueId}\nTimestamp: ${order.timestamp}from user :${userEmail}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error sending email:', error);
        }
        console.log('Email sent: ' + info.response);
    });
}


exports.getUserOrders = async (req, res) => {
    const accessToken = req.headers['authorization'];
    const refreshToken = req.headers['x-refresh-token'];

    console.log('Received request to get user orders');

    try {
        console.log('Verifying access token...');
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const userId = decodedAccessToken.userId;
        console.log('Access token verified');

        console.log('Fetching orders for the user...');
        const orders = await Order.find({ userId });

        if (orders.length === 0) {
            console.log('No orders found for this user');
            return res.status(404).json({ status: 'fail', message: 'No orders found' });
        }

        console.log('Orders found, sending response');
        return res.status(200).json({ status: 'success', data: orders });

    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const userId = decodedRefreshToken.userId;

                console.log('Fetching orders for the user...');
                const orders = await Order.find({ userId });

                if (orders.length === 0) {
                    console.log('No orders found for this user');
                    return res.status(404).json({ status: 'fail', message: 'No orders found' });
                }

                console.log('Orders found, sending response');
                return res.status(200).json({ status: 'success', data: orders });

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