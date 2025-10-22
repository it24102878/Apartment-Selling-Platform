// Global variables
let currentApartmentData = {};
let currentFilter = '';  // For analytics filter
const API_BASE_URL = 'http://localhost:8080';

// Check admin authentication
function checkAdminAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.isAdmin) {
        alert('Access denied. Please login as admin.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
async function loadAnalytics(filterStatus = '') {
    currentFilter = filterStatus;
    const url = filterStatus ? `${API_BASE_URL}/admin/payments/analytics?status=${encodeURIComponent(filterStatus)}` : `${API_BASE_URL}/admin/payments/analytics`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5s timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();

        // ... rest of population code ...

    } catch (error) {
        console.error('Analytics fetch error:', error);  // Always log
        const loadingEl = document.getElementById('analyticsLoading');
        if (loadingEl) {
            loadingEl.textContent = `Error: ${error.message}. Check console.`;
        }
        document.getElementById('analyticsTable').style.display = 'none';
    }
}

// Utility Functions
function showToast(message, type = 'success') {
    alert(`${type.toUpperCase()}: ${message}`);
}

function openModal(modalId) {
    if (!checkAdminAuth()) return;
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function getInitials(text) {
    return text ? text.charAt(0).toUpperCase() : 'A';
}

// Admin logout function
function adminLogout() {
    if (confirm('Are you sure you want to logout from admin panel?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Section Management
function loadSection(section) {
    if (!checkAdminAuth()) return;

    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(section).classList.remove('hidden');

    if (section === 'apartmentListings') {
        loadApartmentListings();
    } else if (section === 'userManagement') {
        loadUserManagement();
    } else if (section === 'analytics') {
        loadAnalytics();  // Load analytics on section select
    }
}

// Analytics Functions
async function loadAnalytics(filterStatus = '') {
    currentFilter = filterStatus;
    const url = filterStatus ? `${API_BASE_URL}/admin/payments/analytics?status=${encodeURIComponent(filterStatus)}` : `${API_BASE_URL}/admin/payments/analytics`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        // Update filter info
        const filterInfo = document.getElementById('filterInfo');
        if (filterInfo) {
            filterInfo.textContent = filterStatus ? `(Filtered by: ${filterStatus})` : '(Showing all)';
        }

        // Update stats
        document.getElementById('totalRevenue').textContent = `$${Number(data.totalRevenue || 0).toFixed(2)}`;
        document.getElementById('completedCount').textContent = data.completedPaymentsCount || 0;
        document.getElementById('totalPayments').textContent = data.totalPayments || 0;

        // Populate table with simplified payments
        const tbody = document.getElementById('analyticsPaymentsBody');
        if (tbody) {
            tbody.innerHTML = '';
            (data.payments || []).forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="analytics-td">${payment.paymentID}</td>
                    <td class="analytics-td" id="amount-${payment.paymentID}">${Number(payment.totalAmount).toFixed(2)}</td>
                    <td class="analytics-td">
                        <button class="analytics-edit-btn" onclick="editAmount(${payment.paymentID}, ${payment.totalAmount})">Edit</button>
                        <div class="analytics-edit-form" id="form-${payment.paymentID}">
                            <input type="number" class="analytics-edit-input" id="input-${payment.paymentID}" step="0.01" value="${Number(payment.totalAmount).toFixed(2)}">
                            <button class="analytics-save-btn" onclick="saveAmount(${payment.paymentID})">Save</button>
                            <button class="analytics-cancel-btn" onclick="cancelEdit(${payment.paymentID})">Cancel</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        document.getElementById('analyticsLoading').style.display = 'none';
        document.getElementById('analyticsTable').style.display = 'table';
    } catch (error) {
        console.error('Error loading analytics:', error);
        document.getElementById('analyticsLoading').textContent = 'Error loading data. Please try again.';
        document.getElementById('analyticsTable').style.display = 'none';
    }
}

// Auto-apply filter on dropdown change
function initAnalyticsFilter() {
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const selected = this.value;
            loadAnalytics(selected);
        });
    }
}

function editAmount(id, currentAmount) {
    const amountCell = document.getElementById(`amount-${id}`);
    const form = document.getElementById(`form-${id}`);
    if (amountCell && form) {
        amountCell.style.display = 'none';
        form.style.display = 'block';
        const input = document.getElementById(`input-${id}`);
        if (input) {
            input.value = Number(currentAmount).toFixed(2);
            input.focus();
            input.select();
        }
    }
}

async function saveAmount(id) {
    const input = document.getElementById(`input-${id}`);
    if (!input) return;
    const newAmount = parseFloat(input.value);
    if (isNaN(newAmount) || newAmount <= 0) {
        alert('Please enter a valid amount greater than 0.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalAmount: newAmount })
        });
        if (!response.ok) throw new Error('Update failed');

        // Update local display
        const amountCell = document.getElementById(`amount-${id}`);
        const form = document.getElementById(`form-${id}`);
        if (amountCell && form) {
            amountCell.textContent = newAmount.toFixed(2);
            amountCell.style.display = 'block';
            form.style.display = 'none';
        }

        // Reload with current filter
        await loadAnalytics(currentFilter);
        showToast('Total amount updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating amount:', error);
        showToast('Failed to update. Please try again.', 'error');
    }
}

// Dashboard Functions
let usersChart, apartmentsChart, revenueChart, locationChart;

async function loadDashboard() {
    try {
        // Load all data in parallel
        const [usersResponse, apartmentsResponse, analyticsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/users1`),
            fetch(`${API_BASE_URL}/admin/apartments1`),
            fetch(`${API_BASE_URL}/admin/payments/analytics`)
        ]);

        const users = await usersResponse.json();
        const apartments = await apartmentsResponse.json();
        const analytics = await analyticsResponse.json();

        // Update dashboard with data
        updateDashboard(users, apartments, analytics);

        // Create charts
        createCharts(users, apartments, analytics);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

function updateDashboard(users, apartments, analytics) {
    // Update quick stats
    document.getElementById('totalUsers').textContent = users.length.toLocaleString();
    document.getElementById('totalApartments').textContent = apartments.length;
    document.getElementById('totalRevenueDash').textContent = `$${Number(analytics.totalRevenue || 0).toFixed(2)}`;

    // Calculate average price
    const totalPrice = apartments.reduce((sum, apt) => sum + (parseFloat(apt.aptPrice) || 0), 0);
    const avgPrice = apartments.length > 0 ? totalPrice / apartments.length : 0;
    document.getElementById('avgPrice').textContent = `$${Math.round(avgPrice).toLocaleString()}`;

    // Update recent activity
    updateRecentActivity(apartments, users);
}

function createCharts(users, apartments, analytics) {
    // Users Chart (Line chart for user growth)
    const usersCtx = document.getElementById('usersChart').getContext('2d');
    if (usersChart) usersChart.destroy();
    usersChart = new Chart(usersCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'User Growth',
                data: [1200, 1350, 1500, 1650, 1750, users.length],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Apartments Chart (Doughnut chart for status distribution)
    const apartmentsCtx = document.getElementById('apartmentsChart').getContext('2d');
    if (apartmentsChart) apartmentsChart.destroy();

    const availableCount = apartments.filter(apt => apt.aptStatus === 'AVAILABLE').length;
    const bookedCount = apartments.filter(apt => apt.aptStatus === 'BOOKED').length;
    const pendingCount = apartments.filter(apt => apt.aptStatus === 'PENDING').length;

    apartmentsChart = new Chart(apartmentsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Available', 'Booked', 'Pending'],
            datasets: [{
                data: [availableCount, bookedCount, pendingCount],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    '#f59e0b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Revenue Chart (Bar chart for revenue by month)
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Revenue',
                data: [12500, 14200, 16800, 19200, 21500, Number(analytics.totalRevenue || 0)],
                backgroundColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Location Chart (Horizontal bar chart for location distribution)
    const locationCtx = document.getElementById('locationChart').getContext('2d');
    if (locationChart) locationChart.destroy();

    // Count apartments by location
    const locationCounts = {};
    apartments.forEach(apt => {
        const location = apt.aptLocation || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    const locations = Object.keys(locationCounts).slice(0, 5); // Top 5 locations
    const counts = locations.map(loc => locationCounts[loc]);

    locationChart = new Chart(locationCtx, {
        type: 'bar',
        data: {
            labels: locations,
            datasets: [{
                label: 'Apartments by Location',
                data: counts,
                backgroundColor: '#06b6d4'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateRecentActivity(apartments, users) {
    const activityBody = document.getElementById('recentActivityBody');
    if (!activityBody) return;

    activityBody.innerHTML = '';

    // Create recent activity from apartments and users
    const activities = [];

    // Add apartment activities
    apartments.slice(0, 3).forEach(apt => {
        activities.push({
            type: 'Apartment',
            description: `${apt.aptType || 'Apartment'} added`,
            date: new Date(apt.aptCreatedAt || Date.now()).toLocaleDateString(),
            user: 'System'
        });
    });

    // Add user activities
    users.slice(0, 2).forEach(user => {
        activities.push({
            type: 'User',
            description: `${user.name || 'User'} registered`,
            date: new Date(user.createdAt || Date.now()).toLocaleDateString(),
            user: 'System'
        });
    });

    // Sort by date (newest first) and take first 5
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Populate table
    activities.slice(0, 5).forEach(activity => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-2 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${
            activity.type === 'Apartment' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }">
                    ${activity.type}
                </span>
            </td>
            <td class="py-2 px-4">${activity.description}</td>
            <td class="py-2 px-4">${activity.date}</td>
            <td class="py-2 px-4">${activity.user}</td>
        `;
        activityBody.appendChild(row);
    });

    // If no activities
    if (activities.length === 0) {
        activityBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-gray-500">No recent activity</td>
            </tr>
        `;
    }
}

// Update the existing loadSection function
function loadSection(section) {
    if (!checkAdminAuth()) return;

    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(section).classList.remove('hidden');

    if (section === 'apartmentListings') {
        loadApartmentListings();
    } else if (section === 'userManagement') {
        loadUserManagement();
    } else if (section === 'analytics') {
        loadAnalytics();
    } else if (section === 'dashboard') {
        loadDashboard();  // Add this line
    }
}

function cancelEdit(id) {
    const amountCell = document.getElementById(`amount-${id}`);
    const form = document.getElementById(`form-${id}`);
    if (amountCell && form) {
        amountCell.style.display = 'block';
        form.style.display = 'none';
    }
}

// Load Apartments from Database
function loadApartmentListings() {
    console.log('Attempting to load apartments from:', `${API_BASE_URL}/admin/apartments1`);

    fetch(`${API_BASE_URL}/admin/apartments1`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(apartments => {
            console.log('Apartments loaded successfully:', apartments);
            populateApartmentTable(apartments);
            updateApartmentStats(apartments);
        })
        .catch(error => {
            console.error('Full error details:', error);
            const tableBody = document.getElementById('apartmentTableBody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4 text-red-500">
                            Server Error: ${error.message}<br>
                            Check Spring Boot console for details
                        </td>
                    </tr>
                `;
            }
        });
}

