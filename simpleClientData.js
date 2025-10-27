// Simple client dummy data for quick testing
// This file contains just a few client objects with Nigerian names that you can use directly in your tests

const simpleClientData = [
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
    }
];

// Example usage in your tests or seed scripts:
/*
const Users = require('./model/userSchema');

// To create a single client:
const newClient = await Users.create(simpleClientData[0]);

// To create multiple clients (RECOMMENDED):
for (const clientData of simpleClientData) {
    const newClient = await Users.create(clientData);
    console.log(`Created client: ${newClient.username}`);
}

// DON'T use insertMany() as it bypasses password hashing
// const clients = await Users.insertMany(simpleClientData); // ❌ Won't hash passwords
*/

module.exports = simpleClientData;