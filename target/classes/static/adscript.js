// Global variables
let currentApartmentData = {};
let currentSection = 'dashboard';
const API_BASE_URL = 'http://localhost:8080';
let map; // Google Maps object
let markers = []; // Array to store map markers
let allMapProperties = []; // Store all properties for filtering
let leafletMode = false; // true when using Leaflet fallback
let markersLayer; // Leaflet feature group for markers
let drawnBoundary = null; // Leaflet polygon layer
let useClustering = false;
let autoFitEnabled = true;
let clusterGroup = null;

// Sample property location data for the map - expanded with more diverse properties for filter demonstration
const sampleLocations = [
    // Luxury properties
    { id: 1, name: "Luxury Penthouse", type: "Penthouse", price: "$5,500,000", numericPrice: 5500000, beds: 4, lat: 40.7128, lng: -74.0060, location: "New York, NY", status: "Available", image: "https://via.placeholder.com/100?text=Penthouse" },
    { id: 2, name: "Ocean View Condo", type: "Condo", price: "$2,300,000", numericPrice: 2300000, beds: 3, lat: 25.7617, lng: -80.1918, location: "Miami, FL", status: "Available", image: "https://via.placeholder.com/100?text=Condo" },
    { id: 3, name: "Downtown Loft", type: "Loft", price: "$1,200,000", numericPrice: 1200000, beds: 2, lat: 41.8781, lng: -87.6298, location: "Chicago, IL", status: "Pending", image: "https://via.placeholder.com/100?text=Loft" },
    { id: 4, name: "Hollywood Hills Villa", type: "Villa", price: "$7,800,000", numericPrice: 7800000, beds: 5, lat: 34.0522, lng: -118.2437, location: "Los Angeles, CA", status: "Available", image: "https://via.placeholder.com/100?text=Villa" },

    // Mid-range properties
    { id: 5, name: "Bayside Apartment", type: "Apartment", price: "$950,000", numericPrice: 950000, beds: 2, lat: 37.7749, lng: -122.4194, location: "San Francisco, CA", status: "Booked", image: "https://via.placeholder.com/100?text=Apartment" },
    { id: 6, name: "Garden District Home", type: "House", price: "$1,700,000", numericPrice: 1700000, beds: 4, lat: 29.9511, lng: -90.0715, location: "New Orleans, LA", status: "Available", image: "https://via.placeholder.com/100?text=House" },
    { id: 7, name: "Lakefront Condo", type: "Condo", price: "$1,850,000", numericPrice: 1850000, beds: 3, lat: 41.8781, lng: -87.6298, location: "Chicago, IL", status: "Pending", image: "https://via.placeholder.com/100?text=Condo2" },

    // Affordable options
    { id: 8, name: "Downtown Apartment", type: "Apartment", price: "$750,000", numericPrice: 750000, beds: 1, lat: 47.6062, lng: -122.3321, location: "Seattle, WA", status: "Available", image: "https://via.placeholder.com/100?text=Studio" },
    { id: 9, name: "Historic Brownstone", type: "Townhouse", price: "$3,200,000", numericPrice: 3200000, beds: 4, lat: 42.3601, lng: -71.0589, location: "Boston, MA", status: "Available", image: "https://via.placeholder.com/100?text=Brownstone" },

    // Additional options with varied characteristics
    { id: 10, name: "Mountain View Retreat", type: "Cabin", price: "$1,100,000", numericPrice: 1100000, beds: 3, lat: 39.7392, lng: -104.9903, location: "Denver, CO", status: "Booked", image: "https://via.placeholder.com/100?text=Cabin" },
    { id: 11, name: "River Walk Studio", type: "Apartment", price: "$680,000", numericPrice: 680000, beds: 1, lat: 29.4241, lng: -98.4936, location: "San Antonio, TX", status: "Available", image: "https://via.placeholder.com/100?text=Studio" },
    { id: 12, name: "French Quarter Condo", type: "Condo", price: "$925,000", numericPrice: 925000, beds: 2, lat: 29.9584, lng: -90.0644, location: "New Orleans, LA", status: "Pending", image: "https://via.placeholder.com/100?text=Condo3" },

    // More Available apartments for demonstration
    { id: 13, name: "Midtown Apartment", type: "Apartment", price: "$890,000", numericPrice: 890000, beds: 2, lat: 33.7490, lng: -84.3880, location: "Atlanta, GA", status: "Available", image: "https://via.placeholder.com/100?text=Atlanta" },
    { id: 14, name: "Waterfront Apartment", type: "Apartment", price: "$970,000", numericPrice: 970000, beds: 2, lat: 38.9072, lng: -77.0369, location: "Washington, DC", status: "Available", image: "https://via.placeholder.com/100?text=DC" },
    { id: 15, name: "Arts District Loft", type: "Loft", price: "$1,050,000", numericPrice: 1050000, beds: 2, lat: 34.0482, lng: -118.2437, location: "Los Angeles, CA", status: "Available", image: "https://via.placeholder.com/100?text=Loft2" },
    { id: 16, name: "Central Park View", type: "Apartment", price: "$2,200,000", numericPrice: 2200000, beds: 3, lat: 40.7831, lng: -73.9712, location: "New York, NY", status: "Available", image: "https://via.placeholder.com/100?text=CPV" },
    { id: 17, name: "Wrigleyville Apartment", type: "Apartment", price: "$780,000", numericPrice: 780000, beds: 2, lat: 41.9484, lng: -87.6553, location: "Chicago, IL", status: "Available", image: "https://via.placeholder.com/100?text=Wrigley" },
    { id: 18, name: "Marina District Condo", type: "Condo", price: "$1,450,000", numericPrice: 1450000, beds: 2, lat: 37.8030, lng: -122.4350, location: "San Francisco, CA", status: "Available", image: "https://via.placeholder.com/100?text=Marina" },
    { id: 19, name: "Downtown Dallas Apt", type: "Apartment", price: "$695,000", numericPrice: 695000, beds: 2, lat: 32.7767, lng: -96.7970, location: "Dallas, TX", status: "Available", image: "https://via.placeholder.com/100?text=Dallas" },
    { id: 20, name: "South Beach Studio", type: "Apartment", price: "$550,000", numericPrice: 550000, beds: 1, lat: 25.7825, lng: -80.1340, location: "Miami, FL", status: "Available", image: "https://via.placeholder.com/100?text=SoBe" }
];

