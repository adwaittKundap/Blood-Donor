/**
 * LifeFlow - Dashboard Script
 * Features: Blood Compatibility First -> TSP Proximity Sorting Second (Nearest to Furthest)
 */

let currentView = 'grid';
let allDonors = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    loadDonors();
});

// --- 1. INITIALIZATION & NAVIGATION ---
function initializeDashboard() {
    const user = getCurrentUser();

    if (user) {
        if (document.getElementById('authLinks')) document.getElementById('authLinks').style.display = 'none';
        if (document.getElementById('userMenu')) document.getElementById('userMenu').style.display = 'block';
        if (document.getElementById('userName')) document.getElementById('userName').textContent = user.fullName.split(' ')[0];

        if (user.role === 'admin' && document.getElementById('adminLink')) {
            document.getElementById('adminLink').style.display = 'block';
        }

        const userBtn = document.getElementById('userBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (userBtn && dropdownMenu) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('active');
            });
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('active');
            });
        }

        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                showProfile();
            });
        }

        const statusToggle = document.getElementById('statusToggle');
        if (statusToggle) {
            statusToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleUserStatus();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
                showToast('Logged out successfully', 'success');
                setTimeout(() => window.location.reload(), 1000);
            });
        }
    }
}

function setupEventListeners() {
    const bloodFilter = document.getElementById('bloodGroupFilter');
    const locationFilter = document.getElementById('locationFilter'); // Standardized ID
    const searchLocation = document.getElementById('searchLocation'); // Fallback ID
    const statusFilter = document.getElementById('statusFilter');
    const searchBtn = document.getElementById('searchBtn');

    // Sync Dropdown with Quick Chips
    if (bloodFilter) {
        bloodFilter.addEventListener('change', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            const matchingChip = document.querySelector(`.chip[data-blood="${e.target.value}"]`);
            if (matchingChip) matchingChip.classList.add('active');
            filterDonors();
        });
    }

    if (statusFilter) statusFilter.addEventListener('change', filterDonors);
    if (locationFilter) locationFilter.addEventListener('input', filterDonors);
    if (searchLocation) searchLocation.addEventListener('input', filterDonors);
    if (searchBtn) searchBtn.addEventListener('click', filterDonors);

    // Quick Filter Chips (Clickable UI synced with dropdown)
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const bloodGroup = chip.dataset.blood;
            if (bloodFilter) bloodFilter.value = bloodGroup;

            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            filterDonors();
        });
    });

    // View Toggles
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            filterDonors();
        });
    });
}

// --- 2. DATA LOADING & FILTERING ENGINE ---
async function loadDonors() {
    showLoading(true);

    try {
        const donors = await getDonors();
        const currentUser = getCurrentUser();

        // Exclude the logged-in user AND the admin account
        allDonors = donors.filter(donor => {
            const donorId = donor.id || donor._id;
            const currentUserId = currentUser ? (currentUser.id || currentUser._id) : null;
            const isNotSelf = currentUserId ? donorId !== currentUserId : true;
            const isNotAdmin = donor.email !== 'admin@lifeflow.com' && donor.role !== 'admin';

            return isNotSelf && isNotAdmin;
        });

        filterDonors();
    } catch (error) {
        console.error("Error loading donors:", error);
    } finally {
        showLoading(false);
    }
}

function getCompatibleDonorTypes(recipientType) {
    const compatibilityMap = {
        'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        'AB-': ['A-', 'B-', 'AB-', 'O-'],
        'A+': ['A+', 'A-', 'O+', 'O-'],
        'A-': ['A-', 'O-'],
        'B+': ['B+', 'B-', 'O+', 'O-'],
        'B-': ['B-', 'O-'],
        'O+': ['O+', 'O-'],
        'O-': ['O-']
    };
    return compatibilityMap[recipientType] || [];
}

// Global Filter Coordinator (Strict Order: Blood -> Status -> Proximity Sort)
function filterDonors() {
    const bloodTypeVal = document.getElementById('bloodGroupFilter') ? document.getElementById('bloodGroupFilter').value : '';
    const statusVal = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'live';

    // Check both potential HTML IDs for the location input box
    const locElement = document.getElementById('locationFilter') || document.getElementById('searchLocation');
    const locationVal = locElement ? locElement.value.toLowerCase().trim() : '';
    const currentUser = getCurrentUser();

    let filtered = [...allDonors];

    // STEP 1: Filter by Blood Compatibility FIRST
    if (bloodTypeVal) {
        const allowedTypes = getCompatibleDonorTypes(bloodTypeVal);
        filtered = filtered.filter(donor => allowedTypes.includes(donor.bloodGroup));
    }

    // STEP 2: Filter by Status
    if (statusVal !== 'all') {
        filtered = filtered.filter(donor => donor.status === statusVal);
    }

    // STEP 3: Route through Traveling Salesman Proximity Engine
    // Determines origin based on search text first, then user's profile location
    const sortOrigin = locationVal || (currentUser ? currentUser.location : '');

    if (sortOrigin) {
        filtered = sortDonorsByProximity(filtered, sortOrigin);
    }

    renderDonors(filtered);
}

