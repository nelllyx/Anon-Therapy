const dotenv = require("dotenv");
const express = require('express')
const connectDB = require('./config/database')
dotenv.config({path: './config.env'})
const userRoutes = require('./routes/userRoutes ')

const anonTheraphy = express()


anonTheraphy.use(express.json())

anonTheraphy.use('/api', userRoutes)


connectDB()

const port = process.env.PORT || 3000

anonTheraphy.listen( port,() =>{
    console.log(`App running on port ${port}...`)
})


