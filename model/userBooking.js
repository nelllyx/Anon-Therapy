const mongoose = require('mongoose')
const Plans = require('../model/userPlans')
const TherapyTypes = require('../config/therapyTypes')
const AppError = require("../exceptions/AppErrors");


const bookingSchema = new mongoose.Schema({
    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clientPlan",
        required: true
    },


    bookingCreationDate: {
        type: Date,
        default: Date.now()
    },

    status:{
        type: String,
        enum: ['pending','confirmed', 'canceled', 'expired'],
        default: 'pending'
    },

    isBookingActive: {
        type: Boolean,
        default: false
    },

    selectedTherapy: {
        type: String,
        required: true
    }


})

bookingSchema.pre('save', async function(next){
    try{

        if (!this.plan._id) throw new AppError('Plan ID is required.');

        const plan = await Plans.findById(this.plan._id)
        if(!plan)throw new AppError('plan not found')
        const allowedTherapies = TherapyTypes[plan.name]
        if (!allowedTherapies.includes(this.selectedTherapy)) {
            throw new AppError('Selected therapy is not allowed for this plan');
    }
        next()
    }catch (error){
       next(error)
    }
})

const Bookings = mongoose.model('UserBooking',bookingSchema)

module.exports = Bookings