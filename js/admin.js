/**
 * LifeFlow - Admin Panel Script
 */

let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is admin
    if (!isLoggedIn() || !isAdmin()) {
        showToast('Access denied. Admin only.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    initializeAdmin();
    loadUsers();
    setupEventListeners();
});

// Initialize admin panel
function initializeAdmin() {
    const user = getCurrentUser();
    document.getElementById('userName').textContent = user.fullName;

    // User dropdown
    const userBtn = document.getElementById('userBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('active');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
        showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    });

    // Mobile nav
    document.getElementById('navToggle').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('active');
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search users
    document.getElementById('searchUsers').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allUsers.filter(u =>
            u.fullName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.bloodGroup.toLowerCase().includes(query) ||
            u.location.toLowerCase().includes(query)
        );
        displayUsers(filtered);
    });

    // Edit form submission
    document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserEdit();
    });
}

// Load all users
async function loadUsers() {
    const donors = await getDonors();
    allUsers = donors.filter(d => d.role !== 'admin');
    displayUsers(allUsers);
    updateStats();
    updateBloodDistribution();
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    const noUsers = document.getElementById('noUsers');

    if (users.length === 0) {
        tbody.innerHTML = '';
        noUsers.style.display = 'block';
        return;
    }

    noUsers.style.display = 'none';

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 35px; height: 35px; background: var(--primary); 
                                color: white; border-radius: 50%; display: flex; 
                                align-items: center; justify-content: center; font-weight: 600;">
                        ${getInitials(user.fullName)}
                    </div>
                    <div>
                        <strong>${user.fullName}</strong>
                        <br>
                        <small style="color: var(--gray-600);">${user.email}</small>
                    </div>
                </div>
            </td>
            <td><span class="blood-badge">${user.bloodGroup}</span></td>
            <td>${user.location}</td>
            <td>${user.phone}</td>
            <td>
                <span class="status-badge ${user.status}">
                    <i class="fas ${getStatusIcon(user.status)}"></i>
                    ${getStatusLabel(user.status)}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editUser('${user.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteUserPrompt('${user.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update statistics
function updateStats() {
    const users = allUsers;

    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('liveUsers').textContent = users.filter(u => u.status === 'live').length;
    document.getElementById('donatedUsers').textContent = users.filter(u => u.status === 'donated').length;
    document.getElementById('notWillingUsers').textContent = users.filter(u => u.status === 'not-willing').length;
}

// Update blood distribution chart
function updateBloodDistribution() {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const container = document.getElementById('bloodDistribution');
    const total = allUsers.length || 1;

    container.innerHTML = bloodGroups.map(bg => {
        const count = allUsers.filter(u => u.bloodGroup === bg).length;
        const percentage = Math.round((count / total) * 100);

        return `
            <div class="distribution-item">
                <div class="blood-type">${bg}</div>
                <div class="distribution-bar">
                    <div class="distribution-bar-header">
                        <span>${count} donors</span>
                        <span>${percentage}%</span>
                    </div>
                    <div class="distribution-bar-track">
                        <div class="distribution-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Edit user
function editUser(userId) {
    const user = allUsers.find(u => (u.id === userId || u._id === userId));
    if (!user) return;

    document.getElementById('editId').value = user.id || user._id;
    document.getElementById('editName').value = user.fullName;
    document.getElementById('editBloodGroup').value = user.bloodGroup;
    document.getElementById('editStatus').value = user.status;
    document.getElementById('editLocation').value = user.location;
    document.getElementById('editPhone').value = user.phone;

    openModal('editModal');
}

// Save user edit
async function saveUserEdit() {
    const id = document.getElementById('editId').value;
    const updates = {
        fullName: document.getElementById('editName').value,
        bloodGroup: document.getElementById('editBloodGroup').value,
        status: document.getElementById('editStatus').value,
        location: document.getElementById('editLocation').value,
        phone: document.getElementById('editPhone').value
    };

    const result = await updateDonor(id, updates);

    if (result.success) {
        showToast('User updated successfully', 'success');
        closeModal('editModal');
        await loadUsers();
    } else {
        showToast('Failed to update user', 'error');
    }
}

// Delete user prompt
function deleteUserPrompt(userId) {
    document.getElementById('deleteId').value = userId;
    openModal('deleteModal');
}

// Confirm delete
async function confirmDelete() {
    const id = document.getElementById('deleteId').value;
    const result = await deleteDonor(id);

    if (result.success) {
        showToast('User deleted successfully', 'success');
        closeModal('deleteModal');
        await loadUsers();
    } else {
        showToast('Failed to delete user', 'error');
    }
}

// Export data as CSV
function exportData() {
    const headers = ['Name', 'Email', 'Blood Group', 'Age', 'Gender', 'Phone', 'Location', 'Status', 'Registered'];
    const rows = allUsers.map(u => [
        u.fullName,
        u.email,
        u.bloodGroup,
        u.age,
        u.gender,
        u.phone,
        u.location,
        u.status,
        formatDate(u.createdAt)
    ]);

    const csv = [headers, ...rows].map(row =>
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeflow-donors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Data exported successfully', 'success');
}
