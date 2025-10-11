// API Base URL
const API_BASE = 'http://localhost:8080/api';
const PURCHASES_API = API_BASE + '/purchases';

// Current property for purchase
let currentProperty = null;
let currentPropertyPrice = 0;
let currentUserID = null; // This should come from login session

// Cached properties to avoid re-fetching on every slider drag
let cachedProperties = [];
let propertiesFetched = false;

// Load properties when page loads
document.addEventListener('DOMContentLoaded', function() {
    // For demo purposes, set a user ID (in real app, this should come from login)
    currentUserID = 1; // This should be dynamic based on logged-in user

    loadProperties();
    setupEventListeners();
    initializePriceSlider();

    // Create a debounced version of applyFilters for slider input
    window.debouncedApplyFilters = debounce(() => applyFilters({silent: true}), 300);
});

// Add event listener to refresh saved properties when page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && propertiesFetched) {
        // Page became visible again, refresh the display to sync saved states
        console.log('Page became visible, refreshing saved property states...');
        displayProperties(cachedProperties);
    }
});

// Add event listener to refresh when user navigates back to the page
window.addEventListener('focus', function() {
    if (propertiesFetched) {
        // Page gained focus, refresh the display to sync saved states
        console.log('Page gained focus, refreshing saved property states...');
        displayProperties(cachedProperties);
    }
});

// Debounce function to prevent excessive filter calls
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Set up event listeners for form interactions
function setupEventListeners() {
    // Purchase form - update price when offer changes
    document.getElementById('purchase-offer').addEventListener('input', updatePriceCalculation);

    // Purchase form submission
    document.getElementById('purchase-form').addEventListener('submit', function(e) {
        e.preventDefault();
        processPurchase();
    });

    // Set minimum date for move-in to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('move-in-date').setAttribute('min', today);
}

// Alias to avoid undefined reference (was updatePriceCalculation in listener)
function updatePriceCalculation() { if (typeof updateOfferCalculation === 'function') { updateOfferCalculation(); } }