// Complete Maharashtra TSP Proximity Engine
function sortDonorsByProximity(donorsList, query) {
    // Comprehensive coordinates for all 36 Maharashtra Districts
    const cityCoords = {
        "mumbai": { lat: 19.0760, lng: 72.8777 },
        "thane": { lat: 19.2183, lng: 72.9781 },
        "palghar": { lat: 19.6967, lng: 72.7699 },
        "raigad": { lat: 18.5158, lng: 72.8688 },
        "ratnagiri": { lat: 16.9902, lng: 73.3120 },
        "sindhudurg": { lat: 16.1667, lng: 73.7000 },
        "pune": { lat: 18.5204, lng: 73.8567 },
        "satara": { lat: 17.6805, lng: 73.9811 },
        "kolhapur": { lat: 16.7050, lng: 74.2433 },
        "sangli": { lat: 16.8524, lng: 74.5815 },
        "solapur": { lat: 17.6599, lng: 75.9064 },
        "nashik": { lat: 20.0110, lng: 73.7903 },
        "ahmednagar": { lat: 19.0952, lng: 74.7496 },
        "dhule": { lat: 20.9042, lng: 74.7749 },
        "jalgaon": { lat: 21.0077, lng: 75.5626 },
        "nandurbar": { lat: 21.3688, lng: 74.2405 },
        "aurangabad": { lat: 19.8762, lng: 75.3433 },
        "jalna": { lat: 19.8297, lng: 75.8800 },
        "beed": { lat: 18.9891, lng: 75.7601 },
        "latur": { lat: 18.4088, lng: 76.5604 },
        "dharashiv": { lat: 18.1856, lng: 76.0417 },
        "osmanabad": { lat: 18.1856, lng: 76.0417 },
        "nanded": { lat: 19.1383, lng: 77.3210 },
        "parbhani": { lat: 19.2644, lng: 76.7729 },
        "hingoli": { lat: 19.7161, lng: 77.1486 },
        "amravati": { lat: 20.9320, lng: 77.7523 },
        "akola": { lat: 20.7059, lng: 77.0082 },
        "washim": { lat: 20.1115, lng: 77.1294 },
        "buldhana": { lat: 20.5317, lng: 76.1824 },
        "yavatmal": { lat: 20.3957, lng: 78.1332 },
        "nagpur": { lat: 21.1458, lng: 79.0882 },
        "wardha": { lat: 20.7453, lng: 78.6022 },
        "chandrapur": { lat: 19.9615, lng: 79.2961 },
        "bhandara": { lat: 21.1777, lng: 79.6569 },
        "gondia": { lat: 21.4624, lng: 80.1960 },
        "gadchiroli": { lat: 20.1849, lng: 79.9948 }
    };

    const cleanQuery = query.toLowerCase().split(',')[0].trim();

    // Find matching origin coordinates based on typed input
    let originCoords = null;
    for (const city in cityCoords) {
        if (city.includes(cleanQuery) || cleanQuery.includes(city)) {
            originCoords = cityCoords[city];
            break;
        }
    }

    return [...donorsList].sort((a, b) => {
        const locA = (a.location || "").toLowerCase().split(',')[0].trim();
        const locB = (b.location || "").toLowerCase().split(',')[0].trim();

        // Exact text matches always forcefully jump to absolute top
        const aMatchesText = locA.includes(cleanQuery);
        const bMatchesText = locB.includes(cleanQuery);

        if (aMatchesText && !bMatchesText) return -1;
        if (!aMatchesText && bMatchesText) return 1;

        // If coordinates exist for the origin, sort remaining cities by physical distance
        if (originCoords) {
            const coordA = cityCoords[locA];
            const coordB = cityCoords[locB];

            const distA = coordA ? Math.sqrt(Math.pow(coordA.lat - originCoords.lat, 2) + Math.pow(coordA.lng - originCoords.lng, 2)) : 9999;
            const distB = coordB ? Math.sqrt(Math.pow(coordB.lat - originCoords.lat, 2) + Math.pow(coordB.lng - originCoords.lng, 2)) : 9999;

            return distA - distB;
        }

        // Fallback for completely unknown cities: keep original array order
        return 0;
    });
}

