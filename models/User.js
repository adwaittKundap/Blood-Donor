const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    age: {
        type: Number,
        required: [true, 'Please add an age']
    },
    bloodGroup: {
        type: String,
        required: [true, 'Please add a blood group']
    },
    gender: {
        type: String,
        required: [true, 'Please add a gender']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    address: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['live', 'donated', 'not-willing'],
        default: 'live'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    lastDonationDate: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
