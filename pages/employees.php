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
        <!-- Sidebar -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <button class="sidebar-toggle" id="sidebarToggle">
                    <i class="fas fa-bars"></i>
                </button>
                <h2>Grande.</h2>
            </div>
            <div class="nav-items">
                <a href="dashboard.php" class="nav-item">
                    <i class="fas fa-chart-line"></i>
                    <span>Dashboard</span>
                </a>
                <a href="employees.php" class="nav-item active">
                    <i class="fas fa-users"></i>
                    <span>Employees</span>
                </a>
                <a href="attendance.php" class="nav-item">
                    <i class="fas fa-clock"></i>
                    <span>Attendance</span>
                </a>
                <a href="biometric.php" class="nav-item">
                    <i class="fas fa-fingerprint"></i>
                    <span>Biometric</span>
                </a>
                <a href="payroll.php" class="nav-item">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Payroll</span>
                </a>
                <a href="settings.php" class="nav-item">
                    <i class="fas fa-cog"></i>
                    <span>Settings</span>
                </a>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
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

    <!-- Employee Modal -->
    <div id="employeeModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Add New Employee</h2>
                <span class="close-modal" id="closeModalBtn">&times;</span>
            </div>
            <form id="employeeForm">
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="employeeId">Employee ID <span class="required">*</span></label>
                            <input type="text" id="employeeId" name="employeeId" required readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="employeeName">Full Name <span class="required">*</span></label>
                            <input type="text" id="employeeName" name="employeeName" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="position">Position <span class="required">*</span></label>
                            <input type="text" id="position" name="position" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="department">Department <span class="required">*</span></label>
                            <select id="department" name="department" required>
                                <option value="">Select Department</option>
                                <option value="Sales">Sales</option>
                                <option value="Kitchen">Kitchen</option>
                                <option value="Service">Service</option>
                                <option value="Management">Management</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email">
                        </div>
                        
                        <div class="form-group">
                            <label for="phone">Phone <span class="required">*</span></label>
                            <input type="tel" id="phone" name="phone" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="dateHired">Date Hired <span class="required">*</span></label>
                            <input type="date" id="dateHired" name="dateHired" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="birthdate">Birthdate</label>
                            <input type="date" id="birthdate" name="birthdate">
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="address">Address</label>
                            <textarea id="address" name="address" rows="2"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="emergencyContact">Emergency Contact</label>
                            <input type="text" id="emergencyContact" name="emergencyContact">
                        </div>
                        
                        <div class="form-group">
                            <label for="emergencyPhone">Emergency Phone</label>
                            <input type="tel" id="emergencyPhone" name="emergencyPhone">
                        </div>
                        
                        <div class="form-group">
                            <label for="monthlySalary">Monthly Salary <span class="required">*</span></label>
                            <input type="number" id="monthlySalary" name="monthlySalary" step="0.01" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="status">Status <span class="required">*</span></label>
                            <select id="status" name="status" required>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="sssNumber">SSS Number</label>
                            <input type="text" id="sssNumber" name="sssNumber" placeholder="12-3456789-0">
                        </div>
                        
                        <div class="form-group">
                            <label for="tinNumber">TIN Number</label>
                            <input type="text" id="tinNumber" name="tinNumber" placeholder="123-456-789-000">
                        </div>
                        
                        <div class="form-group">
                            <label for="philhealthNumber">PhilHealth Number</label>
                            <input type="text" id="philhealthNumber" name="philhealthNumber" placeholder="PH-123456789">
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="submit" class="save-btn">
                        <i class="fas fa-save"></i> Save Employee
                    </button>
                    <button type="button" class="cancel-btn" id="cancelModalBtn">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Schedule Modal -->
    <div id="scheduleModal" class="modal">
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2>Manage Schedule - <span id="scheduleEmployeeName"></span></h2>
                <span class="close-modal" id="closeScheduleModalBtn">&times;</span>
            </div>
            <div class="modal-body">
                <div class="schedule-section">
                    <h3><i class="fas fa-calendar-week"></i> Current Week</h3>
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Shift</th>
                                <th>Time</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="currentWeekScheduleBody"></tbody>
                    </table>
                </div>
                
                <div class="schedule-section">
                    <h3><i class="fas fa-calendar-alt"></i> Next Week</h3>
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Shift</th>
                                <th>Time</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="nextWeekScheduleBody"></tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="cancel-btn" id="cancelScheduleBtn">Close</button>
            </div>
        </div>
    </div>

    <!-- Schedule Edit Modal -->
    <div id="scheduleEditModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Edit Schedule</h2>
                <span class="close-modal" onclick="closeScheduleEditModal()">&times;</span>
            </div>
            <form id="scheduleEditForm" onsubmit="saveSchedule(event)">
                <div class="modal-body">
                    <div class="day-name-display">
                        <i class="fas fa-calendar-day"></i>
                        <span id="editDayName"></span>
                    </div>
                    
                    <input type="hidden" id="editDayWeek">
                    <input type="hidden" id="editDayIndex">
                    <input type="hidden" id="editDayEmployee">
                    
                    <div class="form-group">
                        <label for="editShiftSelect">Select Shift <span class="required">*</span></label>
                        <select id="editShiftSelect" required>
                            <option value="">Choose a shift...</option>
                            <option value="Morning">Morning Shift (6:00 AM - 2:00 PM)</option>
                            <option value="Afternoon">Afternoon Shift (2:00 PM - 10:00 PM)</option>
                            <option value="Night">Night Shift (10:00 PM - 6:00 AM)</option>
                            <option value="Off">Day Off</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="save-btn">
                        <i class="fas fa-save"></i> Save Schedule
                    </button>
                    <button type="button" class="cancel-btn" onclick="closeScheduleEditModal()">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Logout Button -->
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
    <script src="../js/archive-system.js" defer></script>
</body>
</html>