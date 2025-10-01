// Global variables
let currentApartmentData = {};
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
    }
}

// ... rest of your existing adscript.js code remains the same ...

// Initialize application - AUTO-LOAD APARTMENTS
document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication first
    if (!checkAdminAuth()) return;

    console.log('Admin panel loaded');
    // Auto-load apartments when page loads
    loadApartmentListings();

    // Add logout button to sidebar
    addLogoutButton();
});

// Add logout button to sidebar
function addLogoutButton() {
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
}

// Utility Functions
function showToast(message, type = 'success') {
    alert(`${type.toUpperCase()}: ${message}`);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function getInitials(text) {
    return text ? text.charAt(0).toUpperCase() : 'A';
}

// Section Management
function loadSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(section).classList.remove('hidden');

    if (section === 'apartmentListings') {
        loadApartmentListings();
    } else if (section === 'userManagement') {
        loadUserManagement();
    }
}

// Load Apartments from Database
function loadApartmentListings() {
    console.log('Attempting to load apartments from:', `${API_BASE_URL}/admin/apartments1`);

    fetch(`${API_BASE_URL}/admin/apartments1`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                // Try to get the error message from response
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
            document.getElementById('apartmentTableBody').innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-red-500">
                        Server Error: ${error.message}<br>
                        Check Spring Boot console for details
                    </td>
                </tr>
            `;
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

        // Format price properly
        const price = apartment.aptPrice ?
            `$${parseFloat(apartment.aptPrice).toLocaleString()}` : '$0';

        // Format date properly
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

    // Update stats cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.text-2xl').textContent = total;
        statCards[1].querySelector('.text-2xl').textContent = available;
        statCards[2].querySelector('.text-2xl').textContent = booked;
        statCards[3].querySelector('.text-2xl').textContent = pending;
    }
}

// Apartment CRUD Operations
function addNewApartment() {
    openModal('addApartmentModal');
}

function createApartment() {
    const formData = {
        aptType: document.getElementById('newApartmentType').value,
        aptPrice: parseFloat(document.getElementById('newApartmentPrice').value),
        aptBedrooms: parseInt(document.getElementById('newApartmentBedrooms').value),
        aptLocation: document.getElementById('newApartmentLocation').value,
        aptStatus: document.getElementById('newApartmentStatus').value || 'AVAILABLE',
        aptDescription: document.getElementById('newApartmentDescription').value || ''
    };

    // Validation
    if (!formData.aptType || !formData.aptPrice || !formData.aptBedrooms || !formData.aptLocation) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    fetch(`${API_BASE_URL}/admin/apartments1`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to create apartment');
            return response.json();
        })
        .then(newApartment => {
            showToast('Apartment created successfully!', 'success');
            closeModal('addApartmentModal');
            document.getElementById('newApartmentForm').reset();

            // Reload the apartment list to show the new data
            loadApartmentListings();
        })
        .catch(error => {
            console.error('Error creating apartment:', error);
            showToast('Error creating apartment: ' + error.message, 'error');
        });
}

function viewApartment(id) {
    fetch(`${API_BASE_URL}/admin/apartments1/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Apartment not found');
            return response.json();
        })
        .then(apartment => {
            // Populate view modal
            document.getElementById('viewApartmentId').textContent = apartment.aptId || 'N/A';
            document.getElementById('viewApartmentType').textContent = apartment.aptType || 'N/A';
            document.getElementById('viewApartmentPrice').textContent = apartment.aptPrice ? `$${apartment.aptPrice}` : 'N/A';
            document.getElementById('viewApartmentBedrooms').textContent = apartment.aptBedrooms || 'N/A';
            document.getElementById('viewApartmentLocation').textContent = apartment.aptLocation || 'N/A';
            document.getElementById('viewApartmentStatus').textContent = apartment.aptStatus || 'N/A';
            document.getElementById('viewApartmentDescription').textContent = apartment.aptDescription || 'N/A';

            openModal('viewApartmentModal');
        })
        .catch(error => {
            showToast('Error loading apartment: ' + error.message, 'error');
        });
}

function editApartment(id) {
    fetch(`${API_BASE_URL}/admin/apartments1/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Apartment not found');
            return response.json();
        })
        .then(apartment => {
            currentApartmentData = apartment;

            // Populate edit form
            document.getElementById('editApartmentId').value = apartment.aptId;
            document.getElementById('editApartmentType').value = apartment.aptType || '';
            document.getElementById('editApartmentPrice').value = apartment.aptPrice || '';
            document.getElementById('editApartmentBedrooms').value = apartment.aptBedrooms || '';
            document.getElementById('editApartmentLocation').value = apartment.aptLocation || '';
            document.getElementById('editApartmentStatus').value = apartment.aptStatus || 'AVAILABLE';
            document.getElementById('editApartmentDescription').value = apartment.aptDescription || '';

            openModal('editApartmentModal');
        })
        .catch(error => {
            showToast('Error loading apartment: ' + error.message, 'error');
        });
}

function updateApartment() {
    const id = document.getElementById('editApartmentId').value;
    const formData = {
        aptType: document.getElementById('editApartmentType').value,
        aptPrice: parseFloat(document.getElementById('editApartmentPrice').value),
        aptBedrooms: parseInt(document.getElementById('editApartmentBedrooms').value),
        aptLocation: document.getElementById('editApartmentLocation').value,
        aptStatus: document.getElementById('editApartmentStatus').value,
        aptDescription: document.getElementById('editApartmentDescription').value
    };

    fetch(`${API_BASE_URL}/admin/apartments1/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update apartment');
            return response.json();
        })
        .then(updatedApartment => {
            showToast('Apartment updated successfully!', 'success');
            closeModal('editApartmentModal');
            loadApartmentListings();
        })
        .catch(error => {
            showToast('Error updating apartment: ' + error.message, 'error');
        });
}

function deleteApartment(id) {
    if (confirm('Are you sure you want to delete this apartment?')) {
        fetch(`${API_BASE_URL}/admin/apartments1/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete apartment');
                showToast('Apartment deleted successfully!', 'success');
                loadApartmentListings();
            })
            .catch(error => {
                showToast('Error deleting apartment: ' + error.message, 'error');
            });
    }
}

// User Management Functions
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
            document.getElementById('userTableBody').innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-red-500">
                        Error loading users: ${error.message}
                    </td>
                </tr>
            `;
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
    const active = users.length; // You can add status field to users if needed
    const premium = 0; // Add premium field to users if needed
    const suspended = 0; // Add status field to users if needed

    // Update user stats cards - target only user management section stats
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
            // Populate view modal
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
            // Populate edit form
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

// Initialize application - AUTO-LOAD APARTMENTS
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel loaded');
    // Auto-load apartments when page loads
    loadApartmentListings();
});