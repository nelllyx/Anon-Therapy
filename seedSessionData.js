const mongoose = require('mongoose');
const dotenv = require("dotenv");
const Users = require('./model/userSchema');
const Therapists = require('./model/therapistSchema');
const Plans = require('./model/userPlans');
const Subscriptions = require('./model/Subscriptions');
const UserSubscription = require('./model/sessionPreferenceSchema');
const ClientSessions = require('./model/sessionSchema');
const therapyTypesConfig = require('./config/therapyTypes');

dotenv.config({ path: './config.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_ATLAS, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            dbName: 'anonymous-therapy'
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedSessionData = async () => {
    try {
        console.log('Starting data seeding...');

        // 1. Fetch Existing Data
        const clients = await Users.find({ role: 'client' });
        const therapists = await Therapists.find({});
        let plans = await Plans.find({});

        if (clients.length === 0) {
            console.log('No clients found. Please run seedClientData.js first.');
            return;
        }
        if (therapists.length === 0) {
            console.log('No therapists found. Please run seedTherapistData.js first.');
            return;
        }

        // Ensure Plans exist
        if (plans.length === 0) {
            console.log('No plans found. Creating default plans...');
            const defaultPlans = [
                {
                    name: 'Basic',
                    price: 50,
                    features: ['1 session/week', 'Chat support'],
                    sessionsPerWeek: 1
                },
                {
                    name: 'Standard',
                    price: 120,
                    features: ['2 sessions/week', 'Chat support', 'Video calls'],
                    sessionsPerWeek: 2
                },
                {
                    name: 'Premium',
                    price: 200,
                    features: ['4 sessions/week', '24/7 Support', 'Video calls'],
                    sessionsPerWeek: 4
                }
            ];
            plans = await Plans.insertMany(defaultPlans);
            console.log('Created default plans.');
        }

        console.log(`Found ${clients.length} clients, ${therapists.length} therapists, and ${plans.length} plans.`);

        // Clear existing session-related data to avoid duplicates/conflicts during re-runs
        await Subscriptions.deleteMany({});
        await UserSubscription.deleteMany({});
        await ClientSessions.deleteMany({});
        console.log('Cleared existing subscriptions, preferences, and sessions.');

        let subscriptionCount = 0;
        let sessionCount = 0;

        for (const client of clients) {
            // 2. Create Subscription
            const randomPlan = getRandomElement(plans);

            // Calculate start and end dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            const subscription = await Subscriptions.create({
                userId: client._id,
                planId: randomPlan._id,
                status: 'subscribed',
                isSubscriptionActive: true,
                startDate: startDate,
                endDate: endDate,
                sessionsPerWeek: randomPlan.sessionsPerWeek,
                maxSession: randomPlan.sessionsPerWeek * 4 // Approx 4 weeks
            });
            subscriptionCount++;

            // 3. Create Session Preference
            // Get allowed therapy types for the plan
            const allowedTherapies = therapyTypesConfig[randomPlan.name];
            const selectedTherapy = getRandomElement(allowedTherapies);

            await UserSubscription.create({
                userId: client._id,
                planId: randomPlan._id,
                subscriptionId: subscription._id,
                therapyType: selectedTherapy,
                sessionDays: [getRandomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])],
                preferredTime: getRandomElement(['Morning', 'Afternoon', 'Evening'])
            });

            // 4. Create Sessions
            // Assign a single therapist for this client for all sessions
            const assignedTherapist = getRandomElement(therapists);

            // Create a few sessions for this subscription
            const numSessions = getRandomInt(1, 3);
            for (let i = 0; i < numSessions; i++) {
                const sessionStatus = getRandomElement(['upcoming', 'completed', 'canceled']);

                const sessionDate = new Date();
                if (sessionStatus === 'completed') {
                    sessionDate.setDate(sessionDate.getDate() - getRandomInt(1, 10));
                } else {
                    sessionDate.setDate(sessionDate.getDate() + getRandomInt(1, 10));
                }

                await ClientSessions.create({
                    userId: client._id,
                    subscriptionId: subscription._id,
                    therapistId: assignedTherapist._id,
                    therapyType: selectedTherapy,
                    date: sessionDate,
                    preferredTime: getRandomElement(['Morning', 'Afternoon', 'Evening']),
                    scheduledTime: `${getRandomInt(9, 17).toString().padStart(2, '0')}:00`,
                    duration: 45, // Standard session
                    status: sessionStatus,
                    notes: `Session notes for ${client.username}`
                });
                sessionCount++;
            }
        }

        console.log(`Successfully created:`);
        console.log(`- ${subscriptionCount} Subscriptions`);
        console.log(`- ${subscriptionCount} Session Preferences`);
        console.log(`- ${sessionCount} Sessions`);

    } catch (error) {
        console.error('Error seeding session data:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
};

const runSeed = async () => {
    await connectDB();
    await seedSessionData();
};

if (require.main === module) {
    runSeed();
}

module.exports = { seedSessionData };
