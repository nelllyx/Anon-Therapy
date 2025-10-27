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

// Dummy therapist data
const dummyTherapists = [
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
            bio: "Specialized in using nutritional approaches to support mental health and well-being. Passionate about helping clients develop healthy eating habits.",
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
            bio: "Expert in working with teenagers and young adults. Uses evidence-based approaches to help adolescents navigate challenges and develop coping skills.",
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
            bio: "Specializes in family dynamics, couples counseling, and relationship issues. Fluent in Spanish and English.",
            avatar: "uploads/therapists/emily_rodriguez.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    },
    {
        firstName: "David",
        lastName: "Thompson",
        email: "david.thompson@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567893",
        yearsOfExperience: 12,
        specialization: "cognitive therapy",
        licenseNo: 123459,
        profile: {
            education: "PhD in Clinical Psychology, University of California",
            certification: "Licensed Clinical Psychologist (LCP), Cognitive Therapy Specialist",
            bio: "Dedicated to helping individuals overcome negative thought patterns and develop healthier cognitive approaches to life challenges.",
            avatar: "uploads/therapists/david_thompson.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 1,
        maxClients: 7
    },
    {
        firstName: "Lisa",
        lastName: "Williams",
        email: "lisa.williams@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567894",
        yearsOfExperience: 4,
        specialization: "adolescent therapy",
        licenseNo: 123460,
        profile: {
            education: "PsyD in Clinical Psychology, University of Pennsylvania",
            certification: "Licensed Clinical Psychologist (LCP), Adolescent Therapy Certified",
            bio: "Specializes in working with teenagers dealing with anxiety, depression, and behavioral issues. Uses age-appropriate interventions.",
            avatar: "uploads/therapists/lisa_williams.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 5,
        maxClients: 10
    },
    {
        firstName: "James",
        lastName: "Anderson",
        email: "james.anderson@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567895",
        yearsOfExperience: 9,
        specialization: "clinical psychology",
        licenseNo: 123461,
        profile: {
            education: "PhD in Clinical Psychology, University of Texas",
            certification: "Licensed Clinical Psychologist (LCP), Clinical Psychology Specialist",
            bio: "Compassionate therapist specializing in comprehensive psychological assessment and treatment. Helps clients navigate through various mental health challenges.",
            avatar: "uploads/therapists/james_anderson.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 5
    },
    {
        firstName: "Maria",
        lastName: "Garcia",
        email: "maria.garcia@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567896",
        yearsOfExperience: 6,
        specialization: "nutritional therapy",
        licenseNo: 123462,
        profile: {
            education: "MSW, University of Chicago",
            certification: "Licensed Clinical Social Worker (LCSW), Nutritional Therapy Specialist",
            bio: "Specializes in integrating nutritional approaches with traditional therapy to support mental health and overall well-being.",
            avatar: "uploads/therapists/maria_garcia.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    },
    {
        firstName: "Robert",
        lastName: "Brown",
        email: "robert.brown@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567897",
        yearsOfExperience: 11,
        specialization: "marriage and family therapy",
        licenseNo: 123463,
        profile: {
            education: "PhD in Marriage and Family Therapy, University of Michigan",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Expert in family dynamics and relationship issues. Helps families and couples develop healthier communication patterns and resolve conflicts.",
            avatar: "uploads/therapists/robert_brown.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Jennifer",
        lastName: "Davis",
        email: "jennifer.davis@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567898",
        yearsOfExperience: 2,
        specialization: "cognitive therapy",
        licenseNo: 123464,
        profile: {
            education: "MA in Counseling Psychology, University of California",
            certification: "Licensed Professional Counselor (LPC), Cognitive Therapy Certified",
            bio: "Integrates cognitive-behavioral approaches to help clients manage stress, anxiety, and develop healthier thinking patterns.",
            avatar: "uploads/therapists/jennifer_davis.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 1,
        maxClients: 10
    },
    {
        firstName: "Christopher",
        lastName: "Wilson",
        email: "christopher.wilson@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567899",
        yearsOfExperience: 10,
        specialization: "career and life coaching",
        licenseNo: 123465,
        profile: {
            education: "PhD in Counseling Psychology, University of Southern California",
            certification: "Licensed Professional Counselor (LPC), Life Coach Certified",
            bio: "Specializes in career transitions and life coaching using evidence-based approaches. Helps clients achieve personal and professional goals.",
            avatar: "uploads/therapists/christopher_wilson.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 5
    },
    {
        firstName: "Amanda",
        lastName: "Taylor",
        email: "amanda.taylor@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567800",
        yearsOfExperience: 1,
        specialization: "adolescent therapy",
        licenseNo: 123466,
        profile: {
            education: "MSW, Boston University",
            certification: "Licensed Clinical Social Worker (LCSW), Adolescent Therapy Specialist",
            bio: "Focuses on working with teenagers and young adults. Uses evidence-based approaches to help adolescents develop coping skills and resilience.",
            avatar: "uploads/therapists/amanda_taylor.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 0,
        maxClients: 10
    },
    {
        firstName: "Kevin",
        lastName: "Martinez",
        email: "kevin.martinez@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567801",
        yearsOfExperience: 8,
        specialization: "nutritional therapy",
        licenseNo: 123467,
        profile: {
            education: "PhD in Nutritional Psychology, University of Washington",
            certification: "Licensed Clinical Psychologist (LCP), Nutritional Therapy Specialist",
            bio: "Specializes in the intersection of nutrition and mental health. Uses nutritional approaches to support psychological well-being.",
            avatar: "uploads/therapists/kevin_martinez.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 7
    },
    {
        firstName: "Rachel",
        lastName: "Lee",
        email: "rachel.lee@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567802",
        yearsOfExperience: 7,
        specialization: "marriage and family therapy",
        licenseNo: 123468,
        profile: {
            education: "MA in Marriage and Family Therapy, San Francisco State University",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Provides comprehensive family and couples therapy. Specializes in relationship issues, communication problems, and family dynamics.",
            avatar: "uploads/therapists/rachel_lee.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Daniel",
        lastName: "White",
        email: "daniel.white@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567803",
        yearsOfExperience: 14,
        specialization: "career and life coaching",
        licenseNo: 123469,
        profile: {
            education: "PhD in Counseling Psychology, University of Illinois",
            certification: "Licensed Professional Counselor (LPC), Career Development Facilitator",
            bio: "Helps clients navigate career transitions, job stress, and workplace issues. Specializes in career assessment and professional development.",
            avatar: "uploads/therapists/daniel_white.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 1,
        maxClients: 5
    },
    {
        firstName: "Stephanie",
        lastName: "Clark",
        email: "stephanie.clark@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567804",
        yearsOfExperience: 5,
        specialization: "cognitive therapy",
        licenseNo: 123470,
        profile: {
            education: "MA in Clinical Psychology, Pratt Institute",
            certification: "Licensed Professional Counselor (LPC), Cognitive Therapy Specialist",
            bio: "Uses cognitive-behavioral approaches to help clients identify and change negative thought patterns and behaviors.",
            avatar: "uploads/therapists/stephanie_clark.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 3,
        maxClients: 7
    },
    {
        firstName: "Mark",
        lastName: "Lewis",
        email: "mark.lewis@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567805",
        yearsOfExperience: 16,
        specialization: "clinical psychology",
        licenseNo: 123471,
        profile: {
            education: "PhD in Clinical Psychology, University of North Carolina",
            certification: "Licensed Clinical Psychologist (LCP), Clinical Psychology Specialist",
            bio: "Specializes in comprehensive psychological assessment and treatment for various mental health conditions across the lifespan.",
            avatar: "uploads/therapists/mark_lewis.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 5
    },
    {
        firstName: "Nicole",
        lastName: "Hall",
        email: "nicole.hall@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567806",
        yearsOfExperience: 4,
        specialization: "adolescent therapy",
        licenseNo: 123472,
        profile: {
            education: "MSW, University of Maryland",
            certification: "Licensed Clinical Social Worker (LCSW), Adolescent Therapy Specialist",
            bio: "Specializes in working with teenagers and young adults. Uses evidence-based approaches to help adolescents develop healthy coping strategies.",
            avatar: "uploads/therapists/nicole_hall.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 5,
        maxClients: 10
    },
    {
        firstName: "Thomas",
        lastName: "Young",
        email: "thomas.young@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567807",
        yearsOfExperience: 11,
        specialization: "career and life coaching",
        licenseNo: 123473,
        profile: {
            education: "PhD in Counseling Psychology, University of Florida",
            certification: "Licensed Professional Counselor (LPC), Life Coach Certified",
            bio: "Works with individuals to improve life satisfaction, career development, and personal growth. Uses evidence-based coaching approaches.",
            avatar: "uploads/therapists/thomas_young.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 2,
        maxClients: 5
    },
    {
        firstName: "Jessica",
        lastName: "King",
        email: "jessica.king@therapy.com",
        password: "password123",
        gender: "female",
        phoneNumber: "+1234567808",
        yearsOfExperience: 6,
        specialization: "nutritional therapy",
        licenseNo: 123474,
        profile: {
            education: "MA in Nutritional Psychology, University of California",
            certification: "Licensed Professional Counselor (LPC), Nutritional Therapy Specialist",
            bio: "Integrates nutritional approaches with traditional therapy to support mental health and overall well-being.",
            avatar: "uploads/therapists/jessica_king.jpg"
        },
        status: "active",
        isVerified: true,
        currentClients: 4,
        maxClients: 7
    },
    {
        firstName: "Andrew",
        lastName: "Wright",
        email: "andrew.wright@therapy.com",
        password: "password123",
        gender: "male",
        phoneNumber: "+1234567809",
        yearsOfExperience: 12,
        specialization: "marriage and family therapy",
        licenseNo: 123475,
        profile: {
            education: "PhD in Marriage and Family Therapy, University of Wisconsin",
            certification: "Licensed Marriage and Family Therapist (LMFT)",
            bio: "Facilitates family and couples therapy sessions. Specializes in relationship issues, communication problems, and family dynamics.",
            avatar: "uploads/therapists/andrew_wright.jpg"
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