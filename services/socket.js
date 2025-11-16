const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

// Fix the dotenv path
dotenv.config({ path: './config.env' });

// Fix environment variable inconsistency
const JWT_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Track online users for notifications
const onlineUsers = new Map();
// Track typing users
const typingUsers = new Map();

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

        // Ensure userId is stored as string for consistent lookup
        const userIdStr = String(socket.user.id);
        console.log("New client connected:", socket.id, "User:", userIdStr);
        
        // Store user session for notifications
        onlineUsers.set(userIdStr, {
            socketId: socket.id,
            user: socket.user,
            connectedAt: new Date()
        });

        // Automatically join user-specific notification room
        const notificationRoom = `user_${userIdStr}`;
        socket.join(notificationRoom);
        console.log(`User ${userIdStr} automatically joined notification room: ${notificationRoom}`);

        // Check if user is online
        if (onlineUsers.has(userIdStr)) {
            const userSession = onlineUsers.get(userIdStr);
            console.log('User session stored:', userSession);
        }

        // Notify user of successful connection
        socket.emit("connected", { 
            message: "Successfully connected for notifications",
            userId: userIdStr,
            userRole: socket.user.role
        });

        // Join role-based notification room (e.g., all therapists, all clients)
        socket.on("join_role_notifications", (callback) => {
            try {
                const roleRoom = `${socket.user.role}`;
                socket.join(roleRoom);
                console.log(`User ${userIdStr} joined role room: ${roleRoom}`);
                
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

        // ========== MESSAGING HANDLERS ==========
        
        // Join a conversation room
        socket.on("join_conversation", (conversationId, callback) => {
            try {
                const conversationRoom = `conversation_${conversationId}`;
                socket.join(conversationRoom);
                console.log(`User ${userIdStr} joined conversation room: ${conversationRoom}`);
                
                if (callback) {
                    callback({ success: true, roomId: conversationRoom });
                }
            } catch (error) {
                console.error("Error joining conversation room:", error);
                if (callback) {
                    callback({ error: "Failed to join conversation room" });
                }
            }
        });

        // Leave a conversation room
        socket.on("leave_conversation", (conversationId, callback) => {
            try {
                const conversationRoom = `conversation_${conversationId}`;
                socket.leave(conversationRoom);
                console.log(`User ${userIdStr} left conversation room: ${conversationRoom}`);
                
                if (callback) {
                    callback({ success: true });
                }
            } catch (error) {
                console.error("Error leaving conversation room:", error);
                if (callback) {
                    callback({ error: "Failed to leave conversation room" });
                }
            }
        });

        // Handle new message (message should be saved via REST API first, then emitted here)
        socket.on("new_message", (messageData) => {
            try {
                const { conversationId, receiverId } = messageData;
                
                // Emit to the conversation room
                const conversationRoom = `conversation_${conversationId}`;
                io.to(conversationRoom).emit("message_received", messageData);
                
                // Also send to receiver's personal room if they're not in the conversation room
                const receiverRoom = `user_${String(receiverId)}`;
                io.to(receiverRoom).emit("message_received", messageData);
                
                console.log(`Message sent to conversation ${conversationId}`);
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("message_error", { error: "Failed to send message" });
            }
        });

        // Typing indicators
        socket.on("typing_start", (data) => {
            try {
                const { conversationId, receiverId } = data;
                const conversationRoom = `conversation_${conversationId}`;
                
                // Store typing state
                typingUsers.set(`${userIdStr}_${conversationId}`, {
                    userId: userIdStr,
                    conversationId,
                    timestamp: Date.now()
                });
                
                // Emit to conversation room (excluding sender)
                socket.to(conversationRoom).emit("user_typing", {
                    userId: userIdStr,
                    conversationId,
                    isTyping: true
                });
            } catch (error) {
                console.error("Error handling typing start:", error);
            }
        });

        socket.on("typing_stop", (data) => {
            try {
                const { conversationId } = data;
                const conversationRoom = `conversation_${conversationId}`;
                
                // Remove typing state
                typingUsers.delete(`${userIdStr}_${conversationId}`);
                
                // Emit to conversation room
                socket.to(conversationRoom).emit("user_typing", {
                    userId: userIdStr,
                    conversationId,
                    isTyping: false
                });
            } catch (error) {
                console.error("Error handling typing stop:", error);
            }
        });

        // Mark message as read
        socket.on("message_read", (data) => {
            try {
                const { messageId, conversationId } = data;
                const conversationRoom = `conversation_${conversationId}`;
                
                // Emit read receipt to conversation room
                io.to(conversationRoom).emit("message_read_receipt", {
                    messageId,
                    conversationId,
                    readBy: userIdStr,
                    readAt: new Date()
                });
            } catch (error) {
                console.error("Error handling message read:", error);
            }
        });

        // Mark message as delivered
        socket.on("message_delivered", (data) => {
            try {
                const { messageId, conversationId } = data;
                const conversationRoom = `conversation_${conversationId}`;
                
                // Emit delivery receipt to conversation room
                io.to(conversationRoom).emit("message_delivered_receipt", {
                    messageId,
                    conversationId,
                    deliveredTo: userIdStr,
                    deliveredAt: new Date()
                });
            } catch (error) {
                console.error("Error handling message delivered:", error);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            const currentSocket = onlineUsers.get(userIdStr);
            if (currentSocket && currentSocket.socketId === socket.id) {
                onlineUsers.delete(userIdStr);
            }
            
            // Clean up typing indicators for this user
            for (const [key, value] of typingUsers.entries()) {
                if (key.startsWith(`${userIdStr}_`)) {
                    typingUsers.delete(key);
                }
            }
            
            console.log("Client disconnected:", socket.id);
        });
    });

    // Function to send notification to specific user
    const sendNotificationToUser = (userId, notification) => {
        // Ensure userId is a string for consistent Map lookup
        const userIdStr = String(userId);
        
        // Debug: log all online users
        console.log('Online users:', Array.from(onlineUsers.keys()));
        console.log(`Looking for user: ${userIdStr} (type: ${typeof userIdStr})`);
        
        const user = onlineUsers.get(userIdStr);
        if (user) {
            // Use room-based notification for reliability (handles reconnections)
            // Users are automatically joined to their room on connection
            const userRoom = `user_${userIdStr}`;
            io.to(userRoom).emit("notification", notification);
            console.log(`Notification sent to user ${userIdStr} via room ${userRoom}:`, notification);
            return true;
        }
        console.log(`User ${userIdStr} is not online, notification saved to DB only`);
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
