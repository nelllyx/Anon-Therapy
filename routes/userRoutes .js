const express = require('express')
const {protect, restrictTo} = require('../services/authenticationService')
const {signUp, verifyOtp, login, createBookings, initializePayment, confirmPayment} = require('../controller/userController')


const app = express.Router()

app.route('/register').post(signUp)
app.route('/verification').post(verifyOtp)
app.route('/login').post(login)
app.route('/booking').post(protect,restrictTo('client'), createBookings)
app.route('/payment').post(protect,restrictTo('client'), initializePayment)
app.route('/payment/transaction/verify/:reference').get(protect,restrictTo('client'), confirmPayment)


app.all('*',(req, res, next)=>{
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
})
module.exports = app

