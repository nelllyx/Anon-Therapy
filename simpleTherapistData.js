// Simple therapist dummy data for quick testing
// This file contains just a few therapist objects that you can use directly in your tests

const simpleTherapistData = [
    {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567890",
        yearsOfExperience: 3,
        specialization: "nutritional therapy",
        licenseNo: 123456,
        profile: {
            education: "MS in Nutritional Therapy, Stanford University",
            certification: "Licensed Nutritional Therapist (LNT), Certified Nutritional Therapy Practitioner",
            bio: "Specialized in using nutritional approaches to support mental health and well-being.",
            avatar: "uploads/therapists/sarah_johnson.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 10
    },
    {
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567891",
        yearsOfExperience: 7,
        specialization: "adolescent therapy",
        licenseNo: 123457,
        profile: {
            education: "MSW, Columbia University School of Social Work",
            certification: "Licensed Clinical Social Worker (LCSW), Adolescent Therapy Specialist",
            bio: "Expert in working with teenagers and young adults using evidence-based approaches.",
            avatar: "uploads/therapists/michael_chen.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Emily",
        lastName: "Rodriguez",
        email: "emily.rodriguez@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567892",
        yearsOfExperience: 8,
        specialization: "marriage and family therapy",
        licenseNo: 123458,
        profile: {
            education: "MA in Marriage and Family Therapy, Northwestern University",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Specializes in family dynamics, couples counseling, and relationship issues.",
            avatar: "uploads/therapists/emily_rodriguez.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    }
];

// Example usage in your tests or seed scripts:
/*
const therapist = require('./model/therapistSchema');

// IMPORTANT: Always use .create() instead of .insertMany() to ensure password hashing
// To create a single therapist:
const newTherapist = await therapist.create(simpleTherapistData[0]);

// To create multiple therapists (RECOMMENDED):
for (const therapistData of simpleTherapistData) {
    const newTherapist = await therapist.create(therapistData);
    console.log(`Created therapist: ${newTherapist.firstName} ${newTherapist.lastName}`);
}

// DON'T use insertMany() as it bypasses password hashing middleware:
// const therapists = await therapist.insertMany(simpleTherapistData); // ❌ This won't hash passwords
*/

module.exports = simpleTherapistData;