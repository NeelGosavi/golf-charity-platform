const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Charity = require('./models/Charity');
const User = require('./models/User');
require('dotenv').config();

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Clear existing data
        await Charity.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data\n');

        // Create charities
        const charities = await Charity.insertMany([
            {
                name: 'Golf For Good',
                description: 'Supporting youth golf programs in underserved communities',
                is_featured: true
            },
            {
                name: 'Green Earth Initiative',
                description: 'Environmental conservation in golf courses',
                is_featured: false
            },
            {
                name: 'Health Through Golf',
                description: 'Promoting physical and mental health through golf',
                is_featured: true
            },
            {
                name: 'Women in Golf',
                description: 'Empowering women to take up golf as a sport and career',
                is_featured: true
            },
            {
                name: 'Junior Golf Academy',
                description: 'Developing young golf talent from underprivileged backgrounds',
                is_featured: false
            }
        ]);
        
        console.log(`✅ Created ${charities.length} charities`);

        // Create admin user (password: admin123)
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            email: 'admin@example.com',
            password_hash: hashedPassword,
            full_name: 'Admin User',
            is_admin: true,
            charity_id: charities[0]._id,
            charity_percentage: 10
        });
        
        console.log(`✅ Created admin user: admin@example.com / admin123`);

        console.log('\n🎉 Seed data created successfully!');
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error seeding data:', error);
        await mongoose.disconnect();
    }
}

seedData();