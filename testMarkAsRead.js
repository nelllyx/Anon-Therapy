const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notifications = require('./model/notificationSchema');
const notificationController = require('./controller/notificationController');

// Load env vars
dotenv.config({ path: './config.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_ATLAS, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            dbName: 'anonymous-therapy'
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

const runTest = async () => {
    await connectDB();

    // Create a dummy user ID (doesn't need to exist in Users collection for this test as we just use the ID)
    const userId = new mongoose.Types.ObjectId();

    // Create a dummy notification
    const notification = await Notifications.create({
        userId: userId,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification',
        read: false
    });

    console.log('Created notification:', notification._id);

    // Mock req, res, next
    const req = {
        params: { id: notification._id },
        user: { id: userId }
    };

    const res = {
        status: (code) => {
            console.log('Response Status:', code);
            return {
                json: (data) => {
                    console.log('Response Data:', JSON.stringify(data, null, 2));
                }
            };
        }
    };

    const next = (err) => {
        console.error('Next called with error:', err);
    };

    // Call markAsRead
    console.log('Calling markAsRead...');
    await notificationController.markAsRead(req, res, next);

    // Verify in DB
    const updatedNotification = await Notifications.findById(notification._id);
    console.log('Updated Notification Read Status:', updatedNotification.read);

    if (updatedNotification.read === true) {
        console.log('TEST PASSED');
    } else {
        console.log('TEST FAILED');
    }

    // Cleanup
    await Notifications.findByIdAndDelete(notification._id);
    console.log('Cleanup done');

    await mongoose.disconnect();
};

runTest();
