<?php
// pages/dashboard.php
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Grande.</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="../js/audit-archive-manager.js"></script>
</head>
<body>
    <div class="dashboard">
        <!-- Sidebar -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <button class="sidebar-toggle" id="sidebarToggle"><i class="fas fa-bars"></i></button>
                <h2>Grande.</h2>
            </div>
            <div class="nav-items">
                <a href="dashboard.php" class="nav-item active"><i class="fas fa-chart-line"></i><span>Dashboard</span></a>
                <a href="employees.php" class="nav-item"><i class="fas fa-users"></i><span>Employees</span></a>
                <a href="attendance.php" class="nav-item"><i class="fas fa-clock"></i><span>Attendance</span></a>
                <a href="biometric.php" class="nav-item"><i class="fas fa-fingerprint"></i><span>Biometric</span></a>
                <a href="payroll.php" class="nav-item"><i class="fas fa-money-bill-wave"></i><span>Payroll</span></a>
                <a href="report.php" class="nav-item"><i class="fas fa-file-alt"></i><span>Report</span></a>
                <a href="settings.php" class="nav-item"><i class="fas fa-cog"></i><span>Settings</span></a>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="header">
                <div class="search-container">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Search..." class="search-input">
                </div>
                <div class="user-profile">
                    <span><?php echo htmlspecialchars($user['full_name']); ?></span>
                    <div style="width: 40px; height: 40px; background-color: #ddd; border-radius: 50%;"></div>
                </div>
            </div>

            <!-- Global notification area -->
            <div id="globalNotification" class="notification" style="display: none;"></div>

            <!-- Current Week Schedule -->
            <div class="schedule-table">
                <div class="schedule-header">
                    <h2>Current Week Schedule - <span id="weekRange"></span></h2>
                    <div class="schedule-actions">
                        <button class="add-employee-btn" onclick="openAddEmployeeModal()">
                            <i class="fas fa-user-plus"></i> Add Employee
                        </button>
                        <button class="remove-employee-btn" onclick="openRemoveEmployeeModal()">
                            <i class="fas fa-user-minus"></i> Remove Employee
                        </button>
                    </div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Saturday</th>
                                <th>Sunday</th>
                                <th>Monday</th>
                                <th>Tuesday</th>
                                <th>Wednesday</th>
                                <th>Thursday</th>
                                <th>Friday</th>
                            </tr>
                        </thead>
                        <tbody id="scheduleTableBody">
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Next Week Schedule -->
            <div class="schedule-table">
                <div class="schedule-header">
                    <h2>Next Week Schedule - <span id="nextWeekRange"></span></h2>
                    <div class="schedule-actions">
                        <button class="add-employee-btn" id="copyCurrentToNext">
                            <i class="fas fa-copy"></i> Copy Current Week
                        </button>
                        <button class="remove-employee-btn" id="clearNextWeek">
                            <i class="fas fa-eraser"></i> Clear Schedule
                        </button>
                    </div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Saturday</th>
                                <th>Sunday</th>
                                <th>Monday</th>
                                <th>Tuesday</th>
                                <th>Wednesday</th>
                                <th>Thursday</th>
                                <th>Friday</th>
                            </tr>
                        </thead>
                        <tbody id="nextScheduleTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Schedule Modal -->
    <div id="scheduleModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="editModalTitle">Edit Schedule</h2>
                <span class="close-modal" onclick="closeModal()">&times;</span>
            </div>
            <form id="scheduleForm">
                <input type="hidden" id="editingWeek" value="current">
                <div class="form-group">
                    <label for="employeeName">Employee</label>
                    <select id="employeeName" required>
                    </select>
                </div>
                <div class="form-group">
                    <label for="daySelect">Day</label>
                    <select id="daySelect" required>
                        <option value="0">Saturday</option>
                        <option value="1">Sunday</option>
                        <option value="2">Monday</option>
                        <option value="3">Tuesday</option>
                        <option value="4">Wednesday</option>
                        <option value="5">Thursday</option>
                        <option value="6">Friday</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="shiftTypeSelect">Shift Type</label>
                    <select id="shiftTypeSelect" onchange="toggleCustomShift()">
                        <option value="predefined">Predefined Shift</option>
                        <option value="custom">Custom Shift</option>
                    </select>
                </div>
                <div id="predefinedShiftGroup" class="form-group">
                    <label for="shiftSelect">Shift</label>
                    <select id="shiftSelect">
                        <option value="Morning">Morning Shift</option>
                        <option value="Afternoon">Afternoon Shift</option>
                        <option value="Night">Night Shift</option>
                        <option value="Off">Day Off</option>
                    </select>
                </div>
                <div id="customShiftGroup" style="display: none;">
                    <div class="form-group">
                        <label for="customShiftName">Shift Name</label>
                        <input type="text" id="customShiftName" placeholder="e.g., Opening Shift">
                    </div>
                    <div class="form-group">
                        <label for="startTime">Start Time</label>
                        <input type="time" id="startTime">
                    </div>
                    <div class="form-group">
                        <label for="endTime">End Time</label>
                        <input type="time" id="endTime">
                    </div>
                    <div class="form-group">
                        <label for="shiftColor">Shift Color</label>
                        <input type="color" id="shiftColor" value="#222222">
                    </div>
                </div>
                <div id="savedShiftsGroup" style="display: none;">
                    <div class="form-group">
                        <label for="savedShifts">Load Saved Shift</label>
                        <select id="savedShifts" onchange="loadSelectedShift()">
                        </select>
                    </div>
                    <button type="button" class="delete-shift-btn" onclick="deleteSelectedShift()">Delete Selected Shift</button>
                </div>
                <div class="form-buttons">
                    <button type="submit" class="save-btn">Save</button>
                    <button type="button" class="cancel-btn" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Employee Modal -->
    <div id="addEmployeeModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Employee to Schedule</h2>
                <span class="close-modal close-add-employee">&times;</span>
            </div>
            <form id="addEmployeeForm">
                <div class="form-group">
                    <label for="newEmployeeName">Employee Name</label>
                    <input type="text" id="newEmployeeName" required placeholder="Enter employee name">
                </div>
                <div class="form-buttons">
                    <button type="submit" class="save-btn">Add</button>
                    <button type="button" class="cancel-btn close-add-employee">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Remove Employee Modal -->
    <div id="removeEmployeeModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Remove Employee from Schedule</h2>
                <span class="close-modal close-remove-employee">&times;</span>
            </div>
            <div id="removeNotification" class="notification" style="display: none;"></div>
            <form id="removeEmployeeForm">
                <div class="form-group">
                    <label for="removeEmployeeSelect">Select Employee</label>
                    <select id="removeEmployeeSelect" required>
                    </select>
                </div>
                <div class="form-buttons">
                    <button type="submit" class="save-btn">Remove</button>
                    <button type="button" class="cancel-btn close-remove-employee">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div id="logoutConfirmModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Confirm Logout</h2>
                <span class="close-modal close-logout">&times;</span>
            </div>
            <p style="padding: 20px 0; text-align: center;">Are you sure you want to logout?</p>
            <div class="form-buttons">
                <button id="confirmLogoutBtn" class="save-btn">Yes, Logout</button>
                <button class="cancel-btn close-logout">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Logout Button -->
    <button class="logout-btn" id="logoutBtn">
        <i class="fas fa-sign-out-alt"></i>
    </button>

    <script src="../js/dashboard.js"></script>
    <script>
        // Update logout to use PHP logout
        document.getElementById('confirmLogoutBtn').addEventListener('click', function() {
            window.location.href = '../logout.php';
        });
    </script>
</body>
</html>