// Initialize price range slider
function initializePriceSlider() {
    const minSlider = document.getElementById('price-min');
    const maxSlider = document.getElementById('price-max');
    const minValue = document.getElementById('price-min-value');
    const maxValue = document.getElementById('price-max-value');
    const sliderTrack = document.querySelector('.slider-track');

    function updateSlider() {
        const min = parseInt(minSlider.value);
        const max = parseInt(maxSlider.value);
        if (min > max) {
            minSlider.value = max;
            return updateSlider();
        }
        minValue.textContent = formatPriceDisplay(min);
        maxValue.textContent = max >= 3000 ? '$3000+' : formatPriceDisplay(max);
        const percent1 = ((min - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
        const percent2 = ((max - minSlider.min) / (maxSlider.max - minSlider.min)) * 100;
        if (sliderTrack) {
            sliderTrack.style.background = `linear-gradient(to right, #e0e0e0 ${percent1}%, #4CAF50 ${percent1}%, #4CAF50 ${percent2}%, #e0e0e0 ${percent2}%)`;
        }
        // Trigger debounced silent filtering when user adjusts sliders (guard if not yet defined)
        if (typeof debouncedApplyFilters === 'function') {
            debouncedApplyFilters();
        }
    }

    // Format price for display
    function formatPriceDisplay(price) {
        if (price >= 1000) {
            return '$' + (price / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        } else {
            return '$' + price;
        }
    }

    // Avoid attaching duplicate listeners if re-initialized (e.g., after reset)
    if (!minSlider.dataset.filterListenerAttached) {
        minSlider.addEventListener('input', updateSlider);
        minSlider.addEventListener('change', () => { updateSlider(); applyFilters(); });
        minSlider.dataset.filterListenerAttached = 'true';
    }
    if (!maxSlider.dataset.filterListenerAttached) {
        maxSlider.addEventListener('input', updateSlider);
        maxSlider.addEventListener('change', () => { updateSlider(); applyFilters(); });
        maxSlider.dataset.filterListenerAttached = 'true';
    }

    // Initial paint
    updateSlider();
}

// Normalize property objects from different backend entity variants (Apartment, Apartment1, etc.)
function normalizeProperty(raw) {
    if (!raw || typeof raw !== 'object') return null;

    // Handle price normalization to ensure numeric values (BigDecimal or String conversion)
    let price = 0;
    if (raw.price !== undefined) {
        price = typeof raw.price === 'number' ? raw.price : parseFloat(raw.price);
    } else if (raw.aptPrice !== undefined) {
        // Handle aptPrice which may be BigDecimal serialized as object or string
        if (typeof raw.aptPrice === 'object' && raw.aptPrice !== null) {
            price = parseFloat(raw.aptPrice.toString ? raw.aptPrice.toString() : 0);
        } else {
            price = parseFloat(raw.aptPrice || 0);
        }
    }

    // Debug logging for price conversion
    if (raw.aptPrice && price === 0) {
        console.warn('Price conversion issue:', raw.aptId || 'unknown', 'Raw price:', raw.aptPrice);
    }

    // Detect Apartment1 style (aptPrice, aptBedrooms, aptId, etc.)
    if ('aptPrice' in raw || 'aptBedrooms' in raw || 'aptId' in raw) {
        return {
            apartmentID: raw.apartmentID || raw.aptId || raw.id || 0,
            type: raw.type || raw.aptType || 'Apartment',
            price: price,
            bedrooms: raw.bedrooms != null ? raw.bedrooms : raw.aptBedrooms != null ? raw.aptBedrooms : 0,
            bathrooms: raw.bathrooms != null ? raw.bathrooms : raw.aptBathrooms != null ? raw.aptBathrooms : 1,
            location: raw.location || raw.aptLocation || 'Unknown',
            description: raw.description || raw.aptDescription || '',
            status: raw.status || raw.aptStatus || 'AVAILABLE',
            createdAt: raw.createdAt || raw.aptCreatedAt || new Date().toISOString(),
            amenities: raw.amenities || null
        };
    }

    // Already normalized (Apartment API)
    return {
        apartmentID: raw.apartmentID || raw.id || 0,
        type: raw.type || 'Apartment',
        price: price,
        bedrooms: raw.bedrooms || 0,
        bathrooms: raw.bathrooms || 1,
        location: raw.location || 'Unknown',
        description: raw.description || '',
        status: raw.status || 'AVAILABLE',
        createdAt: raw.createdAt || new Date().toISOString(),
        amenities: raw.amenities || null
    };
}

function normalizeList(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeProperty).filter(Boolean);
}

// Load properties from API
async function loadProperties() {
    const container = document.getElementById('properties-container');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading properties...</p></div>';

    try {
        // Create an array of sample rental properties that always appear
        const sampleRentalProperties = [
            {
                apartmentID: 4001,
                type: "Studio",
                price: 228000, // Will display as $950/mo
                bedrooms: 0,
                bathrooms: 1,
                squareFeet: 0,
                location: "Downtown Studios, San Francisco",
                description: "Cozy studio apartment in trendy neighborhood. Walking distance to cafes, shops and public transport.",
                amenities: { pool: false, gym: true, parking: true, petsAllowed: false, furnished: false }
            },
            {
                apartmentID: 4002,
                type: "Apartment",
                price: 288000, // Will display as $1200/mo
                bedrooms: 1,
                bathrooms: 1,
                squareFeet: 750,
                location: "City Center Lofts, New York",
                description: "Modern studio apartment in the heart of downtown. Floor-to-ceiling windows, stainless steel appliances, and 24-hour security.",
                amenities: { pool: false, gym: true, parking: true, petsAllowed: false, furnished: false }
            },
            {
                apartmentID: 4003,
                type: "Apartment",
                price: 336000, // Will display as $1400/mo
                bedrooms: 2,
                bathrooms: 1,
                squareFeet: 1500,
                location: "Harbor View, Seattle",
                description: "Waterfront apartment with stunning views of the harbor. Recently renovated with modern finishes.",
                amenities: { pool: false, gym: true, parking: true, petsAllowed: true, furnished: false }
            },
            {
                apartmentID: 4004,
                type: "Condo",
                price: 384000, // Will display as $1600/mo
                bedrooms: 2,
                bathrooms: 2,
                squareFeet: 1200,
                location: "Lakeside Condos, Chicago",
                description: "Beautiful condo with lake views, modern kitchen, and in-unit laundry.",
                amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: false }
            },
            {
                apartmentID: 4005,
                type: "Apartment",
                price: 420000, // Will display as $1750/mo
                bedrooms: 3,
                bathrooms: 2,
                squareFeet: 1800,
                location: "Sunset Heights, Miami",
                description: "Spacious apartment with balcony, pool access, and nearby shopping.",
                amenities: { pool: true, gym: false, parking: true, petsAllowed: true, furnished: false }
            }
        ];

        // Store these properties as cached properties so they persist
        cachedProperties = sampleRentalProperties;
        propertiesFetched = true;

        // Try to load from API but don't depend on it
        try {
            const response = await fetch(API_BASE + '/apartments');
            if (response.ok) {
                const apiRaw = await response.json();
                const apiProperties = normalizeList(apiRaw);
                // Combine API properties with sample properties
                cachedProperties = [...apiProperties, ...sampleRentalProperties];
            }
        } catch (apiError) {
            console.warn('API fetch error:', apiError);
            // Continue with sample properties only
        }

        // Always display the cached properties
        displayProperties(cachedProperties);

    } catch (error) {
        console.error('Critical error in loadProperties:', error);
        // Show a meaningful error but still try to display sample properties
        const fallbackProperties = [
            {
                apartmentID: 4001,
                type: "Studio",
                price: 228000,
                bedrooms: 0,
                bathrooms: 1,
                squareFeet: 0,
                location: "Downtown Studios, San Francisco",
                description: "Cozy studio apartment in trendy neighborhood.",
                amenities: { pool: false, gym: true, parking: true, petsAllowed: false, furnished: false }
            }
        ];
        cachedProperties = fallbackProperties;
        displayProperties(fallbackProperties);
    }
}

// Display properties in the grid
async function displayProperties(properties) {
    const container = document.getElementById('properties-container');

    if (properties.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #7f8c8d; grid-column: 1 / -1;">
                <i class="fas fa-home fa-3x" style="margin-bottom: 15px;"></i>
                <h3>No Properties Available</h3>
                <p>Check back later for new property listings.</p>
            </div>
        `;
        return;
    }

    // Get current saved properties to check state
    let savedPropertyIds = new Set();

    try {
        // Get current user from session storage
        const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const userId = sessionUser ? sessionUser.userID : currentUserID;

        // Fetch saved properties from database
        const response = await fetch(`${API_BASE}/saved-properties/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const dbProperties = await response.json();
            dbProperties.forEach(dbProp => {
                try {
                    const propertyData = JSON.parse(dbProp.propertyData || '{}');
                    if (propertyData.apartmentID) {
                        savedPropertyIds.add(propertyData.apartmentID);
                    }
                } catch (parseError) {
                    console.warn('Error parsing saved property data:', parseError);
                }
            });
        }
    } catch (error) {
        console.warn('Error fetching saved properties, using localStorage fallback:', error);
    }

    // Also check localStorage for saved properties
    const localSavedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
    localSavedProperties.forEach(prop => {
        if (prop.apartmentID) {
            savedPropertyIds.add(prop.apartmentID);
        }
    });

    console.log('Current saved property IDs:', Array.from(savedPropertyIds));

    // Only display properties returned by the backend API to ensure valid IDs (needed for saving offers)
    const allProperties = properties;

    container.innerHTML = allProperties.map(property => {
        const propertyId = property.apartmentID || property.id;
        const propertyType = property.type || 'Apartment';
        const bedrooms = property.bedrooms || 0;
        const bathrooms = property.bathrooms || 1;
        const squareFeet = property.squareFeet || Math.floor((property.bedrooms + 1) * 500); // Estimate if not provided

        // Calculate monthly price (for display purposes)
        const monthlyPrice = Math.round(property.price / 240); // Rough estimate for monthly payment

        // Generate image URL based on property type or use existing one
        const imageUrl = property.imageUrl || generateImageUrl(propertyType, propertyId);

        // Check if this property is currently saved
        const isSaved = savedPropertyIds.has(propertyId);
        const heartIcon = isSaved ? 'fas fa-heart' : 'far fa-heart';
        const saveText = isSaved ? 'Saved' : 'Save';
        const saveButtonStyle = isSaved ? 'background-color: #27ae60;' : '';

        return `
            <div class="property-card" id="property-${propertyId}">
                <div class="property-image">
                    <img src="${imageUrl}" alt="${propertyType} in ${property.location}" 
                         onerror="this.src='https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'" />
                </div>
                <div class="property-content">
                    <h3 class="property-price">$${monthlyPrice}/mo</h3>
                    <p class="property-address">${property.location}</p>
                    
                    <div class="property-features">
                        <span><i class="fas fa-bed"></i> ${bedrooms} beds</span>
                        <span><i class="fas fa-bath"></i> ${bathrooms} baths</span>
                        <span><i class="fas fa-ruler-combined"></i> ${squareFeet} sqft</span>
                    </div>
                    
                    <div class="property-type-info">
                        <span class="property-type-badge">${propertyType}</span>
                        <span class="property-date">Available Now</span>
                    </div>
                    
                    <p class="property-description">
                        ${property.description || `${propertyType} Available Now. Contact for more details.`}
                    </p>
                    
                    <div class="property-actions">
                        <button class="btn-book" onclick="openPurchaseModal(${propertyId}, ${property.price})">Book Now</button>
                        <button class="btn-save" id="save-btn-${propertyId}" onclick="saveProperty(${propertyId}, '${imageUrl}')" style="${saveButtonStyle}">
                            <i class="${heartIcon}"></i> ${saveText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Save property function
async function saveProperty(propertyId, imageUrl) {
    console.log('Save button clicked for property:', propertyId, 'with image URL:', imageUrl);

    const saveButton = document.getElementById(`save-btn-${propertyId}`);
    const property = cachedProperties.find(p => p.apartmentID == propertyId) || getSampleProperties().find(p => p.apartmentID == propertyId);

    if (!property) {
        console.error('Property not found:', propertyId);
        showNotification('❌ Error: Property not found!');
        return;
    }

    // Show loading state
    const originalButtonContent = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveButton.disabled = true;

    try {
        console.log('Making API call to save property to database...');

        // Get current user ID (this should be dynamic in a real app)
        const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const userId = sessionUser ? sessionUser.userID : currentUserID || 1;

        // Prepare data to save to SavedProperties table
        const propertyDataForSave = {
            apartmentID: propertyId,
            type: property.type || 'Property',
            price: property.price,
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 1,
            location: property.location,
            description: property.description || '',
            imageUrl: imageUrl,
            savedDate: new Date().toISOString(),
            source: 'buy-page'
        };

        const saveData = {
            userID: userId,
            propertyPrice: property.price.toString(),
            propertyAddress: property.location,
            propertyFeatures: `${property.bedrooms || 0} bed, ${property.bathrooms || 1} bath, ${property.type || 'Property'}`,
            propertyData: propertyDataForSave
        };

        console.log('Sending data to SavedProperties API:', saveData);

        // Test server connectivity first
        try {
            const healthCheck = await fetch(`${API_BASE}/saved-properties/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
                }
            });

            if (!healthCheck.ok && healthCheck.status !== 404) {
                throw new Error(`Server unreachable. Status: ${healthCheck.status}`);
            }
        } catch (connectError) {
            console.error('Server connectivity test failed:', connectError);
            throw new Error('Cannot connect to server. Please check if the application server is running.');
        }

        // Save to SavedProperties table
        const response = await fetch(`${API_BASE}/saved-properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(saveData)
        });

        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);

        if (response.ok) {
            const result = await response.json();
            console.log('Property save response:', result);

            // Verify the response indicates actual success
            if (result.success === true) {
                const isAlreadySaved = result.alreadyExists === true;
                const successMessage = isAlreadySaved ?
                    'Property was already in your favorites!' :
                    'Property saved to database successfully!';

                // Update button appearance
                saveButton.innerHTML = '<i class="fas fa-heart"></i> Saved';
                saveButton.style.backgroundColor = '#27ae60';
                saveButton.disabled = false;
                showNotification(`✅ ${successMessage}`);

                // Also save to localStorage for backup
                let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
                if (!savedProperties.some(p => p.apartmentID == propertyId)) {
                    propertyDataForSave.savedPropertyID = result.savedPropertyID;
                    savedProperties.push(propertyDataForSave);
                    localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
                }

                // Log the activity
                logUserActivity('property', isAlreadySaved ?
                    'Property was already saved in database' :
                    'Property saved to database successfully');

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);

            } else {
                // Server responded but indicated failure
                throw new Error(result.message || 'Server reported save failed');
            }
        } else {
            // HTTP error response
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage += `: ${errorData.message || 'Unknown error'}`;
            } catch (parseErr) {
                const errorText = await response.text();
                errorMessage += `: ${errorText || 'Failed to save property'}`;
            }
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error('Error saving property to database:', error);

        // Reset button state
        saveButton.innerHTML = originalButtonContent;
        saveButton.disabled = false;

        // Show specific error messages
        if (error.message.includes('connect') || error.message.includes('fetch') ||
            error.message.includes('Server unreachable') || error.message.includes('NetworkError')) {
            showNotification('⚠️ Server not running! Property saved locally only.');
            console.warn('Server appears to be down, falling back to localStorage');

            // Fallback to localStorage only
            fallbackToLocalStorage(property, propertyId, imageUrl, saveButton);
        } else {
            showNotification(`❌ Database error: ${error.message}`);
        }
    }
}

// Fallback function to save to localStorage when server is unavailable
function fallbackToLocalStorage(property, propertyId, imageUrl, saveButton) {
    try {
        let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
        const isAlreadySaved = savedProperties.some(p => p.apartmentID == propertyId);

        if (isAlreadySaved) {
            saveButton.innerHTML = '<i class="fas fa-heart"></i> Already Saved';
            saveButton.style.backgroundColor = '#f39c12';
            showNotification('Property was already saved locally!');
        } else {
            // Add to localStorage
            const localProperty = {
                ...property,
                apartmentID: propertyId,
                savedDate: new Date().toISOString(),
                imageUrl: imageUrl,
                source: 'buy-page'
            };
            savedProperties.push(localProperty);
            localStorage.setItem('savedProperties', JSON.stringify(savedProperties));

            saveButton.innerHTML = '<i class="fas fa-heart"></i> Saved Locally';
            saveButton.style.backgroundColor = '#f39c12';
            showNotification('✅ Property saved locally! Will sync when server is available.');

            logUserActivity('property', 'Property saved locally (server unavailable)');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    } catch (localError) {
        console.error('Failed to save to localStorage:', localError);
        showNotification('❌ Failed to save property anywhere!');
    }
}

// Log user activity
function logUserActivity(type, details) {
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
}

// Apply filters
function applyFilters(options = {}) {
    const silent = options.silent === true;
    // Get filter values
    const location = document.getElementById('location').value.toLowerCase();
    const category = document.getElementById('category').value.toLowerCase();

    // Fix: Ensure price values are properly parsed as numbers
    const minPrice = parseInt(document.getElementById('price-min').value, 10);
    const maxPrice = parseInt(document.getElementById('price-max').value, 10);

    console.log(`Filtering prices: $${minPrice} - $${maxPrice}`); // Debug log

    const bedroomsFilter = document.getElementById('bedrooms').value;
    const bathroomsFilter = document.getElementById('bathrooms').value;
    const moveInDate = document.getElementById('move-in-date').value;

    // Check if search icon was clicked
    const isSearchIconClicked = options.searchIconClicked === true;

    // If search icon was clicked, redirect to admin dashboard's saved items section
    if (isSearchIconClicked) {
        window.location.href = 'adindex.html?section=savedItems';
        return;
    }

    // Get amenities
    const hasPool = document.getElementById('pool') && document.getElementById('pool').checked;
    const hasGym = document.getElementById('gym') && document.getElementById('gym').checked;
    const hasParking = document.getElementById('parking') && document.getElementById('parking').checked;
    const allowsPets = document.getElementById('pets-allowed') && document.getElementById('pets-allowed').checked;
    const isFurnished = document.getElementById('furnished') && document.getElementById('furnished').checked;

    // Get sort option
    const sortBy = document.getElementById('sort-by') ? document.getElementById('sort-by').value : 'price-low';

    // Start loading state
    if (!silent) {
        const container = document.getElementById('properties-container');
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Filtering properties...</p></div>';
    }

    // Fetch properties and apply filters
    fetchAndFilterProperties();

    // Show filter notification
    if (!silent) {
        showNotification('Applying filters to properties...');
    }

    // Function to fetch and filter properties
    async function fetchAndFilterProperties() {
        try {
            // Use the cached properties that we know are loaded
            const allProperties = cachedProperties.length > 0 ? cachedProperties : getSampleProperties();
            console.log('All properties to filter:', allProperties.length);

            // Apply filters
            const filteredProperties = allProperties.filter(property => {
                const propertyPrice = property.price || 0;
                const propertyBedrooms = property.bedrooms || 0;
                const propertyBathrooms = property.bathrooms || 1;
                const propertyType = (property.type || 'Apartment').toLowerCase();
                const propertyLocation = (property.location || '').toLowerCase();

                // Filter by location (if specified)
                if (location && !propertyLocation.includes(location)) {
                    return false;
                }

                // Filter by category/type (if specified)
                if (category && category !== '' && propertyType !== category && category !== 'all categories') {
                    return false;
                }

                // Convert UI slider values (0-3000) to actual property prices
                // The slider uses a scale of 0-3000 but properties are priced in full dollars
                const actualMinPrice = minPrice * 1000; // Convert $0-$3000 to $0-$3000000
                const actualMaxPrice = maxPrice >= 3000 ? Number.MAX_SAFE_INTEGER : maxPrice * 1000;

                console.log(`Property price: $${propertyPrice}, Range: $${actualMinPrice}-$${actualMaxPrice}`);

                // Filter by price (if both min and max are valid numbers)
                if (!isNaN(actualMinPrice) && !isNaN(actualMaxPrice)) {
                    if (propertyPrice < actualMinPrice || (maxPrice < 3000 && propertyPrice > actualMaxPrice)) {
                        return false;
                    }
                }

                // Filter by bedrooms (if specified)
                if (bedroomsFilter && bedroomsFilter !== '') {
                    if (bedroomsFilter === '5') {
                        if (propertyBedrooms < 5) return false; // 5+ means 5 or more
                    } else if (propertyBedrooms.toString() !== bedroomsFilter) {
                        return false;
                    }
                }

                // Filter by bathrooms (if specified)
                if (bathroomsFilter && bathroomsFilter !== '') {
                    if (bathroomsFilter === '4') {
                        if (propertyBathrooms < 4) return false; // 4+ means 4 or more
                    } else if (propertyBathrooms.toString() !== bathroomsFilter) {
                        return false;
                    }
                }

                // Filter by amenities (if any selected)
                if (hasPool && (!property.amenities || !property.amenities.pool)) {
                    return false;
                }
                if (hasGym && (!property.amenities || !property.amenities.gym)) {
                    return false;
                }
                if (hasParking && (!property.amenities || !property.amenities.parking)) {
                    return false;
                }
                if (allowsPets && (!property.amenities || !property.amenities.petsAllowed)) {
                    return false;
                }
                if (isFurnished && (!property.amenities || !property.amenities.furnished)) {
                    return false;
                }

                // All filters passed
                return true;
            });

            console.log(`Filtered to ${filteredProperties.length} properties`);

            // Sort properties
            sortProperties(filteredProperties, sortBy);

            // Display filtered properties
            displayProperties(filteredProperties);

            // Update count in notification
            if (!silent) {
                showNotification(`Found ${filteredProperties.length} properties matching your criteria.`);
            }
        } catch (error) {
            console.error('Error filtering properties:', error);
            if (!silent) {
                const container = document.getElementById('properties-container');
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle fa-2x"></i>
                        <p>Error filtering properties: ${error.message}</p>
                        <button class="btn-primary" onclick="applyFilters()">Try Again</button>
                    </div>
                `;
            }
        }
    }
}

