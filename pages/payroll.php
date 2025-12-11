<?php
// pages/payroll.php
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payroll - Grande.</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/payroll.css">
    <link rel="stylesheet" href="../css/custom-payroll.css">
    <link rel="stylesheet" href="../css/delete-modal.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> 
    <link rel="stylesheet" href="../css/payslip_print.css">
    <script src="../js/payroll.js" defer></script>
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
                <a href="dashboard.php" class="nav-item"><i class="fas fa-chart-line"></i><span>Dashboard</span></a>
                <a href="employees.php" class="nav-item"><i class="fas fa-users"></i><span>Employees</span></a>
                <a href="attendance.php" class="nav-item"><i class="fas fa-clock"></i><span>Attendance</span></a>
                <a href="biometric.php" class="nav-item"><i class="fas fa-fingerprint"></i><span>Biometric</span></a>
                <a href="payroll.php" class="nav-item active"><i class="fas fa-money-bill-wave"></i><span>Payroll</span></a>
                <a href="settings.php" class="nav-item"><i class="fas fa-cog"></i><span>Settings</span></a>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content" id="mainContent">
            <!-- Header -->
            <div class="header">
                <div class="search-container">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Search employee..." class="search-input" id="searchInput">
                </div>
                <div class="user-profile">
                    <span><?php echo htmlspecialchars($user['full_name']); ?></span>
                    <div style="width: 40px; height: 40px; background-color: #ddd; border-radius: 50%;"></div>
                </div>
            </div>

            <!-- Notification -->
            <div id="notification" class="notification"></div>

            <div class="section-header">
                <h2>Payroll Management</h2>
            </div>

            <!-- Filters and Statistics -->
            <div class="filters-container">
                <div class="filters">
                    <div class="filter-group">
                        <label>Payroll Period</label>
                        <select id="payPeriod" class="period-select">
                            <!-- Will be populated automatically -->
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Department</label>
                        <select id="departmentFilter">
                            <option value="">All Departments</option>
                            <option value="Sales">Sales</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Service">Service</option>
                            <option value="Management">Management</option>
                        </select>
                    </div>
                    <button id="applyFilters" class="filter-btn">
                        <i class="fas fa-filter"></i> Apply Filters
                    </button>
                </div>
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-title">Total Payroll</div>
                        <div class="stat-value" id="totalPayroll">₱0.00</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Total Overtime</div>
                        <div class="stat-value" id="totalOvertime">₱0.00</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Total Deductions</div>
                        <div class="stat-value" id="totalDeductions">₱0.00</div>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table id="payrollTable">
                    <thead>
                        <tr>
                            <th style="width: 100px;">Employee ID</th>
                            <th style="width: 150px;">Name</th>
                            <th style="width: 120px;">Position</th>
                            <th style="width: 120px;">Department</th>
                            <th style="width: 100px; text-align: right;">Basic Salary</th>
                            <th style="width: 100px; text-align: right;">Overtime Pay</th>
                            <th style="width: 100px; text-align: right;">Gross Pay</th>
                            <th style="width: 100px; text-align: right;">Deductions</th>
                            <th style="width: 100px; text-align: right;">Net Pay</th>
                            <th style="width: 100px;">Status</th>
                            <th style="width: 140px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="payrollBody"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteConfirmModal" class="modal">
        <div class="modal-content">
            <div class="modal-body">
                <div id="confirmContent">
                    <p>Are you sure you want to remove this employee from payroll?</p>
                    <div class="form-buttons">
                        <button class="ok-btn" id="confirmDeleteBtn">OK</button>
                        <button class="cancel-btn" id="cancelDeleteBtn">Cancel</button>
                    </div>
                </div>
                <div id="successContent" style="display: none;">
                    <p>Employee has been removed from payroll</p>
                    <div class="form-buttons">
                        <button class="ok-btn" id="successOkBtn">OK</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
    <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
            <h2><i class="fas fa-edit"></i> Edit Payroll Details</h2>
            <button class="close-modal" id="closeEditModalBtn">&times;</button>
        </div>
        <div class="modal-body">
            <form id="editForm">
                <input type="hidden" id="editPayrollId">
                
                <!-- Employee Info (Read-only) -->
                <div class="info-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> Employee Name</label>
                            <input type="text" id="editName" readonly>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-id-badge"></i> Employee ID</label>
                            <input type="text" id="editEmployeeId" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label><i class="fas fa-briefcase"></i> Position</label>
                            <input type="text" id="editPosition" readonly>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-building"></i> Department</label>
                            <input type="text" id="editDepartment" readonly>
                        </div>
                    </div>
                </div>

                <div class="divider"></div>

                <!-- ✅ ENHANCED: Editable Basic Salary -->
                <div class="section-title">
                    <i class="fas fa-money-bill-wave"></i> Basic Compensation
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Basic Salary (₱) *</label>
                        <input type="number" id="editBasicSalary" step="0.01" min="0" required>
                        <small class="form-hint">Base pay for the period (editable)</small>
                    </div>
                    <div class="form-group">
                        <label>Current Value</label>
                        <input type="text" id="currentBasicSalary" readonly style="background: #f8f9fa;">
                    </div>
                </div>

                <div class="divider"></div>

                <!-- Overtime Section -->
                <div class="section-title">
                    <i class="fas fa-clock"></i> Overtime
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Overtime Hours</label>
                        <input type="number" id="editOvertimeHours" step="0.5" min="0" value="0">
                        <small class="form-hint">Hours worked beyond standard time</small>
                    </div>
                    <div class="form-group">
                        <label>Overtime Rate (₱/hour)</label>
                        <input type="number" id="editOvertimeRate" step="0.01" min="0" value="0">
                        <small class="form-hint">Rate per overtime hour</small>
                    </div>
                </div>
                <div class="calculated-field">
                    <label>Calculated Overtime Pay:</label>
                    <span id="calculatedOvertimePay">₱0.00</span>
                </div>

                <div class="divider"></div>

                <!-- Deductions Section -->
                <div class="section-title">
                    <i class="fas fa-minus-circle"></i> Deductions
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Late Deductions (₱)</label>
                        <input type="number" id="editLateDeductions" step="0.01" min="0" value="0">
                        <small class="form-hint">Deductions for tardiness</small>
                    </div>
                    <div class="form-group">
                        <label>Other Deductions (₱)</label>
                        <input type="number" id="editOtherDeductions" step="0.01" min="0" value="0">
                        <small class="form-hint">SSS, PhilHealth, Pag-IBIG, etc.</small>
                    </div>
                </div>

                <div class="divider"></div>

                <!-- Summary Section -->
                <div class="summary-section">
                    <h3><i class="fas fa-calculator"></i> Payroll Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>Basic Salary:</span>
                            <strong id="summaryBasic">₱0.00</strong>
                        </div>
                        <div class="summary-item">
                            <span>Overtime Pay:</span>
                            <strong id="summaryOvertime">₱0.00</strong>
                        </div>
                        <div class="summary-item total">
                            <span>Gross Pay:</span>
                            <strong id="summaryGross">₱0.00</strong>
                        </div>
                        <div class="summary-item deduction">
                            <span>Total Deductions:</span>
                            <strong id="summaryDeductions">₱0.00</strong>
                        </div>
                        <div class="summary-item net">
                            <span>NET PAY:</span>
                            <strong id="summaryNet">₱0.00</strong>
                        </div>
                    </div>
                </div>

                <div class="form-buttons">
                    <button type="button" class="cancel-btn" id="cancelEditBtn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" class="save-btn">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
