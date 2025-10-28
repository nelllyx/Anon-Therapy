const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

// Fix the dotenv path
dotenv.config({ path: './config.env' });

// Fix environment variable inconsistency
const JWT_SECRET = process.env.JWT_SECRET || process.env.REFRESH_TOKEN_SECRET;

// Track online users for notifications
const onlineUsers = new Map();

function socketConnection(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            credentials: true
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Authentication error"));
        }

        try {
            socket.user = jwt.verify(token, JWT_SECRET);
            return next();
        } catch (err) {
            console.error("Socket auth failed:", err.message);
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id, "User:", socket.user.id);
        
        // Store user session for notifications
        onlineUsers.set(socket.user.id, {
            socketId: socket.id,
            user: socket.user,
            connectedAt: new Date()
        });

        // Notify user of successful connection
        socket.emit("connected", { 
            message: "Successfully connected for notifications",
            userId: socket.user.id,
            userRole: socket.user.role
        });

        // Join user-specific notification room
        socket.on("join_notifications", (callback) => {
            try {
                const notificationRoom = `user_${socket.user.id}`;
                socket.join(notificationRoom);
                console.log(`User ${socket.user.id} joined notification room: ${notificationRoom}`);
                
                if (callback) {
                    callback({ success: true, roomId: notificationRoom });
                }
            } catch (error) {
                console.error("Error joining notification room:", error);
                if (callback) {
                    callback({ error: "Failed to join notification room" });
                }
            }
        });

        // Join role-based notification room (e.g., all therapists, all clients)
        socket.on("join_role_notifications", (callback) => {
            try {
                const roleRoom = `${socket.user.role}s`;
                socket.join(roleRoom);
                console.log(`User ${socket.user.id} joined role room: ${roleRoom}`);
                
                if (callback) {
                    callback({ success: true, roomId: roleRoom });
                }
            } catch (error) {
                console.error("Error joining role notification room:", error);
                if (callback) {
                    callback({ error: "Failed to join role notification room" });
                }
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            onlineUsers.delete(socket.user.id);
        });
    });

    // Function to send notification to specific user
    const sendNotificationToUser = (userId, notification) => {
        const user = onlineUsers.get(userId);
        if (user) {
            io.to(user.socketId).emit("notification", notification);
            console.log(`Notification sent to user ${userId}:`, notification);
            return true;
        }
        return false;
    };

    // Function to send notification to all users of a specific role
    const sendNotificationToRole = (role, notification) => {
        io.to(`${role}s`).emit("notification", notification);
        console.log(`Notification sent to all ${role}s:`, notification);
    };

    // Function to send notification to all online users
    const sendNotificationToAll = (notification) => {
        io.emit("notification", notification);
        console.log("Notification sent to all users:", notification);
    };

    // Function to get online users count
    const getOnlineUsersCount = () => {
        return onlineUsers.size;
    };

    // Function to get online users by role
    const getOnlineUsersByRole = (role) => {
        return Array.from(onlineUsers.values())
            .filter(user => user.user.role === role)
            .map(user => ({
                id: user.user.id,
                role: user.user.role,
                connectedAt: user.connectedAt
            }));
    };

    // Expose notification functions
    io.sendNotificationToUser = sendNotificationToUser;
    io.sendNotificationToRole = sendNotificationToRole;
    io.sendNotificationToAll = sendNotificationToAll;
    io.getOnlineUsersCount = getOnlineUsersCount;
    io.getOnlineUsersByRole = getOnlineUsersByRole;

    return io;
}

module.exports = socketConnection;
