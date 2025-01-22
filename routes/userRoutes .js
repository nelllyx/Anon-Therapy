const express = require('express')
const  userController = require('../controller/userController')

const app = express.Router()

app.route('/signup').post(userController.signUp)

app.all('*',(req, res, next)=>{
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
})
module.exports = app