// City to coordinate mapping for backend apartment locations (extend as needed)
const cityCoordinates = {
    'NEW YORK': { lat: 40.7128, lng: -74.0060 },
    'MIAMI': { lat: 25.7617, lng: -80.1918 },
    'CHICAGO': { lat: 41.8781, lng: -87.6298 },
    'LOS ANGELES': { lat: 34.0522, lng: -118.2437 },
    'SAN FRANCISCO': { lat: 37.7749, lng: -122.4194 },
    'NEW ORLEANS': { lat: 29.9511, lng: -90.0715 },
    'SEATTLE': { lat: 47.6062, lng: -122.3321 },
    'BOSTON': { lat: 42.3601, lng: -71.0589 },
    'DENVER': { lat: 39.7392, lng: -104.9903 },
    'SAN ANTONIO': { lat: 29.4241, lng: -98.4936 },
    'AUSTIN': { lat: 30.2672, lng: -97.7431 },
    'DALLAS': { lat: 32.7767, lng: -96.7970 },
    'HOUSTON': { lat: 29.7604, lng: -95.3698 },
    'ATLANTA': { lat: 33.7490, lng: -84.3880 },
    'ORLANDO': { lat: 28.5383, lng: -81.3792 },
    'PHOENIX': { lat: 33.4484, lng: -112.0740 },
    'PORTLAND': { lat: 45.5152, lng: -122.6784 },
    'LAS VEGAS': { lat: 36.1699, lng: -115.1398 },
    'CHARLOTTE': { lat: 35.2271, lng: -80.8431 },
    'NASHVILLE': { lat: 36.1627, lng: -86.7816 }
};

// Helper: Convert backend status to display status
function normalizeStatus(raw) {
    if (!raw) return 'Pending';
    const up = raw.toUpperCase();
    if (up === 'AVAILABLE') return 'Available';
    if (up === 'BOOKED' || up === 'SOLD') return 'Booked';
    if (up === 'PENDING' || up === 'UNDER_REVIEW') return 'Pending';
    return 'Pending';
}

