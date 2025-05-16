const dotenv = require("dotenv");
const express = require('express')
const connectDB = require('./config/database')
const cors = require('cors');
const AppError = require('./exceptions/AppErrors');
const catchAsync = require('./exceptions/catchAsync')

dotenv.config({path: './config.env'})

const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const therapistRoutes = require('./routes/therapistRoutes')
const Roles = require("./config/userRoles");
const auth = require("./services/authenticationService");
const Users = require("./model/userSchema");
const Therapist = require("./model/therapistSchema");

const anonTherapy = express()


anonTherapy.use(express.json())
anonTherapy.use(cors({origin: 'http://localhost:5173'}))



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
        if (userType === 'client') {
            const token = await auth.otpVerification(otp, Users, id);
            const user = await Users.findById(id);
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
        } else if (userType === 'therapist') {
            const token = await auth.otpVerification(otp, Therapist, id);
            const user = await Therapist.findById(id);
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
anonTherapy.listen(port, () => {
    console.log(`App running on port ${port}...`)
})


