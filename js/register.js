/**
 * LifeFlow - Registration Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');

    // Password strength indicator
    passwordInput.addEventListener('input', () => {
        const strength = checkPasswordStrength(passwordInput.value);
        const strengthEl = document.getElementById('passwordStrength');
        
        if (passwordInput.value.length === 0) {
            strengthEl.textContent = '';
            strengthEl.className = 'password-strength';
        } else {
            strengthEl.textContent = `Password strength: ${strength.label}`;
            strengthEl.className = `password-strength ${strength.class}`;
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        
        // Validate form
        const isValid = await validateForm();
        if (!isValid) {
            return;
        }

        // Collect form data
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            bloodGroup: document.getElementById('bloodGroup').value,
            phone: document.getElementById('phone').value.trim(),
            location: document.getElementById('location').value.trim(),
            address: document.getElementById('address').value.trim(),
            email: document.getElementById('email').value.trim().toLowerCase(),
            password: document.getElementById('password').value,
            status: document.querySelector('input[name="status"]:checked').value
        };

        // Register donor
        const result = await registerDonor(formData);

        if (result.success) {
            showToast('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showToast(result.message, 'error');
            if (result.message.includes('Email')) {
                showError('email', result.message);
            }
        }
    });

    // Real-time validation
    document.getElementById('email').addEventListener('blur', async () => {
        await validateEmail();
    });
    document.getElementById('confirmPassword').addEventListener('blur', validateConfirmPassword);
    document.getElementById('age').addEventListener('blur', validateAge);
    document.getElementById('phone').addEventListener('blur', validatePhone);
});

// Validate entire form
async function validateForm() {
    let isValid = true;

    // Full name
    const fullName = document.getElementById('fullName').value.trim();
    if (fullName.length < 3) {
        showError('fullName', 'Name must be at least 3 characters');
        isValid = false;
    }

    // Age
    if (!validateAge()) isValid = false;

    // Gender
    const gender = document.getElementById('gender').value;
    if (!gender) {
        showError('gender', 'Please select a gender');
        isValid = false;
    }

    // Blood group
    const bloodGroup = document.getElementById('bloodGroup').value;
    if (!bloodGroup) {
        showError('bloodGroup', 'Please select a blood group');
        isValid = false;
    }

    // Phone
    if (!validatePhone()) isValid = false;

    // Location
    const location = document.getElementById('location').value.trim();
    if (!location) {
        showError('location', 'Please enter your location');
        isValid = false;
    }

    // Email
    const isEmailValid = await validateEmail();
    if (!isEmailValid) isValid = false;

    // Password
    const password = document.getElementById('password').value;
    if (password.length < 6) {
        showError('password', 'Password must be at least 6 characters');
        isValid = false;
    }

    // Confirm password
    if (!validateConfirmPassword()) isValid = false;

    // Status
    const status = document.querySelector('input[name="status"]:checked');
    if (!status) {
        showError('status', 'Please select your donor status');
        isValid = false;
    }

    // Terms
    const terms = document.getElementById('terms').checked;
    if (!terms) {
        showError('terms', 'You must agree to the terms');
        isValid = false;
    }

    return isValid;
}

// Validate email
async function validateEmail() {
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        showError('email', 'Please enter a valid email address');
        return false;
    }
    
    // Check if email already exists
    try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (data.success && data.exists) {
            showError('email', 'This email is already registered');
            return false;
        }
    } catch (error) {
        console.error('Error validating email:', error);
    }
    
    return true;
}

// Validate confirm password
function validateConfirmPassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        return false;
    }
    
    return true;
}

// Validate age
function validateAge() {
    const age = parseInt(document.getElementById('age').value);
    
    if (isNaN(age) || age < 18 || age > 65) {
        showError('age', 'Age must be between 18 and 65');
        return false;
    }
    
    return true;
}

// Validate phone
function validatePhone() {
    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^[0-9]{10,15}$/;
    
    if (!phoneRegex.test(phone)) {
        showError('phone', 'Please enter a valid phone number (10-15 digits)');
        return false;
    }
    
    return true;
}

// Show error message
function showError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + 'Error');
    const inputEl = document.getElementById(fieldId);
    
    if (errorEl) {
        errorEl.textContent = message;
    }
    
    if (inputEl) {
        inputEl.classList.add('error');
    }
}

// Clear all errors
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    
    document.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
    });
}

// Check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) {
        return { label: 'Weak', class: 'weak' };
    } else if (strength <= 3) {
        return { label: 'Medium', class: 'medium' };
    } else {
        return { label: 'Strong', class: 'strong' };
    }
}
