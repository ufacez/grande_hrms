<?php
// pages/settings.php
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - Grande.</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../css/settings.css">
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
                <a href="attendance.php" class="nav-item"><i class="fas fa-clock"></i><span>Attendance</span></a>
                <a href="biometric.php" class="nav-item"><i class="fas fa-fingerprint"></i><span>Biometric</span></a>
                <a href="payroll.php" class="nav-item"><i class="fas fa-money-bill-wave"></i><span>Payroll</span></a>
                <a href="settings.php" class="nav-item active"><i class="fas fa-cog"></i><span>Settings</span></a>
            </div>
        </div>

        <div class="main-content" id="mainContent">
            <div class="header">
                <div class="page-title">
                    <i class="fas fa-cog"></i>
                    <h1>Settings</h1>
                </div>
                <div class="user-profile">
                    <span><?php echo htmlspecialchars($user['full_name']); ?></span>
                    <div style="width: 40px; height: 40px; background-color: #ddd; border-radius: 50%;"></div>
                </div>
            </div>

            <div class="tabs-container">
                <div class="tabs">
                    <div class="tab active" data-tab="audit"><i class="fas fa-history"></i> Audit Trail</div>
                    <div class="tab" data-tab="archives"><i class="fas fa-archive"></i> Archives</div>
                    <div class="tab" data-tab="general"><i class="fas fa-sliders-h"></i> General Settings</div>
                </div>

                <div class="tab-content active" id="audit">
                    <div class="audit-filters">
                        <div class="filter-row">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="auditSearch" placeholder="Search audit logs...">
                            </div>
                            <div class="filter-select">
                                <i class="fas fa-filter"></i>
                                <select id="auditTypeFilter">
                                    <option value="all">All Activities</option>
                                    <option value="employee">Employee</option>
                                    <option value="payroll">Payroll</option>
                                    <option value="attendance">Attendance</option>
                                    <option value="biometric">Biometric</option>
                                    <option value="issue">Issues</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="audit-content" id="auditContent"></div>
                    <div class="footer-info">
                        <span>Showing <strong id="displayedCount">0</strong> of <strong id="totalCount">0</strong> entries</span>
                        <span>Last updated: <strong id="lastUpdate">Never</strong></span>
                    </div>
                </div>

                <div class="tab-content" id="archives">
                    <div class="archive-controls">
                        <div class="archive-filters">
                            <label style="font-weight: 500; color: #666;">Filter:</label>
                            <select id="archiveTypeFilter">
                                <option value="all">All Archives</option>
                                <option value="employees">Employees</option>
                                <option value="attendance">Attendance</option>
                                <option value="payroll">Payroll</option>
                            </select>
                        </div>
                        <div class="archive-actions">
                            <button class="btn btn-restore" id="restoreSelected"><i class="fas fa-undo"></i> Restore Selected</button>
                            <button class="btn btn-danger" id="deleteSelected"><i class="fas fa-trash"></i> Delete Permanently</button>
                        </div>
                    </div>
                    <div class="archive-table">
                        <table>
                            <thead>
                                <tr>
                                    <th class="checkbox-cell"><input type="checkbox" id="selectAll"></th>
                                    <th>Type</th>
                                    <th>ID</th>
                                    <th>Name/Description</th>
                                    <th>Archived Date</th>
                                    <th>Archived By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="archiveBody"></tbody>
                        </table>
                    </div>
                    <div class="footer-info">
                        <span>Total archived items: <strong id="archiveCount">0</strong></span>
                        <button class="btn btn-secondary" id="clearArchives"><i class="fas fa-broom"></i> Clear All Archives</button>
                    </div>
                </div>

                <div class="tab-content" id="general">
                    <div class="settings-section">
                        <h3><i class="fas fa-bell"></i> Notifications</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Email Notifications</h4>
                                <p>Receive email alerts for important updates</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Late Attendance Alerts</h4>
                                <p>Get notified when employees are late</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3><i class="fas fa-shield-alt"></i> Security</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Two-Factor Authentication</h4>
                                <p>Add an extra layer of security to your account</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Auto Logout</h4>
                                <p>Automatically log out after 30 minutes of inactivity</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3><i class="fas fa-database"></i> Data Management</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Auto-Backup</h4>
                                <p>Automatically backup data daily</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Data Retention</h4>
                                <p>Keep archived data for 90 days before permanent deletion</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <button class="logout-btn" id="logoutBtn"><i class="fas fa-sign-out-alt"></i></button>

    <script>
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
                
                if (tab.dataset.tab === 'audit') renderAuditTrail();
                if (tab.dataset.tab === 'archives') renderArchives();
            });
        });

        function loadAuditData() {
            return JSON.parse(localStorage.getItem('auditTrail') || '[]');
        }

        function formatTimestamp(iso) {
            const date = new Date(iso);
            const diff = Date.now() - date;
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return `${Math.floor(diff/60000)} min ago`;
            if (diff < 86400000) return `${Math.floor(diff/3600000)} hr ago`;
            return date.toLocaleString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
        }

        function renderAuditTrail() {
            const data = loadAuditData();
            const search = document.getElementById('auditSearch').value.toLowerCase();
            const type = document.getElementById('auditTypeFilter').value;
            const filtered = data.filter(e => {
                const matchSearch = e.action.toLowerCase().includes(search) || e.details.toLowerCase().includes(search);
                const matchType = type === 'all' || e.type === type;
                return matchSearch && matchType;
            });
            
            const content = document.getElementById('auditContent');
            if (filtered.length === 0) {
                content.innerHTML = '<div class="empty-audit"><i class="fas fa-inbox"></i><p>No audit logs found</p></div>';
            } else {
                content.innerHTML = filtered.map(e => `
                    <div class="audit-entry type-${e.type}">
                        <div class="audit-entry-header">
                            <div class="audit-entry-title">
                                <div class="audit-icon"><i class="fas ${e.icon}"></i></div>
                                <div class="audit-entry-info">
                                    <h4>${e.action}</h4>
                                    <div class="audit-user"><i class="fas fa-user"></i> ${e.user}</div>
                                </div>
                            </div>
                            <span class="audit-badge">${e.type}</span>
                        </div>
                        <div class="audit-details">${e.details}</div>
                        <div class="audit-timestamp"><i class="fas fa-clock"></i> ${formatTimestamp(e.timestamp)}</div>
                    </div>
                `).join('');
            }
            document.getElementById('displayedCount').textContent = filtered.length;
            document.getElementById('totalCount').textContent = data.length;
            document.getElementById('lastUpdate').textContent = data.length > 0 ? formatTimestamp(data[0].timestamp) : 'Never';
        }

        function loadArchives() {
            return JSON.parse(localStorage.getItem('archives') || '[]');
        }

        function saveArchives(data) {
            localStorage.setItem('archives', JSON.stringify(data));
        }

        function renderArchives() {
            const archives = loadArchives();
            const typeFilter = document.getElementById('archiveTypeFilter').value;
            const filtered = typeFilter === 'all' ? archives : archives.filter(a => a.type === typeFilter);
            
            const body = document.getElementById('archiveBody');
            if (filtered.length === 0) {
                body.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>No archived items</td></tr>';
            } else {
                body.innerHTML = filtered.map(item => `
                    <tr>
                        <td class="checkbox-cell"><input type="checkbox" class="archive-checkbox" data-id="${item.id}"></td>
                        <td><span class="archive-badge badge-${item.type}">${item.type}</span></td>
                        <td>${item.originalId || 'N/A'}</td>
                        <td>${item.name || item.description || 'N/A'}</td>
                        <td>${new Date(item.archivedDate).toLocaleString()}</td>
                        <td>${item.archivedBy}</td>
                        <td class="action-btns">
                            <button class="btn-icon restore" onclick="restoreItem('${item.id}')"><i class="fas fa-undo"></i></button>
                            <button class="btn-icon delete" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');
            }
            document.getElementById('archiveCount').textContent = archives.length;
        }

        function restoreItem(id) {
            if (!confirm('Restore this item?')) return;
            
            const archives = loadArchives();
            const item = archives.find(a => a.id === id);
            if (!item) return;
            
            if (item.type === 'employees') {
                const employees = JSON.parse(localStorage.getItem('employees') || '[]');
                employees.push(item.data);
                localStorage.setItem('employees', JSON.stringify(employees));
            } else if (item.type === 'attendance') {
                const attendance = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
                attendance.push(item.data);
                localStorage.setItem('attendanceRecords', JSON.stringify(attendance));
            } else if (item.type === 'payroll') {
                const payroll = JSON.parse(localStorage.getItem('payrollData') || '[]');
                payroll.push(item.data);
                localStorage.setItem('payrollData', JSON.stringify(payroll));
            }
            
            saveArchives(archives.filter(a => a.id !== id));
            
            const auditData = loadAuditData();
            auditData.unshift({
                id: Date.now(),
                type: 'system',
                action: 'Item Restored',
                details: `Restored ${item.type} item: ${item.name || item.description}`,
                icon: 'fa-undo',
                user: '<?php echo htmlspecialchars($user['full_name']); ?>',
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('auditTrail', JSON.stringify(auditData));
            
            renderArchives();
            alert('Item restored successfully!');
        }

        function deleteItem(id) {
            if (!confirm('Permanently delete this item? This cannot be undone!')) return;
            
            const archives = loadArchives();
            const item = archives.find(a => a.id === id);
            
            saveArchives(archives.filter(a => a.id !== id));
            
            const auditData = loadAuditData();
            auditData.unshift({
                id: Date.now(),
                type: 'system',
                action: 'Item Deleted',
                details: `Permanently deleted ${item.type} item: ${item.name || item.description}`,
                icon: 'fa-trash',
                user: '<?php echo htmlspecialchars($user['full_name']); ?>',
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('auditTrail', JSON.stringify(auditData));
            
            renderArchives();
            alert('Item permanently deleted!');
        }

        document.getElementById('selectAll').addEventListener('change', function() {
            document.querySelectorAll('.archive-checkbox').forEach(cb => {
                cb.checked = this.checked;
            });
        });

        document.getElementById('restoreSelected').addEventListener('click', () => {
            const selected = Array.from(document.querySelectorAll('.archive-checkbox:checked')).map(cb => cb.dataset.id);
            if (selected.length === 0) {
                alert('No items selected!');
                return;
            }
            
            if (!confirm(`Restore ${selected.length} item(s)?`)) return;
            
            selected.forEach(id => restoreItem(id));
        });

        document.getElementById('deleteSelected').addEventListener('click', () => {
            const selected = Array.from(document.querySelectorAll('.archive-checkbox:checked')).map(cb => cb.dataset.id);
            if (selected.length === 0) {
                alert('No items selected!');
                return;
            }
            
            if (!confirm(`Permanently delete ${selected.length} item(s)? This cannot be undone!`)) return;
            
            const archives = loadArchives();
            saveArchives(archives.filter(a => !selected.includes(a.id)));
            
            const auditData = loadAuditData();
            auditData.unshift({
                id: Date.now(),
                type: 'system',
                action: 'Bulk Delete',
                details: `Permanently deleted ${selected.length} archived items`,
                icon: 'fa-trash',
                user: '<?php echo htmlspecialchars($user['full_name']); ?>',
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('auditTrail', JSON.stringify(auditData));
            
            renderArchives();
            alert(`${selected.length} item(s) permanently deleted!`);
        });

        document.getElementById('clearArchives').addEventListener('click', () => {
            const archives = loadArchives();
            if (archives.length === 0) {
                alert('No archives to clear!');
                return;
            }
            
            if (!confirm(`Permanently delete all ${archives.length} archived items? This cannot be undone!`)) return;
            
            saveArchives([]);
            
            const auditData = loadAuditData();
            auditData.unshift({
                id: Date.now(),
                type: 'system',
                action: 'Archives Cleared',
                details: `Cleared all archived items (${archives.length} items)`,
                icon: 'fa-broom',
                user: '<?php echo htmlspecialchars($user['full_name']); ?>',
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('auditTrail', JSON.stringify(auditData));
            
            renderArchives();
            alert('All archives cleared!');
        });

        document.getElementById('auditSearch').addEventListener('input', renderAuditTrail);
        document.getElementById('auditTypeFilter').addEventListener('change', renderAuditTrail);
        document.getElementById('archiveTypeFilter').addEventListener('change', renderArchives);

        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.getElementById('mainContent').classList.toggle('expanded');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '../logout.php';
            }
        });

        renderAuditTrail();
    </script>
</body>
</html>