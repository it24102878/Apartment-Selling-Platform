// Global variables
let currentApartmentData = {};
let currentFilter = '';  // For analytics filter
const API_BASE_URL = 'http://localhost:8080';

// Location Maps Variables
let propertyMap;
let mapMarkers = [];
let allProperties = [];

// New York City coordinates for properties
const nycCoordinates = {
    manhattan: [
        { lat: 40.7589, lng: -73.9851, area: "Times Square" },
        { lat: 40.7614, lng: -73.9776, area: "Central Park South" },
        { lat: 40.7505, lng: -73.9934, area: "Hudson Yards" },
        { lat: 40.7282, lng: -73.9942, area: "Greenwich Village" },
        { lat: 40.7831, lng: -73.9712, area: "Upper East Side" },
        { lat: 40.7580, lng: -73.9855, area: "Midtown West" },
        { lat: 40.7536, lng: -73.9832, area: "Herald Square" },
        { lat: 40.6892, lng: -74.0445, area: "Financial District" }
    ],
    brooklyn: [
        { lat: 40.6782, lng: -73.9442, area: "Williamsburg" },
        { lat: 40.6869, lng: -73.9962, area: "Park Slope" },
        { lat: 40.6451, lng: -74.0151, area: "Bay Ridge" },
        { lat: 40.5907, lng: -73.9970, area: "Coney Island" },
        { lat: 40.6981, lng: -73.9972, area: "DUMBO" },
        { lat: 40.6602, lng: -73.9690, area: "Crown Heights" }
    ],
    queens: [
        { lat: 40.7421, lng: -73.9358, area: "Astoria" },
        { lat: 40.7282, lng: -73.7949, area: "Flushing" },
        { lat: 40.7453, lng: -73.9555, area: "Long Island City" },
        { lat: 40.7058, lng: -73.8173, area: "Jamaica" },
        { lat: 40.7579, lng: -73.8256, area: "Forest Hills" }
    ]
};

