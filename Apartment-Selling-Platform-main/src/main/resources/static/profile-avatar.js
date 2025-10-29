// Profile Picture Utility Functions
// This script provides reusable functions for handling profile pictures across the application

function getUserProfilePicture(userID) {
    return localStorage.getItem(`profilePicture_${userID}`);
}

function getUserInitials(userName) {
    if (!userName) return 'U';
    return userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function createUserAvatar(userName, userID, size = '32px') {
    const savedPicture = getUserProfilePicture(userID);

    if (savedPicture) {
        return `<img src="${savedPicture}" class="user-avatar" style="width: ${size}; height: ${size};" alt="Profile Picture">`;
    } else {
        const initials = getUserInitials(userName);
        return `<div class="user-avatar-default" style="width: ${size}; height: ${size}; font-size: ${parseInt(size) * 0.4}px;">${initials}</div>`;
    }
}

function updateHeaderAvatar() {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) return;

        const headerAvatarContainer = document.getElementById('header-user-avatar');
        if (headerAvatarContainer) {
            headerAvatarContainer.innerHTML = createUserAvatar(currentUser.name || currentUser.email, currentUser.userID);
        }
    } catch (e) {
        console.log('No user logged in or error updating header avatar');
    }
}

// Add global CSS styles for profile avatars
function addProfileAvatarStyles() {
    if (document.getElementById('profile-avatar-styles')) return; // Already added

    const style = document.createElement('style');
    style.id = 'profile-avatar-styles';
    style.textContent = `
        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--primary, #4F46E5);
            margin-left: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .user-avatar:hover {
            transform: scale(1.1);
        }

        .user-avatar-default {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary, #4F46E5), var(--secondary, #06B6D4));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid var(--primary, #4F46E5);
            margin-left: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .user-avatar-default:hover {
            transform: scale(1.1);
        }

        .user-avatar-large {
            width: 48px !important;
            height: 48px !important;
            font-size: 20px !important;
        }

        .user-avatar-small {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
            margin-left: 8px !important;
        }
    `;
    document.head.appendChild(style);
}

// Initialize profile avatar functionality on page load
function initializeProfileAvatars() {
    addProfileAvatarStyles();
    updateHeaderAvatar();
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfileAvatars);
} else {
    initializeProfileAvatars();
}
