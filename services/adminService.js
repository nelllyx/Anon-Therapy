const User = require('../model/userSchema');
const AppError = require('../exceptions/AppErrors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRoles = require('../config/userRoles');

exports.createAdmin = async (adminData) => {
    const { username, email, password } = adminData;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
        $or: [{ email }, { username }],
        role: userRoles.Admin 
    });

    if (existingAdmin) {
        throw new AppError('Admin with this email or username already exists', 400);
    }

    // Create new admin
    const admin = await User.create({
        ...adminData,
        role: userRoles.Admin,
        isVerified: true, // Auto-verify admin accounts
        password: await bcrypt.hash(password, 12)
    });

    return admin;
};

exports.loginAdmin = async (email, password) => {
    // Find admin by email
    const admin = await User.findOne({ 
        email, 
        role: userRoles.Admin 
    });

    if (!admin) {
        throw new AppError('Invalid admin credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid admin credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return { admin, token };
};

exports.getAdminProfile = async (adminId) => {
    const admin = await User.findOne({ 
        _id: adminId,
        role: userRoles.Admin 
    }).select('-password');

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    return admin;
};

exports.updateAdminProfile = async (adminId, updateData) => {
    const admin = await User.findOneAndUpdate(
        { _id: adminId, role: userRoles.Admin },
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    return admin;
};

exports.changeAdminPassword = async (adminId, currentPassword, newPassword) => {
    const admin = await User.findOne({ 
        _id: adminId,
        role: userRoles.Admin 
    });

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    return { message: 'Password updated successfully' };
}; 