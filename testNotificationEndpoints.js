
const mongoose = require('mongoose');
const Notifications = require('./model/notificationSchema');
const notificationController = require('./controller/notificationController');

// Mock request and response objects
const mockRequest = (user, params = {}, body = {}) => ({
    user,
    params,
    body
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

// Mock data
const userId = new mongoose.Types.ObjectId();
const notificationId = new mongoose.Types.ObjectId();

// Mock Notifications model methods
Notifications.find = jest.fn();
Notifications.findOne = jest.fn();
Notifications.updateMany = jest.fn();
Notifications.deleteMany = jest.fn();
Notifications.findOneAndDelete = jest.fn();

// Mock catchAsync to execute the function immediately
const catchAsync = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};

// Override the controller's catchAsync with our mock
// Note: This is a bit tricky since we're importing the controller which already has catchAsync applied.
// Ideally, we'd test the logic inside the controller functions, but since they are wrapped, we can try to invoke them directly if we can access the underlying function, or we can mock the database calls and run the controller methods.

// Since we can't easily unwrap catchAsync, we will just run the controller methods and mock the DB calls.
// The catchAsync wrapper will just execute the async function.

async function runTests() {
    console.log('Starting Notification Controller Tests...');

    // Test markAllAsRead
    console.log('\nTesting markAllAsRead...');
    const reqMarkAll = mockRequest({ id: userId });
    const resMarkAll = mockResponse();

    // We need to re-require the controller to mock the model if we were using a testing framework like Jest properly.
    // But here we are running a standalone script.
    // To make this work without a full test runner, we might need to actually connect to a test DB or mock the Mongoose model globally.
    // Given the environment, let's try to use a real DB connection if possible, or just mock the Mongoose methods if we can replace the model.

    // Since we can't easily replace the model required inside the controller without a dependency injection or mocking library,
    // let's try to connect to the database and run real tests if we have the credentials, OR
    // let's create a script that imports the app and hits the endpoints (integration test).

    // However, the user asked for a test script. Let's try to make a unit test script that mocks mongoose.
    // We can't easily mock `require('../model/notificationSchema')` inside the controller from here without a library like `proxyquire`.

    // ALTERNATIVE: We can create a script that connects to the DB (using the config) and runs the operations.
    // This is better as it verifies the actual DB interactions.

    const dotenv = require('dotenv');
    dotenv.config({ path: './config.env' });
    const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

    try {
        await mongoose.connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });
        console.log('DB connection successful!');

        // 1. Create dummy notifications
        console.log('Creating dummy notifications...');
        const notifications = await Notifications.create([
            { userId, type: 'info', title: 'Test 1', message: 'Message 1', read: false },
            { userId, type: 'info', title: 'Test 2', message: 'Message 2', read: false },
            { userId, type: 'info', title: 'Test 3', message: 'Message 3', read: false }
        ]);
        console.log(`Created ${notifications.length} notifications.`);

        // 2. Test markAllAsRead
        console.log('Testing markAllAsRead...');
        const req1 = { user: { id: userId } };
        const res1 = {
            status: function (code) { console.log(`Status: ${code}`); return this; },
            json: function (data) { console.log('Data:', data); }
        };
        await notificationController.markAllAsRead(req1, res1, console.error);

        // Verify
        const unreadCount = await Notifications.countDocuments({ userId, read: false });
        console.log(`Unread count after markAllAsRead: ${unreadCount} (Expected: 0)`);

        // 3. Test deleteSpecificNotification
        console.log('Testing deleteSpecificNotification...');
        const idToDelete = notifications[0]._id;
        const req2 = { user: { id: userId }, params: { id: idToDelete } };
        const res2 = {
            status: function (code) { console.log(`Status: ${code}`); return this; },
            json: function (data) { console.log('Data:', data); }
        };
        await notificationController.deleteSpecificNotification(req2, res2, console.error);

        // Verify
        const deletedNotification = await Notifications.findById(idToDelete);
        console.log(`Deleted notification exists: ${!!deletedNotification} (Expected: false)`);

        // 4. Test deleteAll
        console.log('Testing deleteAll...');
        const req3 = { user: { id: userId } };
        const res3 = {
            status: function (code) { console.log(`Status: ${code}`); return this; },
            json: function (data) { console.log('Data:', data); }
        };
        await notificationController.deleteAll(req3, res3, console.error);

        // Verify
        const remainingCount = await Notifications.countDocuments({ userId });
        console.log(`Remaining count after deleteAll: ${remainingCount} (Expected: 0)`);

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('DB disconnected.');
    }
}

runTests();
