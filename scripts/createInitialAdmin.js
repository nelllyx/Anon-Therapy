require('dotenv').config();
const mongoose = require('mongoose');
const adminService = require('../services/adminService');

const initialAdminData = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin@123', // Change this to a secure password
    gender: 'other'
};

const createInitialAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        const admin = await adminService.createAdmin(initialAdminData);
        console.log('Initial admin created successfully:', {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role
        });

    } catch (error) {
        console.error('Error creating initial admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

createInitialAdmin(); 