// Sample NYC apartment data
const nycSampleApartments = [
    {
        aptId: 1001,
        aptType: "Luxury Condo",
        aptPrice: 4500,
        aptBedrooms: 2,
        aptLocation: "Times Square, Manhattan",
        aptStatus: "AVAILABLE",
        aptDescription: "Modern luxury condo with stunning city views and high-end finishes. Features floor-to-ceiling windows, gourmet kitchen, and spa-like bathrooms.",
        amenities: ["Gym", "Pool", "Concierge", "Parking", "Roof Deck"],
        squareFeet: 1200,
        yearBuilt: 2020,
        contact: "John Smith - (555) 123-4567"
    },
    {
        aptId: 1002,
        aptType: "Studio Apartment",
        aptPrice: 2800,
        aptBedrooms: 1,
        aptLocation: "Greenwich Village, Manhattan",
        aptStatus: "AVAILABLE",
        aptDescription: "Charming studio in historic building with original hardwood floors and exposed brick. Perfect for young professionals.",
        amenities: ["Laundry", "Pet Friendly", "Bike Storage"],
        squareFeet: 600,
        yearBuilt: 1950,
        contact: "Sarah Johnson - (555) 987-6543"
    },
    {
        aptId: 1003,
        aptType: "Penthouse",
        aptPrice: 12000,
        aptBedrooms: 3,
        aptLocation: "Upper East Side, Manhattan",
        aptStatus: "BOOKED",
        aptDescription: "Spacious penthouse with private terrace and panoramic city views. Features high ceilings, chef's kitchen, and master suite with walk-in closet.",
        amenities: ["Terrace", "Gym", "Concierge", "Valet", "Wine Storage"],
        squareFeet: 2200,
        yearBuilt: 2018,
        contact: "Michael Brown - (555) 456-7890"
    },
    {
        aptId: 1004,
        aptType: "Loft",
        aptPrice: 3800,
        aptBedrooms: 1,
        aptLocation: "Williamsburg, Brooklyn",
        aptStatus: "AVAILABLE",
        aptDescription: "Industrial loft with high ceilings, exposed brick, and large windows. Open concept living with modern kitchen and bathroom.",
        amenities: ["Exposed Brick", "High Ceilings", "Roof Access", "Pet Friendly"],
        squareFeet: 950,
        yearBuilt: 1920,
        contact: "Emily Davis - (555) 234-5678"
    },
    {
        aptId: 1005,
        aptType: "Family Apartment",
        aptPrice: 3200,
        aptBedrooms: 3,
        aptLocation: "Astoria, Queens",
        aptStatus: "AVAILABLE",
        aptDescription: "Spacious family apartment near parks and schools. Features updated kitchen, hardwood floors, and ample closet space.",
        amenities: ["Park View", "Playground", "Storage", "Laundry"],
        squareFeet: 1400,
        yearBuilt: 1985,
        contact: "Robert Wilson - (555) 345-6789"
    },
    {
        aptId: 1006,
        aptType: "Luxury High-Rise",
        aptPrice: 5200,
        aptBedrooms: 2,
        aptLocation: "Long Island City, Queens",
        aptStatus: "AVAILABLE",
        aptDescription: "Brand new high-rise with stunning East River views. Building amenities include pool, fitness center, and resident lounge.",
        amenities: ["River View", "Gym", "Pool", "Lounge", "Concierge"],
        squareFeet: 1100,
        yearBuilt: 2022,
        contact: "Jennifer Lee - (555) 567-8901"
    },
    {
        aptId: 1007,
        aptType: "Brownstone",
        aptPrice: 4100,
        aptBedrooms: 2,
        aptLocation: "Park Slope, Brooklyn",
        aptStatus: "PENDING",
        aptDescription: "Classic brownstone with original details, fireplace, and private garden. Located on tree-lined street near Prospect Park.",
        amenities: ["Garden", "Original Details", "Fireplace", "Pet Friendly"],
        squareFeet: 1300,
        yearBuilt: 1905,
        contact: "David Miller - (555) 678-9012"
    },
    {
        aptId: 1008,
        aptType: "Modern Apartment",
        aptPrice: 3500,
        aptBedrooms: 1,
        aptLocation: "Hudson Yards, Manhattan",
        aptStatus: "AVAILABLE",
        aptDescription: "Sleek modern apartment in new development with smart home features and luxury finishes. Close to transportation and shopping.",
        amenities: ["Smart Home", "Gym", "Concierge", "Bike Storage"],
        squareFeet: 750,
        yearBuilt: 2021,
        contact: "Amanda Taylor - (555) 789-0123"
    },
    {
        aptId: 1009,
        aptType: "Waterfront Condo",
        aptPrice: 6800,
        aptBedrooms: 2,
        aptLocation: "DUMBO, Brooklyn",
        aptStatus: "AVAILABLE",
        aptDescription: "Luxury waterfront condo with breathtaking bridge views. Features open layout, premium appliances, and private balcony.",
        amenities: ["Water View", "Balcony", "Gym", "Parking", "Concierge"],
        squareFeet: 1500,
        yearBuilt: 2019,
        contact: "Christopher Clark - (555) 890-1234"
    },
    {
        aptId: 1010,
        aptType: "Garden Apartment",
        aptPrice: 2900,
        aptBedrooms: 2,
        aptLocation: "Forest Hills, Queens",
        aptStatus: "AVAILABLE",
        aptDescription: "Ground floor apartment with private garden in quiet neighborhood. Recently renovated with modern kitchen and bathroom.",
        amenities: ["Private Garden", "Pet Friendly", "Storage", "Laundry"],
        squareFeet: 1000,
        yearBuilt: 1960,
        contact: "Jessica White - (555) 901-2345"
    },
    {
        aptId: 1011,
        aptType: "Luxury Studio",
        aptPrice: 3200,
        aptBedrooms: 1,
        aptLocation: "Chelsea, Manhattan",
        aptStatus: "AVAILABLE",
        aptDescription: "Luxury studio in prime Chelsea location with high-end finishes and building amenities. Walking distance to galleries and restaurants.",
        amenities: ["Gym", "Roof Deck", "Concierge", "Package Room"],
        squareFeet: 650,
        yearBuilt: 2015,
        contact: "Daniel Harris - (555) 012-3456"
    },
    {
        aptId: 1012,
        aptType: "Townhouse",
        aptPrice: 5500,
        aptBedrooms: 3,
        aptLocation: "Carroll Gardens, Brooklyn",
        aptStatus: "AVAILABLE",
        aptDescription: "Beautiful townhouse with garden, fireplace, and original details. Perfect for families seeking space and character.",
        amenities: ["Garden", "Fireplace", "Original Details", "Pet Friendly"],
        squareFeet: 1800,
        yearBuilt: 1930,
        contact: "Michelle Martin - (555) 123-4567"
    }
];

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

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded shadow text-white ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openModal(modalId) {
    if (!checkAdminAuth()) return;
    document.getElementById(modalId).classList.remove('hidden');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
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

// Load section
function loadSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const section = document.getElementById(sectionId);
    if (section) section.classList.remove('hidden');

    if (sectionId === 'apartmentListings') {
        loadApartmentListings();
    } else if (sectionId === 'userManagement') {
        loadUserManagement();
    } else if (sectionId === 'analytics') {
        loadAnalytics();  // Load analytics on section select
    } else if (sectionId === 'locationMaps') {
        loadLocationMaps();  // Load location maps
    } else if (sectionId === 'dashboard') {
        loadDashboard();  // Load dashboard
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
        statusFilter.addEventListener('change', function () {
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
                        callback: function (value) {
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
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${activity.type === 'Apartment' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
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

function cancelEdit(id) {
    const amountCell = document.getElementById(`amount-${id}`);
    const form = document.getElementById(`form-${id}`);
    if (amountCell && form) {
        amountCell.style.display = 'block';
        form.style.display = 'none';
    }
}

// Load apartment listings
async function loadApartmentListings(filterStatus = '') {
    // Update currentFilter if provided (supports dropdown onchange)
    if (typeof filterStatus === 'string') {
        currentFilter = filterStatus;
    }
    const section = document.getElementById('apartmentListings');
    if (!section) return;

    // Show the apartment listings section
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    section.classList.remove('hidden');

    // Set up the apartment listings table
    section.innerHTML = `
        <h1 class="text-2xl font-bold mb-6">Apartment Listings</h1>
        <div class="analytics-filter">
            <label for="statusFilter">Filter by Status:</label>
            <select id="statusFilter" onchange="loadApartmentListings(this.value)">
                <option value="">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="BOOKED">Booked</option>
                <option value="PENDING">Pending</option>
            </select>
            <span class="analytics-filter-info">Select a status to filter apartments</span>
        </div>
        <div class="analytics-loading">Loading...</div>
        <table class="analytics-table">
            <thead>
                <tr>
                    <th class="analytics-th">ID</th>
                    <th class="analytics-th">Type</th>
                    <th class="analytics-th">Price</th>
                    <th class="analytics-th">Bedrooms</th>
                    <th class="analytics-th">Location</th>
                    <th class="analytics-th">Status</th>
                    <th class="analytics-th">Actions</th>
                </tr>
            </thead>
            <tbody id="apartmentListBody"></tbody>
        </table>
    `;

    try {
        const url = currentFilter ? `${API_BASE_URL}/admin/apartments1?status=${encodeURIComponent(currentFilter)}` : `${API_BASE_URL}/admin/apartments1`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Failed to fetch apartments: ${response.status}`);

        const apartments = await response.json();
        allProperties = apartments; // Update global properties for map integration
        const tbody = document.getElementById('apartmentListBody');
        tbody.innerHTML = '';

        apartments.forEach(apt => {
            const row = document.createElement('tr');
            const statusClass = apt.aptStatus === 'AVAILABLE' ? 'status-available' : (apt.aptStatus === 'BOOKED' ? 'status-booked' : 'status-pending');
            row.innerHTML = `
                <td class="analytics-td">${apt.aptId}</td>
                <td class="analytics-td">${apt.aptType}</td>
                <td class="analytics-td">$${parseFloat(apt.aptPrice).toLocaleString()}</td>
                <td class="analytics-td">${apt.aptBedrooms}</td>
                <td class="analytics-td">${apt.aptLocation}</td>
                <td class="analytics-td"><span class="status-badge ${statusClass}">${apt.aptStatus}</span></td>
                <td class="analytics-td">
                    <div class="action-menu">
                        <button class="analytics-edit-btn" onclick="viewApartmentDetails(${apt.aptId})">View</button>
                        <button class="analytics-edit-btn" onclick="editApartment(${apt.aptId})">Edit</button>
                        <button class="analytics-edit-btn danger" onclick="deleteApartment(${apt.aptId})">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelector('.analytics-loading').style.display = 'none';
    } catch (error) {
        console.error('Error loading apartments:', error);
        showToast('Failed to load apartments', 'error');
        document.querySelector('.analytics-loading').style.display = 'none';
    }
}

// Open add apartment modal
function addNewApartment() {
    const modal = document.getElementById('addApartmentModal');
    modal.classList.remove('hidden');
    document.getElementById('newApartmentForm').reset();
}

// Create a new apartment
async function createApartment() {
    const apartment = {
        aptType: document.getElementById('newApartmentType').value,
        aptPrice: parseFloat(document.getElementById('newApartmentPrice').value),
        aptBedrooms: parseInt(document.getElementById('newApartmentBedrooms').value),
        aptLocation: document.getElementById('newApartmentLocation').value,
        aptStatus: document.getElementById('newApartmentStatus').value,
        aptDescription: document.getElementById('newApartmentDescription').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/admin/apartments1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apartment)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create apartment: ${errorText}`);
        }

        showToast('Apartment created successfully', 'success');
        closeModal('addApartmentModal');
        loadApartmentListings();
    } catch (error) {
        console.error('Error creating apartment:', error);
        showToast(error.message, 'error');
    }
}

// View apartment details
async function viewApartmentDetails(apartmentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/apartments1/${apartmentId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Apartment not found');

        const apartment = await response.json();
        const modal = document.getElementById('viewApartmentModal');
        document.getElementById('viewApartmentId').textContent = apartment.aptId;
        document.getElementById('viewApartmentType').textContent = apartment.aptType;
        document.getElementById('viewApartmentPrice').textContent = `$${parseFloat(apartment.aptPrice).toLocaleString()}`;
        document.getElementById('viewApartmentBedrooms').textContent = apartment.aptBedrooms;
        document.getElementById('viewApartmentLocation').textContent = apartment.aptLocation;
        document.getElementById('viewApartmentStatus').textContent = apartment.aptStatus;
        document.getElementById('viewApartmentDescription').textContent = apartment.aptDescription || 'N/A';
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing apartment:', error);
        showToast('Failed to load apartment details', 'error');
    }
}

// Edit apartment
async function editApartment(apartmentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/apartments1/${apartmentId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Apartment not found');

        const apartment = await response.json();
        const modal = document.getElementById('editApartmentModal');
        document.getElementById('editApartmentId').value = apartment.aptId;
        document.getElementById('editApartmentType').value = apartment.aptType;
        document.getElementById('editApartmentPrice').value = apartment.aptPrice;
        document.getElementById('editApartmentBedrooms').value = apartment.aptBedrooms;
        document.getElementById('editApartmentLocation').value = apartment.aptLocation;
        document.getElementById('editApartmentStatus').value = apartment.aptStatus;
        document.getElementById('editApartmentDescription').value = apartment.aptDescription || '';
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading apartment for edit:', error);
        showToast('Failed to load apartment for editing', 'error');
    }
}

// Update apartment
async function updateApartment() {
    const apartmentId = document.getElementById('editApartmentId').value;
    const apartment = {
        aptType: document.getElementById('editApartmentType').value,
        aptPrice: parseFloat(document.getElementById('editApartmentPrice').value),
        aptBedrooms: parseInt(document.getElementById('editApartmentBedrooms').value),
        aptLocation: document.getElementById('editApartmentLocation').value,
        aptStatus: document.getElementById('editApartmentStatus').value,
        aptDescription: document.getElementById('editApartmentDescription').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/admin/apartments1/${apartmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apartment)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update apartment: ${errorText}`);
        }

        showToast('Apartment updated successfully', 'success');
        closeModal('editApartmentModal');
        loadApartmentListings();
    } catch (error) {
        console.error('Error updating apartment:', error);
        showToast(error.message, 'error');
    }
}

// Delete apartment
async function deleteApartment(apartmentId) {
    if (!confirm('Are you sure you want to delete this apartment?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/apartments1/${apartmentId}`, {
            method: 'DELETE'
        });

        if (response.status === 204 || response.ok) {
            showToast('Apartment deleted successfully', 'success');
            // Reload respecting current filter if any
            loadApartmentListings(currentFilter || '');
            return;
        }

        if (response.status === 404) {
            showToast('Apartment not found (it may have already been deleted). Refreshing…', 'info');
            loadApartmentListings(currentFilter || '');
            return;
        }
        if (response.status === 409) {
            const msg = await response.text();
            showToast(msg || 'Cannot delete apartment due to existing related payments.', 'error');
            // Do not refresh automatically; keep the row so user can investigate
            return;
        }

        const errText = await response.text();
        throw new Error(`Failed to delete apartment: ${response.status} ${errText}`);
    } catch (error) {
        console.error('Error deleting apartment:', error);
        showToast('Failed to delete apartment', 'error');
    }
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

// Placeholder for analytics filter initialization
function initAnalyticsFilter() {
    // Add event listener if needed
}

// Placeholder for logout
function adminLogout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
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

async function populateUserTable(users) {
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

// Location Maps Functions
function loadLocationMaps() {
    // Initialize the map
    initMap();

    // Load property data
    loadMapProperties();
}

function initMap() {
    // Initialize Leaflet map centered on New York City
    propertyMap = L.map('propertyMap').setView([40.7128, -74.0060], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(propertyMap);

    // Add scale control
    L.control.scale().addTo(propertyMap);

    // Add legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <h4>Property Status</h4>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #10b981;"></div>
                <span>Available</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #ef4444;"></div>
                <span>Booked</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #f59e0b;"></div>
                <span>Pending</span>
            </div>
        `;
        return div;
    };
    legend.addTo(propertyMap);
}

function loadMapProperties() {
    // For demo purposes, we'll use the sample NYC apartments
    // In a real application, this would fetch from your API
    setTimeout(() => {
        allProperties = nycSampleApartments;
        updateMapWithProperties(allProperties);
        updateMapStats(allProperties);
        populateMapPropertiesTable(allProperties);
    }, 500);
}

function updateMapWithProperties(properties) {
    // Clear existing markers
    mapMarkers.forEach(marker => propertyMap.removeLayer(marker));
    mapMarkers = [];

    // Track used coordinates to avoid overlap
    const usedCoordinates = {};

    properties.forEach((property, index) => {
        // Determine borough based on location
        let borough = 'manhattan';
        if (property.aptLocation.toLowerCase().includes('brooklyn')) borough = 'brooklyn';
        if (property.aptLocation.toLowerCase().includes('queens')) borough = 'queens';

        // Get coordinates for this borough
        const boroughCoords = nycCoordinates[borough];

        // Find an available coordinate for this property
        let coordIndex = index % boroughCoords.length;
        let attempts = 0;

        // Try to find an unused coordinate
        while (usedCoordinates[`${boroughCoords[coordIndex].lat},${boroughCoords[coordIndex].lng}`] && attempts < boroughCoords.length) {
            coordIndex = (coordIndex + 1) % boroughCoords.length;
            attempts++;
        }

        const coords = boroughCoords[coordIndex];
        usedCoordinates[`${coords.lat},${coords.lng}`] = true;

        // Create custom icon based on status
        const iconColor = property.aptStatus === 'AVAILABLE' ? '#10b981' :
            property.aptStatus === 'BOOKED' ? '#ef4444' : '#f59e0b';

        const customIcon = L.divIcon({
            html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            className: 'property-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })
            .addTo(propertyMap)
            .bindPopup(`
                <div class="p-2" style="min-width: 250px;">
                    <h3 class="font-bold text-lg mb-2">${property.aptType || 'Property'}</h3>
                    <div class="space-y-1 text-sm">
                        <p><strong>Price:</strong> $${parseFloat(property.aptPrice || 0).toLocaleString()}/month</p>
                        <p><strong>Bedrooms:</strong> ${property.aptBedrooms || 'N/A'}</p>
                        <p><strong>Location:</strong> ${property.aptLocation || 'N/A'}</p>
                        <p><strong>Size:</strong> ${property.squareFeet || 'N/A'} sq ft</p>
                        <p><strong>Built:</strong> ${property.yearBuilt || 'N/A'}</p>
                        <p><strong>Status:</strong> 
                            <span class="px-2 py-1 rounded-full text-xs font-semibold ${property.aptStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                    property.aptStatus === 'BOOKED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                }">
                                ${property.aptStatus || 'N/A'}
                            </span>
                        </p>
                    </div>
                    <div class="mt-3">
                        <h4 class="font-semibold">Amenities:</h4>
                        <p class="text-xs">${property.amenities ? property.amenities.join(', ') : 'None listed'}</p>
                    </div>
                    <button onclick="viewApartmentDetails(${property.aptId})" 
                            class="mt-3 bg-blue-500 text-white px-3 py-2 rounded text-sm w-full hover:bg-blue-600 transition-colors">
                        View Full Details
                    </button>
                </div>
            `);

        mapMarkers.push(marker);
    });

    // Adjust map bounds to show all markers
    if (properties.length > 0) {
        const group = new L.featureGroup(mapMarkers);
        propertyMap.fitBounds(group.getBounds().pad(0.1));
    }
}

function updateMapStats(properties) {
    const total = properties.length;
    const available = properties.filter(p => p.aptStatus === 'AVAILABLE').length;
    const booked = properties.filter(p => p.aptStatus === 'BOOKED').length;

    // Calculate average price
    const totalPrice = properties.reduce((sum, prop) => sum + (parseFloat(prop.aptPrice) || 0), 0);
    const avgPrice = total > 0 ? totalPrice / total : 0;

    document.getElementById('totalProperties').textContent = total;
    document.getElementById('mapAvailable').textContent = available;
    document.getElementById('mapBooked').textContent = booked;
    document.getElementById('avgPriceMap').textContent = `$${Math.round(avgPrice).toLocaleString()}`;
}

function populateMapPropertiesTable(properties) {
    const tableBody = document.getElementById('mapPropertiesBody');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!properties || properties.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">No properties found</td>
            </tr>
        `;
        return;
    }

    properties.forEach(property => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';

        const price = property.aptPrice ?
            `$${parseFloat(property.aptPrice).toLocaleString()}` : '$0';

        row.innerHTML = `
            <td class="p-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold">
                        ${getInitials(property.aptType)}
                    </div>
                    <div>
                        <div class="font-semibold">${property.aptType || 'N/A'}</div>
                        <div class="text-sm text-gray-500">ID: ${property.aptId || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="p-3">${property.aptType || 'N/A'}</td>
            <td class="p-3 font-semibold">${price}</td>
            <td class="p-3">${property.aptLocation || 'N/A'}</td>
            <td class="p-3">${property.aptBedrooms || 'N/A'}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${property.aptStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                property.aptStatus === 'BOOKED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
            }">
                    ${property.aptStatus || 'N/A'}
                </span>
            </td>
            <td class="p-3">
                <button class="bg-blue-500 text-white px-3 py-1 rounded mr-2" 
                        onclick="viewApartmentDetails(${property.aptId})">
                    View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterMapMarkers(filter) {
    let filteredProperties = allProperties;

    if (filter === 'available') {
        filteredProperties = allProperties.filter(p => p.aptStatus === 'AVAILABLE');
    } else if (filter === 'booked') {
        filteredProperties = allProperties.filter(p => p.aptStatus === 'BOOKED');
    } else if (filter === 'manhattan') {
        filteredProperties = allProperties.filter(p => p.aptLocation.toLowerCase().includes('manhattan'));
    } else if (filter === 'brooklyn') {
        filteredProperties = allProperties.filter(p => p.aptLocation.toLowerCase().includes('brooklyn'));
    } else if (filter === 'queens') {
        filteredProperties = allProperties.filter(p => p.aptLocation.toLowerCase().includes('queens'));
    }

    updateMapWithProperties(filteredProperties);
    populateMapPropertiesTable(filteredProperties);
    updateMapStats(filteredProperties);
}

function refreshMapData() {
    loadMapProperties();
    showToast('Map data refreshed successfully!', 'success');
}

function viewApartmentDetails(apartmentId) {
    const apartment = allProperties.find(apt => apt.aptId === apartmentId);
    if (!apartment) {
        showToast('Apartment not found', 'error');
        return;
    }

    // Create and show a detailed modal for the apartment
    const modalHtml = `
        <div id="apartmentDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">${apartment.aptType}</h2>
                    <button onclick="closeModal('apartmentDetailsModal')" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="apartment-details-grid">
                    <div>
                        <h3 class="text-lg font-semibold mb-3">Property Details</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="font-medium">Property ID:</span>
                                <span>${apartment.aptId}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Type:</span>
                                <span>${apartment.aptType}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Price:</span>
                                <span class="font-semibold">$${apartment.aptPrice.toLocaleString()}/month</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Bedrooms:</span>
                                <span>${apartment.aptBedrooms}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Location:</span>
                                <span>${apartment.aptLocation}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Square Feet:</span>
                                <span>${apartment.squareFeet || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Year Built:</span>
                                <span>${apartment.yearBuilt || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="font-medium">Status:</span>
                                <span class="px-3 py-1 rounded-full text-sm font-semibold ${apartment.aptStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
            apartment.aptStatus === 'BOOKED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
        }">
                                    ${apartment.aptStatus}
                                </span>
                            </div>
                        </div>

                        <h3 class="text-lg font-semibold mt-6 mb-3">Contact Information</h3>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-blue-800">${apartment.contact || 'Contact information not available'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold mb-3">Description</h3>
                        <p class="text-gray-700 mb-6">${apartment.aptDescription}</p>
                        
                        <h3 class="text-lg font-semibold mb-3">Amenities</h3>
                        <div class="amenities-list">
                            ${apartment.amenities ? apartment.amenities.map(amenity =>
            `<span class="amenity-tag">${amenity}</span>`
        ).join('') : '<p class="text-gray-500">No amenities listed</p>'}
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 mt-8 pt-6 border-t">
                    <button onclick="closeModal('apartmentDetailsModal')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        Close
                    </button>
                    <button onclick="editApartment(${apartment.aptId})" class="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
                        Edit
                    </button>
                    ${apartment.aptStatus === 'AVAILABLE' ?
            `<button onclick="bookApartment(${apartment.aptId})" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
                            Book Now
                        </button>` : ''
        }
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('apartmentDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create and append the modal
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

function bookApartment(apartmentId) {
    if (confirm('Are you sure you want to book this apartment?')) {
        // In a real application, this would make an API call to book the apartment
        const apartment = allProperties.find(apt => apt.aptId === apartmentId);
        if (apartment) {
            apartment.aptStatus = 'BOOKED';
            showToast(`Apartment ${apartmentId} booked successfully!`, 'success');
            closeModal('apartmentDetailsModal');
            refreshMapData();
        }
    }
}

// Export functions (placeholders)
function exportUsers() {
    showToast('Exporting users...', 'info');
}

function exportApartments() {
    showToast('Exporting apartments...', 'info');
}

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAdminAuth()) return;

    console.log('Admin panel loaded');
    loadApartmentListings(); // Auto-load apartments
    initAnalyticsFilter(); // Initialize analytics filter listener

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