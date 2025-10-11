// Dashboard JavaScript

// API Base URL
const API_BASE = 'http://localhost:8080/api';

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

// Load saved properties from database and localStorage
async function loadSavedProperties() {
    try {
        // Get current user from session storage (more reliable than localStorage for logged-in users)
        let sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));

        // If no session user, try localStorage
        if (!sessionUser) {
            sessionUser = JSON.parse(localStorage.getItem('currentUser'));
        }

        // If still no user, set default user ID 1 (matching your database)
        const userId = sessionUser ? sessionUser.userID || sessionUser.id : 1;

        console.log('Dashboard: Loading saved properties for user:', userId);
        console.log('Dashboard: Session user:', sessionUser);
        console.log('Dashboard: Using user ID:', userId);

        // Set up default auth token if not present
        if (!sessionStorage.getItem('authToken') && !localStorage.getItem('authToken')) {
            sessionStorage.setItem('authToken', 'default-token');
            console.log('Dashboard: Set default auth token for database access');
        }

        // First try to load from database with enhanced error handling
        let savedProperties = [];
        let dbLoadSuccess = false;

        try {
            console.log('Dashboard: Attempting to fetch from:', `${API_BASE}/saved-properties/user/${userId}`);

            const response = await fetch(`${API_BASE}/saved-properties/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || 'default-token'}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Dashboard: Database response status:', response.status);
            console.log('Dashboard: Database response ok:', response.ok);

            if (response.ok) {
                const dbProperties = await response.json();
                console.log('Dashboard: Raw database response:', dbProperties);
                console.log('Dashboard: Loaded properties from database:', dbProperties.length);

                if (Array.isArray(dbProperties) && dbProperties.length > 0) {
                    dbLoadSuccess = true;

                    // Convert database format to display format with enhanced rental detection
                    savedProperties = dbProperties.map(dbProp => {
                        console.log('Dashboard: Processing database property:', dbProp);

                        try {
                            const propertyData = dbProp.propertyData ? JSON.parse(dbProp.propertyData) : {};
                            console.log('Dashboard: Parsed property data:', propertyData);

                            // Enhanced rental detection logic
                            const isRental = propertyData.propertyType === 'RENTAL' ||
                                           propertyData.isRental === true ||
                                           propertyData.source === 'rent-page' ||
                                           (dbProp.propertyFeatures && dbProp.propertyFeatures.includes('(RENTAL)')) ||
                                           (dbProp.propertyFeatures && dbProp.propertyFeatures.includes('RENTAL'));

                            const convertedProperty = {
                                savedPropertyID: dbProp.savedPropertyID, // Important: keep database ID for removal
                                apartmentID: propertyData.apartmentID || 0,
                                type: propertyData.type || 'Property',
                                price: propertyData.price || parseFloat(dbProp.propertyPrice) || 0,
                                bedrooms: propertyData.bedrooms || 0,
                                bathrooms: propertyData.bathrooms || 1,
                                location: dbProp.propertyAddress || propertyData.location || propertyData.address || 'Unknown location',
                                description: propertyData.description || '',
                                savedDate: dbProp.savedAt || propertyData.savedDate,
                                imageUrl: propertyData.imageUrl || null,
                                propertyType: isRental ? 'RENTAL' : (propertyData.propertyType || null),
                                isRental: isRental,
                                source: propertyData.source || 'database',
                                features: dbProp.propertyFeatures || propertyData.features || '',
                                fromDatabase: true
                            };

                            console.log('Dashboard: Converted property:', convertedProperty);
                            return convertedProperty;

                        } catch (parseError) {
                            console.warn('Dashboard: Error parsing property data for savedPropertyID', dbProp.savedPropertyID, ':', parseError);

                            // Fallback conversion for properties with invalid JSON
                            const isRentalFromFeatures = dbProp.propertyFeatures &&
                                (dbProp.propertyFeatures.includes('(RENTAL)') || dbProp.propertyFeatures.includes('RENTAL'));

                            return {
                                savedPropertyID: dbProp.savedPropertyID,
                                apartmentID: 0,
                                type: 'Property',
                                price: parseFloat(dbProp.propertyPrice) || 0,
                                bedrooms: 0,
                                bathrooms: 1,
                                location: dbProp.propertyAddress || 'Unknown location',
                                description: 'Property data not available',
                                savedDate: dbProp.savedAt,
                                propertyType: isRentalFromFeatures ? 'RENTAL' : null,
                                isRental: isRentalFromFeatures,
                                features: dbProp.propertyFeatures || '',
                                fromDatabase: true
                            };
                        }
                    });
                } else {
                    console.log('Dashboard: Database returned empty array or invalid data');
                }
            } else {
                const errorText = await response.text();
                console.warn('Dashboard: Database request failed:', response.status, errorText);
                if (response.status === 404) {
                    console.log('Dashboard: No saved properties found in database for user', userId);
                }
            }
        } catch (dbError) {
            console.error('Dashboard: Database connection error:', dbError);
            console.log('Dashboard: Will fall back to localStorage data only');
        }

        // Always try to load from localStorage and merge (for offline saves or as backup)
        const localProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        console.log('Dashboard: Found local properties:', localProperties.length);

        if (!dbLoadSuccess && localProperties.length === 0) {
            console.log('Dashboard: No data found in database or localStorage');
        }

        // Add local properties that aren't already in database (avoid duplicates by apartmentID)
        const dbApartmentIds = new Set(savedProperties.map(p => p.apartmentID));
        const uniqueLocalProperties = localProperties
            .filter(localProp => !dbApartmentIds.has(localProp.apartmentID))
            .map(prop => ({
                ...prop,
                propertyType: prop.propertyType || (prop.isRental ? 'RENTAL' : null),
                isRental: prop.isRental || prop.propertyType === 'RENTAL' || prop.source === 'rent-page',
                fromDatabase: false
            }));

        savedProperties = [...savedProperties, ...uniqueLocalProperties];

        console.log('Dashboard: Total merged properties:', savedProperties.length);
        console.log('Dashboard: Database properties:', savedProperties.filter(p => p.fromDatabase).length);
        console.log('Dashboard: Local properties:', savedProperties.filter(p => !p.fromDatabase).length);
        console.log('Dashboard: Rental properties found:', savedProperties.filter(p => p.isRental).length);

        // Update count
        savedPropertiesCount.textContent = savedProperties.length;

        // Clear container
        savedPropertiesContainer.innerHTML = '';

        if (savedProperties.length === 0) {
            // Show empty state with troubleshooting info
            savedPropertiesContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-heart-broken"></i>
                    <p>No saved properties found.</p>
                    <p style="font-size: 14px; color: #666;">
                        Checked database for user ID: ${userId}<br>
                        Database connection: ${dbLoadSuccess ? '✅ Success' : '❌ Failed'}<br>
                        Local storage: ${localProperties.length} properties
                    </p>
                    <div style="margin-top: 15px;">
                        <a href="buy.html" class="btn-view" style="display: inline-block; margin-right: 10px;">
                            Browse Properties for Sale
                        </a>
                        <a href="rent.html" class="btn-view" style="display: inline-block;">
                            Browse Rental Properties
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        // Display each property
        savedProperties.forEach((property, index) => {
            console.log(`Dashboard: Creating card for property ${index + 1}:`, property);
            const propertyCard = createPropertyCard(property);
            savedPropertiesContainer.appendChild(propertyCard);
        });

        console.log('Dashboard: Successfully displayed all saved properties');

    } catch (error) {
        console.error('Dashboard: Critical error loading saved properties:', error);

        // Fallback to localStorage only
        const savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        console.log('Dashboard: Fallback to localStorage only, found:', savedProperties.length);

        savedPropertiesCount.textContent = savedProperties.length;
        savedPropertiesContainer.innerHTML = '';

        if (savedProperties.length === 0) {
            savedPropertiesContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-heart-broken"></i>
                    <p>No saved properties yet.</p>
                    <p>Start exploring properties and save your favorites!</p>
                    <div style="margin-top: 15px;">
                        <a href="buy.html" class="btn-view" style="display: inline-block; margin-right: 10px;">
                            Browse Properties for Sale
                        </a>
                        <a href="rent.html" class="btn-view" style="display: inline-block;">
                            Browse Rental Properties
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        savedProperties.forEach(property => {
            // Ensure rental properties are properly marked even in fallback
            property.isRental = property.isRental || property.propertyType === 'RENTAL' || property.source === 'rent-page';
            property.propertyType = property.isRental ? 'RENTAL' : property.propertyType;
            const propertyCard = createPropertyCard({...property, fromDatabase: false});
            savedPropertiesContainer.appendChild(propertyCard);
        });
    }
}

// Create HTML for property card
function createPropertyCard(property) {
    const div = document.createElement('div');
    div.className = 'saved-property-card';

    // Format price for display
    const formattedPrice = property.price ? `$${property.price.toLocaleString()}` : 'Price on request';

    // Format date if available
    const savedDate = property.savedDate ? new Date(property.savedDate).toLocaleDateString() : 'Recently';

    // Use savedPropertyID for database properties, apartmentID for localStorage properties
    const removeId = property.fromDatabase ? property.savedPropertyID : property.apartmentID;
    const isFromDatabase = property.fromDatabase ? 'true' : 'false';

    // Determine if this is a rental property and set appropriate badge and pricing display
    // Check multiple indicators to ensure we catch all rental properties
    const isRental = property.propertyType === 'RENTAL' ||
                    (property.features && property.features.includes('(Rental)')) ||
                    (property.propertyType && property.propertyType.toUpperCase() === 'RENTAL');

    const propertyBadge = isRental ? 'FOR RENT' : 'FOR SALE';
    const priceDisplay = isRental ? `${formattedPrice}/mo` : formattedPrice;

    div.innerHTML = `
        <div class="property-image">
            <div class="property-badge" style="${isRental ? 'background-color: #3498db;' : ''}">${propertyBadge}</div>
            ${property.imageUrl ? 
                `<img src="${property.imageUrl}" alt="Property Image" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
            <i class="fas fa-home fa-3x" style="${property.imageUrl ? 'display:none;' : ''}"></i>
        </div>
        <div class="property-content">
            <div class="property-price">${priceDisplay}</div>
            <div class="property-address">${property.location || 'Location unavailable'}</div>
            <div class="property-features">
                <span><i class="fas fa-bed"></i> ${property.bedrooms || 0} beds</span>
                <span><i class="fas fa-bath"></i> ${property.bathrooms || 0} baths</span>
                <span><i class="fas fa-ruler-combined"></i> ${Math.floor((property.bedrooms || 1) * 750).toLocaleString()} sqft</span>
            </div>
            <div class="property-features">
                <span class="property-type-badge" style="${isRental ? 'background-color: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;' : ''}">${property.type || 'Property'}${isRental ? ' (Rental)' : ''}</span>
                <span>Saved on: ${savedDate}</span>
            </div>
            <div class="property-actions">
                <button class="btn-view" onclick="viewProperty(${property.apartmentID}, ${isRental})">View Details</button>
                <button class="btn-remove" onclick="removeProperty(${removeId}, ${isFromDatabase})">Remove</button>
            </div>
        </div>
    `;

    return div;
}

// View property details
function viewProperty(propertyId, isRental = false) {
    // Log this action
    logActivity('navigation', `Viewed ${isRental ? 'rental' : 'sale'} property details (ID: ${propertyId})`);

    // Navigate to the appropriate page based on property type
    if (isRental) {
        window.location.href = `rent.html?view=${propertyId}`;
    } else {
        window.location.href = `buy.html?view=${propertyId}`;
    }
}

// Remove property from saved list and database
async function removeProperty(propertyId, isFromDatabase = false) {
    try {
        console.log('removeProperty called with:', { propertyId, isFromDatabase });

        // Convert string values to proper types
        const actualPropertyId = parseInt(propertyId);
        const fromDatabase = isFromDatabase === 'true' || isFromDatabase === true;

        // Show loading state
        const removeButtons = document.querySelectorAll('.btn-remove');
        const targetButton = Array.from(removeButtons).find(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            return onclickAttr && onclickAttr.includes(propertyId.toString());
        });

        if (targetButton) {
            targetButton.textContent = 'Removing...';
            targetButton.disabled = true;
        }

        let removalSuccess = false;
        let errorMessage = '';

        // Get current user ID
        const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const userId = sessionUser ? sessionUser.userID : 1;

        // Strategy 1: If this is marked as a database property, try direct deletion
        if (fromDatabase) {
            try {
                console.log('Attempting direct database removal with savedPropertyID:', actualPropertyId);

                const response = await fetch(`${API_BASE}/saved-properties/${actualPropertyId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
                    }
                });

                console.log('DELETE API Response status:', response.status);

                if (response.ok) {
                    const result = await response.json();
                    console.log('Database deletion response:', result);

                    if (result.success) {
                        removalSuccess = true;
                        logActivity('property', 'Removed saved property from database');
                        console.log('Database removal successful');
                    } else {
                        errorMessage = result.message || 'Database reported deletion failure';
                        console.warn('Database removal reported failure:', result.message);
                    }
                } else {
                    const errorText = await response.text();
                    errorMessage = `HTTP ${response.status}: ${errorText}`;
                    console.error('Database removal failed:', response.status, errorText);
                }
            } catch (dbError) {
                errorMessage = `Database error: ${dbError.message}`;
                console.warn('Database removal error:', dbError.message);
            }
        }

        // Strategy 2: If direct deletion failed or this is a localStorage property, search by apartmentID
        if (!removalSuccess) {
            try {
                console.log('Searching for property in database by apartmentID:', actualPropertyId);

                // Get all saved properties for this user
                const listResponse = await fetch(`${API_BASE}/saved-properties/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
                    }
                });

                if (listResponse.ok) {
                    const savedProperties = await listResponse.json();
                    console.log('Found saved properties:', savedProperties.length);

                    // Find the property with matching apartmentID
                    let foundProperty = null;
                    for (const savedProp of savedProperties) {
                        try {
                            const propertyData = JSON.parse(savedProp.propertyData || '{}');
                            if (propertyData.apartmentID === actualPropertyId) {
                                foundProperty = savedProp;
                                break;
                            }
                        } catch (parseError) {
                            console.warn('Error parsing property data:', parseError);
                        }
                    }

                    if (foundProperty) {
                        console.log('Found property in database with savedPropertyID:', foundProperty.savedPropertyID);

                        // Delete using the correct savedPropertyID
                        const deleteResponse = await fetch(`${API_BASE}/saved-properties/${foundProperty.savedPropertyID}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
                            }
                        });

                        if (deleteResponse.ok) {
                            const result = await deleteResponse.json();
                            if (result.success) {
                                removalSuccess = true;
                                console.log('Property successfully removed from database via search');
                                logActivity('property', 'Removed saved property from database via search');
                            } else {
                                errorMessage = result.message || 'Database reported deletion failure';
                            }
                        } else {
                            const errorText = await deleteResponse.text();
                            errorMessage = `HTTP ${deleteResponse.status}: ${errorText}`;
                        }
                    } else {
                        console.log('Property not found in database, proceeding with localStorage cleanup only');
                        removalSuccess = true; // Not an error if property doesn't exist in database
                    }
                } else {
                    console.warn('Failed to fetch user saved properties for search');
                    // Don't treat this as failure - continue with localStorage cleanup
                    removalSuccess = true;
                }
            } catch (searchError) {
                console.warn('Error searching for property in database:', searchError.message);
                // Don't treat this as failure - continue with localStorage cleanup
                removalSuccess = true;
            }
        }

        // Strategy 3: Clean up localStorage regardless of database operation
        try {
            let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
            const initialLength = savedProperties.length;

            // Remove by both apartmentID and savedPropertyID to handle all cases
            savedProperties = savedProperties.filter(property => {
                const propApartmentId = property.apartmentID || property.id;
                const propSavedId = property.savedPropertyID;

                return propApartmentId !== actualPropertyId &&
                       propSavedId !== actualPropertyId &&
                       propApartmentId !== propertyId &&
                       propSavedId !== propertyId;
            });

            if (savedProperties.length < initialLength) {
                localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
                logActivity('property', 'Removed saved property from local storage');
                console.log('Property removed from localStorage');
            }
        } catch (localError) {
            console.warn('Error cleaning localStorage:', localError.message);
        }

        // Handle results
        if (removalSuccess) {
            // Show success notification
            showNotification('✅ Property removed successfully!');

            // Immediately remove the property card from DOM
            if (targetButton) {
                const propertyCard = targetButton.closest('.saved-property-card');
                if (propertyCard) {
                    propertyCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    propertyCard.style.opacity = '0';
                    propertyCard.style.transform = 'scale(0.95)';

                    setTimeout(() => {
                        propertyCard.remove();

                        // Update the count immediately
                        const currentCount = parseInt(savedPropertiesCount.textContent) || 0;
                        savedPropertiesCount.textContent = Math.max(0, currentCount - 1);

                        // Check if no properties left and show empty state
                        const remainingCards = document.querySelectorAll('.saved-property-card');
                        if (remainingCards.length === 0) {
                            savedPropertiesContainer.innerHTML = `
                                <div class="empty-state" style="grid-column: 1 / -1;">
                                    <i class="fas fa-heart-broken"></i>
                                    <p>No saved properties yet.</p>
                                    <p>Start exploring properties and save your favorites!</p>
                                    <div style="margin-top: 15px;">
                                        <a href="buy.html" class="btn-view" style="display: inline-block; margin-right: 10px;">
                                            Browse Properties for Sale
                                        </a>
                                        <a href="rent.html" class="btn-view" style="display: inline-block;">
                                            Browse Rental Properties
                                        </a>
                                    </div>
                                </div>
                            `;
                        }
                    }, 300);
                } else {
                    // Fallback: reload the entire saved properties list
                    console.log('Property card not found in DOM, reloading saved properties');
                    setTimeout(() => {
                        loadSavedProperties();
                    }, 100);
                }
            } else {
                // Fallback: reload the entire saved properties list
                console.log('Remove button not found, reloading saved properties');
                setTimeout(() => {
                    loadSavedProperties();
                }, 100);
            }
        } else {
            throw new Error(errorMessage || 'Failed to remove property from database');
        }

    } catch (error) {
        console.error('Error removing property:', error);

        // Reset button state
        const removeButtons = document.querySelectorAll('.btn-remove');
        const targetButton = Array.from(removeButtons).find(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            return onclickAttr && onclickAttr.includes(propertyId.toString());
        });

        if (targetButton) {
            targetButton.textContent = 'Remove';
            targetButton.disabled = false;
        }

        // Show error notification
        showNotification('❌ Failed to remove property: ' + error.message);
    }
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

// Show notification function
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2c3e50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
