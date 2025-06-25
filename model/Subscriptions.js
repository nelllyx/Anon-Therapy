const mongoose = require('mongoose')
const Plans = require('../model/userPlans')
const TherapyTypes = require('../config/therapyTypes')
const AppError = require("../exceptions/AppErrors");


const subscriptionSchema = new mongoose.Schema({

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

    subscriptionCreationDate: {
        type: Date,
        default: Date.now()
    },

    status:{
        type: String,
        enum: ['pending','subscribed', 'waitlist', 'canceled', 'completed'],
        default: 'pending'
    },

    isSubscriptionActive: {
        type: Boolean,
        default: false
    },

    startDate: {
      type: Date,
      default: null,
    } ,


    endDate: {
        type: Date,
        default: null,
    },

    sessionLimit: {
        type: Number,
        required: true,
    },
    
    sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],


    // selectedTherapy: {
    //     type: String,
    //     required: true
    // },
    //
    // selectedDays: {
    //   type: String,
    //   enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    //     required: true
    // },
    //
    // timePreference: {
    //     type: String,
    //     enum: ['morning', 'afternoon', 'evening'],
    //     required: true
    // }


})

// subscriptionSchema.pre('save', async function(next){
//     try{
//
//         if (!this.plan._id) throw new AppError('Plan ID is required.');
//         const plan = await Plans.findById(this.plan._id)
//         const allowedTherapies = TherapyTypes[plan.name]
//         if (!allowedTherapies.includes(this.selectedTherapy)) {
//             throw new AppError('Selected therapy is not allowed for this plan');
//     }
//         next()
//     }catch (error){
//        next(error)
//     }
// })

const Subscriptions = mongoose.model('Subscriptions',subscriptionSchema)

module.exports = Subscriptions