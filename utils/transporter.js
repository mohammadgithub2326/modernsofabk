
const nodemailer = require('nodemailer');

// Configure nodemailer
exports.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.TRANSPORTER_USER,
        pass: process.env.TRANSPORTER_PASS
    }
});
