const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const therapist = require('./model/therapistSchema');

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

// Dummy therapist data with Nigerian names (different from client names)
const dummyTherapists = [
    {
        firstName: "Olumide",
        lastName: "Adebayo",
        email: "olumide.adebayo@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345678",
        yearsOfExperience: 3,
        specialization: "nutritional therapy",
        licenseNo: 123456,
        profile: {
            education: "MS in Nutritional Therapy, University of Lagos",
            certification: "Licensed Nutritional Therapist (LNT), Certified Nutritional Therapy Practitioner",
            bio: "Specialized in using nutritional approaches to support mental health and well-being. Passionate about helping clients develop healthy eating habits rooted in Nigerian dietary traditions.",
            avatar: "uploads/therapists/olumide_adebayo.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 10
    },
    {
        firstName: "Ifeoma",
        lastName: "Nwosu",
        email: "ifeoma.nwosu@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345679",
        yearsOfExperience: 7,
        specialization: "adolescent therapy",
        licenseNo: 123457,
        profile: {
            education: "MSW, University of Nigeria, Nsukka",
            certification: "Licensed Clinical Social Worker (LCSW), Adolescent Therapy Specialist",
            bio: "Expert in working with teenagers and young adults. Uses evidence-based approaches to help adolescents navigate challenges and develop coping skills.",
            avatar: "uploads/therapists/ifeoma_nwosu.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Bukola",
        lastName: "Adeleke",
        email: "bukola.adeleke@therapy.com",
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
            avatar: "uploads/therapists/bukola_adeleke.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    },
    {
        firstName: "Obinna",
        lastName: "Okonkwo",
        email: "obinna.okonkwo@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345681",
        yearsOfExperience: 12,
        specialization: "cognitive therapy",
        licenseNo: 123459,
        profile: {
            education: "PhD in Clinical Psychology, University of Ibadan",
            certification: "Licensed Clinical Psychologist (LCP), Cognitive Therapy Specialist",
            bio: "Dedicated to helping individuals overcome negative thought patterns and develop healthier cognitive approaches to life challenges.",
            avatar: "uploads/therapists/obinna_okonkwo.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 1,
        maxClients: 7
    },
    {
        firstName: "Adunni",
        lastName: "Oluwakemi",
        email: "adunni.oluwakemi@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345682",
        yearsOfExperience: 4,
        specialization: "adolescent therapy",
        licenseNo: 123460,
        profile: {
            education: "PsyD in Clinical Psychology, Ahmadu Bello University",
            certification: "Licensed Clinical Psychologist (LCP), Adolescent Therapy Certified",
            bio: "Specializes in working with teenagers dealing with anxiety, depression, and behavioral issues. Uses age-appropriate interventions.",
            avatar: "uploads/therapists/adunni_oluwakemi.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 5,
        maxClients: 10
    },
    {
        firstName: "Yusuf",
        lastName: "Abdullahi",
        email: "yusuf.abdullahi@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345683",
        yearsOfExperience: 9,
        specialization: "clinical psychology",
        licenseNo: 123461,
        profile: {
            education: "PhD in Clinical Psychology, Bayero University Kano",
            certification: "Licensed Clinical Psychologist (LCP), Clinical Psychology Specialist",
            bio: "Compassionate therapist specializing in comprehensive psychological assessment and treatment. Helps clients navigate through various mental health challenges.",
            avatar: "uploads/therapists/yusuf_abdullahi.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 5
    },
    {
        firstName: "Ngozi",
        lastName: "Eze",
        email: "ngozi.eze@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345684",
        yearsOfExperience: 6,
        specialization: "nutritional therapy",
        licenseNo: 123462,
        profile: {
            education: "MSW, University of Port Harcourt",
            certification: "Licensed Clinical Social Worker (LCSW), Nutritional Therapy Specialist",
            bio: "Specializes in integrating nutritional approaches with traditional therapy to support mental health and overall well-being.",
            avatar: "uploads/therapists/ngozi_eze.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    },
    {
        firstName: "Babatunde",
        lastName: "Ogunleye",
        email: "babatunde.ogunleye@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345685",
        yearsOfExperience: 11,
        specialization: "marriage and family therapy",
        licenseNo: 123463,
        profile: {
            education: "PhD in Marriage and Family Therapy, University of Lagos",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Expert in family dynamics and relationship issues. Helps families and couples develop healthier communication patterns and resolve conflicts.",
            avatar: "uploads/therapists/babatunde_ogunleye.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Chinwe",
        lastName: "Okafor",
        email: "chinwe.okafor@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345686",
        yearsOfExperience: 2,
        specialization: "cognitive therapy",
        licenseNo: 123464,
        profile: {
            education: "MA in Counseling Psychology, University of Nigeria",
            certification: "Licensed Professional Counselor (LPC), Cognitive Therapy Certified",
            bio: "Integrates cognitive-behavioral approaches to help clients manage stress, anxiety, and develop healthier thinking patterns.",
            avatar: "uploads/therapists/chinwe_okafor.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 1,
        maxClients: 10
    },
    {
        firstName: "Gabriel",
        lastName: "Okafor",
        email: "gabriel.okafor@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345687",
        yearsOfExperience: 10,
        specialization: "career and life coaching",
        licenseNo: 123465,
        profile: {
            education: "PhD in Counseling Psychology, Covenant University",
            certification: "Licensed Professional Counselor (LPC), Life Coach Certified",
            bio: "Specializes in career transitions and life coaching using evidence-based approaches. Helps clients achieve personal and professional goals.",
            avatar: "uploads/therapists/gabriel_okafor.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 5
    },
    {
        firstName: "Grace",
        lastName: "Okonkwo",
        email: "grace.okonkwo@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345688",
        yearsOfExperience: 1,
        specialization: "adolescent therapy",
        licenseNo: 123466,
        profile: {
            education: "MSW, University of Benin",
            certification: "Licensed Clinical Social Worker (LCSW), Adolescent Therapy Specialist",
            bio: "Focuses on working with teenagers and young adults. Uses evidence-based approaches to help adolescents develop coping skills and resilience.",
            avatar: "uploads/therapists/grace_okonkwo.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 0,
        maxClients: 10
    },
    {
        firstName: "Kunle",
        lastName: "Adeyemi",
        email: "kunle.adeyemi@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345689",
        yearsOfExperience: 8,
        specialization: "nutritional therapy",
        licenseNo: 123467,
        profile: {
            education: "PhD in Nutritional Psychology, University of Ibadan",
            certification: "Licensed Clinical Psychologist (LCP), Nutritional Therapy Specialist",
            bio: "Specializes in the intersection of nutrition and mental health. Uses nutritional approaches to support psychological well-being.",
            avatar: "uploads/therapists/kunle_adeyemi.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 7
    },
    {
        firstName: "Adaora",
        lastName: "Nwankwo",
        email: "adaora.nwankwo@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345690",
        yearsOfExperience: 7,
        specialization: "marriage and family therapy",
        licenseNo: 123468,
        profile: {
            education: "MA in Marriage and Family Therapy, Nnamdi Azikiwe University",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Provides comprehensive family and couples therapy. Specializes in relationship issues, communication problems, and family dynamics.",
            avatar: "uploads/therapists/adaora_nwankwo.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Femi",
        lastName: "Akinwunmi",
        email: "femi.akinwunmi@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345691",
        yearsOfExperience: 14,
        specialization: "career and life coaching",
        licenseNo: 123469,
        profile: {
            education: "PhD in Counseling Psychology, University of Lagos",
            certification: "Licensed Professional Counselor (LPC), Career Development Facilitator",
            bio: "Helps clients navigate career transitions, job stress, and workplace issues. Specializes in career assessment and professional development.",
            avatar: "uploads/therapists/femi_akinwunmi.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 1,
        maxClients: 5
    },
    {
        firstName: "Zainab",
        lastName: "Mohammed",
        email: "zainab.mohammed@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345692",
        yearsOfExperience: 5,
        specialization: "cognitive therapy",
        licenseNo: 123470,
        profile: {
            education: "MA in Clinical Psychology, Lagos State University",
            certification: "Licensed Professional Counselor (LPC), Cognitive Therapy Specialist",
            bio: "Uses cognitive-behavioral approaches to help clients identify and change negative thought patterns and behaviors.",
            avatar: "uploads/therapists/zainab_mohammed.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    },
    {
        firstName: "Samuel",
        lastName: "Adebayo",
        email: "samuel.adebayo@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345693",
        yearsOfExperience: 16,
        specialization: "clinical psychology",
        licenseNo: 123471,
        profile: {
            education: "PhD in Clinical Psychology, University of Nigeria",
            certification: "Licensed Clinical Psychologist (LCP), Clinical Psychology Specialist",
            bio: "Specializes in comprehensive psychological assessment and treatment for various mental health conditions across the lifespan.",
            avatar: "uploads/therapists/samuel_adebayo.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 5
    },
    {
        firstName: "Patience",
        lastName: "Nwosu",
        email: "patience.nwosu@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345694",
        yearsOfExperience: 4,
        specialization: "adolescent therapy",
        licenseNo: 123472,
        profile: {
            education: "MSW, University of Calabar",
            certification: "Licensed Clinical Social Worker (LCSW), Adolescent Therapy Specialist",
            bio: "Specializes in working with teenagers and young adults. Uses evidence-based approaches to help adolescents develop healthy coping strategies.",
            avatar: "uploads/therapists/patience_nwosu.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 5,
        maxClients: 10
    },
    {
        firstName: "Joshua",
        lastName: "Okafor",
        email: "joshua.okafor@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345695",
        yearsOfExperience: 11,
        specialization: "career and life coaching",
        licenseNo: 123473,
        profile: {
            education: "PhD in Counseling Psychology, University of Ibadan",
            certification: "Licensed Professional Counselor (LPC), Life Coach Certified",
            bio: "Works with individuals to improve life satisfaction, career development, and personal growth. Uses evidence-based coaching approaches.",
            avatar: "uploads/therapists/joshua_okafor.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 5
    },
    {
        firstName: "Mercy",
        lastName: "Eze",
        email: "mercy.eze@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+2348012345696",
        yearsOfExperience: 6,
        specialization: "nutritional therapy",
        licenseNo: 123474,
        profile: {
            education: "MA in Nutritional Psychology, University of Lagos",
            certification: "Licensed Professional Counselor (LPC), Nutritional Therapy Specialist",
            bio: "Integrates nutritional approaches with traditional therapy to support mental health and overall well-being.",
            avatar: "uploads/therapists/mercy_eze.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Peter",
        lastName: "Adebayo",
        email: "peter.adebayo@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+2348012345697",
        yearsOfExperience: 12,
        specialization: "marriage and family therapy",
        licenseNo: 123475,
        profile: {
            education: "PhD in Marriage and Family Therapy, Obafemi Awolowo University",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Facilitates family and couples therapy sessions. Specializes in relationship issues, communication problems, and family dynamics.",
            avatar: "uploads/therapists/peter_adebayo.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    }
];

// Function to seed the database
const seedDatabase = async () => {
    try {
        // Clear existing therapists (optional - remove if you want to keep existing data)
        await therapist.deleteMany({});
        console.log('Cleared existing therapist data');

        // Create therapists one by one to ensure password hashing
        const createdTherapists = [];
        for (const therapistData of dummyTherapists) {
            const newTherapist = await therapist.create(therapistData);
            createdTherapists.push(newTherapist);
            console.log(`Created therapist: ${newTherapist.firstName} ${newTherapist.lastName}`);
        }
        console.log(`Successfully created ${createdTherapists.length} therapist records with properly hashed passwords`);

        // Display summary
        console.log('\n=== THERAPIST DATA SUMMARY ===');
        createdTherapists.forEach((therapist, index) => {
            console.log(`${index + 1}. ${therapist.firstName} ${therapist.lastName}`);
            console.log(`   Email: ${therapist.email}`);
            console.log(`   Specialization: ${therapist.specialization}`);
            console.log(`   Experience: ${therapist.yearsOfExperience} years`);
            console.log(`   Status: ${therapist.status}`);
            console.log(`   Clients: ${therapist.currentClients}/${therapist.maxClients}`);
            console.log('---');
        });

        console.log('\n=== SPECIALIZATION BREAKDOWN ===');
        const specializations = {};
        createdTherapists.forEach(therapist => {
            specializations[therapist.specialization] = (specializations[therapist.specialization] || 0) + 1;
        });
        Object.entries(specializations).forEach(([spec, count]) => {
            console.log(`${spec}: ${count} therapist(s)`);
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

module.exports = { dummyTherapists, seedDatabase, connectDB };