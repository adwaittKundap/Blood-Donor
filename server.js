const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables from .env
dotenv.config();

// Establish connection to MongoDB
connectDB();

const app = express();

// Body Parser Middleware to parse JSON payloads
app.use(express.json());

// Set up API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '.')));

// Fallback to index.html for undefined requests
app.get('*', (req, res, next) => {
    // Let api requests pass through or throw 404
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configure Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running in development mode on port ${PORT}`);
});
