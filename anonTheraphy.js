const dotenv = require("dotenv");
const express = require('express')
const connectDB = require('./config/database')
dotenv.config({path: './config.env'})
const userRoutes = require('./routes/userRoutes ')
const adminRoutes = require('./routes/adminRoute')
const therapistRoutes = require('./routes/therapistRoutes')

const anonTheraphy = express()


anonTheraphy.use(express.json())

anonTheraphy.use('/api/v1/admin', adminRoutes)

anonTheraphy.use('/api/v1/users', userRoutes)

anonTheraphy.use('/api/v1/therapist', therapistRoutes )


connectDB()

const port = process.env.PORT || 3000

anonTheraphy.listen( port,() =>{
    console.log(`App running on port ${port}...`)
})


