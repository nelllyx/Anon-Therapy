const mongoose = require('mongoose')
const AppError = require("../exceptions/AppErrors");
const Plans = require("./userPlans");
const TherapyTypes = require("../config/therapyTypes");


const userSubscriptionSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },

    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clientPlan",
        required: true
    },

    subscriptionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscriptions",
        required: true
    },


    therapyType:{
        type: String,
        required: true
    },

    sessionDays: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        required: true
    },

    preferredTime: {
        type: String,
        enum: ['Morning', 'Afternoon', 'Evening'],
        required: true
    },


} ,{ timestamps: true})

userSubscriptionSchema.pre('save', async function(next){
    try{

        if (!this.planId._id) throw new AppError('Plan ID is required.');
        const plan = await Plans.findById(this.planId._id)
        const allowedTherapies = TherapyTypes[plan.name]
        if (!allowedTherapies.includes(this.therapyType)) {
            throw new AppError('Selected therapy is not allowed for this plan');
        }
        next()
    }catch (error){
        next(error)
    }
})

const UserSubscription = mongoose.model('sessionPreference',userSubscriptionSchema)

module.exports = UserSubscription