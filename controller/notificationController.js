const Notifications = require('../model/notificationSchema');
const catchAsync = require('../exceptions/catchAsync');
const AppError = require('../exceptions/AppErrors');

exports.getMissedNotifications = catchAsync(async (req, res, next) => {
    // Assuming req.user is populated by the protect middleware
    const userId = req.user.id;

    if (!userId) {
        return next(new AppError('User not authenticated', 401));
    }

    const missedNotifications = await Notifications.find({
        userId: userId,
        read: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: missedNotifications.length,
        data: {
            notifications: missedNotifications
        }
    });
});


exports.markAsRead = catchAsync(async (req, res, next) => {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notifications.findOne({ _id: notificationId, userId: userId });

    if (!notification) {
        return next(new AppError('Notification not found or does not belong to this user', 404));
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
        status: 'success',
        data: {
            notification
        }
    });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    await Notifications.updateMany(
        { userId: userId, read: false },
        { $set: { read: true } }
    );

    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});

exports.deleteAll = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    await Notifications.deleteMany({ userId: userId });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.deleteSpecificNotification = catchAsync(async (req, res, next) => {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notifications.findOneAndDelete({ _id: notificationId, userId: userId });

    if (!notification) {
        return next(new AppError('Notification not found or does not belong to this user', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
