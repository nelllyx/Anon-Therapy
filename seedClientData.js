const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Users = require('./model/userSchema');
const Subscriptions = require('./model/Subscriptions');

// Connect to MongoDB (adjust connection string as needed)
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/anonymous_therapy', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Nigerian names and client data
const dummyClients = [
    {
        username: "adebayo_olu",
        email: "adebayo.olu@gmail.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "chioma_grace",
        email: "chioma.grace@yahoo.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "chukwudi_emeka",
        email: "chukwudi.emeka@outlook.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "folake_adebisi",
        email: "folake.adebisi@gmail.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "ibrahim_musa",
        email: "ibrahim.musa@yahoo.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "nkemka_onyinye",
        email: "nkemka.onyinye@gmail.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "tunde_adeyemi",
        email: "tunde.adeyemi@outlook.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "amara_chidinma",
        email: "amara.chidinma@yahoo.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "segun_oluwaseun",
        email: "segun.oluwaseun@gmail.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "uchechi_ifeoma",
        email: "uchechi.ifeoma@outlook.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "kolawole_babatunde",
        email: "kolawole.babatunde@yahoo.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "adunni_oluwakemi",
        email: "adunni.oluwakemi@gmail.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "emmanuel_godwin",
        email: "emmanuel.godwin@outlook.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "blessing_chioma",
        email: "blessing.chioma@yahoo.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "victor_onyeka",
        email: "victor.onyeka@gmail.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "peace_amaka",
        email: "peace.amaka@outlook.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "solomon_adebayo",
        email: "solomon.adebayo@yahoo.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "joy_udochukwu",
        email: "joy.udochukwu@gmail.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    },
    {
        username: "daniel_oluwaseyi",
        email: "daniel.oluwaseyi@outlook.com",
        password: "password123",
        gender: "male",
        role: "client",
        isVerified: true
    },
    {
        username: "faith_oluwatoyin",
        email: "faith.oluwatoyin@yahoo.com",
        password: "password123",
        gender: "female",
        role: "client",
        isVerified: true
    }
];

// Function to seed the database
const seedDatabase = async () => {
    try {
        // Clear existing clients (optional - remove if you want to keep existing data)
        await Users.deleteMany({ role: 'client' });
        console.log('Cleared existing client data');

        // Create clients one by one to ensure password hashing
        const createdClients = [];
        for (const clientData of dummyClients) {
            const newClient = await Users.create(clientData);
            createdClients.push(newClient);
            console.log(`Created client: ${newClient.username}`);
        }
        console.log(`Successfully created ${createdClients.length} client records with properly hashed passwords`);

        // Display summary
        console.log('\n=== CLIENT DATA SUMMARY ===');
        createdClients.forEach((client, index) => {
            console.log(`${index + 1}. ${client.username}`);
            console.log(`   Email: ${client.email}`);
            console.log(`   Gender: ${client.gender}`);
            console.log(`   Verified: ${client.isVerified}`);
            console.log('---');
        });

        console.log('\n=== GENDER BREAKDOWN ===');
        const genderBreakdown = createdClients.reduce((acc, client) => {
            acc[client.gender] = (acc[client.gender] || 0) + 1;
            return acc;
        }, {});
        Object.entries(genderBreakdown).forEach(([gender, count]) => {
            console.log(`${gender}: ${count} client(s)`);
        });

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the seed function
const runSeed = async () => {
    await connectDB();
    await seedDatabase();
};

// Execute if this file is run directly
if (require.main === module) {
    runSeed();
}

module.exports = { dummyClients, seedDatabase, connectDB };