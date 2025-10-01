// API Base URL
const API_BASE = 'http://localhost:8080/api';
const PURCHASES_API = API_BASE + '/purchases';

// Current property for purchase
let currentProperty = null;
let currentPropertyPrice = 0;
let currentUserID = null; // This should come from login session

// Load properties when page loads
document.addEventListener('DOMContentLoaded', function() {
    // For demo purposes, set a user ID (in real app, this should come from login)
    currentUserID = 1; // This should be dynamic based on logged-in user

    loadProperties();
    setupEventListeners();
});

// Set up event listeners for form interactions
function setupEventListeners() {
    // Purchase form - update price when offer changes
    document.getElementById('purchase-offer').addEventListener('input', updatePriceCalculation);

    // Purchase form submission
    document.getElementById('purchase-form').addEventListener('submit', function(e) {
        e.preventDefault();
        processPurchase();
    });
}

// Load properties from API
async function loadProperties() {
    const container = document.getElementById('properties-container');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading properties...</p></div>';

    try {
        const response = await fetch(API_BASE + '/apartments');
        if (!response.ok) throw new Error('Failed to fetch properties');

        const properties = await response.json();
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

// Display properties in the grid
function displayProperties(properties) {
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

    container.innerHTML = properties.map(property => {
        const propertyId = property.apartmentID || property.id;

        return `
            <div class="property-card" id="property-${propertyId}">
                <div class="property-image">
                    <div class="property-badge">FOR SALE</div>
                    <i class="fas fa-home fa-3x"></i>
                </div>
                <div class="property-content">
                    <div class="property-price">$${property.price.toLocaleString()}</div>
                    <div class="property-address">${property.location}</div>
                    <div class="property-features">
                        <span><i class="fas fa-bed"></i> ${property.bedrooms} beds</span>
                        <span><i class="fas fa-building"></i> ${property.type}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(property.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${property.description ? `<div class="property-description">${property.description}</div>` : ''}
                    <div class="property-actions">
                        <button class="btn-purchase" id="purchase-btn-${propertyId}" onclick="openPurchaseModal(${propertyId}, ${property.price})">Make Offer</button>
                        <button class="btn-save" id="save-btn-${propertyId}" onclick="saveProperty(${propertyId})">Save</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Save property function
function saveProperty(propertyId) {
    const saveButton = document.getElementById(`save-btn-${propertyId}`);

    if (saveButton.textContent === 'Save') {
        saveButton.textContent = 'Saved';
        saveButton.style.backgroundColor = '#95a5a6';
        alert('Property saved to your favorites!');
    } else {
        saveButton.textContent = 'Save';
        saveButton.style.backgroundColor = '#3498db';
        alert('Property removed from favorites!');
    }
}

// Apply filters
function applyFilters() {
    // In a real application, this would filter the properties
    // For now, we'll just reload all properties
    loadProperties();
}

// Reset filters
function resetFilters() {
    document.getElementById('location').value = '';
    document.getElementById('price-range').value = '';
    document.getElementById('bedrooms').value = '';
    loadProperties();
}

// Open purchase modal
function openPurchaseModal(propertyId, propertyPrice) {
    currentProperty = propertyId;
    currentPropertyPrice = propertyPrice;

    // Reset form
    document.getElementById('purchase-form').reset();
    document.getElementById('property-price').textContent = `$${propertyPrice.toLocaleString()}`;
    updatePriceCalculation();

    document.getElementById('purchase-modal').style.display = 'flex';
}

// Update price calculation in purchase modal
function updatePriceCalculation() {
    const offer = parseInt(document.getElementById('purchase-offer').value) || 0;
    const difference = offer - currentPropertyPrice;

    document.getElementById('offer-price').textContent = `$${offer.toLocaleString()}`;
    document.getElementById('price-difference').textContent = `$${difference.toLocaleString()}`;

    // Color code the difference
    const differenceElement = document.getElementById('price-difference');
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
    const offer = parseInt(document.getElementById('purchase-offer').value);
    const paymentType = document.getElementById('purchase-type').value;
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const nameOnCard = document.getElementById('name-on-card').value;

    // Client-side validation
    if (!name || !email || !phone || isNaN(offer) || offer <= 0 || !paymentType) {
        alert('Please fill in all required fields. Offer must be a positive number.');
        return;
    }

    // If payment type requires card, validate card details
    if (paymentType !== 'Cash' && (!cardNumber || !nameOnCard)) {
        alert('Please provide card details for non-cash payment methods.');
        return;
    }

    const purchaseData = {
        userID: currentUserID,
        apartmentID: currentProperty,
        paymentType: paymentType,
        cardNumber: cardNumber || null,
        nameOnCard: nameOnCard || null,
        offerAmount: offer,
        askingPrice: currentPropertyPrice
    };

    try {
        const response = await fetch(PURCHASES_API + '/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseData)
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Purchase offer submitted successfully!\nOffer: $${offer.toLocaleString()}\nPurchase ID: ${result.purchaseID || 'N/A'}`);

            // Update button to show offer submitted
            const purchaseButton = document.getElementById(`purchase-btn-${currentProperty}`);
            if (purchaseButton) {
                purchaseButton.textContent = 'Offer Submitted ✓';
                purchaseButton.style.backgroundColor = '#95a5a6';
                purchaseButton.disabled = true;
                purchaseButton.onclick = null;
            }

            // Show Download PDF button
            const downloadButton = document.getElementById('download-pdf');
            if (downloadButton) {
                downloadButton.style.display = 'block';
                downloadButton.onclick = () => downloadPurchasePdf(result.purchaseID);
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit purchase offer');
        }
    } catch (error) {
        console.error('Error submitting purchase offer:', error);
        alert(`Error submitting purchase offer: ${error.message}. Please try again.`);
    }
}

// Download Purchase PDF
async function downloadPurchasePdf(purchaseID) {
    try {
        const response = await fetch(`${PURCHASES_API}/pdf/${purchaseID}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to generate purchase PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `purchase_offer_${purchaseID}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        // Close modal after download
        closeModal('purchase-modal');
    } catch (error) {
        alert('Error generating PDF: ' + error.message);
    }


    // buy.js - Updated with save functionality




}