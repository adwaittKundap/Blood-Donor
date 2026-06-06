/**
 * LifeFlow - Login Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearErrors();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        // Validate inputs
        if (!email) {
            showError('email', 'Please enter your email');
            return;
        }

        if (!password) {
            showError('password', 'Please enter your password');
            return;
        }

        // Attempt login
        const result = await loginUser(email, password);

        if (result.success) {
            showToast('Login successful! Redirecting...', 'success');

            // Redirect based on role
            setTimeout(() => {
                if (result.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
        } else {
            showToast(result.message, 'error');
            showError('password', 'Invalid email or password');
        }
    });
});

// Fill demo credentials
function fillDemo(type) {
    if (type === 'admin') {
        document.getElementById('email').value = 'admin@lifeflow.com';
        document.getElementById('password').value = 'admin123';
    } else {
        document.getElementById('email').value = 'rajesh@example.com';
        document.getElementById('password').value = 'user123';
    }
}

// Show error
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

// Clear errors
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });

    document.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
    });
}
