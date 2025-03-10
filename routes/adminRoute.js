const express = require('express')
const  adminController = require('../controller/adminController')

const app = express.Router()

app.route('/userPlans').post(adminController.createPlan)



app.all('*',(req, res, next)=>{
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
})
module.exports = app