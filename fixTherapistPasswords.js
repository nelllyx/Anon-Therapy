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

// Function to fix existing therapist passwords
const fixPasswords = async () => {
    try {
        // Find all therapists
        const therapists = await therapist.find({});
        console.log(`Found ${therapists.length} therapists to update`);

        // Update each therapist's password
        for (const therapistDoc of therapists) {
            // Hash the password using bcrypt
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            
            // Update the therapist with hashed password
            await therapist.findByIdAndUpdate(
                therapistDoc._id,
                { password: hashedPassword },
                { new: true }
            );
            
            console.log(`Updated password for: ${therapistDoc.firstName} ${therapistDoc.lastName}`);
        }

        console.log('\n✅ All therapist passwords have been hashed successfully!');
        console.log('You can now login with any therapist using email and password "password123"');

    } catch (error) {
        console.error('Error fixing passwords:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the fix function
const runFix = async () => {
    await connectDB();
    await fixPasswords();
};

// Execute if this file is run directly
if (require.main === module) {
    runFix();
}

module.exports = { fixPasswords, connectDB };