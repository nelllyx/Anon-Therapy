const { Server } = require("socket.io");
const  jwt = require('jsonwebtoken')
const dotenv = require("dotenv");
dotenv.config({path: '../config.env'})

const JWT_SECRET = process.env.REFRESH_TOKEN_SECRET



function socketConnection(server) {

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true
        }
    });

    // authentication middleware

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) return next(new Error("Authentication error"));

        try {
            socket.user = jwt.verify(token, JWT_SECRET); // store user info for later use
            return next();
        } catch (err) {
            console.error("Socket auth failed:", err.message);
            return next(new Error("Authentication error"));
        }
    });


    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("join_room", (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    return io;
}

module.exports = socketConnection;
