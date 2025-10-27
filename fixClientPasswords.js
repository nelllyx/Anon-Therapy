const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Users = require('./model/userSchema');

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

// Function to fix client passwords
const fixClientPasswords = async () => {
    try {
        // Get all clients
        const clients = await Users.find({ role: 'client' });
        console.log(`Found ${clients.length} clients to fix`);

        let fixedCount = 0;
        let skippedCount = 0;

        for (const client of clients) {
            // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
            if (client.password.startsWith('$2a$') || client.password.startsWith('$2b$')) {
                console.log(`Skipping ${client.username} - password already hashed`);
                skippedCount++;
                continue;
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(client.password, salt);

            // Update the client with hashed password
            await Users.findByIdAndUpdate(client._id, {
                password: hashedPassword
            });

            console.log(`Fixed password for ${client.username}`);
            fixedCount++;
        }

        console.log(`\n=== CLIENT PASSWORD FIX SUMMARY ===`);
        console.log(`Fixed: ${fixedCount} clients`);
        console.log(`Skipped: ${skippedCount} clients (already hashed)`);
        console.log(`Total: ${clients.length} clients`);

    } catch (error) {
        console.error('Error fixing client passwords:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the fix function
const runFix = async () => {
    await connectDB();
    await fixClientPasswords();
};

// Execute if this file is run directly
if (require.main === module) {
    runFix();
}

module.exports = { fixClientPasswords, connectDB };