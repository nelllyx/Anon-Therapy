const express = require('express')
const  userController = require('../controller/userController')
const authService = require('../services/authenticationService')

const app = express.Router()

app.route('/register').post(userController.signUp)
app.route('/verification').post(userController.vetifyOtp)
app.route('/login').post(userController.login)
app.route('/booking').post(authService.protect, userController.createBookings)

app.all('*',(req, res, next)=>{
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
})
module.exports = app

