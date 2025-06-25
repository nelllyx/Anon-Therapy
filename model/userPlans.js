const mongoose = require('mongoose')
const therapyTypesConfig = require('../config/therapyTypes')
const monthlyPlanSchema = new mongoose.Schema({

    name: {
        type: String,
        enum: ['Basic', 'Standard', 'Premium'],
        default: 'Basic'
    },

    price: {
        type: Number,
        required: true
    },

    features: {
        type: [String],
        required: true
    },

    therapyTypes: {
        type: [String],
        required: true
    },

    sessionsPerWeek: {
        type: Number,
        required: true
    },

    createdAt:{
        type: Date,
        default: Date.now()
    },

    updatedAt: Date

})

monthlyPlanSchema.pre('save', function async (next){
    this.therapyTypes = therapyTypesConfig[this.name];
    next();
})


const Plans = mongoose.model('clientPlan', monthlyPlanSchema)



module.exports = Plans