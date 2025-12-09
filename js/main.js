// Login function (kept in main.js because index.html uses it)
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple validation - in a real app, this would involve server authentication
    if (username && password) {
        window.location.href = './pages/dashboard.html';
    } else {
        alert('Please enter both username and password');
    }
}