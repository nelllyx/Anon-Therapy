// Client-side Socket.IO implementation for live notifications
// This file shows how to use the notification system from the frontend

const io = require('socket.io-client');

class NotificationClient {
    constructor(serverUrl, token) {
        this.socket = io(serverUrl, {
            auth: {
                token: token // JWT token for authentication
            }
        });
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to notification server');
            this.onConnected?.();
        });

        this.socket.on('connected', (data) => {
            console.log('Authentication successful:', data);
            this.userId = data.userId;
            this.userRole = data.userRole;
            this.onAuthenticated?.(data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from notification server');
            this.onDisconnected?.();
        });

        // Notification events
        this.socket.on('notification', (notification) => {
            console.log('New notification received:', notification);
            this.onNotification?.(notification);
        });

        // Error handling
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
            this.onError?.(error);
        });
    }

    // Join notification rooms
    joinNotifications() {
        return new Promise((resolve, reject) => {
            this.socket.emit('join_notifications', (response) => {
                if (response.success) {
                    console.log('Successfully joined notification room');
                    resolve(response);
                } else {
                    console.error('Failed to join notification room:', response.error);
                    reject(new Error(response.error));
                }
            });
        });
    }

    // Join role-based notifications
    joinRoleNotifications() {
        return new Promise((resolve, reject) => {
            this.socket.emit('join_role_notifications', (response) => {
                if (response.success) {
                    console.log('Successfully joined role notification room');
                    resolve(response);
                } else {
                    console.error('Failed to join role notification room:', response.error);
                    reject(new Error(response.error));
                }
            });
        });
    }

    // Set event handlers
    setOnConnected(handler) {
        this.onConnected = handler;
    }

    setOnAuthenticated(handler) {
        this.onAuthenticated = handler;
    }

    setOnDisconnected(handler) {
        this.onDisconnected = handler;
    }

    setOnNotification(handler) {
        this.onNotification = handler;
    }

    setOnError(handler) {
        this.onError = handler;
    }

    // Disconnect
    disconnect() {
        this.socket.disconnect();
    }
}

// Usage example for React/JavaScript frontend:
/*
const notificationClient = new NotificationClient('http://localhost:3001', 'your-jwt-token');

// Set up notification handlers
notificationClient.setOnNotification((notification) => {
    // Show notification in UI
    showNotificationToast(notification);
    
    // Update notification badge
    updateNotificationBadge();
    
    // Play notification sound
    playNotificationSound();
});

notificationClient.setOnConnected(() => {
    console.log('Connected to notifications');
    // Join notification rooms
    notificationClient.joinNotifications();
    notificationClient.joinRoleNotifications();
});

// Example notification display function
function showNotificationToast(notification) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="notification-header">
            <h4>${notification.title}</h4>
            <span class="notification-time">${new Date(notification.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="notification-body">
            <p>${notification.message}</p>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Example notification badge update
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        badge.style.display = 'block';
    }
}

// Example notification sound
function playNotificationSound() {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Could not play notification sound:', e));
}
*/

module.exports = NotificationClient;
