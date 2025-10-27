# Therapist Dummy Data for Testing

This directory contains dummy data for populating the therapist schema to aid in testing your Anon-Therapy application.

## Files Created

### 1. `seedTherapistData.js`
A comprehensive seed script that includes:
- 20 diverse therapist profiles with different specializations
- Complete schema validation compliance
- Realistic data including education, certifications, and bios
- Various experience levels (4-16 years)
- Different client loads and capacities
- All required fields populated

### 2. `simpleTherapistData.js`
A simplified version with just 3 therapist profiles for quick testing:
- Minimal but complete data
- Easy to use in unit tests
- Can be imported directly into test files

## How to Use

### Option 1: Run the Full Seed Script
```bash
# Make sure your MongoDB is running
node seedTherapistData.js
```

This will:
- Clear existing therapist data (optional)
- Create 20 therapist records with properly hashed passwords
- Display a summary of created therapists
- Show specialization breakdown

**Note**: The script now uses `.create()` instead of `.insertMany()` to ensure passwords are properly hashed by the schema middleware.

### Option 2: Use in Your Tests
```javascript
const simpleTherapistData = require('./simpleTherapistData');
const therapist = require('./model/therapistSchema');

// Create a single therapist
const newTherapist = await therapist.create(simpleTherapistData[0]);

// Create multiple therapists (RECOMMENDED)
for (const therapistData of simpleTherapistData) {
    const newTherapist = await therapist.create(therapistData);
    console.log(`Created therapist: ${newTherapist.firstName} ${newTherapist.lastName}`);
}

// DON'T use insertMany() as it bypasses password hashing
// const therapists = await therapist.insertMany(simpleTherapistData); // ❌ Won't hash passwords
```

### Option 3: Fix Existing Data
If you've already run the seed script with unhashed passwords, use this fix script:
```bash
node fixTherapistPasswords.js
```

### Option 4: Import Specific Data
```javascript
const { dummyTherapists } = require('./seedTherapistData');

// Use specific therapist data
const cbtTherapist = dummyTherapists.find(t => t.specialization === 'cognitive behavioral therapy');
```

## Data Characteristics

### Specializations Included
All specializations are from the `therapyTypes.js` configuration file:
- **Basic Plan**: nutritional therapy, adolescent therapy
- **Standard Plan**: marriage and family therapy, nutritional therapy, cognitive therapy, adolescent therapy
- **Premium Plan**: clinical psychology, marriage and family therapy, nutritional therapy, cognitive therapy, adolescent therapy, career and life coaching

### Profile Information
Each therapist includes:
- **Personal Info**: Name, email, phone, gender
- **Professional Info**: Specialization, years of experience, license number
- **Profile Details**: Education, certifications, bio, avatar path
- **Status**: Active/inactive, verification status
- **Client Management**: Current clients (0-5), maximum capacity based on years of experience

### Max Client Logic
Based on years of experience and specialization matching therapy types:
- **Basic Plan** (0-5 years): maxClients = 10
- **Standard Plan** (5-15 years): maxClients = 7  
- **Premium Plan** (6-30 years): maxClients = 5

### Validation Compliance
All data follows the schema requirements:
- ✅ Required fields populated
- ✅ Email format validation
- ✅ Gender enum values
- ✅ Phone number uniqueness
- ✅ License number uniqueness
- ✅ Experience years (max 2 digits)
- ✅ Specialization matches therapyTypes.js
- ✅ Status enum values
- ✅ Password minimum length (8 characters)
- ✅ Current clients between 0-5
- ✅ Max clients based on experience level

## Customization

You can easily modify the data by:
1. Editing the arrays in either file
2. Adding new specializations
3. Changing experience levels
4. Modifying client capacities
5. Updating profile information

## Database Connection

Make sure to update the MongoDB connection string in `seedTherapistData.js` if your database configuration is different:

```javascript
await mongoose.connect('mongodb://localhost:27017/anon-therapy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
```

## Notes

- All passwords are set to "password123" for testing purposes
- Email addresses are unique and follow a consistent pattern
- Phone numbers are unique and follow US format
- License numbers are sequential and unique
- Profile avatars point to placeholder image paths
- All therapists are set to "active" status and verified by default