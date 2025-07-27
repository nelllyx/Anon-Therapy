const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads', // Optional: Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'], // Allowed file formats
        transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional: Image transformations
    },
});

const upload = multer({ storage: storage });

module.exports = upload;