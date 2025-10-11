// API Base URL
const API_BASE = 'http://localhost:8080/api';
const PAYMENTS_API = API_BASE + '/payments';

// Current property for booking
let currentProperty = null;
let currentMonthlyRent = 0;
let currentUserID = null; // This should come from login session

// Cached properties to avoid re-fetching on every slider drag
let cachedProperties = [];
let propertiesFetched = false;

// Load properties when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get current user from session storage (like buy section)
    const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
    currentUserID = sessionUser ? sessionUser.userID : 1; // Fallback to 1 for demo

    console.log('Rent page loaded for user:', currentUserID);

    loadProperties();
    setupEventListeners();
    initializePriceSlider();

    // Create a debounced version of applyFilters for slider input
    window.debouncedApplyFilters = debounce(() => applyFilters({silent: true}), 300);
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
        // Trigger debounced silent filtering when user adjusts sliders
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

    // Debug logging for price conversion
    if (property.aptPrice && price === 0) {
        console.warn('Price conversion issue:', property.aptId || 'unknown', 'Raw price:', property.aptPrice);
    }

    // Detect Apartment1 style (aptPrice, aptBedrooms, aptId, etc.)
    if ('aptPrice' in property || 'aptBedrooms' in property || 'aptId' in property) {
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

    // Return normalized property
    return {
        apartmentID: property.apartmentID || property.id || 0,
        type: property.type || 'Apartment',
        price: price,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 1,
        location: property.location || 'Unknown',
        description: property.description || '',
        status: property.status || 'AVAILABLE',
        createdAt: property.createdAt || new Date().toISOString(),
        amenities: property.amenities || null
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
        const response = await fetch(API_BASE + '/apartments');
        if (!response.ok) throw new Error('Failed to fetch properties');

        const apiRaw = await response.json();
        console.log('API Response:', apiRaw); // Debug log
        const normalized = normalizeList(apiRaw);
        cachedProperties = normalized; // store normalized base
        propertiesFetched = true;

        // Combine with sample properties for display
        const allProperties = [...normalized, ...getSampleProperties()];
        displayProperties(allProperties);
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

    container.innerHTML = properties.map(property => {
        // Ensure property has proper ID and values
        const propertyId = property.apartmentID || property.id || 0;
        const propertyPrice = property.price || 1500;
        const propertyType = property.type || 'Apartment';
        const bedrooms = property.bedrooms || 1;
        const bathrooms = property.bathrooms || 1;
        const squareFeet = property.squareFeet || Math.floor(bedrooms * 750);

        // Generate image URL based on property type or use existing one (like buy section)
        const imageUrl = property.imageUrl || generateImageUrl(propertyType, propertyId);

        return `
            <div class="property-card" id="property-${propertyId}">
                <div class="property-image">
                    <div class="property-badge">FOR RENT</div>
                    <img src="${imageUrl}" alt="${propertyType} in ${property.location}" 
                         style="width: 100%; height: 100%; object-fit: cover;" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <i class="fas fa-home fa-3x" style="display: none; color: #3498db;"></i>
                </div>
                <div class="property-content">
                    <div class="property-header">
                        <div class="property-price">$${propertyPrice.toLocaleString()}/mo</div>
                        <div class="property-address">${property.location || 'Unknown Location'}</div>
                    </div>
                    
                    <div class="property-features">
                        <span><i class="fas fa-bed"></i> ${bedrooms} beds</span>
                        <span><i class="fas fa-bath"></i> ${bathrooms} baths</span>
                        <span><i class="fas fa-ruler-combined"></i> ${squareFeet.toLocaleString()} sqft</span>
                    </div>
                    
                    <div class="property-type-info">
                        <span class="property-type-badge">${propertyType}</span>
                        <span class="property-date">Available from ${new Date().toLocaleDateString()}</span>
                    </div>
                    
                    ${property.description ? `<div class="property-description">${property.description}</div>` : ''}
                    
                    <div class="property-actions">
                        <button id="book-btn-${propertyId}" class="btn-book" onclick="openBookingModal(${propertyId}, ${propertyPrice})">Book Now</button>
                        <button class="btn-save" id="save-btn-${propertyId}" onclick="saveProperty(${propertyId}, '${imageUrl}')">
                            <i class="far fa-heart"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // After rendering, mark already-saved properties
    try {
        const savedProps = JSON.parse(localStorage.getItem('savedProperties')) || [];
        const savedIds = new Set(savedProps.map(p => p.apartmentID));
        savedIds.forEach(id => {
            const btn = document.getElementById(`save-btn-${id}`);
            if (btn) {
                btn.innerHTML = '<i class="fas fa-heart"></i> Saved';
                btn.style.backgroundColor = '#27ae60';
                btn.style.color = 'white';
                btn.style.borderColor = '#27ae60';
            }
        });
    } catch (e) {
        console.warn('Could not read saved properties from localStorage:', e);
    }
}

// Apply filters
function applyFilters(options = {}) {
    const silent = options.silent === true;

    // Get filter values
    const location = document.getElementById('location').value.toLowerCase();
    const category = document.getElementById('category').value.toLowerCase();
    const minPrice = parseInt(document.getElementById('price-min').value);
    const maxPrice = parseInt(document.getElementById('price-max').value);
    const bedroomsFilter = document.getElementById('bedrooms').value;
    const bathroomsFilter = document.getElementById('bathrooms').value;
    const moveInDate = document.getElementById('move-in-date').value;

    // Get amenities
    const hasPool = document.getElementById('pool').checked;
    const hasGym = document.getElementById('gym').checked;
    const hasParking = document.getElementById('parking').checked;
    const allowsPets = document.getElementById('pets-allowed').checked;
    const isFurnished = document.getElementById('furnished').checked;

    // Get sort option
    const sortBy = document.getElementById('sort-by').value;

    // Update loading state
    if (!silent) {
        const container = document.getElementById('properties-container');
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Filtering properties...</p></div>';
    }

    // Fetch and filter properties
    fetchAndFilterProperties();

    async function fetchAndFilterProperties() {
        try {
            let baseList = [];
            if (propertiesFetched) {
                baseList = [...cachedProperties];
            } else {
                const response = await fetch(API_BASE + '/apartments');
                if (!response.ok) throw new Error('Failed to fetch properties');
                const apiRaw = await response.json();
                const normalized = normalizeList(apiRaw);
                cachedProperties = normalized;
                propertiesFetched = true;
                baseList = [...normalized];
            }

            // Combine API properties with sample properties
            const allProperties = [...baseList, ...getSampleProperties()];

            // Apply filters
            const filteredProperties = allProperties.filter(property => {
                const propertyPrice = property.price || 0;
                const propertyBedrooms = property.bedrooms || 0;
                const propertyBathrooms = property.bathrooms || 1;
                const propertyType = (property.type || 'Apartment').toLowerCase();
                const propertyLocation = (property.location || '').toLowerCase();

                // Filter by location
                if (location && !propertyLocation.includes(location)) {
                    return false;
                }

                // Filter by category/type
                if (category && category !== '' && propertyType !== category && category !== 'all categories') {
                    return false;
                }

                // Filter by price range
                if (!isNaN(minPrice) && !isNaN(maxPrice) && (propertyPrice < minPrice || propertyPrice > maxPrice)) {
                    return false;
                }

                // Filter by bedrooms
                if (bedroomsFilter && bedroomsFilter !== '') {
                    if (bedroomsFilter === '5') {
                        if (propertyBedrooms < 5) return false; // 5+ means 5 or more
                    } else if (propertyBedrooms.toString() !== bedroomsFilter) {
                        return false;
                    }
                }

                // Filter by bathrooms
                if (bathroomsFilter && bathroomsFilter !== '') {
                    if (bathroomsFilter === '4') {
                        if (propertyBathrooms < 4) return false; // 4+ means 4 or more
                    } else if (propertyBathrooms.toString() !== bathroomsFilter) {
                        return false;
                    }
                }

                // Filter by amenities
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

                return true;
            });

            // Sort properties
            sortProperties(filteredProperties, sortBy);

            // Display filtered properties
            displayProperties(filteredProperties);

            // Show notification
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

// Sort properties based on selection
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
            properties.sort((a, b) => a.price - b.price);
    }
    return properties;
}

// Sample rental properties
function getSampleProperties() {
    return [
        {
            apartmentID: 4001,
            type: "Apartment",
            price: 1200,
            bedrooms: 1,
            bathrooms: 1,
            location: "Downtown Lofts, New York",
            description: "Modern 1-bedroom apartment in central location. Recently renovated with high-end finishes.",
            amenities: { pool: false, gym: true, parking: true, petsAllowed: false, furnished: false }
        },
        {
            apartmentID: 4002,
            type: "Condo",
            price: 1800,
            bedrooms: 2,
            bathrooms: 2,
            location: "Lakeside Condos, Chicago",
            description: "Spacious 2-bedroom condo with lake views. Features granite countertops and stainless appliances.",
            amenities: { pool: true, gym: true, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 4003,
            type: "House",
            price: 2500,
            bedrooms: 3,
            bathrooms: 2.5,
            location: "Maple Heights, Boston",
            description: "Charming 3-bedroom house in family-friendly neighborhood. Large backyard and updated kitchen.",
            amenities: { pool: false, gym: false, parking: true, petsAllowed: true, furnished: false }
        },
        {
            apartmentID: 4004,
            type: "Studio",
            price: 950,
            bedrooms: 0,
            bathrooms: 1,
            location: "Urban Studios, Seattle",
            description: "Cozy studio apartment with modern amenities in trendy downtown area.",
            amenities: { pool: false, gym: true, parking: false, petsAllowed: false, furnished: true }
        },
        {
            apartmentID: 4005,
            type: "Penthouse",
            price: 3500,
            bedrooms: 3,
            bathrooms: 3,
            location: "Skyline Towers, San Francisco",
            description: "Luxury penthouse with panoramic city views, chef's kitchen, and private terrace.",
            amenities: { pool: true, gym: true, parking: true, petsAllowed: false, furnished: true }
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

    // Reset price slider
    document.getElementById('price-min').value = document.getElementById('price-min').min;
    document.getElementById('price-max').value = document.getElementById('price-max').max;
    initializePriceSlider();

    // Reset checkboxes
    document.getElementById('pool').checked = false;
    document.getElementById('gym').checked = false;
    document.getElementById('parking').checked = false;
    document.getElementById('pets-allowed').checked = false;
    document.getElementById('furnished').checked = false;

    // Reload properties
    loadProperties();

    // Show notification
    showNotification('All filters have been reset.');
}

// Show notification message
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    // Update message
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;

    // Show notification
    notification.classList.add('show');

    // Hide after delay
    setTimeout(() => {
        notification.classList.remove('show');
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

// Generate a placeholder image URL based on property type (like buy section)
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
        'Ranch': 'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=400',
        'Duplex': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        'Loft': 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=400'
    };

    return imageUrls[propertyType] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
}

// Remove duplicate applyFilters and getRentalProperties functions, keeping only one version each

// Save property function with database integration (enhanced with better error handling)
async function saveProperty(propertyId, imageUrl) {
    console.log('Save button clicked for rental property:', propertyId, 'with image URL:', imageUrl);

    const saveButton = document.getElementById(`save-btn-${propertyId}`);

    // Critical null check for save button
    if (!saveButton) {
        console.error('Save button not found for property:', propertyId);
        showNotification('Error: Save button not found!');
        return;
    }

    // Find the property in our data
    let property = cachedProperties.find(p => p.apartmentID == propertyId);
    if (!property) {
        property = getSampleProperties().find(p => p.apartmentID == propertyId);
    }

    if (!property) {
        console.error('Rental property not found:', propertyId);
        showNotification('Error: Property not found!');
        return;
    }

    // Show loading state
    const originalButtonContent = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveButton.disabled = true;

    try {
        console.log('Making API call to save rental property to database...');

        // Prepare enhanced data to save to SavedProperties table
        const propertyDataForSave = {
            ...property,
            imageUrl: imageUrl,
            savedDate: new Date().toISOString(),
            price: property.price,
            address: property.location,
            features: `${property.bedrooms || 0} bed, ${property.bathrooms || 1} bath, ${property.type}`,
            propertyType: 'RENTAL', // CRITICAL: Mark as rental so dashboard can identify it
            isRental: true, // Additional flag for clarity
            source: 'rent-page' // Track where it was saved from
        };

        const saveData = {
            userID: currentUserID || 1,
            propertyPrice: property.price.toString(),
            propertyAddress: property.location,
            propertyFeatures: `${property.bedrooms || 0} bed, ${property.bathrooms || 1} bath, ${property.type} (RENTAL)`, // Mark in features too
            propertyData: JSON.stringify(propertyDataForSave) // CRITICAL FIX: Must stringify for backend
        };

        console.log('Sending rental data to SavedProperties API:', saveData);

        // Save to SavedProperties table using the correct endpoint
        const response = await fetch(`${API_BASE}/saved-properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saveData)
        });

        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);

        if (response.ok) {
            const result = await response.json();
            console.log('Rental property saved to database successfully:', result);

            // Check if property was already saved or newly saved
            const isAlreadySaved = result.alreadyExists === true;
            const successMessage = isAlreadySaved ?
                'Rental property was already in your favorites!' :
                'Rental property saved to favorites successfully!';

            // Update button appearance
            saveButton.innerHTML = '<i class="fas fa-heart"></i> Saved';
            saveButton.style.backgroundColor = '#27ae60';
            saveButton.style.color = 'white';
            saveButton.style.borderColor = '#27ae60';
            saveButton.disabled = false;
            showNotification(successMessage);

            // Also save to localStorage with enhanced rental marking
            let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
            property.savedDate = new Date().toISOString();
            property.imageUrl = imageUrl;
            property.propertyType = 'RENTAL'; // Mark as rental
            property.isRental = true; // Additional flag
            property.source = 'rent-page';

            // Check if already saved locally to avoid duplicates
            const isAlreadySavedLocally = savedProperties.some(p => p.apartmentID == propertyId);
            if (!isAlreadySavedLocally) {
                savedProperties.push(property);
                localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
                console.log('Property also saved to localStorage with rental marking');
            }

            // Log the activity
            const activityMessage = isAlreadySaved ?
                'Rental property was already saved in database' :
                'Saved rental property to database successfully';
            logUserActivity('property', activityMessage);

            // Show success message and redirect to dashboard after a short delay
            showNotification('🏠 Redirecting to dashboard to view your saved rental property...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } else {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to save rental property to database'}`);
        }

    } catch (error) {
        console.error('Error saving rental property:', error);

        // Reset button state
        saveButton.innerHTML = originalButtonContent;
        saveButton.disabled = false;

        // Check if it's a network error (server not running)
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showNotification('⚠️ Server not running! Saving locally only.');
            console.warn('Server appears to be down, falling back to localStorage');

            // Fallback to localStorage only
            let savedProperties = JSON.parse(localStorage.getItem('savedProperties')) || [];
            const isAlreadySaved = savedProperties.some(p => p.apartmentID == propertyId);

            if (!isAlreadySaved) {
                // Add current date, image URL, and rental marking to property
                property.savedDate = new Date().toISOString();
                property.imageUrl = imageUrl;
                property.propertyType = 'RENTAL';
                property.isRental = true;
                property.source = 'rent-page';

                savedProperties.push(property);
                localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
                saveButton.innerHTML = '<i class="fas fa-heart"></i> Saved Locally';
                saveButton.style.backgroundColor = '#f39c12';
                saveButton.style.color = 'white';
                showNotification('🏠 Rental property saved locally! Redirecting to dashboard...');

                logUserActivity('property', 'Saved rental property locally (server offline)');

                // Still redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                showNotification('Rental property was already saved locally!');
            }
        } else {
            showNotification(`❌ Database error: ${error.message}`);
        }
    }
}
