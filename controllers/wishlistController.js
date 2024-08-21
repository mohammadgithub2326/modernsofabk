const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const User = require('../models/user');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

exports.addProductToWishlist = async (req, res) => {
    const { productId, userId } = req.body;

    try {
        const user = await User.findById(userId);
        const product = await Product.findById(productId);

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        if (!product) {
            return res.status(404).json({ status: 'fail', message: 'Product not found' });
        }

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, products: [productId] });
        } else {
            if (!wishlist.products.includes(productId)) {
                wishlist.products.push(productId);
            }
        }

        await wishlist.save();

        res.status(200).json({ status: 'success', message: 'Product successfully added to wishlist' });
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        res.status(500).json({ status: 'fail', message: 'Server error', error: error.message });
    }
};

exports.dowloadwishlist = async (req, res) => {
    console.log("request received for download wishlist : "+req.body.userId +req.params.userId)

    const { userId } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const wishlist = await Wishlist.findOne({ user: userId }).populate('products');

        if (!wishlist) {
            return res.status(404).json({ status: 'fail', message: 'Wishlist not found' });
        }

        // Generate PDF
        const doc = new PDFDocument();

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="wishlist_${userId}.pdf"`);

        // Pipe the document to the response
        doc.pipe(res);

        doc.fontSize(25).text('Wishlist', {
            align: 'center'
        });

        wishlist.products.forEach(product => {
            doc.fontSize(20).text(`Product: ${product.productDescription}`, {
                align: 'left'
            });
            doc.fontSize(15).text(`Category: ${product.categories}`, {
                align: 'left'
            });
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ status: 'fail', message: 'Server error', error: error.message });
    }
};

exports.downloadWishlistPDF = async (req, res) => {
    const { userId } = req.body;

    try {
        console.log(`Received request to download wishlist PDF for user ID: ${userId}`);

        console.log('Fetching wishlist...');
        const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
        
        if (!wishlist) {
            console.log('Wishlist not found');
            return res.status(404).json({ status: 'fail', message: 'Wishlist not found' });
        }

        console.log('Wishlist found, generating PDF...');
        generateWishlistPDF(wishlist, res, userId);

    } catch (error) {
        console.error('Error generating PDF:', error);
        return res.status(500).json({ status: 'fail', message: 'Server error', error: error.message });
    }
};
const convertAndUseDriveUrl = (url) => {
    const id = url.split('id=')[1];
    return `https://drive.google.com/uc?export=view&id=${id}`;
  };

function generateWishlistPDF(wishlist, res, userId) {
    const doc = new PDFDocument();

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="wishlist_${userId}.pdf"`);

    // Pipe the document to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(25).text('Wishlist', { align: 'center' }).moveDown(2);

    wishlist.products.forEach(product => {
        const description = product.description || 'No description available';
        const category = product.category || 'No category available';
        const imageUrls = product.images || []; // Assuming `imageUrls` is an array of image URLs

        doc.fontSize(20).text(`Product: ${description}`, { align: 'left' });
        doc.fontSize(15).text(`Category: ${category}`, { align: 'left' });
        doc.moveDown();

        if (imageUrls.length > 0) {
            imageUrls.forEach((imageUrl, index) => {
                const convertedUrl = convertAndUseDriveUrl(imageUrl); // Convert the URL
                console.log(`Adding image ${index + 1} for product: ${description}`);
                try {
                    doc.image(convertedUrl, {
                        fit: [150, 150], // Adjust size as needed
                        align: 'center',
                        valign: 'center'
                    });
                    doc.moveDown();
                } catch (error) {
                    console.error(`Error adding image ${index + 1} for product ${description}:`, error.message);
                    doc.fontSize(15).text(`Image ${index + 1} could not be loaded.`, { align: 'center' });
                    doc.moveDown();
                }
            });
        } else {
            doc.fontSize(15).text('No images available.', { align: 'center' });
            doc.moveDown();
        }

        doc.moveDown();
    });

    console.log('Finalizing PDF document...');

    // Respond with success once the PDF is sent
    doc.on('end', () => {
        console.log('PDF generated and sent successfully');
        res.status(200).end();
    });
}

exports.getWishlist = async (req, res) => {
    console.log(req.headers)
    const accessToken = req.headers?.authorization;
    const refreshToken = req.headers["x-refresh-token"];

    console.log('Received request to get wishlist');

    try {
        console.log('Verifying access token...');
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const userId = decodedAccessToken.userId;
        console.log(`Access token verified. User ID: ${userId}`);

        console.log('Fetching user...');
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }
        console.log('User found');

        console.log('Fetching wishlist...');
        const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
        if (!wishlist) {
            console.log('Wishlist not found');
            return res.status(404).json({ status: 'fail', message: 'Wishlist not found' });
        }
        console.log('Wishlist found');

        console.log('Sending wishlist as response');
        return res.status(200).json({ status: 'success', data: wishlist.products });

    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const userId = decodedRefreshToken.userId;
                console.log(`Refresh token verified. User ID: ${userId}`);

                console.log('Fetching user...');
                const user = await User.findById(userId);
                if (!user) {
                    console.log('User not found');
                    return res.status(404).json({ status: 'fail', message: 'User not found' });
                }
                console.log('User found');

                console.log('Fetching wishlist...');
                const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
                if (!wishlist) {
                    console.log('Wishlist not found');
                    return res.status(404).json({ status: 'fail', message: 'Wishlist not found' });
                }
                console.log('Wishlist found');

                console.log('Sending wishlist as response');
                return res.status(200).json({ status: 'success', data: wishlist.products });

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

exports.removeProductFromWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return res.status(404).json({ status: 'fail', message: 'Wishlist not found' });
        }

        const productIndex = wishlist.products.indexOf(productId);
        if (productIndex > -1) {
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();
            return res.status(200).json({ status: 'success', message: 'Product successfully removed from wishlist' });
        } else {
            return res.status(404).json({ status: 'fail', message: 'Product not found in wishlist' });
        }
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ status: 'fail', message: 'Server error', error: error.message });
    }
};