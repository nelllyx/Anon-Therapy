// migrate.js
const dotenv = require("dotenv");
dotenv.config({path: '../config.env'})
const mongoose = require('mongoose');
const Therapist = require('../model/therapistSchema');


async function migrate() {

    await mongoose.connect(process.env.DATABASE_ATLAS, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    // Add empty `profile` object to docs missing it
    const result = await Therapist.updateMany(
        { profile: { $exists: false } }, // Target docs without `profile`
        { $set: { profile: {} } }        // Initialize empty `profile`
    );

    console.log(`Updated ${result.modifiedCount} documents`);
    mongoose.disconnect();
}

migrate().catch(console.error);