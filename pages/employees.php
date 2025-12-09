<?php
// pages/employees.php
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Management - Grande.</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/employees.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="dashboard">
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <button class="sidebar-toggle" id="sidebarToggle"><i class="fas fa-bars"></i></button>
                <h2>Grande.</h2>
            </div>
            <div class="nav-items">
                <a href="dashboard.php" class="nav-item"><i class="fas fa-chart-line"></i><span>Dashboard</span></a>
                <a href="employees.php" class="nav-item active"><i class="fas fa-users"></i><span>Employees</span></a>
                <a href="attendance.php" class="nav-item"><i class="fas fa-clock"></i><span>Attendance</span></a>
                <a href="biometric.php" class="nav-item"><i class="fas fa-fingerprint"></i><span>Biometric</span></a>
                <a href="payroll.php" class="nav-item"><i class="fas fa-money-bill-wave"></i><span>Payroll</span></a>
                <a href="report.php" class="nav-item"><i class="fas fa-file-alt"></i><span>Report</span></a>
                <a href="settings.php" class="nav-item"><i class="fas fa-cog"></i><span>Settings</span></a>
            </div>
        </div>

        <div class="main-content">
            <div class="header">
                <div class="search-container">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="searchInput" placeholder="Search employee by name or ID" class="search-input">
                </div>
                <div class="user-profile">
                    <span><?php echo htmlspecialchars($user['full_name']); ?></span>
                    <div style="width: 40px; height: 40px; background-color: #ddd; border-radius: 50%;"></div>
                </div>
            </div>

            <!-- Analytics Section -->
            <div class="analytics-section">
                <h2>Employee Analytics</h2>
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <div class="analytics-icon" style="background-color: #d4edda; color: #28a745;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="analytics-info">
                            <h3 id="totalEmployees">0</h3>
                            <p>Total Employees</p>
                        </div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-icon" style="background-color: #d1ecf1; color: #17a2b8;">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="analytics-info">
                            <h3 id="activeEmployees">0</h3>
                            <p>Active</p>
                        </div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-icon" style="background-color: #fff3cd; color: #ffc107;">
                            <i class="fas fa-user-clock"></i>
                        </div>
                        <div class="analytics-info">
                            <h3 id="onLeaveEmployees">0</h3>
                            <p>On Leave</p>
                        </div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-icon" style="background-color: #f8d7da; color: #dc3545;">
                            <i class="fas fa-user-slash"></i>
                        </div>
                        <div class="analytics-info">
                            <h3 id="blocklistedEmployees">0</h3>
                            <p>Blocklisted</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Employee List Section -->
            <div class="content-section">
                <div class="section-header">
                    <h2>Employee List</h2>
                    <div class="header-actions">
                        <select id="filterStatus" class="filter-select">
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Blocklisted">Blocklisted</option>
                        </select>
                        <button class="blocklisted-view-btn" onclick="showBlocklistedOnly()">
                            <i class="fas fa-ban"></i>
                            View Blocklisted
                        </button>
                        <button class="add-btn" onclick="openAddModal()">
                            <i class="fas fa-plus"></i>
                            Add Employee
                        </button>
                    </div>
                </div>
                <div id="employeeGrid" class="employee-grid">
                    <!-- Employees will be loaded here via JavaScript -->
                </div>
            </div>
        </div>
    </div>

    <!-- Include all modals from original HTML -->
    <!-- View, Add/Edit, Blocklist, Delete modals -->

    <button class="logout-btn" id="logoutBtn">
        <i class="fas fa-sign-out-alt"></i>
    </button>

    <script>
        // API Base URL
        const API_URL = '../api/employees.php';
        
        // Load employees from API instead of localStorage
        async function loadEmployees() {
            try {
                const response = await fetch(`${API_URL}?action=list`);
                const result = await response.json();
                
                if (result.success) {
                    employees = result.data;
                    updateAnalytics();
                    renderEmployees();
                }
            } catch (error) {
                console.error('Error loading employees:', error);
                showNotification('Failed to load employees', 'error');
            }
        }
        
        // Load statistics
        async function updateAnalytics() {
            try {
                const response = await fetch(`${API_URL}?action=stats`);
                const result = await response.json();
                
                if (result.success) {
                    const stats = result.data;
                    document.getElementById('totalEmployees').textContent = stats.total_employees || 0;
                    document.getElementById('activeEmployees').textContent = stats.active_employees || 0;
                    document.getElementById('onLeaveEmployees').textContent = stats.on_leave || 0;
                    document.getElementById('blocklistedEmployees').textContent = stats.blocklisted || 0;
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        }
        
        // Save employee (create or update)
        async function saveEmployee(employeeData) {
            const action = editingEmployeeId ? 'update' : 'create';
            const method = editingEmployeeId ? 'PUT' : 'POST';
            
            try {
                const response = await fetch(`${API_URL}?action=${action}`, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(employeeData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    loadEmployees();
                    setTimeout(() => closeModal(), 1500);
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                console.error('Error saving employee:', error);
                showNotification('Failed to save employee', 'error');
            }
        }
        
        // Delete employee
        async function deleteEmployee(id) {
            if (!confirm('Are you sure you want to delete this employee?')) return;
            
            try {
                const response = await fetch(`${API_URL}?action=delete&id=${id}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    loadEmployees();
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
                showNotification('Failed to delete employee', 'error');
            }
        }
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', () => {
            loadEmployees();
            
            // ... rest of your existing JavaScript code
            // Just replace localStorage operations with API calls
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '../logout.php';
            }
        });
    </script>
</body>
</html>