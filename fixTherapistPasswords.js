const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const therapist = require('./model/therapistSchema');

// Connect to MongoDB (adjust connection string as needed)
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/anon-therapy', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Function to fix therapist passwords
const fixTherapistPasswords = async () => {
    try {
        // Get all therapists
        const therapists = await therapist.find({});
        console.log(`Found ${therapists.length} therapists to fix`);

        let fixedCount = 0;
        let skippedCount = 0;

        for (const therapistDoc of therapists) {
            // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
            if (therapistDoc.password.startsWith('$2a$') || therapistDoc.password.startsWith('$2b$')) {
                console.log(`Skipping ${therapistDoc.firstName} ${therapistDoc.lastName} - password already hashed`);
                skippedCount++;
                continue;
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(therapistDoc.password, salt);

            // Update the therapist with hashed password
            await therapist.findByIdAndUpdate(therapistDoc._id, {
                password: hashedPassword
            });

            console.log(`Fixed password for ${therapistDoc.firstName} ${therapistDoc.lastName}`);
            fixedCount++;
        }

        console.log(`\n=== PASSWORD FIX SUMMARY ===`);
        console.log(`Fixed: ${fixedCount} therapists`);
        console.log(`Skipped: ${skippedCount} therapists (already hashed)`);
        console.log(`Total: ${therapists.length} therapists`);

    } catch (error) {
        console.error('Error fixing therapist passwords:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the fix function
const runFix = async () => {
    await connectDB();
    await fixTherapistPasswords();
};

// Execute if this file is run directly
if (require.main === module) {
    runFix();
}

module.exports = { fixTherapistPasswords, connectDB };