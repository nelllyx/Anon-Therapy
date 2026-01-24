const dotenv = require("dotenv");
const express = require('express')
const rateLimit = require('express-rate-limit')
const connectDB = require('./config/database')
const cors = require('cors');
const socketConnection = require('./services/socket')
const cookieParser = require('cookie-parser')
const AppError = require('./exceptions/AppErrors');
const catchAsync = require('./exceptions/catchAsync')
dotenv.config({ path: './config.env' })
const helmet = require('helmet');
const compression = require('compression');


const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const crypto = require('crypto');
const therapistRoutes = require('./routes/therapistRoutes')
const messageRoutes = require('./routes/messageRoutes')
const Roles = require("./config/userRoles");
const notificationRoutes = require('./routes/notificationRoutes');
const auth = require("./services/authenticationService");
const Users = require("./model/userSchema");
const Therapist = require("./model/therapistSchema");
const RefreshToken = require("./model/refreshToken");
const { CLIENT, THERAPIST } = require("./config/userRoles");
const { transporter } = require("./config/nodeMailer");
const { sendPasswordResetTokenToUserEmail, generateUserOtp, sendOtpToUserEmail, protect } = require("./services/authenticationService");
const anonTherapy = express()

anonTherapy.use(express.json())
anonTherapy.use(cookieParser());
anonTherapy.use(helmet());

anonTherapy.use(compression());

anonTherapy.use(cors({ origin: 'http://localhost:5173', credentials: true }))


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
    },
});

const otpResendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: 'Too many OTP resend request from this IP, please try again later'
})

// Global login route
anonTherapy.post('/api/v1/login', catchAsync(async (req, res, next) => {

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }


    const [client, therapist] = await Promise.all([
        Users.findOne({ email: email }),
        Therapist.findOne({ email: email })
    ]);

    const user = client || therapist;

    if (!user || (! await user.correctPassword(password))) return next(new AppError("Invalid Email or Password", 401))

    // Check if user is verified
    if (!user.isVerified) {
        return next(new AppError('Please complete your email verification', 401));
    }

    // Prepare user data based on type
    const userType = user.role

    const refreshToken = await auth.saveRefreshToken(user._id, userType)
    const accessToken = auth.createAccessToken(user._id, user.role);

    auth.setAuthCookies(res, accessToken, refreshToken)

    const userData = userType === CLIENT
        ? {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
        : {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,

            email: user.email,
            role: user.role
        };

    res.status(200).json({
        status: 'success',
        data: {
            user: userData,
        }
    });
}));

// Global OTP verification route
anonTherapy.post('/api/v1/verify-otp', catchAsync(async (req, res, next) => {

    const { userType, id, otp } = req.body;

    // Validate required fields
    if (!userType || !id || !otp) {
        return next(new AppError('Please provide userType, id, and otp', 400));
    }

    // Validate userType is a valid role using Roles enum
    if (!Object.values(Roles).includes(userType)) {
        return next(new AppError('Invalid user type', 400));
    }

    try {
        if (userType === Roles.CLIENT) {
            const user = await Users.findById(id);
            if (!user) {
                return next(new AppError('User not found', 404));
            }
            await auth.otpVerification(otp, Users, id);

            user.accountStatus = 'active'
            user.save()

            const refreshToken = await auth.saveRefreshToken(user._id, userType)
            const accessToken = auth.createAccessToken(user._id, user.role);

            auth.setAuthCookies(res, accessToken, refreshToken)

            return res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        } else if (userType === Roles.THERAPIST) {
            const user = await Therapist.findById(id);
            if (!user) {
                return next(new AppError('User not found', 404));
            }
            const token = await auth.otpVerification(otp, Therapist, id);

            const refreshToken = await auth.saveRefreshToken(user._id, userType)
            const accessToken = auth.createAccessToken(user._id, user.role);

            user.accountStatus = 'active'
            user.save()

            auth.setAuthCookies(res, accessToken, refreshToken)

            return res.status(200).json({
                status: 'success',
                token,
                data: {
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        }
    } catch (error) {
        return next(new AppError(error.message || 'Error verifying OTP', 400));
    }
}));

// Global RESEND OTP route
anonTherapy.post('/api/v1/resend-otp', otpResendLimiter, catchAsync(async (req, res, next) => {

    const { email } = req.body;

    // Validate required fields
    if (!email) {
        return next(new AppError('Please your email is required', 400));
    }

    const [client, therapist] = await Promise.all([
        Users.findOne({ email: email, isVerified: false }),
        Therapist.findOne({ email: email, isVerified: false })
    ]);

    const user = client || therapist
    const username = client.username || therapist.firstName

    if (!user) {
        return next(new AppError('Invalid credentials', 400));
    }

    user.otp = await generateUserOtp(user)

    await user.save()

    await transporter.sendMail(sendOtpToUserEmail(email, user.otp, username), (err, info) => {

        if (err) {
            return console.error('Error occurred while sending email:', err)
        }

        res.status(201).json({
            message: 'OTP sent to user Email',

        })

        console.log('Email sent successfully:', info.response)
    })

}));

anonTherapy.post('/api/v1/logout', (req, res) => {

    auth.clearAuthCookies(res)

    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
});

anonTherapy.get('/api/v1/auth/token', protect, (req, res) => {

    const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
    const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];

    if (!req.user || !token) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Token available for WebSocket auth',
        token,
    });


})

