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
                <h3>No Rental Properties Available</h3>
                <p>Check back later for new rental listings.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = properties.map(property => {
        const monthlyRent = Math.round(property.price / 1000); // Monthly rent = price / 1000
        const propertyId = property.apartmentID || property.id;

        return `
            <div class="property-card" id="property-${propertyId}">
                <div class="property-image">
                    <div class="property-badge">FOR RENT</div>
                    <i class="fas fa-home fa-3x"></i>
                </div>
                <div class="property-content">
                    <div class="property-price">$${monthlyRent.toLocaleString()}/month</div>
                    <div class="property-address">${property.location}</div>
                    <div class="property-features">
                        <span><i class="fas fa-bed"></i> ${property.bedrooms} beds</span>
                        <span><i class="fas fa-building"></i> ${property.type}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(property.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${property.description ? `<div class="property-description">${property.description}</div>` : ''}
                    <div class="property-actions">
                        <button class="btn-book" id="book-btn-${propertyId}" onclick="openBookingModal(${propertyId}, ${monthlyRent})">Book & Pay</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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