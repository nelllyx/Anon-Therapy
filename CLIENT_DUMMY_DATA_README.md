# Client Dummy Data for Testing

This directory contains dummy data for populating the client schema to aid in testing your Anon-Therapy application.

## Files Created

### 1. `seedClientData.js`
A comprehensive seed script that includes:
- 20 diverse client profiles with authentic Nigerian names
- Complete schema validation compliance
- Realistic usernames and email addresses
- All required fields populated
- Proper password hashing using `.create()` method

### 2. `simpleClientData.js`
A simplified version with just 3 client profiles for quick testing:
- Minimal but complete data
- Easy to use in unit tests
- Can be imported directly into test files

### 3. `fixClientPasswords.js`
A utility script to fix password hashing issues in existing client data.

## How to Use

### Option 1: Run the Full Seed Script
```bash
# Make sure your MongoDB is running
node seedClientData.js
```

This will:
- Clear existing client data (optional)
- Create 20 client records with properly hashed passwords
- Display a summary of created clients
- Show gender breakdown

**Note**: The script uses `.create()` instead of `.insertMany()` to ensure passwords are properly hashed by the schema middleware.

### Option 2: Use in Your Tests
```javascript
const simpleClientData = require('./simpleClientData');
const Users = require('./model/userSchema');

// Create a single client
const newClient = await Users.create(simpleClientData[0]);

// Create multiple clients (RECOMMENDED)
for (const clientData of simpleClientData) {
    const newClient = await Users.create(clientData);
    console.log(`Created client: ${newClient.username}`);
}

// DON'T use insertMany() as it bypasses password hashing
// const clients = await Users.insertMany(simpleClientData); // ❌ Won't hash passwords
```

### Option 3: Fix Existing Data
If you've already run the seed script with unhashed passwords, use this fix script:
```bash
node fixClientPasswords.js
```

### Option 4: Import Specific Data
```javascript
const { dummyClients } = require('./seedClientData');

// Use specific client data
const maleClient = dummyClients.find(c => c.gender === 'male');
```

## Data Characteristics

### Nigerian Names Included
The clients feature authentic Nigerian names from various ethnic groups:
- **Yoruba Names**: Adebayo, Folake, Tunde, Segun, Kolawole, Adunni, etc.
- **Igbo Names**: Chioma, Chukwudi, Nkemka, Amara, Uchechi, Blessing, etc.
- **Hausa Names**: Ibrahim, Musa, etc.
- **Christian Names**: Emmanuel, Victor, Solomon, Daniel, Faith, Joy, Peace, etc.

### Profile Information
Each client includes:
- **Personal Info**: Username, email, gender
- **Authentication**: Password (properly hashed), verification status
- **Role**: Set to 'client' as per schema requirements

### Validation Compliance
All data follows the schema requirements:
- ✅ Required fields populated
- ✅ Email format validation
- ✅ Gender enum values ('male', 'female')
- ✅ Username uniqueness
- ✅ Email uniqueness
- ✅ Password minimum length (8 characters)
- ✅ Role set to 'client'
- ✅ All clients verified by default

### Gender Distribution
- **Male**: 10 clients
- **Female**: 10 clients
- **Total**: 20 clients

## Nigerian Cultural Context

The names chosen reflect Nigeria's diverse cultural heritage:

### Yoruba Names
- **Adebayo** - "The crown meets joy"
- **Folake** - "Wealth has been bestowed"
- **Tunde** - "Return"
- **Segun** - "Victory"
- **Adunni** - "Sweet to have"

### Igbo Names
- **Chioma** - "Good God"
- **Chukwudi** - "God exists"
- **Nkemka** - "My own"
- **Amara** - "Grace"
- **Uchechi** - "God's will"

### Meaningful Combinations
- **Blessing Chioma** - "Blessing Good God"
- **Peace Amaka** - "Peace Beauty"
- **Joy Udochukwu** - "Joy God's will"
- **Faith Oluwatoyin** - "Faith God is worthy to be praised"

## Customization

You can easily modify the data by:
1. Editing the arrays in either file
2. Adding more Nigerian names
3. Changing email domains
4. Modifying verification status
5. Updating usernames

## Database Connection

Make sure to update the MongoDB connection string in `seedClientData.js` if your database configuration is different:

```javascript
await mongoose.connect('mongodb://localhost:27017/anon-therapy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
```

## Notes

- All passwords are set to "password123" for testing purposes
- Email addresses use common Nigerian email providers (Gmail, Yahoo, Outlook)
- Usernames follow Nigerian naming conventions
- All clients are set to verified by default for easy testing
- The data respects Nigerian cultural naming traditions