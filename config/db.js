const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Seeds the database if empty.
 */
const seedUsers = async () => {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            console.log("No users found in database. Seeding default admin and demo users...");
            const salt = await bcrypt.genSalt(10);
            
            // Seed Admin
            const adminPassword = await bcrypt.hash('admin123', salt);
            const admin = new User({
                name: 'System Admin',
                email: 'admin@lifeflow.com',
                password: adminPassword,
                age: 30,
                gender: 'male',
                bloodGroup: 'O+',
                phone: '1234567890',
                location: 'New York',
                address: 'LifeFlow Headquarters',
                status: 'live',
                role: 'admin',
                lastDonationDate: null
            });
            await admin.save();

            // Seed Demo Users
            const demoUsers = [
                {
                    name: 'Rajesh Deshmukh',
                    email: 'rajesh@example.com',
                    password: 'user123',
                    age: 34,
                    gender: 'male',
                    bloodGroup: 'O+',
                    phone: '9876543210',
                    location: 'pune',
                    address: 'FC Road, Pune',
                    status: 'live',
                    role: 'user',
                    lastDonationDate: null
                },
                {
                    name: 'Anjali Kulkarni',
                    email: 'anjali@example.com',
                    password: 'user123',
                    age: 28,
                    gender: 'female',
                    bloodGroup: 'A+',
                    phone: '9988776655',
                    location: 'Mumbai',
                    address: 'Dadar, Mumbai',
                    status: 'live',
                    role: 'user',
                    lastDonationDate: null
                },
                {
                    name: 'Sameer Patil',
                    email: 'sameer@example.com',
                    password: 'user123',
                    age: 40,
                    gender: 'male',
                    bloodGroup: 'B+',
                    phone: '9123456789',
                    location: 'Nashik',
                    address: 'College Road, Nashik',
                    status: 'donated',
                    role: 'user',
                    lastDonationDate: null
                },
                {
                    name: 'Priyanka Jadhav',
                    email: 'priyanka@example.com',
                    password: 'user123',
                    age: 26,
                    gender: 'female',
                    bloodGroup: 'AB+',
                    phone: '9822334455',
                    location: 'Nagpur',
                    address: 'Civil Lines, Nagpur',
                    status: 'live',
                    role: 'user',
                    lastDonationDate: null
                },
                {
                    name: 'Vikram Gaikwad',
                    email: 'vikram@example.com',
                    password: 'user123',
                    age: 35,
                    gender: 'male',
                    bloodGroup: 'O-',
                    phone: '9977886655',
                    location: 'Satara',
                    address: 'Rajwada, Satara',
                    status: 'not-willing',
                    role: 'user',
                    lastDonationDate: null
                },
                {
                    name: 'Snehal Pawar',
                    email: 'snehal@example.com',
                    password: 'user123',
                    age: 31,
                    gender: 'female',
                    bloodGroup: 'B-',
                    phone: '9765432100',
                    location: 'Aurangabad',
                    address: 'CIDCO, Aurangabad',
                    status: 'live',
                    role: 'user',
                    lastDonationDate: null
                }
            ];

            for (const u of demoUsers) {
                const hashedPassword = await bcrypt.hash(u.password, salt);
                const newUser = new User({
                    ...u,
                    password: hashedPassword
                });
                await newUser.save();
            }
            console.log("Database seeded successfully with admin and demo users!");
        } else {
            console.log(`Database already has ${count} users. Skipping seeding.`);
        }
    } catch (err) {
        console.error("Error seeding users:", err.message);
    }
};

/**
 * Establishes a connection to MongoDB using the URI specified in env variables.
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bloodDonorDB", {
            dbName: "bloodDonorDB"
        });
        console.log(`Database Connected: ${conn.connection.host}`);
        await seedUsers();
    } catch (error) {
        console.error(`Database Connection Failed: ${error.message}`);
        // Exit process with failure code
        process.exit(1);
    }
};

module.exports = connectDB;
