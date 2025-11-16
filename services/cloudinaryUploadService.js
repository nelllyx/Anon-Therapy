const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const therapist = require('../model/therapistSchema');

/**
 * Uploads a file to Cloudinary asynchronously and updates the therapist profile
 * @param {string} filePath - Local file path to upload
 * @param {string} therapistId - Therapist ID to update
 * @param {string} folder - Cloudinary folder name
 */
const uploadProfilePictureAsync = async (filePath, therapistId, folder = 'uploads') => {
    try {
        console.log(`Starting async upload for therapist ${therapistId}`);
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
        });

        console.log(`Cloudinary upload successful: ${result.secure_url}`);

        // Update therapist profile with the Cloudinary URL (using correct schema field)
        await therapist.findByIdAndUpdate(
            therapistId,
            { 'profile.avatar': result.secure_url },
            { new: true }
        );

        console.log(`Therapist ${therapistId} profile picture updated successfully`);

        // Delete the temporary file using async/await
        try {
            await fs.promises.unlink(filePath);
            console.log(`Temp file ${filePath} deleted successfully`);
        } catch (unlinkError) {
            console.error(`Error deleting temp file ${filePath}:`, unlinkError);
        }

        return result.secure_url;
    } catch (error) {
        console.error(`Error uploading profile picture for therapist ${therapistId}:`, error);
        
        // Try to delete the temp file even if upload failed
        try {
            await fs.promises.unlink(filePath);
        } catch (unlinkError) {
            console.error(`Error deleting temp file after failed upload:`, unlinkError);
        }
        
        throw error;
    }
};

module.exports = {
    uploadProfilePictureAsync
};