// --- 3. UI RENDERING & COMPONENT GENERATION ---
function renderDonors(donors) {
    const gridContainer = document.getElementById('donorsGrid');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');

    if (!gridContainer) return;

    if (resultsCount) {
        resultsCount.textContent = `${donors.length} donor${donors.length !== 1 ? 's' : ''} found`;
    }

    if (currentView === 'list') {
        gridContainer.classList.add('list-view');
    } else {
        gridContainer.classList.remove('list-view');
    }

    if (donors.length === 0) {
        gridContainer.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }

    if (noResults) noResults.style.display = 'none';
    gridContainer.innerHTML = donors.map(donor => createDonorCard(donor)).join('');
}

function createDonorCard(donor) {
    let lockDetailsHTML = '';
    if (donor.status === 'donated' && donor.lastDonationDate) {
        const startDate = new Date(donor.lastDonationDate);
        const endDate = new Date(donor.lastDonationDate + (90 * 24 * 60 * 60 * 1000));
        lockDetailsHTML = `
            <div class="donor-detail lock-info" style="background: #fff5f5; border-left: 3px solid #e74c3c; padding: 5px 10px; margin: 5px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 0.8rem; color: #c0392b;">
                    <i class="fas fa-lock"></i> <strong>Donor Lock:</strong><br>
                    Ends: ${endDate.toLocaleDateString()}
                </p>
            </div>
        `;
    }

    return `
        <div class="donor-card">
            <div class="donor-card-header">
                <div class="donor-avatar">${getInitials(donor.fullName || 'U')}</div>
                <div class="donor-info">
                    <h3>${donor.fullName}</h3>
                    <span class="donor-blood-type">${donor.bloodGroup}</span>
                </div>
            </div>
            <div class="donor-card-body">
                <div class="donor-details">
                    <div class="donor-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${donor.location}</span>
                    </div>
                    <div class="donor-detail">
                        <span class="donor-status ${donor.status}">
                            <i class="fas ${getStatusIcon(donor.status)}"></i>
                            ${getStatusLabel(donor.status)}
                        </span>
                    </div>
                    ${lockDetailsHTML}
                    <div class="donor-detail">
                        <i class="fas fa-venus-mars"></i>
                        <span>${capitalizeFirst(donor.gender || '')}, ${donor.age} years</span>
                    </div>
                </div>
                <button class="btn btn-outline btn-full" onclick="viewDonorDetails('${donor.id}')">
                    View Contact Info
                </button>
            </div>
        </div>
    `;
}

// --- 4. MODALS & USER ACTIONS ---
// Opens the premium, medical-themed donor details modal UI
function viewDonorDetails(donorId) {
    const donor = allDonors.find(d => (d.id === donorId || d._id === donorId));

    if (!donor) return;

    const modalBody = document.getElementById('donorContent');
    if (!modalBody) return;

    // Define adaptive badges based on live platform status
    let badgeClass = 'badge-available';
    let badgeIcon = 'fa-heartbeat';
    let badgeText = getStatusLabel(donor.status);

    if (donor.status === 'donated') {
        badgeClass = 'badge-donated';
        badgeIcon = 'fa-clock';
    } else if (donor.status === 'emergency') {
        badgeClass = 'badge-emergency';
        badgeIcon = 'fa-exclamation-triangle';
    }

    // Process medical lockout timeline checks (90-day clinical standard)
    let lockInfoHTML = "";
    let lastDonationText = "Never";

    if (donor.status === 'donated' && donor.lastDonationDate) {
        const startDate = new Date(donor.lastDonationDate);
        lastDonationText = startDate.toLocaleDateString();

        const endDate = new Date(donor.lastDonationDate + (90 * 24 * 60 * 60 * 1000));
        lockInfoHTML = `
            <div class="deferral-alert-banner">
                <div class="alert-pulse-border"></div>
                <div class="alert-content">
                    <div class="alert-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="alert-text">
                        <h4>Temporary Deferral Recovery Active</h4>
                        <p>Fully eligible for next direct donation stream on: <strong>${endDate.toLocaleDateString()}</strong></p>
                    </div>
                </div>
            </div>
        `;
    }

    // Inject beautifully structured premium interface components
    modalBody.innerHTML = `
        <!-- Premium Backdrop Floating Glow Nodes -->
        <div class="glow-node node-1"></div>
        <div class="glow-node node-2"></div>

        <!-- Decorative EKG Heartbeat Line SVG Base -->
        <div class="ekg-container">
            <svg class="ekg-line" viewBox="0 0 300 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,20 L100,20 L110,10 L120,30 L130,5 L140,35 L150,20 L300,20" fill="none" stroke="rgba(193, 18, 31, 0.15)" stroke-width="2"/>
            </svg>
        </div>

        <div class="lifeflow-modal-content">
            <!-- Header Section -->
            <header class="modal-profile-header">
                <div class="avatar-wrapper">
                    <div class="donor-avatar-pulse"></div>
                    <div class="donor-avatar-main">${getInitials(donor.fullName || 'U')}</div>
                </div>
                <h2 class="donor-name">${donor.fullName}</h2>
                <div class="badge-row">
                    <span class="status-badge ${badgeClass}">
                        <i class="fas ${badgeIcon}"></i> ${badgeText}
                    </span>
                </div>
            </header>

            <!-- Grid Information Section -->
            <section class="info-matrix-grid">
                <!-- Blood Group Card -->
                <div class="matrix-card highlight-blood">
                    <div class="card-icon-wrapper">
                        <i class="fas fa-tint"></i>
                    </div>
                    <div class="card-meta">
                        <span class="meta-label">Blood Group</span>
                        <span class="meta-value blood-type-display">${donor.bloodGroup}</span>
                    </div>
                </div>

                <!-- Location Card -->
                <div class="matrix-card">
                    <div class="card-icon-wrapper">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="card-meta">
                        <span class="meta-label">Location</span>
                        <span class="meta-value">${donor.location || 'Not Specified'}</span>
                    </div>
                </div>

                <!-- Age & Gender Card -->
                <div class="matrix-card">
                    <div class="card-icon-wrapper">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="card-meta">
                        <span class="meta-label">Demographics</span>
                        <span class="meta-value">${capitalizeFirst(donor.gender || 'User')}, ${donor.age ? donor.age + ' Years' : '--'}</span>
                    </div>
                </div>

                <!-- Last Donated Card -->
                <div class="matrix-card">
                    <div class="card-icon-wrapper">
                        <i class="fas fa-history"></i>
                    </div>
                    <div class="card-meta">
                        <span class="meta-label">Last Donation</span>
                        <span class="meta-value">${lastDonationText}</span>
                    </div>
                </div>
            </section>

            <!-- Recovery Alert Block (Appears Conditionally) -->
            ${lockInfoHTML}

            <!-- Action Contact Row -->
            <footer class="modal-action-footer">
                <a href="tel:${donor.phone}" class="premium-action-btn btn-primary-gradient">
                    <i class="fas fa-phone-alt"></i>
                    <span>Call Direct Line</span>
                </a>
                <a href="mailto:${donor.email}" class="premium-action-btn btn-secondary-outline">
                    <i class="fas fa-envelope-open-text"></i>
                    <span>Email Donor</span>
                </a>
            </footer>
        </div>
    `;

    openModal('donorModal');
}

