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
    }

})

monthlyPlanSchema.pre('save', function async (next){
    this.therapyTypes = therapyTypesConfig[this.name];
    next();
})


const Plans = mongoose.model('clientPlan', monthlyPlanSchema)



module.exports = Plans