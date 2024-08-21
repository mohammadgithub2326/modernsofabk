const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken")
const Token = require("../models/token")
const dotenv = require('dotenv');
const validator = require('validator');
const {transporter} = require("../utils/transporter")
dotenv.config();

// // Configure nodemailer
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'g.s.dadanoor@gmail.com',
//         pass: 'kkfrkoognhkrwksi'
//     }
// });
exports.registerUser = async (req, res) => {
    console.log("entered user egistration mesthod")
    const { name, email, password, type, mobile } = req.body;
    console.log("data destructured from the req body")

    // Validate email
    if (!validator.isEmail(email)) {
        console.log("email format is invalid")

        return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    console.log("entered existing user mesthod")

    if (existingUser) {
        
        console.log("user already found")

        return res.status(400).json({ message: 'This email is already registered. Please login.' });
    }

    // Handle Owner registration request
    if (type.toLowerCase() === 'owner') {
        console.log("entered the if statement for sending mail to Owner approval  method")

        // Send an email for owner approval
        const mailOptions = {
            from: email,
            to: 'g.s.dadanoor@gmail.com',
            subject: 'Owner Registration Request',
            html: `
                <p>The user with email ${email} is trying to register as an Owner.</p>
                <button><a href="http://localhost:5000/api/v1/users/approve?email=${email}">Accept</a></button>
                <button><a href="http://localhost:5000/api/v1/users/reject?email=${email}">Reject</a></button>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Failed to send approval email.")

                return res.status(500).json({ message: 'Failed to send approval email.' });
            } else {
                console.log("Owner registration request sent for approval.")

                return res.status(200).json({ message: 'Owner registration request sent for approval.' });
            }
        });

        // return; // Exit the function here, the registration will be handled based on email approval.
    }

    // Register the user (Customer)
    const newUser = new User({ name, email, password, type: 'customer', mobile });

    console.log("user tried to register as customer")


    try {
        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully.' });
        console.log("regustration successfull as a cusyomer")

    } catch (error) {
        return res.status(500).json({ message: 'Failed to register user.' });
        console.log("register failed")

    }
    

};


exports.approve = async (req, res) => {    
    console.log("entered approve method")

    const { email } = req.query;
    console.log("data destructured from req body")


    try {
        // Find the user by email
        console.log("finding the user by email ")
        const user = await User.findOne({ email });

        if (!user) {

            return res.status(404).json({ message: 'User not found.' });
            console.log("user not found ")
        }

        // Update the user's type to Owner
        console.log("updating the user in database")
        user.type = 'owner';
        await user.save();

        // Send approval notification
        const mailOptions = {
            from: 'g.s.dadanoor@gmail.com',
            to: email,
            subject: 'Owner Registration Approved',
            text: 'Congratulations! Your request to register as an Owner has been approved.'
        };
        console.log("send the comfirmation mail")

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("failed to send the confirmation  mail")
                return res.status(500).json({ message: 'Failed to send approval email.' });
            } else {
                console.log("comfirmation mail sent successfully")
                return res.status(200).json({ message: 'User approved as Owner and notification sent successfully.' });
            }
        });

    } catch (error) {
        return res.status(500).json({ message: 'Failed to approve user as Owner.' });
        console.log("failed to approve  the user as owner")
    }
};

exports.reject = async (req, res) => {
    console.log("entered the reject method")
    const { email } = req.query;
    console.log("data destructured from req body")
    try {
        // Find and delete the user by email
        console.log("finding the user from the database")
        const user = await User.findOneAndDelete({ email });


        if (!user) {

            console.log("user not found")
            return res.status(404).json({ message: 'User not found.' });
        }

        // Send rejection notification
        const mailOptions = {
            from: 'g.s.dadanor@gmail.com',
            to: email,
            subject: 'Owner Registration Rejected',
            text: 'We regret to inform you that your request to register as an Owner has been rejected.'
        };
        console.log("sending the rejection mail ")
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("rejection mail sending failed ")
                return res.status(500).json({ message: 'Failed to send rejection email.' });
            } else {
                console.log("rejection mail sending successfull")
                return res.status(200).json({ message: 'Owner registration request rejected and notification sent.' });
            }
        });

    } catch (error) {
        console.log("failed to reject the owner aplication")
        return res.status(500).json({ message: 'Failed to reject user registration.' });
    }
};





//controller for login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log('Received login request for email:', email + password);

    try {
        // Check if user is registered
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found:', email+""+user.password);

        // Hash the incoming password for comparison
        // const isMatch = await bcrypt.compare(password, user.password);
        if (!password ===user.password) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Password match for user:', email);

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user._id, name:user.name,type:user.type, email: user.email },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '29d' }
        );
        console.log('Access token generated for user:', email);

        const refreshToken = jwt.sign(
            { userId: user._id,name:user.name, email: user.email,type:user.type },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: 30*24*60*60 }
        );
        console.log('Refresh token generated for user:', email);

        // Check if token already exists and delete it
        const existingToken = await Token.findOne({ userId: user._id });
        if (existingToken) {
            await Token.deleteOne({ userId: user._id });
            console.log('Existing token deleted for user:', email);
        }

        // Save new token in database
        const token = new Token({
            userId: user._id,
            email: user.email,
            refreshToken,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        await token.save();
        console.log('New token saved for user:', email);

        // Send email if the user is an owner
        if (user.type === 'owner') {
            // const transporter = nodemailer.createTransport({
            //     service: 'gmail',
            //     auth: {
            //         user: 'g.s.dadanoor@gmail.com',
            //         pass: 'your_email_password',
            //     },
            // });

            const mailOptions = {
                from:'g.s.dadanoor@gmail.com',
                to: email,
                subject: 'Owner Login Attempt',
                text: `User with email ${user.email} and name  ${user.name} is logged in  as a owner.`,
            };

            await transporter.sendMail(mailOptions);
            console.log('Login attempt email sent for user:', email);
        }

        // Respond with tokens
        res.json({ accessToken, refreshToken });
        console.log('Response sent with tokens for user:', email);
    } catch (error) {
        console.error('Error during login process:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserProfile = async (req, res) => {
    
    console.log(req.headers)
    const accessToken = req.headers['authorization'];
    console.log(accessToken)
    const refreshToken = req.headers['x-refresh-token'];

    console.log('Received request to get user profile');

    try {
        console.log('Verifying access token...');
        console.log( decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET))
        const userId = decodedAccessToken.userId;
        console.log('Access token verified');

        console.log('Fetching user details...');
        const user = await User.findById(userId);

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        console.log('User details found, sending response');
        return res.status(200).json({ status: 'success', data: user });

    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const userId = decodedRefreshToken.userId;

                console.log('Fetching user details...');
                const user = await User.findById(userId);

                if (!user) {
                    console.log('User not found');
                    return res.status(404).json({ status: 'fail', message: 'User not found' });
                }

                console.log('User details found, sending response');
                return res.status(200).json({ status: 'success', data: user });

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

exports.updateUserProfile = async (req, res) => {
    const accessToken = req.headers['authorization'];
    const refreshToken = req.headers['x-refresh-token'];
    console.log('Received request to update user profile');
    const userId= req.body._id
    const updateData = req.body;
    console.log( "this is a data for update" + updateData)
    console.log("this is a req body" + req.body)


    try {
        console.log('Verifying access token...');
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const verifiedUserId = decodedAccessToken.userId;
        console.log('Access token verified');

        if (verifiedUserId !== userId) {
            return res.status(403).json({ status: 'fail', message: 'User verification failed' });
        }

        console.log('Fetching user details...');
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        console.log('Updating user details...');
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        console.log('User details updated successfully');

        return res.status(200).json({ status: 'success', data: updatedUser });

    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const verifiedUserId = decodedRefreshToken.userId;

                if (verifiedUserId !== userId) {
                    return res.status(403).json({ status: 'fail', message: 'User verification failed' });
                }

                console.log('Fetching user details...');
                const user = await User.findById(userId);
                if (!user) {
                    console.log('User not found');
                    return res.status(404).json({ status: 'fail', message: 'User not found' });
                }

                console.log('Updating user details...');
                const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
                console.log('User details updated successfully');

                return res.status(200).json({ status: 'success', data: updatedUser });

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

exports.changePassword = async (req, res) => {
    const accessToken = req.headers['authorization'];
    const refreshToken = req.headers['x-refresh-token'];
    const { userId, currentPassword, newPassword } = req.body;

    console.log('Received request to change password');

    try {
        console.log('Verifying access token...');
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const verifiedUserId = decodedAccessToken.userId;
        console.log('Access token verified');

        if (verifiedUserId !== userId) {
            return res.status(403).json({ status: 'fail', message: 'User verification failed' });
        }

        console.log('Fetching user details...');
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        console.log('Validating current password...');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            console.log('Current password is incorrect');
            return res.status(401).json({ status: 'fail', message: 'Current password is incorrect' });
        }

        console.log('Updating password...');
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await user.save();

        console.log('Password updated successfully');
        return res.status(200).json({ status: 'success', message: 'Password changed successfully' });

    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            console.log('Access token expired, verifying refresh token...');
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const verifiedUserId = decodedRefreshToken.userId;

                if (verifiedUserId !== userId) {
                    return res.status(403).json({ status: 'fail', message: 'User verification failed' });
                }

                console.log('Fetching user details...');
                const user = await User.findById(userId);
                if (!user) {
                    console.log('User not found');
                    return res.status(404).json({ status: 'fail', message: 'User not found' });
                }

                console.log('Validating current password...');
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) {
                    console.log('Current password is incorrect');
                    return res.status(401).json({ status: 'fail', message: 'Current password is incorrect' });
                }

                console.log('Updating password...');
                const hashedNewPassword = await bcrypt.hash(newPassword, 12);
                user.password = hashedNewPassword;
                await user.save();

                console.log('Password updated successfully');
                return res.status(200).json({ status: 'success', message: 'Password changed successfully' });

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
exports.forgotPassword = async (req, res) => {
    const { email, newPassword } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'Email ID not found' });
      }
  
      user.password = newPassword;
      await user.save();
  
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
