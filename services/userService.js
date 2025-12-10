const User = require('../model/userSchema')
const Subscription = require('../model/Subscriptions')
const AppError = require('../exceptions/AppErrors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userRoles = require('../config/userRoles')

exports.createUser = async (userData, session = null) => {
    return User.create([userData], { session: session }).then(doc => doc[0]);
}

exports.createSubscription = async (bookingData, session = null) => {
    return Subscription.create([bookingData], { session: session }).then(doc => doc[0]);
}

exports.register = async (userData, session = null) => {
    const { username, email, password, role = userRoles.Client } = userData;

    // Validate role
    if (!Object.values(userRoles).includes(role)) {
        throw new AppError('Invalid role', 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    }).session(session);

    if (existingUser) {
        throw new AppError('User with this email or username already exists', 400);
    }

    // Create new user
    // User.create returns an array when options are passed, so we take the first element
    const [user] = await User.create([{
        ...userData,
        password: await bcrypt.hash(password, 12),
        isVerified: role === userRoles.Therapist // Auto-verify therapists
    }], { session: session });

    return user;
};

exports.login = async (email, password) => {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
    }

    // Check if user is verified
    if (!user.isVerified) {
        throw new AppError('Please verify your email first', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return { user, token };
};

exports.getProfile = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

exports.updateProfile = async (userId, updateData, session = null) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true, session: session }
    ).select('-password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
};

exports.changePassword = async (userId, currentPassword, newPassword, session = null) => {
    const user = await User.findById(userId).session(session);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save({ session: session });

    return { message: 'Password updated successfully' };
};



