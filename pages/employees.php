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
    <script src="../js/audit-archive-manager.js"></script>
    <style>
        /* Schedule Modal Styles */
        #scheduleModal .modal-content {
            max-width: 900px;
        }
        
        .schedule-section {
            margin-bottom: 30px;
        }
        
        .schedule-section h3 {
            font-size: 16px;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #eee;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .schedule-table th,
        .schedule-table td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
        }
        
        .schedule-table th {
            background-color: #f8f9fa;
            font-weight: 500;
            color: #333;
        }
        
        .schedule-table tbody tr:hover {
            background-color: #f8f9fa;
        }
        
        .schedule-edit-btn {
            background-color: #222;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.2s;
        }
        
        .schedule-edit-btn:hover {
            background-color: #111;
        }
        
        .schedule-edit-btn i {
            font-size: 12px;
        }
        
        /* Schedule Edit Modal */
        #scheduleEditModal .modal-content {
            max-width: 500px;
        }
        
        .day-name-display {
            font-size: 18px;
            font-weight: 600;
            color: #222;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            text-align: center;
        }
        
        /* Employee Card Schedule Icon */
        .employee-card .icon-btn[title="Manage Schedule"] {
            color: #17a2b8;
        }
        
        .employee-card .icon-btn[title="Manage Schedule"]:hover {
            color: #138496;
        }
    </style>
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
                        <button class="blocklisted-view-btn" id="blocklistToggleBtn">
                            <i class="fas fa-ban"></i>
                            View Blocklisted
                        </button>
                        <button class="add-btn" id="addEmployeeBtn">
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

    <!-- All modals remain the same -->
    <!-- Employee Modal, Schedule Modal, Schedule Edit Modal -->
    <!-- (keeping the existing modal HTML from your original file) -->

    <button class="logout-btn" id="logoutBtn">
        <i class="fas fa-sign-out-alt"></i>
    </button>

    <!-- Logout Confirmation Modal -->
    <div id="logoutConfirmModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Confirm Logout</h2>
                <span class="close-modal close-logout">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to logout?</p>
                <div class="form-buttons">
                    <button id="confirmLogoutBtn" class="save-btn">Yes, Logout</button>
                    <button class="cancel-btn close-logout">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <script src="../js/employees.js"></script>
    <script>
        // Update logout to use PHP
        document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
            window.location.href = '../logout.php';
        });
    </script>
</body>
</html>