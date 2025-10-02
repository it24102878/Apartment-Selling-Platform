// ==================== GLOBAL CONFIGURATION ====================
const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api',
    REQUEST_TIMEOUT: 10000,
    ADMIN_CREDENTIALS: {
        email: "admin@propertyhub.com",
        password: "admin123"
    }
};
// Add to your login success handler
console.log('User logged in:', data.user);
console.log('User ID:', data.user.userID);

// Add to activity tracking
console.log('Attempting to track activity for user:', user);

// ==================== STATE MANAGEMENT ====================
let currentTab = 'login';
let currentUser = null;

// ==================== AUTHENTICATION CHECK ====================
function isAuthenticated() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    return user !== null;
}

function requireAuthentication() {
    if (!isAuthenticated()) {
        alert('Please login to access this feature.');
        showPage('auth-page');
        return false;
    }
    return true;
}

// ==================== PAGE NAVIGATION ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

function navigateToProtectedPage(pageUrl) {
    if (!requireAuthentication()) {
        return;
    }

    // Track user activity
    trackUserActivity('navigation', `Visited ${pageUrl}`);

    // Navigate to the page
    window.location.href = pageUrl;
}

// ==================== USER ACTIVITY TRACKING ====================
async function trackUserActivity(activityType, description, relatedData = null) {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) return;

    const activity = {
        userID: user.userID,
        activityType: activityType,
        description: description,
        relatedData: relatedData ? JSON.stringify(relatedData) : null,
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(`${CONFIG.API_BASE_URL}/user/activity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            },
            body: JSON.stringify(activity)
        });
    } catch (error) {
        console.error('Failed to track activity:', error);
    }
}

// ==================== USER DROPDOWN MANAGEMENT ====================
function toggleUserMenu() {
    const userMenu = document.getElementById('user-menu');
    const dropdown = document.querySelector('.user-dropdown');

    if (userMenu && dropdown) {
        userMenu.classList.toggle('show');
        dropdown.classList.toggle('active');
    }
}

function updateAllUserDropdowns(user) {
    // Update all user dropdown instances on the page
    const dropdownSelectors = [
        { dropdown: 'userDropdown', menu: 'user-menu' },
        { dropdown: 'userDropdownAccount', menu: 'user-menu-account' }
    ];

    dropdownSelectors.forEach(selector => {
        const dropdown = document.getElementById(selector.dropdown);
        if (dropdown) {
            dropdown.style.display = 'inline-block';

            // Update user info in all dropdown instances
            updateUserInfo(user, selector.dropdown.replace('userDropdown', '').toLowerCase());
        }
    });

    // Hide auth buttons on all instances
    document.querySelectorAll('.auth-buttons').forEach(btn => {
        btn.style.display = 'none';
    });
}

function updateUserInfo(user, suffix = '') {
    const initial = user.name.charAt(0).toUpperCase();
    const suffixStr = suffix ? `-${suffix}` : '';

    // Update user name and avatar
    const elements = [
        { id: `user-name${suffixStr}`, value: user.name },
        { id: `user-name-large${suffixStr}`, value: user.name },
        { id: `user-email${suffixStr}`, value: user.email },
        { id: `user-avatar${suffixStr}`, value: initial },
        { id: `user-avatar-large${suffixStr}`, value: initial }
    ];

    elements.forEach(elem => {
        const element = document.getElementById(elem.id);
        if (element) {
            element.textContent = elem.value;
        }
    });

    // Update account page specific elements
    const accountElements = [
        { id: 'account-username', value: user.name },
        { id: 'welcome-username', value: `Welcome, ${user.name}!` }
    ];

    accountElements.forEach(elem => {
        const element = document.getElementById(elem.id);
        if (element) {
            element.textContent = elem.value;
        }
    });
}

function resetAllUserDropdowns() {
    document.querySelectorAll('.auth-buttons').forEach(btn => {
        btn.style.display = 'flex';
    });
    document.querySelectorAll('.user-dropdown').forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

// ==================== NAVIGATION INTERCEPTORS ====================
function setupNavigationInterceptors() {
    // Intercept Buy page navigation
    document.querySelectorAll('a[href="buy.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (requireAuthentication()) {
                trackUserActivity('navigation', 'Accessed Buy page');
                window.location.href = 'buy.html';
            }
        });
    });

    // Intercept Rent page navigation
    document.querySelectorAll('a[href="rent.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (requireAuthentication()) {
                trackUserActivity('navigation', 'Accessed Rent page');
                window.location.href = 'rent.html';
            }
        });
    });

    // Intercept Sell page navigation
    document.querySelectorAll('a[href="apartment.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (requireAuthentication()) {
                trackUserActivity('navigation', 'Accessed Sell page');
                window.location.href = 'apartment.html';
            }
        });
    });
}

// ==================== PROPERTY INTERACTIONS ====================
async function saveProperty(propertyData) {
    if (!requireAuthentication()) return;

    const user = JSON.parse(sessionStorage.getItem('currentUser'));

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/user/saved-properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                userID: user.userID,
                propertyData: propertyData
            })
        });

        if (response.ok) {
            trackUserActivity('property', 'Saved property', propertyData);
            alert('Property saved successfully!');
        }
    } catch (error) {
        console.error('Failed to save property:', error);
        alert('Failed to save property. Please try again.');
    }
}

async function loadUserActivities() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/user/activities/${user.userID}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const activities = await response.json();
            displayUserActivities(activities);
        }
    } catch (error) {
        console.error('Failed to load activities:', error);
    }
}

function displayUserActivities(activities) {
    const container = document.getElementById('user-activities');
    if (!container) return;

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.activityType)}"></i>
            </div>
            <div class="activity-details">
                <h4>${activity.description}</h4>
                <span class="activity-time">${formatDate(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(activityType) {
    const icons = {
        'navigation': 'fa-compass',
        'property': 'fa-home',
        'booking': 'fa-calendar',
        'payment': 'fa-credit-card',
        'review': 'fa-star'
    };
    return icons[activityType] || 'fa-circle';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== TAB SWITCHING ====================
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-button')[tab === 'login' ? 0 : 1].classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    const targetForm = document.getElementById(tab + '-form');
    if (targetForm) {
        targetForm.classList.add('active');
    }

    // Update header text
    const titleEl = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');

    if (titleEl && subtitleEl) {
        if (tab === 'login') {
            titleEl.textContent = 'Welcome Back';
            subtitleEl.textContent = 'Please sign in to your account';
        } else {
            titleEl.textContent = 'Create Account';
            subtitleEl.textContent = 'Join our property community';
        }
    }

    clearMessages();
}

// ==================== MESSAGE HANDLING ====================
function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    const errorEl = document.getElementById('error-message');

    if (successEl && errorEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        errorEl.style.display = 'none';
    }
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    const successEl = document.getElementById('success-message');

    if (errorEl && successEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
    }
}

function clearMessages() {
    const successEl = document.getElementById('success-message');
    const errorEl = document.getElementById('error-message');

    if (successEl) successEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
}

// ==================== VALIDATION UTILITIES ====================
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isAdminUser(email, password) {
    return email === CONFIG.ADMIN_CREDENTIALS.email && password === CONFIG.ADMIN_CREDENTIALS.password;
}

// ==================== AUTHENTICATION ====================
function handleAdminLogin(email) {
    showSuccess('Welcome back, Admin!');

    const adminUser = {
        name: 'Admin',
        email: email,
        isAdmin: true,
        userID: 'admin'
    };

    sessionStorage.setItem('currentUser', JSON.stringify(adminUser));
    sessionStorage.setItem('authToken', 'admin-token');

    setTimeout(() => {
        window.location.href = 'adindex.html';
    }, 1500);

    return true;
}

async function handleLogin(formData) {
    const email = formData.get('email')?.trim();
    const password = formData.get('password')?.trim();

    // Client-side validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return false;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return false;
    }

    // Check for admin login
    if (isAdminUser(email, password)) {
        return handleAdminLogin(email);
    }

    // Regular user login
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!data.success) {
            showError(data.message || 'Invalid email or password');
            return false;
        }

        showSuccess(`Welcome back, ${data.user.name}!`);

        // Store user data and auth token
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        sessionStorage.setItem('authToken', data.token || 'user-token');

        currentUser = data.user;
        updateAllUserDropdowns(data.user);

        // Track login activity
        trackUserActivity('authentication', 'User logged in');

        // Redirect to account page
        setTimeout(() => {
            showPage('account-page');
            loadUserActivities();
        }, 1200);

        return true;

    } catch (error) {
        console.error('Login error:', error);
        if (error.name === 'AbortError') {
            showError('Login request timed out. Please try again.');
        } else {
            showError('Login failed. Please check your connection and try again.');
        }
        return false;
    }
}

async function handleRegistration(formData) {
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const phone = formData.get('phone')?.trim();
    const password = formData.get('password')?.trim();
    const confirmPassword = formData.get('confirm_password')?.trim();

    // Client-side validation
    if (!name || !email || !phone || !password || !confirmPassword) {
        showError('Please fill in all required fields');
        return false;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return false;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return false;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return false;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.success) {
            showSuccess('Account created successfully! You can now sign in.');

            // Reset form
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.reset();
            }

            // Switch to login tab and pre-fill email
            setTimeout(() => {
                switchTab('login');
                const loginEmail = document.getElementById('login-email');
                if (loginEmail) {
                    loginEmail.value = email;
                }
            }, 2000);

            return true;
        } else {
            showError(data.message || 'Registration failed. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'AbortError') {
            showError('Registration request timed out. Please try again.');
        } else {
            showError('Registration failed. Please check your connection and try again.');
        }
        return false;
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Track logout activity
        trackUserActivity('authentication', 'User logged out');

        // Clear session data
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        currentUser = null;

        // Reset UI
        resetAllUserDropdowns();
        showPage('home-page');

        // Show success message
        setTimeout(() => {
            alert('You have been logged out successfully.');
        }, 100);
    }
}

// ==================== UTILITY FUNCTIONS ====================
function showForgotPassword() {
    alert('Forgot Password functionality would be implemented here.\n\nThis would typically:\n1. Ask for email address\n2. Send reset link to email\n3. Allow user to reset password');
}

function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 10) {
        value = value.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1-$2-$3-$4');
    }
    input.value = value;
}

// ==================== EVENT HANDLERS ====================
function setupEventListeners() {
    // Navigation buttons
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            switchTab('login');
            showPage('auth-page');
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            switchTab('register');
            showPage('auth-page');
        });
    }

    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearMessages();

            const container = document.querySelector('.auth-container');
            if (container) {
                container.classList.add('loading');
            }

            try {
                await handleLogin(new FormData(this));
            } catch (error) {
                console.error('Login error:', error);
                showError('Login failed. Please try again.');
            } finally {
                if (container) {
                    container.classList.remove('loading');
                }
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearMessages();

            const container = document.querySelector('.auth-container');
            if (container) {
                container.classList.add('loading');
            }

            try {
                await handleRegistration(new FormData(this));
            } catch (error) {
                console.error('Registration error:', error);
                showError('Registration failed. Please try again.');
            } finally {
                if (container) {
                    container.classList.remove('loading');
                }
            }
        });
    }

    // Phone number formatting
    const phoneInput = document.getElementById('register-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            formatPhoneNumber(e.target);
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.user-dropdown');
        dropdowns.forEach(dropdown => {
            if (dropdown && !dropdown.contains(e.target)) {
                const menu = dropdown.querySelector('.user-dropdown-menu');
                if (menu) {
                    menu.classList.remove('show');
                    dropdown.classList.remove('active');
                }
            }
        });
    });

    // Property interactions
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            const propertyCard = e.target.closest('.property-card');
            if (propertyCard) {
                const address = propertyCard.querySelector('.property-address')?.textContent;

                if (confirm(`Are you sure you want to remove ${address || 'this property'} from your saved properties?`)) {
                    propertyCard.style.opacity = '0';
                    setTimeout(() => {
                        propertyCard.remove();
                        trackUserActivity('property', 'Removed saved property', { address });
                        alert('Property removed successfully!');
                    }, 500);
                }
            }
        }

        // Handle save property buttons
        if (e.target.classList.contains('btn-save-property')) {
            const propertyCard = e.target.closest('.property-card');
            if (propertyCard) {
                const propertyData = extractPropertyData(propertyCard);
                saveProperty(propertyData);
            }
        }
    });

    // Setup navigation interceptors
    setupNavigationInterceptors();
}

function extractPropertyData(propertyCard) {
    return {
        price: propertyCard.querySelector('.property-price')?.textContent,
        address: propertyCard.querySelector('.property-address')?.textContent,
        features: propertyCard.querySelector('.property-features')?.textContent
    };
}

// ==================== API TESTING ====================
async function testApiConnection() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/test`);
        if (response.ok) {
            console.log('API connection test: SUCCESS');
        } else {
            console.log('API connection test: FAILED');
        }
    } catch (error) {
        console.log('API connection test: FAILED -', error.message);
    }
}

// ==================== INITIALIZATION ====================
function initializeApp() {
    clearMessages();

    // Test API connection
    testApiConnection();

    // Check if user is already logged in
    currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (currentUser) {
        if (currentUser.isAdmin) {
            // If admin is logged in, redirect to admin panel
            window.location.href = 'adindex.html';
        } else {
            // Update UI for logged-in user
            updateAllUserDropdowns(currentUser);

            // Load user activities if on account page
            const accountPage = document.getElementById('account-page');
            if (accountPage && accountPage.classList.contains('active')) {
                loadUserActivities();
            }
        }
    }
}

// ==================== APP START ====================
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeApp();
});