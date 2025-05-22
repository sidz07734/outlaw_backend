const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/outlaw_survey_app');

// Users to seed
const users = [
  {
    name: 'sidz07734',
    email: 'siddharth07734@gmail.com',
    password: 'password07734'
  },
  {
    name: 'nitya164',
    email: 'nityareddy164@gmail.com',
    password: 'password164'
  }
];

// Seed function
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Create users (password will be hashed by the pre-save hook in User model)
    const createdUsers = [];
    
    for (let user of users) {
      const createdUser = await User.create({
        name: user.name,
        email: user.email,
        password: user.password
      });
      
      createdUsers.push(createdUser);
    }
    
    console.log('Users seeded successfully:');
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });
    
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding users:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedUsers();