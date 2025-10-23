const mongoose = require('mongoose')
const bcrypt = require("bcryptjs");

const UserRefreshToken = new mongoose.Schema({

    token: {
        type: String,
        required: true,
        unique: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    userType: {
        type: String,
        enum: ['client', 'therapist'],
        required: true
    },

    expiresAt: {
        type: Date,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    revoked: {
        type: Boolean,
        default: false
    },
})

UserRefreshToken.methods.validateToken = async function (plainToken){
    return await bcrypt.compare(plainToken, this.token)
}

 const refreshToken   = mongoose.model('RefreshToken', UserRefreshToken);

module.exports = refreshToken
