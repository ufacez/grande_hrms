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
                <a href="zkteco-import.php" class="nav-item"><i class="fas fa-file-import"></i><span>ZKTeco Import</span></a>
                <a href="zkteco-mapping.php" class="nav-item"><i class="fas fa-link"></i><span>ID Mapping</span></a>
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

    <!-- Employee Modal - Add this to employees.php before closing </body> tag -->
<div id="employeeModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Add New Employee</h2>
            <span class="close-modal" id="closeModalBtn">&times;</span>
        </div>
        <form id="employeeForm">
            <div class="modal-body">
                <div class="form-grid">
                    <!-- Basic Information -->
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
                    
                    <!-- Emergency Contact -->
                    <div class="form-group">
                        <label for="emergencyContact">Emergency Contact</label>
                        <input type="text" id="emergencyContact" name="emergencyContact">
                    </div>
                    
                    <div class="form-group">
                        <label for="emergencyPhone">Emergency Phone</label>
                        <input type="tel" id="emergencyPhone" name="emergencyPhone">
                    </div>
                    
                    <!-- Salary and Status -->
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
                    
                    <!-- Government IDs -->
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
    <div class="modal-content">
        <div class="modal-header">
            <h2>Manage Schedule - <span id="scheduleEmployeeName"></span></h2>
            <span class="close-modal" id="closeScheduleModalBtn">&times;</span>
        </div>
        <div class="modal-body">
            <!-- Current Week Schedule -->
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
                    <tbody id="currentWeekScheduleBody">
                        <!-- Populated by JavaScript -->
                    </tbody>
                </table>
            </div>
            
            <!-- Next Week Schedule -->
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
                    <tbody id="nextWeekScheduleBody">
                        <!-- Populated by JavaScript -->
                    </tbody>
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
    <div class="modal-content">
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

<style>
/* Modal Styles */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.3s;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-content {
    background-color: #fff;
    margin: 2% auto;
    padding: 0;
    border-radius: 8px;
    max-width: 800px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    animation: slideDown 0.3s;
}

@keyframes slideDown {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    border-bottom: 1px solid #eee;
}

.modal-header h2 {
    margin: 0;
    font-size: 20px;
    color: #333;
}

.close-modal {
    color: #aaa;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    line-height: 1;
}

.close-modal:hover {
    color: #000;
}

.modal-body {
    padding: 25px;
    max-height: 60vh;
    overflow-y: auto;
}

.modal-footer {
    padding: 15px 25px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group label {
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.required {
    color: #dc3545;
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #222;
}

.form-group input[readonly] {
    background-color: #f5f5f5;
    cursor: not-allowed;
}

.save-btn {
    background-color: #222;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.3s;
}

.save-btn:hover {
    background-color: #111;
}

.cancel-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
}

.cancel-btn:hover {
    background-color: #5a6268;
}

@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .modal-content {
        margin: 5% 10px;
        max-width: calc(100% - 20px);
    }
}
</style>

    <script src="../js/employees.js"></script>
    <script src="../js/archive-system.js" defer></script>
    <script>
        // Update logout to use PHP
        document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
            window.location.href = '../logout.php';
        });
    </script>
</body>
</html>