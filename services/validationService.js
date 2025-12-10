const AppError = require('../exceptions/AppErrors');
const { Types } = require('mongoose');

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validateObjectId = (id) => {
    return Types.ObjectId.isValid(id);
};

// User Validations
exports.validateSignUp = (data) => {
    const { username, email, password, gender, role } = data;
    if (!username || !email || !password || !gender) {
        throw new AppError('Please provide all required fields: username, email, password, gender', 400);
    }
    if (!validateEmail(email)) {
        throw new AppError('Please provide a valid email', 400);
    }
    if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400);
    }
};

exports.validateCreateSubscription = (data) => {
    const { planName } = data;
    if (!planName) {
        throw new AppError('Please provide a plan name', 400);
    }
};

exports.validateInitializePayment = (data) => {
    const { email, amount, subscriptionId } = data;
    if (!email || !amount || !subscriptionId) {
        throw new AppError('Please provide email, amount, and subscriptionId', 400);
    }
    if (!validateEmail(email)) {
        throw new AppError('Please provide a valid email', 400);
    }
    if (amount <= 0) {
        throw new AppError('Amount must be greater than 0', 400);
    }
};

exports.validateCreateBooking = (data) => {
    const { planName, therapyType, sessionDays, preferredTime } = data;
    if (!planName || !therapyType || !sessionDays || !preferredTime) {
        throw new AppError('Please provide planName, therapyType, sessionDays, and preferredTime', 400);
    }
    if (!Array.isArray(sessionDays) || sessionDays.length === 0) {
        throw new AppError('sessionDays must be a non-empty array', 400);
    }
};

exports.validateRescheduleSession = (data) => {
    const { newDate, newTime } = data;
    if (!newDate || !newTime) {
        throw new AppError('Please provide newDate and newTime', 400);
    }
};

// Therapist Validations
exports.validateTherapistRegister = (data) => {
    const { firstName, lastName, email, password, specialization, yearsOfExperience } = data;
    if (!firstName || !lastName || !email || !password || !specialization || !yearsOfExperience) {
        throw new AppError('Please provide all required fields', 400);
    }
    if (!validateEmail(email)) {
        throw new AppError('Please provide a valid email', 400);
    }
};

exports.validateUpdateTherapistProfile = (data) => {
    // Add specific validation if needed, for now just ensure data is not empty if that's a requirement,
    // but updates often allow partial fields.
    if (Object.keys(data).length === 0) {
        // It's okay to have empty body if just uploading file, but usually there's something.
        // Let's keep it loose for updates unless specific constraints exist.
    }
};

exports.validateAssignTimeForSession = (data) => {
    // updates object
    if (Object.keys(data).length === 0) {
        throw new AppError('Please provide fields to update', 400);
    }
};

exports.validateUpdatePassword = (data) => {
    const { currentPassword, newPassword } = data;
    if (!currentPassword || !newPassword) {
        throw new AppError('Please provide currentPassword and newPassword', 400);
    }
    if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters long', 400);
    }
};

// Message Validations
exports.validateSendMessage = (data) => {
    const { receiverId, receiverRole, message } = data;
    if (!receiverId || !receiverRole || !message) {
        throw new AppError('Please provide receiverId, receiverRole, and message', 400);
    }
    if (!validateObjectId(receiverId)) {
        throw new AppError('Invalid receiverId', 400);
    }
};

// Admin Validations
exports.validateCreateAdmin = (data) => {
    const { username, email, password } = data;
    if (!username || !email || !password) {
        throw new AppError('Please provide username, email, and password', 400);
    }
    if (!validateEmail(email)) {
        throw new AppError('Please provide a valid email', 400);
    }
};

exports.validateLoginAdmin = (data) => {
    const { email, password } = data;
    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }
};

exports.validateCreatePlan = (data) => {
    const { name, price, features, sessionsPerWeek } = data;
    if (!name || !price || !features || !sessionsPerWeek) {
        throw new AppError('Please provide name, price, features, and sessionsPerWeek', 400);
    }
};

// Notification Validations
exports.validateMarkAsRead = (params) => {
    const { id } = params; // notificationId
    if (!id || !validateObjectId(id)) {
        throw new AppError('Invalid notification ID', 400);
    }
};
