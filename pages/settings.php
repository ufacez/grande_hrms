<?php
// pages/settings.php - Complete with Profile, Audit Trail & Archives
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
    <link rel="stylesheet" href="../css/styles.css">
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
                    <h1>System Settings</h1>
                </div>
                <div class="user-profile">
                    <span><?php echo htmlspecialchars($user['full_name']); ?></span>
                    <div style="width: 40px; height: 40px; background-color: #ddd; border-radius: 50%;"></div>
                </div>
            </div>

            <div class="tabs-container">
                <div class="tabs">
                    <div class="tab active" data-tab="profile">
                        <i class="fas fa-user-circle"></i> My Profile
                    </div>
                    <div class="tab" data-tab="audit">
                        <i class="fas fa-history"></i> Audit Trail
                    </div>
                    <div class="tab" data-tab="archives">
                        <i class="fas fa-archive"></i> Archives
                    </div>
                </div>

                <!-- Profile Tab -->
                <div class="tab-content active" id="profile">
                    <div style="padding: 25px;">
                        <!-- Profile Header -->
                        <div class="profile-header">
                            <div class="profile-avatar" id="profileAvatar">
                                <!-- Initials will be loaded here -->
                            </div>
                            <div class="profile-info">
                                <h2 class="profile-name" id="profileName">Loading...</h2>
                                <span class="profile-role" id="profileRole">Loading...</span>
                                <div class="profile-meta">
                                    <div class="meta-item">
                                        <i class="fas fa-user"></i>
                                        <span id="profileUsername">Loading...</span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-envelope"></i>
                                        <span id="profileEmail">Loading...</span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-calendar"></i>
                                        <span>Joined: <strong id="profileJoined">Loading...</strong></span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-clock"></i>
                                        <span>Last Login: <strong id="profileLastLogin">Loading...</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Personal Information Section -->
                        <div class="settings-section">
                            <h3><i class="fas fa-id-card"></i> Personal Information</h3>
                            <form id="profileForm">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="fullName">Full Name *</label>
                                        <input type="text" id="fullName" required disabled>
                                    </div>
                                    <div class="form-group">
                                        <label for="email">Email Address *</label>
                                        <input type="email" id="email" required disabled>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="username">Username</label>
                                        <input type="text" id="username" disabled>
                                    </div>
                                    <div class="form-group">
                                        <label for="role">Role</label>
                                        <input type="text" id="role" disabled>
                                    </div>
                                </div>
                                <div class="btn-group">
                                    <button type="button" class="btn-primary" id="editProfileBtn">
                                        <i class="fas fa-edit"></i>
                                        Edit Profile
                                    </button>
                                    <button type="submit" class="btn-primary" id="saveProfileBtn" style="display: none;">
                                        <i class="fas fa-save"></i>
                                        Save Changes
                                    </button>
                                    <button type="button" class="btn-secondary" id="cancelEditBtn" style="display: none;">
                                        <i class="fas fa-times"></i>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Security Section -->
                        <div class="settings-section" style="margin-top: 30px;">
                            <h3><i class="fas fa-lock"></i> Security Settings</h3>
                            <form id="passwordForm">
                                <div class="form-group">
                                    <label for="currentPassword">Current Password *</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="currentPassword" required>
                                        <button type="button" class="toggle-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="newPassword">New Password *</label>
                                        <div class="password-input-wrapper">
                                            <input type="password" id="newPassword" required>
                                            <button type="button" class="toggle-password">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="confirmPassword">Confirm New Password *</label>
                                        <div class="password-input-wrapper">
                                            <input type="password" id="confirmPassword" required>
                                            <button type="button" class="toggle-password">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="password-requirements">
                                    <h4>Password Requirements:</h4>
                                    <ul>
                                        <li>At least 6 characters long</li>
                                        <li>Must be different from current password</li>
                                        <li>Both passwords must match</li>
                                    </ul>
                                </div>
                                <div class="btn-group">
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-key"></i>
                                        Change Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Audit Trail Tab -->
                <div class="tab-content" id="audit">
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
                                    <option value="system">System</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="audit-content" id="auditContent">
                        <div class="empty-audit">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading audit trail...</p>
                        </div>
                    </div>
                    <div class="footer-info">
                        <span>Showing <strong id="displayedCount">0</strong> of <strong id="totalCount">0</strong> entries</span>
                        <span>Last updated: <strong id="lastUpdate">Never</strong></span>
                    </div>
                </div>

                <!-- Archives Tab -->
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
                            <button class="btn btn-restore" id="restoreSelected">
                                <i class="fas fa-undo"></i> Restore Selected
                            </button>
                            <button class="btn btn-danger" id="deleteSelected">
                                <i class="fas fa-trash"></i> Delete Permanently
                            </button>
                        </div>
                    </div>
                    <div class="archive-table">
                        <table>
                            <thead>
                                <tr>
                                    <th class="checkbox-cell">
                                        <input type="checkbox" id="selectAll">
                                    </th>
                                    <th>Type</th>
                                    <th>ID</th>
                                    <th>Name/Description</th>
                                    <th>Archived Date</th>
                                    <th>Archived By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="archiveBody">
                                <tr>
                                    <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                                        <i class="fas fa-spinner fa-spin" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                                        <p>Loading archives...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="footer-info">
                        <span>Total archived items: <strong id="archiveCount">0</strong></span>
                        <button class="btn btn-secondary" id="clearArchives">
                            <i class="fas fa-broom"></i> Clear All Archives
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <button class="logout-btn" id="logoutBtn">
        <i class="fas fa-sign-out-alt"></i>
    </button>

    <!-- Load the dynamic settings manager -->
    <script src="../js/settings.js"></script>
</body>
</html>