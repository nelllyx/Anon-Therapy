// Example of how to use the notification service in your controllers
// This shows how to integrate live notifications into your existing API endpoints

const NotificationService = require('./services/notificationService');

// Example: In your session booking controller
const notifySessionBooking = (io, therapistId, sessionData) => {
    const notificationService = new NotificationService(io);
    
    // Send notification to therapist about new booking
    notificationService.notifyNewSessionBooking(therapistId, {
        sessionId: sessionData._id,
        clientId: sessionData.userId,
        clientName: sessionData.clientName,
        sessionDate: sessionData.date,
        sessionTime: sessionData.startTime
    });
};

// Example: In your session controller
const notifySessionReminder = (io, userId, sessionData) => {
    const notificationService = new NotificationService(io);
    
    // Send reminder 15 minutes before session
    notificationService.notifySessionReminder(userId, {
        sessionId: sessionData._id,
        therapistName: sessionData.therapistName,
        sessionTime: sessionData.startTime
    });
};

// Example: In your message controller
const notifyNewMessage = (io, recipientId, messageData) => {
    const notificationService = new NotificationService(io);
    
    notificationService.notifyNewMessage(recipientId, {
        messageId: messageData._id,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        preview: messageData.content.substring(0, 50) + '...'
    });
};

// Example: In your payment controller
const notifyPaymentSuccess = (io, userId, paymentData) => {
    const notificationService = new NotificationService(io);
    
    notificationService.notifyPayment(userId, {
        message: `Payment of $${paymentData.amount} was successful`,
        amount: paymentData.amount,
        status: 'success',
        transactionId: paymentData.transactionId
    });
};

// Example: In your admin controller
const notifyNewTherapistRegistration = (io, adminId, therapistData) => {
    const notificationService = new NotificationService(io);
    
    notificationService.notifyNewTherapistRegistration(adminId, {
        id: therapistData._id,
        name: `${therapistData.firstName} ${therapistData.lastName}`,
        specialization: therapistData.specialization,
        email: therapistData.email
    });
};

// Example: System-wide notifications
const notifySystemMaintenance = (io) => {
    const notificationService = new NotificationService(io);
    
    notificationService.notifySystemMaintenance();
};

// Example: Custom notification
const sendCustomNotification = (io, userId, notification) => {
    const notificationService = new NotificationService(io);
    
    notificationService.sendToUser(userId, {
        type: 'custom',
        title: notification.title,
        message: notification.message,
        data: notification.data
    });
};

// Example: Role-based notification
const notifyAllTherapists = (io, notification) => {
    const notificationService = new NotificationService(io);
    
    notificationService.sendToRole('therapist', {
        type: 'announcement',
        title: 'Important Update',
        message: 'New therapy guidelines have been published',
        data: { link: '/guidelines' }
    });
};

// Example: Get online statistics
const getOnlineStats = (io) => {
    const notificationService = new NotificationService(io);
    return notificationService.getOnlineStats();
};

module.exports = {
    notifySessionBooking,
    notifySessionReminder,
    notifyNewMessage,
    notifyPaymentSuccess,
    notifyNewTherapistRegistration,
    notifySystemMaintenance,
    sendCustomNotification,
    notifyAllTherapists,
    getOnlineStats
};