function showProfile() {
    const user = getCurrentUser();
    if (!user) return;
    const content = document.getElementById('profileContent');
    content.innerHTML = `
        <div class="profile-header text-center mb-20">
            <div class="donor-avatar-large mx-auto">${getInitials(user.fullName)}</div>
            <h2>${user.fullName}</h2>
            <span class="donor-status ${user.status}">${getStatusLabel(user.status)}</span>
        </div>
        <div class="profile-details">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p><strong>Location:</strong> ${user.location}</p>
            <p><strong>Blood Group:</strong> ${user.bloodGroup}</p>
        </div>
    `;
    openModal('profileModal');
}

// Allows the logged-in user to change their status (Available,Recently donated,not available)
async function toggleUserStatus() {
    const user = getCurrentUser();
    if (!user) return;

    const now = new Date().getTime();
    const threeMonthsInMs = 90 * 24 * 60 * 60 * 1000;
    let newStatus, updateData = {};

    if (user.status === 'live') {
        newStatus = 'donated';
        updateData.lastDonationDate = now;
        showToast("Status: Recently Donated. 3-month lock active.", "info");
    } else if (user.status === 'donated') {
        const timePassed = now - (user.lastDonationDate || 0);
        if (timePassed < threeMonthsInMs) {
            const daysLeft = Math.ceil((threeMonthsInMs - timePassed) / (24 * 60 * 60 * 1000));
            showToast(`Locked! Wait ${daysLeft} more days.`, "error");
            return;
        }
        newStatus = 'not-willing';
    } else {
        newStatus = 'live';
    }

    updateData.status = newStatus;
    const userId = user.id || user._id;
    const result = await updateDonor(userId, updateData);

    if (result.success) {
        showToast(`Status updated to: ${getStatusLabel(newStatus)}`, "success");
        if (document.getElementById('statusLabel')) {
            document.getElementById('statusLabel').textContent = getStatusLabel(newStatus);
        }
        await loadDonors();
    }
}

// --- 5. HELPERS ---
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function clearFilters() {
    if (document.getElementById('bloodGroupFilter')) document.getElementById('bloodGroupFilter').value = '';

    // Clear both potential location inputs
    if (document.getElementById('locationFilter')) document.getElementById('locationFilter').value = '';
    if (document.getElementById('searchLocation')) document.getElementById('searchLocation').value = '';

    if (document.getElementById('statusFilter')) document.getElementById('statusFilter').value = 'live';

    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    filterDonors();
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = show ? 'block' : 'none';
}