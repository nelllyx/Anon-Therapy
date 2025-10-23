const express = require('express')
const therapistController = require('../controller/therapistController')
const { protect, restrictTo } = require('../services/authenticationService');


const app = express.Router()

app.post('/registration', therapistController.register)


//protected routes
app.use(protect, restrictTo('therapist'));

app.patch('/update-profile', therapistController.updateProfile)
app.patch('/sessions/:sessionId', therapistController.updateProfile)
app.get('/dashboard', therapistController.getDashboard)
app.get('/sessions/week', therapistController.getSessionsForTheWeek)


app.all('*',(req, res, next)=>{
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })
})
module.exports = app