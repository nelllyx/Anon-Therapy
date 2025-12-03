const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({path: '../config.env'})


const connectDB = async ()=>{
    try{
     const conn =  await mongoose.connect(process.env.DATABASE_ATLAS, {
           maxPoolSize: 10,
           serverSelectionTimeoutMS: 5000,
           socketTimeoutMS: 45000,
           bufferCommands: false,
           dbName: 'anonymous-therapy'
       })
        console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
        console.log(`[DATABASE] Database Name: ${conn.connection.name}`);


        // Handle connection events
        mongoose.connection.on("error", (err) => {
            console.error("[DATABASE] MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("[DATABASE] MongoDB disconnected");
        });

        mongoose.connection.on("reconnected", () => {
            console.log("[DATABASE] MongoDB reconnected");
        });


    }catch (error){
        console.error("[DATABASE] MongoDB connection failed:", error.message);
        process.exit(1);    }
}

module.exports = connectDB


