// Simple therapist dummy data for quick testing
// This file contains just a few therapist objects that you can use directly in your tests

const simpleTherapistData = [
    {
        firstName: "Adebayo",
        lastName: "Oluwaseun",
        email: "adebayo.oluwaseun@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345678",
        yearsOfExperience: 3,
        specialization: "nutritional therapy",
        licenseNo: 123456,
        profile: {
            education: "MS in Nutritional Therapy, University of Lagos",
            certification: "Licensed Nutritional Therapist (LNT), Certified Nutritional Therapy Practitioner",
            bio: "Specialized in using nutritional approaches to support mental health and well-being rooted in Nigerian dietary traditions.",
            avatar: "uploads/therapists/adebayo_oluwaseun.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 10
    },
    {
        firstName: "Chioma",
        lastName: "Nkemka",
        email: "chioma.nkemka@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345679",
        yearsOfExperience: 7,
        specialization: "adolescent therapy",
        licenseNo: 123457,
        profile: {
            education: "MSW, University of Nigeria, Nsukka",
            certification: "Licensed Clinical Social Worker (LCSW), Adolescent Therapy Specialist",
            bio: "Expert in working with teenagers and young adults using evidence-based approaches.",
            avatar: "uploads/therapists/chioma_nkemka.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Folake",
        lastName: "Adebisi",
        email: "folake.adebisi@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345680",
        yearsOfExperience: 8,
        specialization: "marriage and family therapy",
        licenseNo: 123458,
        profile: {
            education: "MA in Marriage and Family Therapy, Obafemi Awolowo University",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Specializes in family dynamics, couples counseling, and relationship issues. Fluent in Yoruba, Igbo, and English.",
            avatar: "uploads/therapists/folake_adebisi.jpg"
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

// To create a single therapist:
const newTherapist = await therapist.create(simpleTherapistData[0]);

// To create multiple therapists:
const therapists = await therapist.insertMany(simpleTherapistData);

// To create therapists one by one:
for (const therapistData of simpleTherapistData) {
    const newTherapist = await therapist.create(therapistData);
    console.log(`Created therapist: ${newTherapist.firstName} ${newTherapist.lastName}`);
}
*/

module.exports = simpleTherapistData;