// Check admin authentication
function checkAdminAuth() {
    // For development purposes, bypass authentication check
    return true;

    // In production, enable this:
    /*
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.isAdmin) {
        alert('Access denied. Please login as admin.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
    */
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

    // Update current section
    currentSection = section;

    if (section === 'apartmentListings') {
        loadApartmentListings();
    } else if (section === 'userManagement') {
        loadUserManagement();
    } else if (section === 'savedItems') {
        loadSavedItems();
    } else if (section === 'locationMaps') {
        initLocationMap(); // Initialize the map when this section is loaded
    }
}

// Initialize application - AUTO-LOAD APARTMENTS
document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication first
    if (!checkAdminAuth()) return;

    console.log('Admin panel loaded');
    // Auto-load apartments when page loads
    loadApartmentListings();

    // Add logout button to sidebar
    addLogoutButton();

    // Load Google Maps API
    loadGoogleMapsScript();
});

// Load Google Maps API script
function loadGoogleMapsScript() {
    if (window.google && window.google.maps) {
        // Google Maps already loaded, initialize map if needed
        if (currentSection === 'locationMaps') {
            initLocationMap();
        }
        return;
    }

    const script = document.createElement('script');
    // Use a callback that doesn't require an API key for development
    script.src = "https://maps.googleapis.com/maps/api/js?callback=googleMapsLoaded";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Fallback if Google Maps fails to load
    setTimeout(() => {
        if (!window.google || !window.google.maps) {
            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full bg-gray-100 p-4 rounded-lg">
                        <div class="text-xl font-bold text-red-500 mb-2">Map Loading Error</div>
                        <p class="text-gray-700 text-center">
                            Google Maps could not be loaded. Please check your internet connection and try again.
                            For development purposes, you can continue to use the application without the map.
                        </p>
                        <button onclick="loadGoogleMapsScript()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                            Try Again
                        </button>
                    </div>
                `;
            }
        }
    }, 5000);
}

// Callback when Google Maps API is loaded
window.googleMapsLoaded = function() {
    console.log('Google Maps API loaded');
    // If the location maps section is currently active, initialize the map
    if (currentSection === 'locationMaps') {
        initLocationMap();
    }
};

// Attempt to load real apartments for the map
async function loadMapDataFromAPI() {
    try {
        const resp = await fetch(`${API_BASE_URL}/admin/apartments1`);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const apartments = await resp.json();
        // Transform to map property objects (only ones we can geocode)
        const transformed = apartments
            .map(a => {
                const cityRaw = (a.aptLocation || '').split(',')[0].trim();
                const cityKey = cityRaw.toUpperCase();
                const coords = cityCoordinates[cityKey];
                if (!coords) return null; // skip if no coordinate mapping
                return {
                    id: a.aptId || 0,
                    name: a.aptType ? `${a.aptType} #${a.aptId}` : `Apartment #${a.aptId}`,
                    type: a.aptType || 'Apartment',
                    price: a.aptPrice ? `$${Number(a.aptPrice).toLocaleString()}` : '$0',
                    numericPrice: a.aptPrice ? Number(a.aptPrice) : 0,
                    beds: a.aptBedrooms || 0,
                    lat: coords.lat + (Math.random() - 0.5) * 0.05, // slight jitter to avoid overlap
                    lng: coords.lng + (Math.random() - 0.5) * 0.05,
                    location: a.aptLocation || cityRaw,
                    status: normalizeStatus(a.aptStatus),
                    image: 'https://via.placeholder.com/100'
                };
            })
            .filter(Boolean);
        if (transformed.length) {
            allMapProperties = transformed; // replace global dataset
            console.log('Loaded map apartments from API:', transformed.length);
            return true;
        }
        console.warn('No mappable apartments found, falling back to samples');
        return false;
    } catch (e) {
        console.warn('Failed to load apartments for map, using samples. Reason:', e.message);
        return false;
    }
}

// Initialize the location map
function initLocationMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    mapContainer.innerHTML = '';
    leafletMode = true; // force Leaflet only now
    // initialize map once
    if (!map) {
        map = L.map('map-container', { preferCanvas: true }).setView([39.8283, -98.5795], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        setupDrawListeners();
    }
    loadMapDataFromAPI().then(success => {
        if (!success) allMapProperties = [...sampleLocations];
        renderCurrentMarkers(allMapProperties, true);
        populateFeaturedLocations();
        document.getElementById('property-count').textContent = allMapProperties.length;
    });
}