anonTherapy.post('/api/v1/fetch-accessTok', catchAsync(async (req, res, next) => {

    const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
    const refreshTokenCookie = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshTokenCookie) {
        return next(new AppError('No refresh token provided', 401));
    }

    const parts = refreshTokenCookie.split('.');
    if (parts.length !== 2) {
        return next(new AppError('Invalid refresh token format', 401));
    }

    const [tokenId, rawToken] = parts;

    const refreshTokenDoc = await RefreshToken.findById(tokenId);

    if (!refreshTokenDoc) {
        return next(new AppError('Invalid refresh token', 401));
    }

    if (refreshTokenDoc.revoked) {
        return next(new AppError('Refresh token revoked', 401));
    }

    if (refreshTokenDoc.expiresAt < Date.now()) {
        return next(new AppError('Refresh token expired', 401));
    }

    const isValid = await refreshTokenDoc.validateToken(rawToken);

    if (!isValid) {
        return next(new AppError('Invalid refresh token', 401));
    }

    const accessToken = auth.createAccessToken(refreshTokenDoc.userId, refreshTokenDoc.userType);

    auth.setAuthCookies(res, accessToken, refreshTokenCookie);

    res.status(200).json({
        success: true,
        message: 'Access token refreshed',
    });
}))

anonTherapy.post('/api/v1/forgotPassword', catchAsync(async (req, res, next) => {

    const { email } = req.body

    const [client, therapist] = await Promise.all([
        Users.findOne({ email: email }),
        Therapist.findOne({ email: email })
    ]);

    const user = client || therapist
    const username = client.username || therapist.firstName

    if (!user) {
        res.status(400).send('No user with such email')
    }

    const resetToken = auth.createPasswordResetToken(user)

    console.log(resetToken)

    const resetLink = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

    await transporter.sendMail(sendPasswordResetTokenToUserEmail(resetLink, username, email), (err, info) => {

        if (err) {
            return next(new AppError('Error occurred while sending email. Try again later!', 500))
        }

        res.status(200).json({
            status: 'success',
            message: 'Password reset email sent.'
        })

        console.log('Email sent successfully:', info.response)
    })


}))

anonTherapy.patch('/api/v1/resetPassword/:token', catchAsync(async (req, res, next) => {

    // Get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const [client, therapist] = await Promise.all([
        Users.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } }),
        Therapist.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })
    ]);

    const user = client || therapist

    if (!user) return next(new AppError('Token is invalid or has expired', 400))

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()

    // Generate token
    const token = auth.signUpToken(user._id, user.role);

    res.status(200).json({
        status: 'success',
        token
    })

}))

anonTherapy.use('/api/v1/admin', limiter, adminRoutes)
anonTherapy.use('/api/v1/client', limiter, userRoutes)
anonTherapy.use('/api/v1/therapist', limiter, therapistRoutes)
anonTherapy.use('/api/v1/messages', limiter, messageRoutes)
anonTherapy.use('/api/v1/notifications', limiter, notificationRoutes)






anonTherapy.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


// Global error handling middleware
anonTherapy.use((err, req, res, next) => {
    // Ensure we have a valid status code
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    // Log the error for debugging
    console.error('Error details:', {
        message: err.message,
        statusCode: statusCode,
        stack: err.stack
    });

    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).json({
            status: status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production mode
        if (err.isOperational) {
            res.status(statusCode).json({
                status: status,
                message: err.message
            });
        } else {
            // Programming or unknown errors
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    }
});



// Connect to database
connectDB()

const port = process.env.PORT || 3001



// Start server
const server = anonTherapy.listen(port, () => {
    console.log(`App running on port ${port}...`)
})

// Initialize socket and expose io to the app for controllers
const io = socketConnection(server)
anonTherapy.set('io', io)


