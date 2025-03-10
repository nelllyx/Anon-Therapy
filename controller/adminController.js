//const subscription = require('../config/therapyTypes')
const catchAsync = require('../exceptions/catchAsync')
const Subscription = require('../model/userPlans')

exports.createPlan = catchAsync(
    async (req,res) =>{
    const {name, price, features} = req.body
     const  newPlan = await Subscription.create({name, price, features})
        res.status(201).json({
            status: 'success',
            data: {
                plan: newPlan
            }

        })
})