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

// Helper to get random unique elements from array
const getRandomElements = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

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

        // Ensure Plans exist with correct pricing and sessions
        // We'll update existing plans or create new ones if missing
        const defaultPlans = [
            {
                name: 'Basic',
                price: 0, // Free
                features: ['1 session/week', 'Chat support'],
                sessionsPerWeek: 1
            },
            {
                name: 'Standard',
                price: 50000,
                features: ['2 sessions/week', 'Chat support', 'Video calls'],
                sessionsPerWeek: 2
            },
            {
                name: 'Premium',
                price: 100000,
                features: ['4 sessions/week', '24/7 Support', 'Video calls'],
                sessionsPerWeek: 4
            }
        ];

        if (plans.length === 0) {
            console.log('No plans found. Creating default plans...');
            plans = await Plans.insertMany(defaultPlans);
            console.log('Created default plans.');
        } else {
            // Update existing plans to match new requirements
            for (const defPlan of defaultPlans) {
                await Plans.findOneAndUpdate({ name: defPlan.name }, defPlan, { upsert: true });
            }
            plans = await Plans.find({}); // Refresh plans
            console.log('Updated existing plans.');
        }

        console.log(`Found ${clients.length} clients, ${therapists.length} therapists, and ${plans.length} plans.`);

        // Clear existing session-related data
        await Subscriptions.deleteMany({});
        await UserSubscription.deleteMany({});
        await ClientSessions.deleteMany({});
        console.log('Cleared existing subscriptions, preferences, and sessions.');

        let subscriptionCount = 0;
        let sessionCount = 0;
        let preferenceCount = 0;

        for (const client of clients) {
            // 2. Create Subscription
            const randomPlan = getRandomElement(plans);

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
                maxSession: randomPlan.sessionsPerWeek * 4
            });
            subscriptionCount++;

            // 3. Create Session Preference
            const allowedTherapies = therapyTypesConfig[randomPlan.name] || ['General Counseling']; // Fallback
            const selectedTherapy = getRandomElement(allowedTherapies);

            const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const selectedDays = getRandomElements(availableDays, randomPlan.sessionsPerWeek);

            const preference = await UserSubscription.create({
                userId: client._id,
                planId: randomPlan._id,
                subscriptionId: subscription._id,
                therapyType: selectedTherapy,
                sessionDays: selectedDays,
                preferredTime: getRandomElement(['Morning', 'Afternoon', 'Evening'])
            });
            preferenceCount++;

            // 4. Assign Therapist
            // Find therapist with matching specialization
            // Note: Specialization in Therapist model is a string, therapyType is a string.
            // We need to ensure case-insensitive matching or exact matching depending on data.
            // Assuming exact match or close enough for seeding.
            const eligibleTherapists = therapists.filter(t =>
                t.specialization && t.specialization.toLowerCase() === selectedTherapy.toLowerCase()
            );

            // If no exact match, pick a random therapist to ensure data generation proceeds
            const assignedTherapist = eligibleTherapists.length > 0
                ? getRandomElement(eligibleTherapists)
                : getRandomElement(therapists);

            if (!assignedTherapist) {
                console.log(`No therapist found for client ${client.username} with therapy ${selectedTherapy}`);
                continue;
            }

            // 5. Create Sessions
            // Generate sessions for the next 4 weeks based on selected days
            const sessionsToCreate = [];
            const dayMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };

            let currentDate = new Date();
            // Reset to start of day
            currentDate.setHours(0, 0, 0, 0);

            // Generate sessions for 4 weeks
            for (let week = 0; week < 4; week++) {
                for (const dayName of selectedDays) {
                    const targetDay = dayMap[dayName];
                    const sessionDate = new Date(currentDate);

                    // Calculate date for this day in the current week
                    // This is a simplified logic: find next occurrence of the day
                    const currentDay = sessionDate.getDay();
                    let daysUntilTarget = targetDay - currentDay;
                    if (daysUntilTarget <= 0) daysUntilTarget += 7; // Move to next week if day passed

                    // Adjust for the specific week iteration
                    sessionDate.setDate(sessionDate.getDate() + daysUntilTarget + (week * 7));

                    const sessionStatus = getRandomElement(['upcoming', 'completed', 'upcoming']); // Bias towards upcoming

                    sessionsToCreate.push({
                        userId: client._id,
                        subscriptionId: subscription._id,
                        therapistId: assignedTherapist._id,
                        therapyType: selectedTherapy,
                        date: sessionDate,
                        preferredTime: preference.preferredTime,
                        scheduledTime: `${getRandomInt(9, 17).toString().padStart(2, '0')}:00`,
                        duration: 45,
                        status: sessionStatus,
                        notes: sessionStatus === 'completed' ? `Session notes for ${client.username}` : ''
                    });
                }
            }

            if (sessionsToCreate.length > 0) {
                await ClientSessions.insertMany(sessionsToCreate);
                sessionCount += sessionsToCreate.length;
            }
        }

        console.log(`Successfully created:`);
        console.log(`- ${subscriptionCount} Subscriptions`);
        console.log(`- ${preferenceCount} Session Preferences`);
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