// Sort properties based on user selection
function sortProperties(properties, sortBy) {
    switch(sortBy) {
        case 'price-low':
            properties.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            properties.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            properties.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        default:
            // Default sort is by price low to high
            properties.sort((a, b) => a.price - b.price);
    }
    return properties;
}

// Sample properties with various price ranges for testing the filter
function getSampleProperties() {
    const today = new Date();
    return [
        {
            apartmentID: 3001,
            type: "Apartment",
            price: 275000,
            bedrooms: 1,
            bathrooms: 1,
            location: "Downtown Lofts, New York",
            description: "Modern 1-bedroom apartment in central location. Recently renovated with high-end finishes.",
            createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            amenities: { pool: false, gym: true, parking: true, petsAllowed: false, furnished: false }
        },
        {
            apartmentID: 3002,
            type: "Condo",
            price: 450000,
            bedrooms: 2,
            bathrooms: 2,
            location: "Lakeside Condos, Chicago",
            description: "Spacious 2-bedroom condo with lake views. Features granite countertops and stainless appliances.",
            createdAt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 3003,
            type: "House",
            price: 785000,
            bedrooms: 3,
            bathrooms: 2.5,
            location: "Maple Heights, Boston",
            description: "Charming 3-bedroom house in family-friendly neighborhood. Large backyard and updated kitchen.",
            createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            amenities: { pool: false, gym: false, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 3004,
            type: "Townhouse",
            price: 625000,
            bedrooms: 3,
            bathrooms: 2,
            location: "Parkview Commons, Austin",
            description: "Modern townhouse with high ceilings, open floor plan, and private patio.",
            createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            amenities: { pool: true, gym: false, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 3005,
            type: "Villa",
            price: 1250000,
            bedrooms: 4,
            bathrooms: 3.5,
            location: "Sunset Heights, Miami",
            description: "Luxury villa with private pool, gourmet kitchen, and stunning ocean views.",
            createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: true }
        },
        {
            apartmentID: 3006,
            type: "Penthouse",
            price: 1850000,
            bedrooms: 3,
            bathrooms: 3,
            location: "Skyline Towers, San Francisco",
            description: "Breathtaking penthouse apartment with panoramic city views and premium finishes throughout.",
            createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            amenities: { pool: true, gym: true, parking: true, petsAllowed: false, furnished: true }
        },
        {
            apartmentID: 3007,
            type: "Apartment",
            price: 350000,
            bedrooms: 2,
            bathrooms: 1,
            location: "Harbor View, Seattle",
            description: "Waterfront apartment with stunning views and modern amenities.",
            createdAt: today.toISOString(), // Today
            amenities: { pool: false, gym: true, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 3008,
            type: "Mansion",
            price: 2750000,
            bedrooms: 6,
            bathrooms: 5,
            location: "Hillside Estates, Los Angeles",
            description: "Spectacular mansion with swimming pool, home theater, and expansive grounds.",
            createdAt: today.toISOString(), // Today
            amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 3009,
            type: "Ranch",
            price: 1250000,
            bedrooms: 4,
            bathrooms: 3,
            location: "Country Meadows, Denver",
            description: "Spacious ranch house on large lot with mountain views and modern interior.",
            createdAt: today.toISOString(), // Today
            amenities: { pool: false, gym: false, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 3010,
            type: "Studio",
            price: 195000,
            bedrooms: 0,
            bathrooms: 1,
            location: "City Center Studios, Portland",
            description: "Cozy studio apartment in trendy neighborhood close to shops and restaurants.",
            createdAt: today.toISOString(), // Today
            amenities: { pool: false, gym: true, parking: false, petsAllowed: false, furnished: true }
        }
    ];
}

// Reset all filters
function resetFilters() {
    // Reset text/select inputs
    document.getElementById('location').value = '';
    document.getElementById('category').value = '';
    document.getElementById('bedrooms').value = '';
    document.getElementById('bathrooms').value = '';
    document.getElementById('move-in-date').value = '';
    document.getElementById('sort-by').value = 'price-low';

    // Reset price slider (use defined min/max attributes rather than hardcoded 0)
    const minSliderEl = document.getElementById('price-min');
    const maxSliderEl = document.getElementById('price-max');
    if (minSliderEl && maxSliderEl) {
        minSliderEl.value = minSliderEl.min || 50000;
        maxSliderEl.value = maxSliderEl.max || 3000000;
    }
    initializePriceSlider();

    // Reset checkboxes
    document.getElementById('pool').checked = false;
    document.getElementById('gym').checked = false;
    document.getElementById('parking').checked = false;
    document.getElementById('pets-allowed').checked = false;
    document.getElementById('furnished').checked = false;

    // Reload properties
    loadProperties();

    // Show reset notification
    showNotification('All filters have been reset.');
}

// Show a notification message
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Open purchase modal
function openPurchaseModal(propertyId, propertyPrice) {
    currentProperty = propertyId;
    currentPropertyPrice = propertyPrice;

    // Reset form
    document.getElementById('purchase-form').reset();

    // Set fixed property price to $450,000 as shown in the UI
    const fixedPrice = 450000;

    // Set up event listener for offer input to update calculation in real-time
    const offerInput = document.getElementById('purchase-offer');
    offerInput.addEventListener('input', updateOfferCalculation);

    // Initialize offer calculation
    document.getElementById('offer-amount').textContent = '0';
    document.getElementById('difference-amount').textContent = '-450,000';
    document.getElementById('difference-amount').style.color = 'red';

    // Display the modal
    document.getElementById('purchase-modal').style.display = 'flex';
}

// Update offer calculation in purchase modal
function updateOfferCalculation() {
    const offerInput = document.getElementById('purchase-offer');
    const offer = parseInt(offerInput.value) || 0;
    const fixedPrice = 450000; // Fixed property price as shown in UI
    const difference = offer - fixedPrice;

    // Update offer amount
    document.getElementById('offer-amount').textContent = offer.toLocaleString();

    // Update difference with proper formatting and color
    const differenceElement = document.getElementById('difference-amount');
    differenceElement.textContent = difference.toLocaleString();

    // Set color based on difference
    if (difference > 0) {
        differenceElement.style.color = '#27ae60'; // Green for above asking
    } else if (difference < 0) {
        differenceElement.style.color = '#e74c3c'; // Red for below asking
    } else {
        differenceElement.style.color = '#2c3e50'; // Default color for exact match
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Process purchase offer
async function processPurchase() {
    const name = document.getElementById('purchase-name').value;
    const email = document.getElementById('purchase-email').value;
    const phone = document.getElementById('purchase-phone').value;
    const offer = parseInt(document.getElementById('purchase-offer').value) || 0;
    const paymentType = document.getElementById('purchase-type').value;
    const cardNumber = document.getElementById('card-number').value;
    const nameOnCard = document.getElementById('name-on-card').value;

    // Basic validation
    if (!name || !email || !phone || offer <= 0 || !paymentType) {
        alert('Please fill in all required fields and enter a valid offer amount.');
        return;
    }

    // If payment type is not Cash, validate card details
    if (paymentType !== 'Cash' && (!cardNumber || !nameOnCard)) {
        alert('Please provide card details for non-cash payment methods.');
        return;
    }

    // Fixed property price is $450,000 as shown in the UI
    const fixedPrice = 450000;

    // Prepare data to send to the backend
    const purchaseData = {
        userID: currentUserID,
        apartmentID: currentProperty,
        paymentType: paymentType,
        cardNumber: cardNumber || null,
        nameOnCard: nameOnCard || null,
        offerAmount: offer,
        askingPrice: fixedPrice
    };

    try {
        // Show loading state
        const submitButton = document.querySelector('#purchase-form button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;

        // Send data to backend
        const response = await fetch(PURCHASES_API + '/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseData)
        });

        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;

        if (response.ok) {
            const result = await response.json();

            // Show success message with purchase ID
            alert(`Offer submitted successfully!\n\nProperty: $${fixedPrice.toLocaleString()}\nYour Offer: $${offer.toLocaleString()}\nPayment Method: ${paymentType}\nPurchase ID: ${result.purchaseID}`);

            // Update button to show offer submitted
            const purchaseButton = document.getElementById(`purchase-btn-${currentProperty}`);
            if (purchaseButton) {
                purchaseButton.textContent = 'Offer Submitted ✓';
                purchaseButton.style.backgroundColor = '#95a5a6';
                purchaseButton.disabled = true;
                purchaseButton.onclick = null;
            }

            // Log activity for debugging
            console.log('Purchase offer saved successfully:', result);

            // Close the modal
            closeModal('purchase-modal');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit purchase offer');
        }
    } catch (error) {
        console.error('Error processing purchase offer:', error);
        alert(`Error submitting offer: ${error.message}. Please try again.`);
    }
}

// Utility: debounce to limit rapid filter calls during slider drag
function debounce(fn, delay = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Keep a single debounced instance to avoid re-creating on every re-init
const debouncedApplyFilters = debounce(() => {
    if (document.getElementById('price-min') && document.getElementById('price-max')) {
        applyFilters({silent: true});
    }
}, 350);

// Generate a placeholder image URL based on property type
function generateImageUrl(propertyType, propertyId) {
    const imageUrls = {
        'Studio': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
        'Apartment': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        'Condo': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
        'House': 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
        'Townhouse': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        'Villa': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
        'Penthouse': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
        'Mansion': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
        'Ranch': 'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=400'
    };

    return imageUrls[propertyType] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400';
}
