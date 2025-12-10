// js/biometric.js - Updated with Archive System

const API_URL = '../api/biometric.php';
let biometricData = [];
let deleteItemId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBiometricData();
    loadStats();
    setupEventListeners();
});

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('mainContent').classList.toggle('expanded');
    });
    
    // Register button
    document.getElementById('registerBiometricBtn')?.addEventListener('click', openRegisterModal);
    
    // Modal close buttons
    document.getElementById('closeRegisterModalBtn')?.addEventListener('click', closeRegisterModal);
    document.getElementById('cancelRegisterBtn')?.addEventListener('click', closeRegisterModal);
    
    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', renderTable);
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        document.getElementById('logoutConfirmModal').style.display = 'block';
    });
    
    document.querySelectorAll('.close-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('logoutConfirmModal').style.display = 'none';
        });
    });
}

async function loadBiometricData() {
    try {
        const response = await fetch(`${API_URL}?action=list`);
        const result = await response.json();
        
        if (result.success) {
            biometricData = result.data;
            window.biometricData = result.data; // Make available globally for archive system
            renderTable();
        } else {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error loading biometric data:', error);
        showNotification('error', 'Error', 'Failed to load biometric records');
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}?action=stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('totalRegistered').textContent = stats.total_registered || 0;
            document.getElementById('expiringCount').textContent = stats.expiring_soon || 0;
            document.getElementById('expiredCount').textContent = stats.expired || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderTable() {
    const tbody = document.getElementById('biometricBody');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    const filtered = biometricData.filter(bio => 
        bio.employee_id.toLowerCase().includes(searchTerm) ||
        bio.employee_name.toLowerCase().includes(searchTerm) ||
        bio.department.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div>
                        <i class="fas fa-fingerprint"></i>
                        <p>No biometric records found</p>
                        <small>Register new biometrics to see them here</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(bio => {
        const status = getStatus(bio.expiry_date);
        return `
            <tr>
                <td>${bio.employee_id}</td>
                <td>${bio.employee_name}</td>
                <td>${bio.department}</td>
                <td>${formatDate(bio.registration_date)}</td>
                <td>${formatDate(bio.expiry_date)}</td>
                <td><span class="status-badge ${status.class}">${status.label}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-renew" onclick="renewBiometric('${bio.employee_id}')">
                            <i class="fas fa-sync-alt"></i> Renew
                        </button>
                        <button class="btn" onclick="archiveBiometric(${bio.biometric_id})" style="background-color: #ff9800; color: white;">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
        return { label: 'Expired', class: 'status-expired' };
    } else if (daysUntilExpiry <= 7) {
        return { label: 'Expiring Soon', class: 'status-warning' };
    } else {
        return { label: 'Active', class: 'status-active' };
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function openRegisterModal() {
    try {
        const response = await fetch(`${API_URL}?action=employees`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('employeeSelect');
            select.innerHTML = '<option value="">Select Employee</option>' +
                result.data.map(emp => 
                    `<option value="${emp.employee_id}">${emp.name} (${emp.employee_id})</option>`
                ).join('');
        }
        
        document.getElementById('registerModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerForm').reset();
}

async function handleRegister(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('employeeSelect').value;
    
    if (!employeeId) {
        showNotification('error', 'Error', 'Please select an employee');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: employeeId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Success', result.message);
            closeRegisterModal();
            loadBiometricData();
            loadStats();
        } else {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error registering biometric:', error);
        showNotification('error', 'Error', 'Failed to register biometric');
    }
}

async function renewBiometric(employeeId) {
    if (!confirm('Renew biometric registration for this employee?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=renew`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: employeeId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Success', result.message);
            loadBiometricData();
            loadStats();
        } else {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error renewing biometric:', error);
        showNotification('error', 'Error', 'Failed to renew biometric');
    }
}

// DELETE FUNCTION REMOVED - NOW USING archiveBiometric() from archive-system.js

function showNotification(type, title, message) {
    const notification = document.getElementById('notification');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Close modals on outside click
window.onclick = (event) => {
    const registerModal = document.getElementById('registerModal');
    
    if (event.target === registerModal) {
        closeRegisterModal();
    }
};

// Make functions global
window.renewBiometric = renewBiometric;
window.biometricData = biometricData;

console.log('✅ Biometric system loaded with archive functionality');