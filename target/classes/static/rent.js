// API Base URL
const API_BASE = 'http://localhost:8080/api';
const PAYMENTS_API = API_BASE + '/payments';

// Current property for booking
let currentProperty = null;
let currentMonthlyRent = 0;
let currentUserID = null; // This should come from login session

// Load properties when page loads
document.addEventListener('DOMContentLoaded', function() {
    // For demo purposes, set a user ID (in real app, this should come from login)
    currentUserID = 1; // This should be dynamic based on logged-in user

    loadProperties();
    setupEventListeners();
    initializePriceSlider();
});

// Set up event listeners for form interactions
function setupEventListeners() {
    // Booking form - update price when duration changes (use 'input' for real-time updates on number field)
    document.getElementById('booking-duration').addEventListener('input', updatePriceCalculation);

    // Booking form submission
    document.getElementById('booking-form').addEventListener('submit', function(e) {
        e.preventDefault();
        processBooking();
    });

    // Set minimum date for move-in to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('move-in-date').setAttribute('min', today);
}

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

// Load properties from API
async function loadProperties() {
    const container = document.getElementById('properties-container');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading properties...</p></div>';

    try {
        const response = await fetch(API_BASE + '/apartments');
        if (!response.ok) throw new Error('Failed to fetch properties');

        const properties = await response.json();
        console.log('Apartments loaded:', properties); // Debug log
        displayProperties(properties);
    } catch (error) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <p>Error loading properties: ${error.message}</p>
                <button class="btn-primary" onclick="loadProperties()">Try Again</button>
            </div>
        `;
        console.error('Error loading properties:', error);
    }
}

// Normalize property objects from different backend entity variants
function normalizeProperty(property) {
    if (!property || typeof property !== 'object') return null;

    // Handle price normalization
    let price = 0;
    if (property.price !== undefined) {
        price = typeof property.price === 'number' ? property.price : parseFloat(property.price);
    } else if (property.aptPrice !== undefined) {
        // Handle aptPrice which may be BigDecimal serialized as object or string
        if (typeof property.aptPrice === 'object' && property.aptPrice !== null) {
            price = parseFloat(property.aptPrice.toString ? property.aptPrice.toString() : 0);
        } else {
            price = parseFloat(property.aptPrice || 0);
        }
    }

    // Return normalized property
    return {
        apartmentID: property.apartmentID || property.aptId || property.id || 0,
        type: property.type || property.aptType || 'Apartment',
        price: price,
        bedrooms: property.bedrooms != null ? property.bedrooms : property.aptBedrooms != null ? property.aptBedrooms : 0,
        bathrooms: property.bathrooms != null ? property.bathrooms : property.aptBathrooms != null ? property.aptBathrooms : 1,
        location: property.location || property.aptLocation || 'Unknown',
        description: property.description || property.aptDescription || '',
        status: property.status || property.aptStatus || 'AVAILABLE',
        createdAt: property.createdAt || property.aptCreatedAt || new Date().toISOString(),
        amenities: property.amenities || null
    };
}

// Display properties in the grid
function displayProperties(properties) {
    const container = document.getElementById('properties-container');

    if (!properties || properties.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #7f8c8d; grid-column: 1 / -1;">
                <i class="fas fa-home fa-3x" style="margin-bottom: 15px;"></i>
                <h3>No Properties Available</h3>
                <p>Check back later for new property listings.</p>
            </div>
        `;
        return;
    }

    // Normalize all properties to ensure consistent format
    const normalizedProperties = properties.map(prop => normalizeProperty(prop)).filter(Boolean);

    console.log('Normalized properties:', normalizedProperties); // Debug log

    container.innerHTML = normalizedProperties.map(property => {
        const propertyId = property.apartmentID;
        const monthlyRent = property.price;
        // Calculate the monthly rent based on property price (for rentals we'll use 0.5% of purchase price as monthly rent)
        const calculatedMonthlyRent = property.price * 0.005; // This is just for demo purposes
        const actualMonthlyRent = property.price > 10000 ? calculatedMonthlyRent : monthlyRent;

        return `
            <div class="property-card">
                <div class="property-image">
                    <div class="property-badge">FOR RENT</div>
                    <i class="fas fa-building fa-3x"></i>
                </div>
                <div class="property-content">
                    <div class="property-header">
                        <div class="property-price">$${actualMonthlyRent.toFixed(0)}/mo</div>
                        <div class="property-address">${property.location}</div>
                    </div>
                    
                    <div class="property-features">
                        <span><i class="fas fa-bed"></i> ${property.bedrooms} beds</span>
                        <span><i class="fas fa-bath"></i> ${property.bathrooms} baths</span>
                        <span><i class="fas fa-ruler-combined"></i> ${property.bedrooms * 750} sqft</span>
                    </div>
                    
                    <div class="property-type-info">
                        <span class="property-type-badge">${property.type}</span>
                        <span class="property-date">Available Now</span>
                    </div>
                    
                    ${property.description ? `<div class="property-description">${property.description}</div>` : ''}
                    
                    <div class="property-actions">
                        <button class="btn-book" onclick="openBookingModal(${propertyId}, ${actualMonthlyRent})">Book Now</button>
                        <button class="btn-save"><i class="far fa-heart"></i> Save</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Apply filters to properties
function applyFilters(options = {}) {
    const silent = options && options.silent === true;

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

    // Get amenities (with null checks)
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

    // Fetch and filter properties
    fetchAndFilterProperties();

    // Show filter notification
    if (!silent) {
        showNotification('Applying filters to properties...');
    }

    // Function to fetch and filter properties
    async function fetchAndFilterProperties() {
        try {
            const response = await fetch(API_BASE + '/apartments');
            if (!response.ok) throw new Error('Failed to fetch properties');

            const apiProperties = await response.json();

            // Get sample rental properties
            const sampleProperties = getSampleRentalProperties();

            // Combine API and sample properties
            const allProperties = [...apiProperties, ...sampleProperties];

            // Normalize all properties for consistent handling
            const normalizedProperties = allProperties.map(prop => normalizeProperty(prop)).filter(Boolean);

            // Apply filters
            const filteredProperties = normalizedProperties.filter(property => {
                // Calculate monthly rent (for rental properties we use either the direct price or 0.5% of purchase price)
                const propertyPrice = property.price || 0;
                const calculatedMonthlyRent = property.price * 0.005;
                const actualRent = property.price > 10000 ? calculatedMonthlyRent : propertyPrice;

                // For rental filtering, we use the monthly rent value
                const propertyPriceToFilter = actualRent;

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

                // Fix: Improved price range filtering logic
                if (!isNaN(minPrice) && !isNaN(maxPrice) && (propertyPriceToFilter < minPrice || propertyPriceToFilter > maxPrice)) {
                    console.log(`Filtering out property: $${propertyPriceToFilter} (outside range $${minPrice}-$${maxPrice})`);
                    return false;
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
            properties.sort((a, b) => {
                const aRent = a.price > 10000 ? a.price * 0.005 : a.price;
                const bRent = b.price > 10000 ? b.price * 0.005 : b.price;
                return aRent - bRent;
            });
            break;
        case 'price-high':
            properties.sort((a, b) => {
                const aRent = a.price > 10000 ? a.price * 0.005 : a.price;
                const bRent = b.price > 10000 ? b.price * 0.005 : b.price;
                return bRent - aRent;
            });
            break;
        case 'newest':
            properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            properties.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        default:
            // Default sort is by price low to high
            properties.sort((a, b) => {
                const aRent = a.price > 10000 ? a.price * 0.005 : a.price;
                const bRent = b.price > 10000 ? b.price * 0.005 : b.price;
                return aRent - bRent;
            });
    }
    return properties;
}

// Reset all filters
function resetFilters() {
    // Reset text/select inputs
    document.getElementById('location').value = '';
    document.getElementById('category').value = '';
    document.getElementById('bedrooms').value = '';
    document.getElementById('bathrooms').value = '';
    document.getElementById('move-in-date').value = '';
    if (document.getElementById('sort-by')) {
        document.getElementById('sort-by').value = 'price-low';
    }

    // Reset price slider
    const minSliderEl = document.getElementById('price-min');
    const maxSliderEl = document.getElementById('price-max');
    if (minSliderEl && maxSliderEl) {
        minSliderEl.value = minSliderEl.min || 0;
        maxSliderEl.value = maxSliderEl.max || 3000;
    }
    initializePriceSlider();

    // Reset checkboxes
    if (document.getElementById('pool')) document.getElementById('pool').checked = false;
    if (document.getElementById('gym')) document.getElementById('gym').checked = false;
    if (document.getElementById('parking')) document.getElementById('parking').checked = false;
    if (document.getElementById('pets-allowed')) document.getElementById('pets-allowed').checked = false;
    if (document.getElementById('furnished')) document.getElementById('furnished').checked = false;

    // Reload properties
    loadProperties();

    // Show reset notification
    showNotification('All filters have been reset.');
}

// Save property function
function saveProperty(propertyId) {
    // Find the property in our data
    const allProperties = [...properties, ...getSampleRentalProperties()];
    const property = allProperties.find(p => p.apartmentID == propertyId);

    if (!property) {
        console.error('Property not found:', propertyId);
        return;
    }

    // Get existing saved properties from localStorage
    let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];

    // Check if this property is already saved
    const isAlreadySaved = savedProperties.some(p => p.apartmentID == propertyId);

    if (isAlreadySaved) {
        // Remove from saved properties
        savedProperties = savedProperties.filter(p => p.apartmentID != propertyId);
        localStorage.setItem('savedProperties', JSON.stringify(savedProperties));

        // Update the button to show "Save" again
        const saveBtn = document.querySelector(`#property-${propertyId} .btn-save`);
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="far fa-heart"></i>';
            saveBtn.classList.remove('saved');
        }

        showNotification('Property removed from favorites!');
    } else {
        // Add current date to property
        property.savedDate = new Date().toISOString();
        // Add to saved properties
        savedProperties.push(property);
        localStorage.setItem('savedProperties', JSON.stringify(savedProperties));

        // Update the button to show "Saved"
        const saveBtn = document.querySelector(`#property-${propertyId} .btn-save`);
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-heart"></i>';
            saveBtn.classList.add('saved');
        }

        showNotification('Property saved to your favorites!');

        // Log the activity
        logUserActivity('property', 'Saved property');

        // Redirect to dashboard after a short delay to show notification
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
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

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Open booking modal
function openBookingModal(propertyId, monthlyRent) {
    currentProperty = propertyId;
    currentMonthlyRent = monthlyRent;

    // Set today's date as minimum for start date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-start').min = today;

    // Reset form
    document.getElementById('booking-form').reset();
    document.getElementById('monthly-rent').textContent = `$${monthlyRent.toLocaleString()}`;
    updatePriceCalculation();

    document.getElementById('booking-modal').style.display = 'flex';
}

