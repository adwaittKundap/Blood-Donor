/**
 * LifeFlow - Authentication Utilities
 * Common functions for authentication and user management
 */

const APP_VERSION = '1.6'; // Change this to '1.2', '1.3' etc. whenever you update data

function checkVersion() {
    const storedVersion = localStorage.getItem('appVersion');

    if (storedVersion !== APP_VERSION) {
        console.log("New version detected. Clearing old cache...");
        localStorage.clear(); // Wipes everything
        localStorage.setItem('appVersion', APP_VERSION); // Sets the new version
        return true;
    }
    return false;
}

// Generate unique ID (fallback for client-side items if needed)
function generateId() {
    return 'donor-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Get all donors (async)
async function getDonors() {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching donors:', error);
        return [];
    }
}

// Get current logged in user
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// Check if user is logged in
function isLoggedIn() {
    return sessionStorage.getItem('currentUserId') !== null;
}

// Check if current user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Login user (async)
async function loginUser(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.success) {
            sessionStorage.setItem('currentUserId', result.data.id);
            sessionStorage.setItem('currentUser', JSON.stringify(result.data));
            return { success: true, user: result.data };
        }
        return { success: false, message: result.message || 'Invalid email or password' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Server error during login' };
    }
}

// Logout user
function logoutUser() {
    sessionStorage.removeItem('currentUserId');
    sessionStorage.removeItem('currentUser');
}

// Register new donor (async)
async function registerDonor(donorData) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(donorData)
        });
        const result = await response.json();
        if (result.success) {
            sessionStorage.setItem('currentUserId', result.data.id);
            sessionStorage.setItem('currentUser', JSON.stringify(result.data));
            return { success: true, user: result.data };
        }
        return { success: false, message: result.message || 'Registration failed' };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Server error during registration' };
    }
}

// Update donor (async)
async function updateDonor(id, updates) {
    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        if (result.success) {
            const currentUser = getCurrentUser();
            if (currentUser && (currentUser.id === id || currentUser._id === id)) {
                sessionStorage.setItem('currentUser', JSON.stringify(result.data));
            }
            return { success: true, donor: result.data };
        }
        return { success: false, message: result.message || 'Update failed' };
    } catch (error) {
        console.error('Update error:', error);
        return { success: false, message: 'Server error during update' };
    }
}

// Delete donor (async)
async function deleteDonor(id) {
    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            return { success: true };
        }
        return { success: false, message: result.message || 'Deletion failed' };
    } catch (error) {
        console.error('Deletion error:', error);
        return { success: false, message: 'Server error during deletion' };
    }
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = field.nextElementSibling.querySelector('i');

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');

    // Set icon based on type
    icon.className = 'toast-icon fas';
    if (type === 'success') {
        icon.classList.add('fa-check-circle');
        toast.className = 'toast success';
    } else if (type === 'error') {
        icon.classList.add('fa-exclamation-circle');
        toast.className = 'toast error';
    } else if (type === 'warning') {
        icon.classList.add('fa-exclamation-triangle');
        toast.className = 'toast warning';
    }

    messageEl.textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Open modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
});

// Get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        'live': 'Available',
        'donated': 'Recently Donated',
        'not-willing': 'Not Available'
    };
    return labels[status] || status;
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        'live': 'fa-check-circle',
        'donated': 'fa-clock',
        'not-willing': 'fa-times-circle'
    };
    return icons[status] || 'fa-question-circle';
}
