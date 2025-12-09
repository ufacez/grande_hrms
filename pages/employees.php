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

    <!-- Employee Modal (Add/Edit) -->
    <div id="employeeModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Add New Employee</h2>
                <span class="close-modal" onclick="document.getElementById('employeeModal').style.display='none'">&times;</span>
            </div>
            <form id="employeeForm" onsubmit="saveEmployee(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Employee ID *</label>
                        <input type="text" id="employeeId" required>
                    </div>
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="employeeName" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Position *</label>
                        <input type="text" id="position" required>
                    </div>
                    <div class="form-group">
                        <label>Department *</label>
                        <select id="department" required>
                            <option value="Sales">Sales</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Service">Service</option>
                            <option value="Management">Management</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="tel" id="phone" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Date Hired *</label>
                        <input type="date" id="dateHired" required>
                    </div>
                    <div class="form-group">
                        <label>Birthdate *</label>
                        <input type="date" id="birthdate" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Address *</label>
                    <textarea id="address" rows="2" required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Emergency Contact *</label>
                        <input type="text" id="emergencyContact" required>
                    </div>
                    <div class="form-group">
                        <label>Emergency Phone *</label>
                        <input type="tel" id="emergencyPhone" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Monthly Salary *</label>
                        <input type="number" id="monthlySalary" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Status *</label>
                        <select id="status" required>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>SSS Number</label>
                        <input type="text" id="sssNumber">
                    </div>
                    <div class="form-group">
                        <label>TIN Number</label>
                        <input type="text" id="tinNumber">
                    </div>
                </div>
                <div class="form-group">
                    <label>PhilHealth Number</label>
                    <input type="text" id="philhealthNumber">
                </div>
                <div class="form-buttons">
                    <button type="submit" class="save-btn">Save Employee</button>
                    <button type="button" class="cancel-btn" onclick="document.getElementById('employeeModal').style.display='none'">Cancel</button>
                </div>
            </form>
        </div>
    </div>

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
        document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
            window.location.href = '../logout.php';
        });
    </script>
</body>
</html>