const jwt = require('jsonwebtoken');
const Token = require('../models/token');
const dotenv = require('dotenv');
dotenv.config();
// const secretKey = 'your_secret_key';
// const refreshSecretKey = 'your_refresh_secret_key';

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (error, decoded) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                // Token has expired, try to refresh it
                const refreshToken = req.headers['x-refresh-token'];
                if (!refreshToken) {
                    return res.status(401).json({ message: 'Refresh token not provided.' });
                }

                const tokenDoc = await Token.findOne({ token: refreshToken });
                if (!tokenDoc) {
                    return res.status(401).json({ message: 'Invalid refresh token.' });
                }

                jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (refreshError, refreshDecoded) => {
                    if (refreshError) {
                        return res.status(401).json({ message: 'Invalid refresh token.' });
                    }

                    // Generate a new token
                    const newToken = jwt.sign({ id: refreshDecoded.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
                    res.setHeader('Authorization', newToken);
                    req.user = refreshDecoded;
                    next();
                });
            } else {
                return res.status(401).json({ message: 'Invalid token.' });
            }
        } else {
            req.user = decoded;
            next();
        }
    });
};

module.exports = verifyToken;
