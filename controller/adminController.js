//const subscription = require('../config/therapyTypes')
const catchAsync = require('../exceptions/catchAsync')
const Subscription = require('../model/userPlans')
const adminService = require('../services/adminService')
const AppError = require('../exceptions/AppErrors')

// Admin authentication
exports.createAdmin = catchAsync(async (req, res) => {
    // Verify internal request
    if (!req.headers['x-internal-secret'] || req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
        throw new AppError('Unauthorized access', 401)
    }

    const admin = await adminService.createAdmin(req.body)
    
    res.status(201).json({
        status: 'success',
        data: {
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        }
    })
})

exports.loginAdmin = catchAsync(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new AppError('Please provide email and password', 400)
    }

    const { admin, token } = await adminService.loginAdmin(email, password)

    res.status(200).json({
        status: 'success',
        token,
        data: {
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        }
    })
})

// Admin profile management
exports.getAdminProfile = catchAsync(async (req, res) => {
    const admin = await adminService.getAdminProfile(req.admin.id)

    res.status(200).json({
        status: 'success',
        data: {
            admin
        }
    })
})

exports.updateAdminProfile = catchAsync(async (req, res) => {
    const admin = await adminService.updateAdminProfile(req.admin.id, req.body)

    res.status(200).json({
        status: 'success',
        data: {
            admin
        }
    })
})

exports.changeAdminPassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
        throw new AppError('Please provide current and new password', 400)
    }

    await adminService.changeAdminPassword(req.admin.id, currentPassword, newPassword)

    res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
    })
})

// Existing plan management
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