function populateApartmentTable(apartments) {
    const tableBody = document.getElementById('apartmentTableBody');

    if (!tableBody) {
        console.error('apartmentTableBody element not found!');
        return;
    }

    tableBody.innerHTML = '';

    if (!apartments || apartments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">No apartments found in database</td>
            </tr>
        `;
        return;
    }

    apartments.forEach(apartment => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';

        const price = apartment.aptPrice ?
            `$${parseFloat(apartment.aptPrice).toLocaleString()}` : '$0';

        const createdDate = apartment.aptCreatedAt ?
            new Date(apartment.aptCreatedAt).toLocaleDateString() : 'N/A';

        row.innerHTML = `
            <td class="p-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold">
                        ${getInitials(apartment.aptType)}
                    </div>
                    <div>
                        <div class="font-semibold">${apartment.aptType || 'N/A'}</div>
                        <div class="text-sm text-gray-500">ID: ${apartment.aptId || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="p-3">${apartment.aptType || 'N/A'}</td>
            <td class="p-3 font-semibold">${price}</td>
            <td class="p-3">${apartment.aptBedrooms || 'N/A'}</td>
            <td class="p-3">${apartment.aptLocation || 'N/A'}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${
            apartment.aptStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                apartment.aptStatus === 'BOOKED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        }">
                    ${apartment.aptStatus || 'N/A'}
                </span>
            </td>
            <td class="p-3">${createdDate}</td>
            <td class="p-3">
                <button class="bg-blue-500 text-white px-3 py-1 rounded mr-2" onclick="viewApartment(${apartment.aptId})">View</button>
                <button class="bg-yellow-500 text-white px-3 py-1 rounded mr-2" onclick="editApartment(${apartment.aptId})">Edit</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="deleteApartment(${apartment.aptId})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateApartmentStats(apartments) {
    if (!apartments) return;

    const total = apartments.length;
    const available = apartments.filter(apt => apt.aptStatus === 'AVAILABLE').length;
    const booked = apartments.filter(apt => apt.aptStatus === 'BOOKED').length;
    const pending = apartments.filter(apt => apt.aptStatus === 'PENDING').length;

    const statCards = document.querySelectorAll('#apartmentListings .stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.text-2xl').textContent = total;
        statCards[1].querySelector('.text-2xl').textContent = available;
        statCards[2].querySelector('.text-2xl').textContent = booked;
        statCards[3].querySelector('.text-2xl').textContent = pending;
    }
}

// Apartment CRUD functions (viewApartment, editApartment, updateApartment, deleteApartment, createApartment - implement as needed)
function viewApartment(id) {
    // Fetch and populate view modal
    showToast(`View apartment ${id}`, 'info');
    openModal('viewApartmentModal');
}

function editApartment(id) {
    // Fetch and populate edit modal
    showToast(`Edit apartment ${id}`, 'info');
    openModal('editApartmentModal');
}

function updateApartment() {
    showToast('Apartment updated successfully!', 'success');
    closeModal('editApartmentModal');
    loadApartmentListings();
}

function deleteApartment(id) {
    if (confirm('Are you sure?')) {
        showToast(`Apartment ${id} deleted`, 'success');
        loadApartmentListings();
    }
}

function createApartment() {
    showToast('Apartment created successfully!', 'success');
    closeModal('addApartmentModal');
    loadApartmentListings();
}

function addNewApartment() {
    openModal('addApartmentModal');
}

// User Management
function loadUserManagement() {
    fetch(`${API_BASE_URL}/admin/users1`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load users');
            return response.json();
        })
        .then(users => {
            populateUserTable(users);
            updateUserStats(users);
        })
        .catch(error => {
            console.error('Error loading users:', error);
            const tableBody = document.getElementById('userTableBody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4 text-red-500">
                            Error loading users: ${error.message}
                        </td>
                    </tr>
                `;
            }
        });
}

function populateUserTable(users) {
    const tableBody = document.getElementById('userTableBody');

    if (!tableBody) {
        console.error('userTableBody element not found!');
        return;
    }

    tableBody.innerHTML = '';

    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">No users found</td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';

        const regDate = user.createdAt ?
            new Date(user.createdAt).toLocaleDateString() : 'N/A';

        row.innerHTML = `
            <td class="p-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold">
                        ${getInitials(user.name)}
                    </div>
                    <div>
                        <div class="font-semibold">${user.name || 'N/A'}</div>
                        <div class="text-sm text-gray-500">ID: ${user.userId || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="p-3">${user.email || 'N/A'}</td>
            <td class="p-3">${regDate}</td>
            <td class="p-3">
                <button class="bg-blue-500 text-white px-3 py-1 rounded mr-2" onclick="viewUser(${user.userId})">View</button>
                <button class="bg-yellow-500 text-white px-3 py-1 rounded mr-2" onclick="editUser(${user.userId})">Edit</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="deleteUser(${user.userId})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateUserStats(users) {
    if (!users) return;

    const total = users.length;
    const active = users.length; // Adjust based on status
    const premium = 0; // Adjust based on data
    const suspended = 0; // Adjust based on data

    const userStatCards = document.querySelectorAll('#userManagement .stat-card');
    if (userStatCards.length >= 4) {
        userStatCards[0].querySelector('.text-2xl').textContent = total;
        userStatCards[1].querySelector('.text-2xl').textContent = active;
        userStatCards[2].querySelector('.text-2xl').textContent = premium;
        userStatCards[3].querySelector('.text-2xl').textContent = suspended;
    }
}

function viewUser(id) {
    fetch(`${API_BASE_URL}/admin/users1/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('User not found');
            return response.json();
        })
        .then(user => {
            document.getElementById('viewUserName').textContent = user.name || 'N/A';
            document.getElementById('viewUserEmail').textContent = user.email || 'N/A';
            document.getElementById('viewUserPhone').textContent = user.phone || 'N/A';
            document.getElementById('viewUserRegDate').textContent =
                user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

            openModal('viewUserModal');
        })
        .catch(error => {
            showToast('Error loading user: ' + error.message, 'error');
        });
}

function editUser(id) {
    fetch(`${API_BASE_URL}/admin/users1/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('User not found');
            return response.json();
        })
        .then(user => {
            document.getElementById('editUserId').value = user.userId;
            document.getElementById('editUserName').value = user.name || '';
            document.getElementById('editUserEmail').value = user.email || '';
            document.getElementById('editUserPhone').value = user.phone || '';

            openModal('editUserModal');
        })
        .catch(error => {
            showToast('Error loading user: ' + error.message, 'error');
        });
}

function updateUser() {
    const id = document.getElementById('editUserId').value;
    const formData = {
        name: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        phone: document.getElementById('editUserPhone').value
    };

    fetch(`${API_BASE_URL}/admin/users1/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update user');
            return response.json();
        })
        .then(updatedUser => {
            showToast('User updated successfully!', 'success');
            closeModal('editUserModal');
            loadUserManagement();
        })
        .catch(error => {
            showToast('Error updating user: ' + error.message, 'error');
        });
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`${API_BASE_URL}/admin/users1/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete user');
                showToast('User deleted successfully!', 'success');
                loadUserManagement();
            })
            .catch(error => {
                showToast('Error deleting user: ' + error.message, 'error');
            });
    }
}

function addNewUser() {
    openModal('addUserModal');
}

function createUser() {
    const formData = {
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        phone: document.getElementById('newUserPhone').value,
        password: document.getElementById('newUserPassword').value
    };

    if (!formData.name || !formData.email || !formData.password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    fetch(`${API_BASE_URL}/admin/users1`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to create user');
            return response.json();
        })
        .then(newUser => {
            showToast('User created successfully!', 'success');
            closeModal('addUserModal');
            document.getElementById('newUserForm').reset();
            loadUserManagement();
        })
        .catch(error => {
            showToast('Error creating user: ' + error.message, 'error');
        });
}

// Export functions (placeholders)
function exportUsers() {
    showToast('Exporting users...', 'info');
}

function exportApartments() {
    showToast('Exporting apartments...', 'info');
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;

    console.log('Admin panel loaded');
    loadApartmentListings();  // Auto-load apartments
    initAnalyticsFilter();  // Initialize analytics filter listener

    // Add logout button to sidebar
    const sidebar = document.querySelector('aside nav ul');
    if (sidebar) {
        const logoutItem = document.createElement('li');
        logoutItem.innerHTML = `
            <a href="#" class="nav-item flex items-center p-4 text-gray-600 hover:bg-gray-200" onclick="adminLogout()">
                <span class="mr-2">🚪</span> Logout
            </a>
        `;
        sidebar.appendChild(logoutItem);
    }
});

// Search and filter functions (placeholders)
function searchTable(value, section) {
    // Implement search logic
}

function filterTable(section, value) {
    // Implement filter logic
}