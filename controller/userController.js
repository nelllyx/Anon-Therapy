const catchAsync = require('../exceptions/catchAsync')
const User = require('../services/userService')
const auth = require('../services/authenticationService')


exports.signUp = catchAsync(
    async (req,res,next) =>{
    const newUser = await User.createUser(req.body)
    const token = auth.signUpToken(newUser._id)

    res.status(201).json({
        status: 'success',
        token: token,
        data: {
            user: newUser
        }
    })

})
