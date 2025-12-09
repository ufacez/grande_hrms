<?php
// pages/attendance.php
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance - Grande.</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/attendance.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="../js/attendance-pdf-export.js" defer></script>
    <script src="../js/audit-archive-manager.js"></script>
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
                <a href="employees.php" class="nav-item"><i class="fas fa-users"></i><span>Employees</span></a>
                <a href="attendance.php" class="nav-item active"><i class="fas fa-clock"></i><span>Attendance</span></a>
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

            <div class="attendance-section">
                <!-- Export Action Section -->
                <div class="export-action">
                    <button class="action-button" onclick="exportToPDF()">
                        <i class="fas fa-file-pdf"></i>
                        Export to PDF
                    </button>
                </div>

                <div class="section-header">
                    <h2>Attendance Records</h2>
                    <div class="header-actions">
                        <select id="statusFilter" class="filter-select">
                            <option value="">All Status</option>
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                        <div class="date-filter-container">
                            <select id="viewBySelect" class="filter-select" style="margin-right:8px;">
                                <option value="day">Day</option>
                                <option value="month">Month</option>
                            </select>
                            <div id="dateFilterDay" class="date-range-inputs">
                                <input type="date" id="dateFilterSingle" class="date-filter" title="Select date">
                            </div>
                            <div id="dateFilterMonth" class="date-range-inputs" style="display:none;">
                                <input type="month" id="monthFilter" class="date-filter" title="Select month">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="attendance-stats">
                    <div class="stat-card">
                        <div class="stat-icon present">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="presentCount">0</h3>
                            <p>Present</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon absent">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="absentCount">0</h3>
                            <p>Absent</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon late">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="lateCount">0</h3>
                            <p>Late</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon leave">
                            <i class="fas fa-calendar-times"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="leaveCount">0</h3>
                            <p>On Leave</p>
                        </div>
                    </div>
                </div>

                <div class="attendance-table-container">
                    <table class="attendance-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Time In</th>
                                <th>Time Out</th>
                                <th>Status</th>
                                <th>Hours Worked</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="attendanceTableBody">
                            <!-- Attendance records will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Attendance Modal -->
    <div id="editAttendanceModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Attendance</h2>
                <span class="close-modal" id="closeEditModal">&times;</span>
            </div>
            <div id="editNotification" class="notification" style="display: none;"></div>
            <div class="modal-body">
                <form id="editAttendanceForm">
                    <input type="hidden" id="editAttendanceId">
                    <div class="form-group">
                        <label for="editEmployeeName">Employee</label>
                        <input type="text" id="editEmployeeName" readonly>
                    </div>
                    <div class="form-group">
                        <label for="editAttendanceDate">Date *</label>
                        <input type="date" id="editAttendanceDate" required>
                    </div>
                    <div class="form-group">
                        <label for="editTimeIn">Time In *</label>
                        <input type="time" id="editTimeIn" required>
                    </div>
                    <div class="form-group">
                        <label for="editTimeOut">Time Out</label>
                        <input type="time" id="editTimeOut">
                    </div>
                    <div class="form-group">
                        <label for="editStatusSelect">Status *</label>
                        <select id="editStatusSelect" required>
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editRemarks">Remarks</label>
                        <textarea id="editRemarks" rows="3"></textarea>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="save-btn">Update</button>
                        <button type="button" class="cancel-btn" id="cancelEditBtn">Cancel</button>
                    </div>
                </form>
            </div>
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

    <script src="../js/attendance.js"></script>
    <script>
        // Update API calls to use PHP backend
        const API_URL = '../api/attendance.php';
        
        // Override logout function
        document.getElementById('confirmLogoutBtn').addEventListener('click', function() {
            window.location.href = '../logout.php';
        });
    </script>
</body>
</html>