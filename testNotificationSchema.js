const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notifications = require('./model/notificationSchema');

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

    const userId = new mongoose.Types.ObjectId();

    console.log('Creating notification...');
    const notification = await Notifications.create({
        userId: userId,
        type: 'test_expiry',
        title: 'Test Expiry',
        message: 'Testing expiresAt field'
    });

    console.log('Notification created:', notification._id);
    console.log('CreatedAt:', notification.createdAt);
    console.log('ExpiresAt:', notification.expiresAt);

    const diff = notification.expiresAt - notification.createdAt;
    const expectedDiff = 7 * 24 * 60 * 60 * 1000;

    // Allow small difference due to execution time (e.g. 1 second)
    const tolerance = 1000;

    if (Math.abs(diff - expectedDiff) < tolerance) {
        console.log('TEST PASSED: expiresAt is correctly set to 7 days after createdAt');
    } else {
        console.log('TEST FAILED: expiresAt is NOT correct');
        console.log('Difference:', diff);
        console.log('Expected:', expectedDiff);
    }

    // Cleanup
    await Notifications.findByIdAndDelete(notification._id);
    console.log('Cleanup done');

    await mongoose.disconnect();
};

runTest();
