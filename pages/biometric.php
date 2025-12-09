<?php
// pages/biometric.php
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biometric - Grande.</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/biometric.css">
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
                <a href="dashboard.php" class="nav-item"><i class="fas fa-chart-line"></i><span>Dashboard</span></a>
                <a href="employees.php" class="nav-item"><i class="fas fa-users"></i><span>Employees</span></a>
                <a href="attendance.php" class="nav-item"><i class="fas fa-clock"></i><span>Attendance</span></a>
                <a href="biometric.php" class="nav-item active"><i class="fas fa-fingerprint"></i><span>Biometric</span></a>
                <a href="payroll.php" class="nav-item"><i class="fas fa-money-bill-wave"></i><span>Payroll</span></a>
                <a href="report.php" class="nav-item"><i class="fas fa-file-alt"></i><span>Report</span></a>
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

            <div class="section-header">
                <div class="section-title">
                    <h2>Biometric Management</h2>
                </div>
                <div class="section-actions">
                    <button class="add-btn" id="registerBiometricBtn">
                        <i class="fas fa-plus"></i>
                        Register New Biometric
                    </button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="fas fa-fingerprint"></i>
                        </div>
                        <div class="stat-text">
                            <span class="stat-label">Total Registered</span>
                            <span class="stat-value" id="totalRegistered">0</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-text">
                            <span class="stat-label">Expiring Soon</span>
                            <span class="stat-value" id="expiringCount">0</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon danger">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <div class="stat-text">
                            <span class="stat-label">Expired</span>
                            <span class="stat-value" id="expiredCount">0</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Biometric Table -->
            <div class="table-container">
                <table id="biometricTable">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Registration Date</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="biometricBody"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Register Biometric Modal -->
    <div id="registerModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Register Biometric</h2>
                <button class="close-modal" id="closeRegisterModalBtn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="registerForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Employee *</label>
                            <select id="employeeSelect" required>
                                <option value="">Select Employee</option>
                            </select>
                        </div>
                    </div>
                    <div class="biometric-capture">
                        <div class="fingerprint-icon">
                            <i class="fas fa-fingerprint"></i>
                        </div>
                        <p>Place finger on scanner to capture biometric</p>
                        <div class="capture-status">Ready to scan</div>
                    </div>
                    <div class="form-buttons">
                        <button type="button" class="cancel-btn" id="cancelRegisterBtn">Cancel</button>
                        <button type="submit" class="save-btn">Register Biometric</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Notification Container -->
    <div id="notification" class="notification"></div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteConfirmModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Confirm Delete</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this biometric record?</p>
                <div class="form-buttons">
                    <button class="cancel-btn" id="cancelDeleteBtn">Cancel</button>
                    <button class="delete-btn" id="confirmDeleteBtn">Delete</button>
                </div>
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

    <script>
        let biometricData = [];
        const EXPIRY_DAYS = 30;

        // Load initial data
        function initializeBiometricData() {
            const savedData = localStorage.getItem('biometricData');
            if (savedData) {
                biometricData = JSON.parse(savedData);
            }
            updateStats();
            renderTable();
        }

        function saveBiometricData() {
            localStorage.setItem('biometricData', JSON.stringify(biometricData));
        }

        // Calculate expiry date
        function calculateExpiryDate(registrationDate) {
            const date = new Date(registrationDate);
            date.setDate(date.getDate() + EXPIRY_DAYS);
            return date;
        }

        // Get biometric status
        function getBiometricStatus(expiryDate) {
            const today = new Date();
            const expiry = new Date(expiryDate);
            const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                return { status: 'Expired', class: 'status-expired' };
            } else if (daysUntilExpiry <= 7) {
                return { status: 'Expiring Soon', class: 'status-warning' };
            } else {
                return { status: 'Active', class: 'status-active' };
            }
        }

        // Update statistics
        function updateStats() {
            const today = new Date();
            const stats = biometricData.reduce((acc, bio) => {
                const expiryDate = new Date(bio.expiryDate);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry < 0) {
                    acc.expired++;
                } else if (daysUntilExpiry <= 7) {
                    acc.expiringSoon++;
                }
                return acc;
            }, { total: biometricData.length, expiringSoon: 0, expired: 0 });

            document.getElementById('totalRegistered').textContent = stats.total;
            document.getElementById('expiringCount').textContent = stats.expiringSoon;
            document.getElementById('expiredCount').textContent = stats.expired;
        }

        // Render table
        function renderTable() {
            const tbody = document.getElementById('biometricBody');
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();

            const filtered = biometricData.filter(bio => 
                bio.employeeId.toLowerCase().includes(searchTerm) ||
                bio.name.toLowerCase().includes(searchTerm) ||
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
                const status = getBiometricStatus(bio.expiryDate);
                return `
                    <tr>
                        <td>${bio.employeeId}</td>
                        <td>${bio.name}</td>
                        <td>${bio.department}</td>
                        <td>${new Date(bio.registrationDate).toLocaleDateString()}</td>
                        <td>${new Date(bio.expiryDate).toLocaleDateString()}</td>
                        <td><span class="status-badge ${status.class}">${status.status}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-renew" onclick="renewBiometric('${bio.employeeId}')">
                                    <i class="fas fa-sync-alt"></i> Renew
                                </button>
                                <button class="btn btn-delete" onclick="deleteBiometric('${bio.employeeId}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Load employees for registration
        function loadEmployees() {
            const savedEmployees = localStorage.getItem('employees');
            if (savedEmployees) {
                const employees = JSON.parse(savedEmployees);
                const select = document.getElementById('employeeSelect');
                select.innerHTML = '<option value="">Select Employee</option>' +
                    employees.map(emp => 
                        `<option value="${emp.id}" data-department="${emp.department}">${emp.name} (${emp.id})</option>`
                    ).join('');
            }
        }

        // Register new biometric
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const employeeSelect = document.getElementById('employeeSelect');
            const option = employeeSelect.options[employeeSelect.selectedIndex];
            
            if (!option.value) {
                showNotification('error', 'Error', 'Please select an employee');
                return;
            }

            if (biometricData.find(bio => bio.employeeId === option.value)) {
                showNotification('error', 'Error', 'Employee already has a biometric registered');
                return;
            }

            const today = new Date();
            const newBiometric = {
                employeeId: option.value,
                name: option.text.split(' (')[0],
                department: option.dataset.department,
                registrationDate: today.toISOString(),
                expiryDate: calculateExpiryDate(today).toISOString()
            };

            biometricData.push(newBiometric);
            saveBiometricData();
            updateStats();
            renderTable();
            document.getElementById('registerModal').style.display = 'none';
            showNotification('success', 'Success', 'Biometric registered successfully');
        });

        // Renew biometric
        function renewBiometric(employeeId) {
            const biometric = biometricData.find(bio => bio.employeeId === employeeId);
            if (biometric) {
                const today = new Date();
                biometric.registrationDate = today.toISOString().split('T')[0];
                biometric.expiryDate = calculateExpiryDate(today).toISOString().split('T')[0];
                
                saveBiometricData();
                updateStats();
                renderTable();
                showNotification('Biometric has been successfully renewed');
            }
        }

        // Show notification
        function showNotification(message, isSuccess = true) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = 'notification ' + (isSuccess ? 'success' : 'error');
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }

        // Delete biometric
        function deleteBiometric(employeeId) {
            const deleteModal = document.getElementById('deleteConfirmModal');
            const closeBtn = deleteModal.querySelector('.close-modal');
            const cancelBtn = document.getElementById('cancelDeleteBtn');
            const confirmBtn = document.getElementById('confirmDeleteBtn');

            deleteModal.style.display = 'block';

            const closeModal = () => {
                deleteModal.style.display = 'none';
            };

            closeBtn.onclick = closeModal;
            cancelBtn.onclick = closeModal;
            
            confirmBtn.onclick = () => {
                biometricData = biometricData.filter(bio => bio.employeeId !== employeeId);
                saveBiometricData();
                updateStats();
                renderTable();
                closeModal();
                showNotification('Biometric record deleted successfully');
            };

            window.onclick = (event) => {
                if (event.target === deleteModal) {
                    closeModal();
                }
            };
        }

        // Event Listeners
        document.getElementById('registerBiometricBtn').addEventListener('click', function() {
            loadEmployees();
            document.getElementById('registerForm').reset();
            document.getElementById('registerModal').style.display = 'block';
        });

        document.getElementById('closeRegisterModalBtn').addEventListener('click', function() {
            document.getElementById('registerModal').style.display = 'none';
        });

        document.getElementById('cancelRegisterBtn').addEventListener('click', function() {
            document.getElementById('registerModal').style.display = 'none';
        });

        document.getElementById('searchInput').addEventListener('input', renderTable);

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            document.getElementById('logoutConfirmModal').style.display = 'block';
        });

        const closeLogoutBtns = document.querySelectorAll('.close-logout');
        closeLogoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('logoutConfirmModal').style.display = 'none';
            });
        });

        document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
            window.location.href = '../logout.php';
        });

        // Handle responsive layout
        function handleResize() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            
            if (window.innerWidth <= 1024) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        // Initialize
        initializeBiometricData();
    </script>
</body>
</html>