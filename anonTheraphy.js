const dotenv = require("dotenv");
const express = require('express')
const connectDB = require('./config/database')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const AppError = require('./exceptions/AppErrors');
const catchAsync = require('./exceptions/catchAsync')
dotenv.config({path: './config.env'})

const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const crypto = require('crypto');
const therapistRoutes = require('./routes/therapistRoutes')
const Roles = require("./config/userRoles");
const auth = require("./services/authenticationService");
const Users = require("./model/userSchema");
const Therapist = require("./model/therapistSchema");
const {CLIENT, THERAPIST} = require("./config/userRoles");
const {transporter} = require("./config/nodeMailer");
const {sendPasswordResetTokenToUserEmail, generateUserOtp, sendOtpToUserEmail} = require("./services/authenticationService");
const anonTherapy = express()

anonTherapy.use(express.json())
anonTherapy.use(cookieParser());
anonTherapy.use(cors({origin: 'http://localhost:5173', credentials: true}))

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

        if(!user || (! await user.correctPassword(password))) return next  (new AppError("Invalid Email or Password", 401))

        // Check if user is verified
        if (!user.isVerified) {
            return next(new AppError('Please complete your email verification', 401));
        }

        // Generate token
        const token = auth.signUpToken(user._id, user.role);

        // Prepare user data based on type
    const userType = user.role
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


    // res.cookie('auth_token', token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    //     maxAge: 3600000,    // 1 hour expiry
    //     path: '/'
    // });

    res.status(200).json({
        status: 'success',
        data: {
            user: userData,
            token
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
            const token = await auth.otpVerification(otp, Users, id);
            return res.status(200).json({
                status: 'success',
                token,
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
anonTherapy.post('/api/v1/resend-otp', catchAsync(async (req, res, next) => {

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

    await generateUserOtp(user)

    await transporter.sendMail(sendOtpToUserEmail(email, user.otp ,username),(err, info) =>{

        if(err){
            return console.error('Error occurred while sending email:', err)
        }

        res.status(201).json({
            message: 'OTP sent to user Email',

        })

        console.log('Email sent successfully:', info.response)
    })

}));

anonTherapy.post('/api/v1/logout', (req, res) => {

    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/'
    });
    
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
});

anonTherapy.post('/api/v1/forgotPassword', catchAsync (async (req, res, next)=> {

    const {email} = req.body

    const [client, therapist] = await Promise.all([
        Users.findOne({ email: email }),
        Therapist.findOne({ email: email })
    ]);

    const user = client || therapist
    const username = client.username || therapist.firstName

    if(!user){
        res.status(400).send( 'No user with such email')
    }

    const resetToken = auth.createPasswordResetToken(user)

    console.log(resetToken)

    const resetLink = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

    await transporter.sendMail(sendPasswordResetTokenToUserEmail( resetLink ,username, email),(err, info) =>{

        if(err){
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
        Users.findOne({ passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now() } }),
        Therapist.findOne({ passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now() } })
    ]);

    const user = client || therapist

    if(!user) return next(new AppError('Token is invalid or has expired', 400))

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

} ))

anonTherapy.use('/api/v1/admin', adminRoutes)
anonTherapy.use('/api/v1/client', userRoutes)
anonTherapy.use('/api/v1/therapist', therapistRoutes)



anonTherapy.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


// Global error handling middleware
anonTherapy.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production mode
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err
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
anonTherapy.listen(port, () => {
    console.log(`App running on port ${port}...`)
})


