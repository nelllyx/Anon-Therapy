const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');
const path = require('path');
const fs = require('fs');

// Cloudinary storage for synchronous uploads (used in profile updates)
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
});

// Disk storage for temporary files (used in registration for async upload)
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/temp';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'), false);
    }
};

// Default upload with Cloudinary storage
const upload = multer({ 
    storage: cloudinaryStorage,
    fileFilter: fileFilter
});

// Upload with disk storage for async processing
const uploadTemp = multer({ 
    storage: diskStorage,
    fileFilter: fileFilter
});

module.exports = upload;
module.exports.uploadTemp = uploadTemp;
module.exports.cloudinaryStorage = cloudinaryStorage;