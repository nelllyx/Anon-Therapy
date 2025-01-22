const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({path: '../config.env'})


const connectDB = async ()=>{
    try{
       await mongoose.connect(process.env.DATABASE_LOCAL, {
           useNewUrlParser: true,
           useUnifiedTopology: true,

       })
           console.log('DB connection successful')
    }catch (error){
        console.error('MongoDB connection error: ' + error)
    }
}

module.exports = connectDB


