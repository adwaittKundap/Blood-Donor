const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Helper to map Mongoose User model to frontend representation
const mapUser = (user) => ({
    id: user._id.toString(),
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
    lastDonationDate: user.lastDonationDate,
    createdAt: user.createdAt
});

/**
 * @route   GET /api/users
 * @desc    Get all users (excluding admin)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } });
        const mappedUsers = users.map(mapUser);
        res.json({
            success: true,
            data: mappedUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user list'
        });
    }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: mapUser(user)
        });
    } catch (error) {
        console.error('Error fetching user by ID:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user details'
        });
    }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user's details or status
 * @access  Public
 */
router.put('/:id', async (req, res) => {
    try {
        const { fullName, name, bloodGroup, status, location, phone, lastDonationDate, address } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Apply updates from request body (supporting both backend "name" and frontend "fullName" keys)
        if (fullName !== undefined) user.name = fullName;
        if (name !== undefined) user.name = name;
        if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
        if (status !== undefined) user.status = status;
        if (location !== undefined) user.location = location;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (lastDonationDate !== undefined) user.lastDonationDate = lastDonationDate;

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            data: mapUser(user)
        });
    } catch (error) {
        console.error('Error updating user:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error updating user details'
        });
    }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user by ID
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error deleting user'
        });
    }
});

module.exports = router;