// Update price calculation in booking modal
function updatePriceCalculation() {
    const duration = parseInt(document.getElementById('booking-duration').value) || 0;
    const totalPrice = currentMonthlyRent * duration;

    document.getElementById('duration-months').textContent = `${duration} month${duration !== 1 ? 's' : ''}`;
    document.getElementById('total-price').textContent = `$${totalPrice.toLocaleString()}`;
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Process booking and payment
async function processBooking() {
    const name = document.getElementById('booking-name').value;
    const email = document.getElementById('booking-email').value;
    const phone = document.getElementById('booking-phone').value;
    const startDate = document.getElementById('booking-start').value;
    const duration = parseInt(document.getElementById('booking-duration').value);
    const paymentType = document.getElementById('payment-type').value;
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const nameOnCard = document.getElementById('name-on-card').value;
    const totalPrice = currentMonthlyRent * duration;

    // Client-side validation
    if (!name || !email || !phone || !startDate || isNaN(duration) || duration < 1 || !paymentType || !cardNumber || !nameOnCard) {
        alert('Please fill in all required fields. Duration must be a number >= 1.');
        return;
    }

    // Basic card number validation
    if (cardNumber.length < 16 || cardNumber.length > 19) {
        alert('Please enter a valid card number (16-19 digits).');
        return;
    }

    const paymentData = {
        userID: currentUserID,
        apartmentID: currentProperty,
        paymentType: paymentType,
        cardNumber: cardNumber,
        nameOnCard: nameOnCard,
        months: duration,
        monthlyRent: currentMonthlyRent,
        totalAmount: totalPrice
    };

    try {
        const response = await fetch(PAYMENTS_API + '/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Booking and payment processed successfully! Total: $${totalPrice.toLocaleString()}\nPayment ID: ${result.paymentID || 'N/A'}`);

            // Update button to show paid
            const bookButton = document.getElementById(`book-btn-${currentProperty}`);
            if (bookButton) {
                bookButton.textContent = 'Paid ✓';
                bookButton.style.backgroundColor = '#95a5a6';
                bookButton.disabled = true;
                bookButton.onclick = null;
            }

            // Show Download PDF button
            const downloadButton = document.getElementById('download-pdf');
            if (downloadButton) {
                downloadButton.style.display = 'block';
                downloadButton.onclick = () => downloadPaymentPdf(result.paymentID);
            }

            // Do not close the modal immediately to allow PDF download
            // closeModal('booking-modal');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to process payment');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        alert(`Error processing payment: ${error.message}. Please try again.`);
    }
}

// Download Payment PDF
async function downloadPaymentPdf(paymentID) {
    try {
        const response = await fetch(`${PAYMENTS_API}/pdf/${paymentID}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to generate payment PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment_details_${paymentID}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        // Close modal after download
        closeModal('booking-modal');
    } catch (error) {
        alert('Error generating PDF: ' + error.message);
    }
}

// Remove duplicate applyFilters and getRentalProperties functions, keeping only one version each

// Add a saveProperty function for the save button functionality
function saveProperty(propertyId) {
    // Find the property in our data
    const allProperties = [...properties, ...getSampleRentalProperties()];
    const property = allProperties.find(p => p.apartmentID == propertyId);

    if (!property) {
        console.error('Property not found:', propertyId);
        return;
    }

    // Get existing saved properties from localStorage
    let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];

    // Check if this property is already saved
    const isAlreadySaved = savedProperties.some(p => p.apartmentID == propertyId);

    if (isAlreadySaved) {
        // Remove from saved properties
        savedProperties = savedProperties.filter(p => p.apartmentID != propertyId);
        localStorage.setItem('savedProperties', JSON.stringify(savedProperties));

        // Update the button to show "Save" again
        const saveBtn = document.querySelector(`#property-${propertyId} .btn-save`);
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="far fa-heart"></i>';
            saveBtn.classList.remove('saved');
        }

        showNotification('Property removed from favorites!');
    } else {
        // Add current date to property
        property.savedDate = new Date().toISOString();
        // Add to saved properties
        savedProperties.push(property);
        localStorage.setItem('savedProperties', JSON.stringify(savedProperties));

        // Update the button to show "Saved"
        const saveBtn = document.querySelector(`#property-${propertyId} .btn-save`);
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-heart"></i>';
            saveBtn.classList.add('saved');
        }

        showNotification('Property saved to your favorites!');

        // Log the activity
        logUserActivity('property', 'Saved property');

        // Redirect to dashboard after a short delay to show notification
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
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

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Helper function to get sample rental properties
function getSampleRentalProperties() {
    return [
        {
            apartmentID: 2001,
            type: "Apartment",
            price: 240000.00,
            bedrooms: 1,
            bathrooms: 1,
            location: "City Center Lofts, New York",
            description: "Modern studio apartment in the heart of downtown. Floor-to-ceiling windows, stainless steel appliances, and 24-hour security.",
            createdAt: "2025-08-10T00:00:00",
            amenities: { pool: false, gym: true, parking: true, petsAllowed: false, furnished: true }
        },
        {
            apartmentID: 2002,
            type: "Condo",
            price: 350000.00,
            bedrooms: 2,
            bathrooms: 2,
            location: "Lakeside Towers, Chicago",
            description: "Upscale 2-bedroom condo with lake views. Features granite countertops, in-unit laundry, and a large balcony.",
            createdAt: "2025-08-22T00:00:00",
            amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 2003,
            type: "Townhouse",
            price: 420000.00,
            bedrooms: 3,
            bathrooms: 2,
            location: "Park View Commons, Boston",
            description: "Spacious 3-bedroom townhouse next to city park. Includes garage parking, private patio, and newly renovated kitchen.",
            createdAt: "2025-09-05T00:00:00",
            amenities: { pool: false, gym: false, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 2004,
            type: "House",
            price: 520000.00,
            bedrooms: 4,
            bathrooms: 3,
            location: "Maple Grove, Los Angeles",
            description: "Charming 4-bedroom house in family-friendly neighborhood. Large yard, finished basement, and close to schools and shopping.",
            createdAt: "2025-09-15T00:00:00",
            amenities: { pool: true, gym: false, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 2005,
            type: "Villa",
            price: 680000.00,
            bedrooms: 3,
            bathrooms: 2,
            location: "Sunset Gardens, Miami",
            description: "Luxury 3-bedroom villa with private pool. Open floor plan, gourmet kitchen, and landscaped garden.",
            createdAt: "2025-09-20T00:00:00",
            amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: true }
        },
        {
            apartmentID: 2006,
            type: "Studio",
            price: 190000.00,
            bedrooms: 0,
            bathrooms: 1,
            location: "Downtown Studios, San Francisco",
            description: "Cozy studio apartment in trendy neighborhood. Walking distance to cafes, shops and public transport.",
            createdAt: "2025-09-22T00:00:00",
            amenities: { pool: false, gym: true, parking: false, petsAllowed: false, furnished: true }
        },
        {
            apartmentID: 2007,
            type: "Apartment",
            price: 280000.00,
            bedrooms: 2,
            bathrooms: 1,
            location: "Harbor View, Seattle",
            description: "Waterfront apartment with stunning views of the harbor. Recently renovated with modern finishes.",
            createdAt: "2025-09-25T00:00:00",
            amenities: { pool: false, gym: true, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 2008,
            type: "Penthouse",
            price: 890000.00,
            bedrooms: 4,
            bathrooms: 3,
            location: "Skyline Towers, Atlanta",
            description: "Luxurious penthouse with panoramic city views. Private elevator, rooftop terrace, and premium finishes throughout.",
            createdAt: "2025-09-27T00:00:00",
            amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: true }
        },
        {
            apartmentID: 2009,
            type: "Duplex",
            price: 420000.00,
            bedrooms: 3,
            bathrooms: 2,
            location: "University Heights, Austin",
            description: "Modern duplex near university campus. Perfect for students or faculty with easy access to campus facilities.",
            createdAt: "2025-09-28T00:00:00",
            amenities: { pool: false, gym: false, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 2010,
            type: "Loft",
            price: 320000.00,
            bedrooms: 1,
            bathrooms: 1,
            location: "Arts District, Portland",
            description: "Industrial-style loft in historic building. High ceilings, exposed brick, and artistic neighborhood.",
            createdAt: "2025-09-30T00:00:00",
            amenities: { pool: false, gym: false, parking: true, petsAllowed: true, furnished: false }
        }
    ];
}
