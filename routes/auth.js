const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            age,
            gender,
            bloodGroup,
            phone,
            location,
            address,
            status,
            role
        } = req.body;

        // Basic validation
        if (!fullName || !email || !password || !age || !gender || !bloodGroup || !phone || !location) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user instance
        const user = new User({
            name: fullName,
            email: normalizedEmail,
            password: hashedPassword,
            age,
            gender,
            bloodGroup,
            phone,
            location,
            address: address || '',
            status: status || 'live',
            role: role || 'user',
            lastDonationDate: null
        });

        // Save user to MongoDB
        await user.save();

        // Return user data (excluding password)
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user._id,
                fullName: user.name,
                email: user.email,
                age: user.age,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                phone: user.phone,
                location: user.location,
                address: user.address,
                status: user.status,
                role: user.role,
                lastDonationDate: user.lastDonationDate
            }
        });
    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error occurred during registration'
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get user data
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please enter both email and password'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Return user data
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: user._id,
                fullName: user.name,
                email: user.email,
                age: user.age,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                phone: user.phone,
                location: user.location,
                address: user.address,
                status: user.status,
                role: user.role,
                lastDonationDate: user.lastDonationDate
            }
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error occurred during login'
        });
    }
});

/**
 * @route   GET /api/auth/check-email
 * @desc    Check if email already exists
 * @access  Public
 */
router.get('/check-email', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email query param required' });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        res.json({ success: true, exists: !!user });
    } catch (error) {
        console.error('Check Email Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