/* Enhanced Modal Styles */
.info-section {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 20px 0 15px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #eee;
    display: flex;
    align-items: center;
    gap: 8px;
}

.divider {
    height: 1px;
    background: #eee;
    margin: 25px 0;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 15px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.form-group input {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    transition: all 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: #222;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
}

.form-group input[readonly] {
    background-color: #f5f5f5;
    cursor: not-allowed;
    color: #666;
}

.form-hint {
    font-size: 11px;
    color: #666;
    margin-top: 4px;
    font-style: italic;
}

.calculated-field {
    background: #fff3cd;
    padding: 12px;
    border-radius: 5px;
    border-left: 4px solid #ffc107;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    font-size: 14px;
}

.calculated-field label {
    font-weight: 500;
    color: #856404;
}

.calculated-field span {
    font-size: 16px;
    font-weight: 600;
    color: #856404;
}

.summary-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
}

.summary-section h3 {
    color: white;
    margin: 0 0 15px 0;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.summary-grid {
    display: grid;
    gap: 10px;
}

.summary-item {
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 15px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.summary-item.total {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
}

.summary-item.deduction {
    background: #ffebee;
    border-left: 4px solid #f44336;
}

.summary-item.net {
    background: #e8f5e9;
    border-left: 4px solid #4caf50;
    font-size: 16px;
    padding: 15px;
}

.summary-item span {
    color: #666;
    font-weight: 500;
}

.summary-item strong {
    color: #222;
    font-size: 15px;
}

.summary-item.net strong {
    font-size: 20px;
    color: #2e7d32;
}

.form-buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.save-btn, .cancel-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
}

.save-btn {
    background: #222;
    color: white;
}

.save-btn:hover {
    background: #111;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.cancel-btn {
    background: #6c757d;
    color: white;
}

.cancel-btn:hover {
    background: #5a6268;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}
</style>

    <!-- Payslip Modal -->
    <div id="payslipModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Employee Payslip</h2>
                <button class="close-modal" id="closePayslipModalBtn">&times;</button>
            </div>
            <div class="payslip" id="payslipContent"></div>
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

    <!-- Notification System -->
    <div class="notification-container" id="notificationContainer"></div>

    <script>
        // The payroll.js will handle all functionality
        // Update logout to use PHP
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
                window.location.href = '../logout.php';
            });
        });
    </script>
    <script src="../js/archive-system.js" defer></script>
</body>
</html>