// Filter map markers based on selected criteria
function filterMapMarkers() {
    renderCurrentMarkers(allMapProperties);
}

// Reset all map filters
function resetMapFilters() {
    ['mapFilterType','mapFilterPrice','mapFilterBeds','mapFilterStatus'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='all';});
    clearBoundary();
    renderCurrentMarkers(allMapProperties,true);
}

// Clear all markers from the map
function clearMarkers() {
    if (clusterGroup) { clusterGroup.clearLayers(); }
    if (markersLayer) { markersLayer.clearLayers(); }
    markers = [];
}

// Add property markers to the map
function addPropertyMarkers(properties) {
    if (!map) return;
    clearMarkers();
    if (useClustering) {
        if (!clusterGroup) {
            clusterGroup = L.markerClusterGroup({
                showCoverageOnHover:false,
                spiderfyOnEveryZoom:true,
                maxClusterRadius:50
            });
        }
        clusterGroup.clearLayers();
    } else {
        if (!markersLayer) markersLayer = L.featureGroup().addTo(map);
        else markersLayer.clearLayers();
    }

    const bounds = [];
    properties.forEach(p => {
        const color = p.status === 'Available' ? '#16a34a' : p.status === 'Pending' ? '#d97706' : '#dc2626';
        const markerIcon = L.divIcon({
            className: 'ph-marker',
            html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35);"></div>`
        });
        const m = L.marker([p.lat, p.lng], { icon: markerIcon, title: p.name });
        m.bindPopup(`<div style=\"min-width:200px;\"><h3 style=\"font-weight:600;margin:0 0 4px;font-size:14px;\">${p.name}</h3><p style=\"margin:0;font-size:12px;color:#374151;\"><strong>Type:</strong> ${p.type}<br><strong>Price:</strong> ${p.price}<br><strong>Beds:</strong> ${p.beds}<br><strong>Status:</strong> <span style=\"color:${color}\">${p.status}</span></p><button onclick=\"viewProperty(${p.id})\" style=\"margin-top:6px;background:#2563eb;color:#fff;padding:5px 10px;border:none;border-radius:4px;font-size:12px;cursor:pointer;\">View</button></div>`);
        if (useClustering) clusterGroup.addLayer(m); else markersLayer.addLayer(m);
        markers.push(m);
        bounds.push([p.lat, p.lng]);
    });
    if (useClustering) clusterGroup.addTo(map);
    if (autoFitEnabled && bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.2));
}

