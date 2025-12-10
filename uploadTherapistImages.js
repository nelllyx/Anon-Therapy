
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const Therapist = require('./model/therapistSchema');

dotenv.config({ path: './config.env' });

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

// Paths to generated images (Update these if filenames change)
// Note: In a real scenario, we might want to move these to a local 'uploads' folder first.
// For now, we point to the artifacts directory.
const imagePaths = {
    male: [
        'C:/Users/OWNER/.gemini/antigravity/brain/94c5e505-4783-4548-80a3-f3887ef9d1b7/african_male_therapist_1_1764882121428.png',
        'C:/Users/OWNER/.gemini/antigravity/brain/94c5e505-4783-4548-80a3-f3887ef9d1b7/african_male_therapist_2_1764882137359.png'
    ],
    female: [
        'C:/Users/OWNER/.gemini/antigravity/brain/94c5e505-4783-4548-80a3-f3887ef9d1b7/african_female_therapist_1_1764882155565.png',
        'C:/Users/OWNER/.gemini/antigravity/brain/94c5e505-4783-4548-80a3-f3887ef9d1b7/african_female_therapist_2_1764882169779.png'
    ]
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_ATLAS, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const uploadImage = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'therapists',
            use_filename: true,
            unique_filename: false
        });
        return result.secure_url;
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        return null;
    }
};

const run = async () => {
    await connectDB();

    try {
        const therapists = await Therapist.find({});
        console.log(`Found ${therapists.length} therapists.`);

        // Pre-upload images to get URLs (optimization: upload each unique image once)
        // Or upload for each therapist if we want distinct entries (but same image content).
        // Let's upload each unique image once and reuse the URL to save Cloudinary storage/bandwidth.

        console.log('Uploading base images to Cloudinary...');
        const uploadedUrls = {
            male: [],
            female: []
        };

        for (const path of imagePaths.male) {
            const url = await uploadImage(path);
            if (url) uploadedUrls.male.push(url);
        }
        for (const path of imagePaths.female) {
            const url = await uploadImage(path);
            if (url) uploadedUrls.female.push(url);
        }

        console.log('Base images uploaded.');
        console.log('Male URLs:', uploadedUrls.male);
        console.log('Female URLs:', uploadedUrls.female);

        if (uploadedUrls.male.length === 0 || uploadedUrls.female.length === 0) {
            throw new Error('Failed to upload base images.');
        }

        // Assign images to therapists
        for (let i = 0; i < therapists.length; i++) {
            const therapist = therapists[i];
            let url;

            if (therapist.gender === 'male') {
                // Pick random male image
                const randomIndex = Math.floor(Math.random() * uploadedUrls.male.length);
                url = uploadedUrls.male[randomIndex];
            } else {
                // Pick random female image
                const randomIndex = Math.floor(Math.random() * uploadedUrls.female.length);
                url = uploadedUrls.female[randomIndex];
            }

            therapist.profile.avatar = url;
            await therapist.save();
            console.log(`Updated ${therapist.firstName} ${therapist.lastName} (${therapist.gender}) with image.`);
        }

        console.log('All therapists updated successfully.');

    } catch (err) {
        console.error('Script failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('DB disconnected.');
    }
};

run();
