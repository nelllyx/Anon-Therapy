const Notifications = require('../model/notificationSchema')

class NotificationService {
    constructor(io) {
        this.io = io;
    }

    // Send notification to a specific user
    async sendToUser(userId, notification) {
        const notificationData = {
            id: Date.now(),
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            data: notification.data || {},
            timestamp: new Date(),
            read: false
        };

        // Persist to DB so user sees it even if offline
        await Notifications.create({
            userId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data,
        })

        // Try to deliver live if online
        return this.io.sendNotificationToUser ? this.io.sendNotificationToUser(userId, notificationData) : false;
    }

    // Send notification to all users of a specific role
    async sendToRole(role, notification) {
        const notificationData = {
            id: Date.now(),
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            data: notification.data || {},
            timestamp: new Date(),
            read: false,
            targetRole: role
        };

        // Live broadcast to role (persistence optional per-user; skip bulk DB writes here)
        if (this.io.sendNotificationToRole) this.io.sendNotificationToRole(role, notificationData);
    }

    // Send notification to all online users
    sendToAll(notification) {
        const notificationData = {
            id: Date.now(),
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            data: notification.data || {},
            timestamp: new Date(),
            read: false,
            broadcast: true
        };

        if (this.io.sendNotificationToAll) this.io.sendNotificationToAll(notificationData);
    }

    // Predefined notification types for therapy app


    // New therapist assigned to client

    notifyNewTherapistAssignment(userId, sessionData) {

        return this.sendToUser(userId, {
            type: 'therapist_assigned',
            title: 'Therapist Assigned',
            message: `A therapist has been assigned to handle your sessions. DR ${sessionData.therapistFirstName}   ${sessionData.therapistLastName}`,
            data: {
                firstName: sessionData.therapistFirstName,
                lastName: sessionData.therapistLastName,
                therapistBio: sessionData.therapistBio

            }
        });
    }



    // New session booking notification
    notifyNewSessionBooking(therapistId, sessionData) {
        return this.sendToUser(therapistId, {
            type: 'session_booking',
            title: 'New Session Booking',
            message: `You have a new session booking from ${sessionData.clientName}`,

        });
    }


    // Session reminder notification

    notifyUserSessionTime(userId, sessionData) {
        return this.sendToUser(userId, {
            type: 'session_time_set',
            title: 'Session Time Sent',
            message: `Your session with ${sessionData.therapistName} has been scheduled for ${sessionData.sessionTime} on ${sessionData.sessionDate}`,
            data: {
                therapistName: sessionData.therapistName,
                sessionTime: sessionData.sessionTime,
                sessionDate: sessionData.sessionDate
            }
        });
    }

    // Session reminder notification
    notifySessionReminder(userId, sessionData) {
        return this.sendToUser(userId, {
            type: 'session_reminder',
            title: 'Session Reminder',
            message: `Your session with ${sessionData.therapistName} starts in 15 minutes`,
            data: {
                sessionId: sessionData.sessionId,
                therapistName: sessionData.therapistName,
                sessionTime: sessionData.sessionTime
            }
        });
    }

    // Session cancellation notification
    notifySessionCancellation(userId, sessionData) {
        return this.sendToUser(userId, {
            type: 'session_cancelled',
            title: 'Session Cancelled',
            message: `Your session with ${sessionData.therapistName} has been cancelled`,
            data: {
                sessionId: sessionData.sessionId,
                therapistName: sessionData.therapistName,
                reason: sessionData.reason
            }
        });
    }

    // New message notification
    notifyNewMessage(userId, messageData) {
        return this.sendToUser(userId, {
            type: 'new_message',
            title: 'New Message',
            message: `You have a new message from ${messageData.senderName}`,
            data: {
                messageId: messageData.messageId,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                preview: messageData.preview
            }
        });
    }

    // Payment notification
    notifyPaymentStatus(userId, paymentData) {
        return this.sendToUser(userId, {
            type: 'payment',
            title: 'Payment Update',
            message: paymentData.message,
            data: {
                amount: paymentData.amount,
                status: paymentData.status,
                transactionId: paymentData.transactionId
            }
        });
    }

    // System maintenance notification
    notifySystemMaintenance() {
        return this.sendToAll({
            type: 'system_maintenance',
            title: 'System Maintenance',
            message: 'The system will be under maintenance from 2:00 AM to 4:00 AM',
            data: {
                startTime: '2:00 AM',
                endTime: '4:00 AM',
                duration: '2 hours'
            }
        });
    }

    // New therapist registration notification (for admins)
    notifyNewTherapistRegistration(adminId, therapistData) {
        return this.sendToUser(adminId, {
            type: 'new_therapist',
            title: 'New Therapist Registration',
            message: `${therapistData.name} has registered as a therapist`,
            data: {
                therapistId: therapistData.id,
                name: therapistData.name,
                specialization: therapistData.specialization,
                email: therapistData.email
            }
        });
    }

    // Get online users statistics
    getOnlineStats() {
        return {
            totalOnline: this.io.getOnlineUsersCount(),
            therapists: this.io.getOnlineUsersByRole('therapist').length,
            clients: this.io.getOnlineUsersByRole('client').length,
            admins: this.io.getOnlineUsersByRole('admin').length
        };
    }
}

module.exports = NotificationService;