// new helper to apply filters + markers
function renderCurrentMarkers(source, fullReload=false){
    // apply current UI filters
    const typeFilter = document.getElementById('mapFilterType')?.value || 'all';
    const priceFilter = document.getElementById('mapFilterPrice')?.value || 'all';
    const bedsFilter = document.getElementById('mapFilterBeds')?.value || 'all';
    const statusFilter = document.getElementById('mapFilterStatus')?.value || 'all';
    const [minPrice, maxPrice] = priceFilter !== 'all' ? priceFilter.split('-').map(Number) : [0, Number.MAX_SAFE_INTEGER];
    const boundaryGeo = (drawnBoundary) ? drawnBoundary.toGeoJSON() : null;
    const filtered = source.filter(p => {
        if (typeFilter !== 'all' && p.type !== typeFilter) return false;
        if (p.numericPrice < minPrice || p.numericPrice > maxPrice) return false;
        if (bedsFilter !== 'all') {
            if (bedsFilter === '5+' && p.beds < 5) return false; else if (bedsFilter !== '5+' && p.beds !== parseInt(bedsFilter)) return false;
        }
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (boundaryGeo) {
            try { if (!turf.booleanPointInPolygon(turf.point([p.lng, p.lat]), boundaryGeo)) return false; } catch (_) {}
        }
        return true;
    });
    addPropertyMarkers(filtered);
    document.getElementById('property-count').textContent = filtered.length;
    populateFeaturedLocations(filtered);
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

// Saved Items Functions
function loadSavedItems() {
    fetch(`${API_BASE_URL}/admin/saved-items`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load saved items');
            return response.json();
        })
        .then(items => {
            populateSavedItemsTable(items);
        })
        .catch(error => {
            console.error('Error loading saved items:', error);
            document.getElementById('savedItemsTableBody').innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-red-500">
                        Error loading saved items: ${error.message}
                    </td>
                </tr>
            `;
        });
}

function populateSavedItemsTable(items) {
    const tableBody = document.getElementById('savedItemsTableBody');

    if (!tableBody) {
        console.error('savedItemsTableBody element not found!');
        return;
    }

    tableBody.innerHTML = '';

    if (!items || items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">No saved items found</td>
            </tr>
        `;
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';

        row.innerHTML = `
            <td class="p-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold">
                        ${getInitials(item.apartment.aptType)}
                    </div>
                    <div>
                        <div class="font-semibold">${item.apartment.aptType || 'N/A'}</div>
                        <div class="text-sm text-gray-500">ID: ${item.apartment.aptId || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="p-3">${item.apartment.aptLocation || 'N/A'}</td>
            <td class="p-3">${item.apartment.aptPrice ? `$${item.apartment.aptPrice}` : 'N/A'}</td>
            <td class="p-3">
                <button class="bg-blue-500 text-white px-3 py-1 rounded mr-2" onclick="viewSavedItem(${item.id})">View</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="deleteSavedItem(${item.id})">Remove</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function viewSavedItem(id) {
    fetch(`${API_BASE_URL}/admin/saved-items/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Saved item not found');
            return response.json();
        })
        .then(item => {
            // Populate view modal
            document.getElementById('viewSavedItemId').textContent = item.id || 'N/A';
            document.getElementById('viewSavedApartmentType').textContent = item.apartment.aptType || 'N/A';
            document.getElementById('viewSavedApartmentPrice').textContent = item.apartment.aptPrice ? `$${item.apartment.aptPrice}` : 'N/A';
            document.getElementById('viewSavedApartmentLocation').textContent = item.apartment.aptLocation || 'N/A';
            document.getElementById('viewSavedApartmentStatus').textContent = item.apartment.aptStatus || 'N/A';
            document.getElementById('viewSavedApartmentDescription').textContent = item.apartment.aptDescription || 'N/A';

            openModal('viewSavedItemModal');
        })
        .catch(error => {
            showToast('Error loading saved item: ' + error.message, 'error');
        });
}

function deleteSavedItem(id) {
    if (confirm('Are you sure you want to remove this item from saved items?')) {
        fetch(`${API_BASE_URL}/admin/saved-items/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to remove saved item');
                showToast('Saved item removed successfully!', 'success');
                loadSavedItems();
            })
            .catch(error => {
                showToast('Error removing saved item: ' + error.message, 'error');
            });
    }
}

// --- Boundary Drawing Functions ---
function setupDrawListeners() {
    map.off('draw:created');
    map.on('draw:created', e=>{ if(drawnBoundary) map.removeLayer(drawnBoundary); drawnBoundary=e.layer; drawnBoundary.setStyle({color:'#15803d',weight:2,fillOpacity:0.08}); map.addLayer(drawnBoundary); document.getElementById('drawBoundaryBtn')?.classList.add('boundary-active'); renderCurrentMarkers(allMapProperties); });
}
function beginBoundaryDraw() {
    const drawer=new L.Draw.Polygon(map,{shapeOptions:{color:'#15803d',weight:2,fillOpacity:0.08}});drawer.enable();
}
function clearBoundary() {
    if (drawnBoundary && map){ map.removeLayer(drawnBoundary);}
    drawnBoundary=null;
    document.getElementById('drawBoundaryBtn')?.classList.remove('boundary-active');
    renderCurrentMarkers(allMapProperties);
}
function resetMapView(){
    if(!map) return; if(markers.length){ const g=L.featureGroup(markers); map.fitBounds(g.getBounds().pad(0.2)); } else { map.setView([39.8283,-98.5795],4);} }
// clustering toggles
function toggleClustering(enabled){ useClustering = enabled; renderCurrentMarkers(allMapProperties,true); }
function setAutoFit(enabled){ autoFitEnabled = enabled; }
// options panel
function toggleMapOptions(force){
    const panel=document.getElementById('map-options-panel');
    const btn=document.getElementById('optionsToggleBtn');
    const show = (typeof force === 'boolean')? force : panel.classList.contains('hidden');
    if(show){ panel.classList.remove('hidden'); btn.classList.add('active'); } else { panel.classList.add('hidden'); btn.classList.remove('active'); }
}
