// Dashboard JavaScript

// DOM elements
const savedPropertiesContainer = document.getElementById('savedPropertiesContainer');
const savedPropertiesCount = document.getElementById('savedPropertiesCount');
const recentActivitiesCount = document.getElementById('recentActivitiesCount');
const activitiesList = document.getElementById('activitiesList');
const userProfileName = document.getElementById('userProfileName');

// Current user info (normally would come from backend/session)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com'
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Set user name
    userProfileName.textContent = currentUser.name;

    // Load saved properties
    loadSavedProperties();

    // Add logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Log activity
    logActivity('navigation', 'Accessed dashboard page');
});

// Load saved properties from localStorage
function loadSavedProperties() {
    // Get saved properties from localStorage
    const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];

    // Update count
    savedPropertiesCount.textContent = savedProperties.length;

    // Clear container
    savedPropertiesContainer.innerHTML = '';

    if (savedProperties.length === 0) {
        // Show empty state
        savedPropertiesContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-heart-broken"></i>
                <p>No saved properties yet.</p>
                <p>Start exploring properties and save your favorites!</p>
                <a href="buy.html" class="btn-view" style="display: inline-block; margin-top: 15px;">
                    Browse Properties
                </a>
            </div>
        `;
        return;
    }

    // Display each property
    savedProperties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        savedPropertiesContainer.appendChild(propertyCard);
    });
}

// Create HTML for property card
function createPropertyCard(property) {
    const div = document.createElement('div');
    div.className = 'saved-property-card';

    // Format price for display
    const formattedPrice = property.price ? `$${property.price.toLocaleString()}` : 'Price on request';

    // Format date if available
    const savedDate = property.savedDate ? new Date(property.savedDate).toLocaleDateString() : 'Recently';

    div.innerHTML = `
        <div class="property-image">
            <div class="property-badge">FOR SALE</div>
            <i class="fas fa-home fa-3x"></i>
        </div>
        <div class="property-content">
            <div class="property-price">${formattedPrice}</div>
            <div class="property-address">${property.location || 'Location unavailable'}</div>
            <div class="property-features">
                <span><i class="fas fa-bed"></i> ${property.bedrooms || 0} beds</span>
                <span><i class="fas fa-bath"></i> ${property.bathrooms || 0} baths</span>
                <span><i class="fas fa-ruler-combined"></i> ${Math.floor((property.bedrooms || 1) * 750).toLocaleString()} sqft</span>
            </div>
            <div class="property-features">
                <span>${property.type || 'Property'}</span>
                <span>Saved on: ${savedDate}</span>
            </div>
            <div class="property-actions">
                <button class="btn-view" onclick="viewProperty(${property.apartmentID})">View Details</button>
                <button class="btn-remove" onclick="removeProperty(${property.apartmentID})">Remove</button>
            </div>
        </div>
    `;

    return div;
}

// View property details
function viewProperty(propertyId) {
    // In a real application, this would navigate to the property details page
    window.location.href = `buy.html?view=${propertyId}`;
}

// Remove property from saved list
function removeProperty(propertyId) {
    // Get current saved properties
    let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];

    // Filter out the property to remove
    savedProperties = savedProperties.filter(property => property.apartmentID !== propertyId);

    // Save back to localStorage
    localStorage.setItem('savedProperties', JSON.stringify(savedProperties));

    // Log activity
    logActivity('property', 'Removed saved property');

    // Reload saved properties
    loadSavedProperties();
}

// Log user activity
function logActivity(type, details) {
    // Get current activities
    let activities = JSON.parse(localStorage.getItem('userActivities')) || [];

    // Add new activity at the beginning
    activities.unshift({
        type: type,
        details: details,
        timestamp: new Date().toISOString()
    });

    // Keep only the latest 20 activities
    if (activities.length > 20) {
        activities = activities.slice(0, 20);
    }

    // Save back to localStorage
    localStorage.setItem('userActivities', JSON.stringify(activities));

    // Update activities display
    updateActivitiesDisplay(activities);
}

// Update activities display
function updateActivitiesDisplay(activities) {
    // Update count
    recentActivitiesCount.textContent = activities.length;

    // Clear list
    activitiesList.innerHTML = '';

    // Display each activity (only show the first 5)
    const activitiesToShow = activities.slice(0, 5);

    activitiesToShow.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';

        const date = new Date(activity.timestamp);
        const formattedDate = `${date.toLocaleDateString()}, ${date.toLocaleTimeString()}`;

        activityItem.innerHTML = `
            <div class="activity-type">${activity.type}:</div>
            <div class="activity-details">${activity.details}</div>
            <div class="activity-time">${formattedDate}</div>
        `;

        activitiesList.appendChild(activityItem);
    });
}
