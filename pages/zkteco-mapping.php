<?php
// pages/zkteco-mapping.php - Manage ZKTeco ID Mappings
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZKTeco ID Mapping - Grande.</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .mapping-section {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .mapping-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }

        .mapping-header h2 {
            margin: 0;
            font-size: 24px;
            color: #222;
        }

        .btn-add {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .search-filter {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }

        .search-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }

        .mapping-table {
            width: 100%;
            border-collapse: collapse;
        }

        .mapping-table th,
        .mapping-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .mapping-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }

        .mapping-table tr:hover {
            background: #f8f9fa;
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .status-active {
            background: #d4edda;
            color: #155724;
        }

        .status-unmapped {
            background: #fff3cd;
            color: #856404;
        }

        .status-inactive {
            background: #f8d7da;
            color: #721c24;
        }

        .action-btns {
            display: flex;
            gap: 5px;
        }

        .btn-icon {
            padding: 6px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            color: white;
        }

        .btn-edit {
            background: #007bff;
        }

        .btn-delete {
            background: #dc3545;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.show {
            display: flex;
        }

        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .modal-header h3 {
            margin: 0;
        }

        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }

        .form-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }

        .btn-save {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .btn-cancel {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .info-box h4 {
            margin: 0 0 10px 0;
            color: #1565c0;
        }

        .info-box p {
            margin: 5px 0;
            color: #1976d2;
            font-size: 14px;
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
                <a href="employees.php" class="nav-item"><i class="fas fa-users"></i><span>Employees</span></a>
                <a href="attendance.php" class="nav-item"><i class="fas fa-clock"></i><span>Attendance</span></a>
                <a href="zkteco-import.php" class="nav-item"><i class="fas fa-file-import"></i><span>ZKTeco Import</span></a>
                <a href="zkteco-mapping.php" class="nav-item active"><i class="fas fa-link"></i><span>ID Mapping</span></a>
                <a href="payroll.php" class="nav-item"><i class="fas fa-money-bill-wave"></i><span>Payroll</span></a>
                <a href="settings.php" class="nav-item"><i class="fas fa-cog"></i><span>Settings</span></a>
            </div>
        </div>

        <div class="main-content">
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

            <div class="mapping-section">
                <div class="mapping-header">
                    <h2><i class="fas fa-link"></i> ZKTeco ID Mapping</h2>
                    <button class="btn-add" onclick="openAddModal()">
                        <i class="fas fa-plus"></i>
                        Add Mapping
                    </button>
                </div>

                <div class="info-box">
                    <h4><i class="fas fa-info-circle"></i> About ID Mapping</h4>
                    <p>This page maps ZKTeco Badge Numbers (AC-No.) to your system's Employee IDs.</p>
                    <p>When you import ZKTeco data, the system uses these mappings to identify employees.</p>
                    <p><strong>Auto-mapping:</strong> System automatically creates mappings when badge numbers match employee IDs.</p>
                </div>

                <div class="search-filter">
                    <input type="text" class="search-input" id="searchMapping" placeholder="Search by ZKTeco ID or Employee ID...">
                    <select id="statusFilter" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Unmapped">Unmapped</option>
                        <option value="Inactive Employee">Inactive Employee</option>
                    </select>
                </div>

                <table class="mapping-table">
                    <thead>
                        <tr>
                            <th>ZKTeco ID (Badge)</th>
                            <th>Employee ID</th>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Mapped Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="mappingTableBody">
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #999;"></i>
                                <p style="margin-top: 10px; color: #999;">Loading mappings...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Add/Edit Modal -->
    <div id="mappingModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">Add ID Mapping</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <form id="mappingForm">
                <input type="hidden" id="mappingId">
                <div class="form-group">
                    <label>ZKTeco ID (Badge Number) *</label>
                    <input type="text" id="zktecoId" required placeholder="Badge number from ZKTeco device">
                </div>
                <div class="form-group">
                    <label>Employee *</label>
                    <select id="employeeSelect" required>
                        <option value="">Select Employee</option>
                    </select>
                </div>
                <div class="form-buttons">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-save">Save Mapping</button>
                </div>
            </form>
        </div>
    </div>

    <button class="logout-btn" id="logoutBtn">
        <i class="fas fa-sign-out-alt"></i>
    </button>

    <script>
        let mappings = [];
        let employees = [];

        // Load data
        async function loadMappings() {
            try {
                const response = await fetch('../api/zkteco-mapping-api.php?action=list');
                const result = await response.json();
                
                if (result.success) {
                    mappings = result.data;
                    renderMappings();
                }
            } catch (error) {
                console.error('Error loading mappings:', error);
            }
        }

        async function loadEmployees() {
            try {
                const response = await fetch('../api/employees.php?action=list&status=Active');
                const result = await response.json();
                
                if (result.success) {
                    employees = result.data;
                    populateEmployeeSelect();
                }
            } catch (error) {
                console.error('Error loading employees:', error);
            }
        }

        function populateEmployeeSelect() {
            const select = document.getElementById('employeeSelect');
            select.innerHTML = '<option value="">Select Employee</option>' +
                employees.map(emp => 
                    `<option value="${emp.employee_id}">${emp.name} (${emp.employee_id})</option>`
                ).join('');
        }

        function renderMappings() {
            const tbody = document.getElementById('mappingTableBody');
            const searchTerm = document.getElementById('searchMapping').value.toLowerCase();
            const statusFilter = document.getElementById('statusFilter').value;

            let filtered = mappings.filter(m => {
                const matchSearch = !searchTerm || 
                    m.zkteco_id.toLowerCase().includes(searchTerm) ||
                    m.employee_id.toLowerCase().includes(searchTerm) ||
                    (m.system_name || '').toLowerCase().includes(searchTerm);
                
                const matchStatus = statusFilter === 'all' || m.mapping_status === statusFilter;
                
                return matchSearch && matchStatus;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                            <i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                            <p>No mappings found</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filtered.map(m => `
                <tr>
                    <td><strong>${m.zkteco_id}</strong></td>
                    <td>${m.employee_id}</td>
                    <td>${m.system_name || m.zkteco_name || '-'}</td>
                    <td>${m.department || '-'}</td>
                    <td>
                        <span class="status-badge status-${m.mapping_status.toLowerCase().replace(' ', '-')}">
                            ${m.mapping_status}
                        </span>
                    </td>
                    <td>${new Date(m.mapped_date).toLocaleDateString()}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon btn-edit" onclick="editMapping('${m.zkteco_id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="deleteMapping('${m.zkteco_id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Add ID Mapping';
            document.getElementById('mappingForm').reset();
            document.getElementById('zktecoId').disabled = false;
            document.getElementById('mappingModal').classList.add('show');
        }

        function editMapping(zktecoId) {
            const mapping = mappings.find(m => m.zkteco_id === zktecoId);
            if (!mapping) return;

            document.getElementById('modalTitle').textContent = 'Edit ID Mapping';
            document.getElementById('zktecoId').value = mapping.zkteco_id;
            document.getElementById('zktecoId').disabled = true;
            document.getElementById('employeeSelect').value = mapping.employee_id;
            document.getElementById('mappingModal').classList.add('show');
        }

        function closeModal() {
            document.getElementById('mappingModal').classList.remove('show');
        }

        async function deleteMapping(zktecoId) {
            if (!confirm('Delete this mapping? ZKTeco imports will no longer recognize this badge number.')) {
                return;
            }

            try {
                const response = await fetch(`../api/zkteco-mapping-api.php?action=delete&zkteco_id=${zktecoId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    alert('Mapping deleted successfully');
                    loadMappings();
                } else {
                    alert('Failed to delete: ' + result.message);
                }
            } catch (error) {
                alert('Error deleting mapping');
            }
        }

        document.getElementById('mappingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                zkteco_id: document.getElementById('zktecoId').value,
                employee_id: document.getElementById('employeeSelect').value
            };

            try {
                const response = await fetch('../api/zkteco-mapping-api.php?action=save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Mapping saved successfully');
                    closeModal();
                    loadMappings();
                } else {
                    alert('Failed to save: ' + result.message);
                }
            } catch (error) {
                alert('Error saving mapping');
            }
        });

        // Event listeners
        document.getElementById('searchMapping').addEventListener('input', renderMappings);
        document.getElementById('statusFilter').addEventListener('change', renderMappings);
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Logout?')) window.location.href = '../logout.php';
        });

        // Initialize
        loadMappings();
        loadEmployees();
    </script>
</body>
</html>