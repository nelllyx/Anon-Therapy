const express = require('express')
const therapistController = require('../controller/therapistController')


const app = express.Router()

app.route('/registration').post(therapistController.register)
app.route('/login').post(therapistController.login)
app.route('/verification').post(therapistController.vetifyOtp)

app.all('*',(req, res, next)=>{
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
})
module.exports = app