// users.js

function saveUserSession(userId, username) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
}

function clearUserSession() {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
}

function getUserId() {
    return localStorage.getItem('userId');
}

function getUsername() {
    return localStorage.getItem('username');
}

window.userHelper = {
    saveUserSession,
    clearUserSession,
    getUserId,
    getUsername
};