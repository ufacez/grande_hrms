// js/settings.js - Dynamic Settings, Audit Trail & Archives Manager

const AUDIT_API = '../api/audit.php';
const EMPLOYEES_API = '../api/employees.php';
const ATTENDANCE_API = '../api/attendance.php';
const PAYROLL_API = '../api/payroll.php';

// Initialize Settings Page
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupEventListeners();
    loadAuditTrail();
    setupAutoRefresh();
});

// Tab System
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active states
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Load tab content
            if (tabName === 'audit') {
                loadAuditTrail();
            } else if (tabName === 'archives') {
                loadArchives();
            }
        });
    });
}

// Event Listeners
function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('mainContent').classList.toggle('expanded');
    });
    
    // Audit filters
    document.getElementById('auditSearch')?.addEventListener('input', loadAuditTrail);
    document.getElementById('auditTypeFilter')?.addEventListener('change', loadAuditTrail);
    
    // Archive filters
    document.getElementById('archiveTypeFilter')?.addEventListener('change', loadArchives);
    document.getElementById('selectAll')?.addEventListener('change', handleSelectAll);
    
    // Archive actions
    document.getElementById('restoreSelected')?.addEventListener('click', restoreSelected);
    document.getElementById('deleteSelected')?.addEventListener('click', deleteSelected);
    document.getElementById('clearArchives')?.addEventListener('click', clearAllArchives);
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '../logout.php';
        }
    });
}

// Auto-refresh audit trail every 30 seconds
function setupAutoRefresh() {
    setInterval(() => {
        const activeTab = document.querySelector('.tab.active')?.dataset.tab;
        if (activeTab === 'audit') {
            loadAuditTrail(true); // Silent refresh
        }
    }, 30000);
}

// =============================================
// AUDIT TRAIL FUNCTIONS
// =============================================

async function loadAuditTrail(silent = false) {
    try {
        const search = document.getElementById('auditSearch')?.value || '';
        const type = document.getElementById('auditTypeFilter')?.value || 'all';
        
        const params = new URLSearchParams({
            action: 'list',
            type: type,
            search: search
        });
        
        const response = await fetch(`${AUDIT_API}?${params}`);
        const result = await response.json();
        
        if (result.success) {
            renderAuditTrail(result.data || []);
            updateAuditStats(result.data || []);
        } else if (!silent) {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error loading audit trail:', error);
        if (!silent) {
            showNotification('error', 'Error', 'Failed to load audit trail');
        }
    }
}

function renderAuditTrail(data) {
    const content = document.getElementById('auditContent');
    
    if (data.length === 0) {
        content.innerHTML = `
            <div class="empty-audit">
                <i class="fas fa-inbox"></i>
                <p>No audit logs found</p>
                <small>Activity logs will appear here</small>
            </div>
        `;
        return;
    }
    
    content.innerHTML = data.map(entry => {
        const typeClass = `type-${entry.action_type}`;
        const icon = entry.icon || getDefaultIcon(entry.action_type);
        const badge = getBadgeForType(entry.action_type);
        
        return `
            <div class="audit-entry ${typeClass}">
                <div class="audit-entry-header">
                    <div class="audit-entry-title">
                        <div class="audit-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="audit-entry-info">
                            <h4>${escapeHtml(entry.action)}</h4>
                            <div class="audit-user">
                                <i class="fas fa-user"></i> 
                                ${escapeHtml(entry.user_name || 'System')}
                            </div>
                        </div>
                    </div>
                    <span class="audit-badge">${badge}</span>
                </div>
                <div class="audit-details">${escapeHtml(entry.details)}</div>
                <div class="audit-timestamp">
                    <i class="fas fa-clock"></i> 
                    ${formatTimestamp(entry.timestamp)}
                </div>
            </div>
        `;
    }).join('');
}

function updateAuditStats(data) {
    document.getElementById('displayedCount').textContent = data.length;
    document.getElementById('totalCount').textContent = data.length;
    
    const lastUpdate = data.length > 0 ? formatTimestamp(data[0].timestamp) : 'Never';
    document.getElementById('lastUpdate').textContent = lastUpdate;
}

function getDefaultIcon(type) {
    const icons = {
        'employee': 'fa-user',
        'payroll': 'fa-money-bill-wave',
        'attendance': 'fa-clock',
        'biometric': 'fa-fingerprint',
        'issue': 'fa-exclamation-triangle',
        'system': 'fa-cog'
    };
    return icons[type] || 'fa-info-circle';
}

function getBadgeForType(type) {
    const labels = {
        'employee': 'Employee',
        'payroll': 'Payroll',
        'attendance': 'Attendance',
        'biometric': 'Biometric',
        'issue': 'Issue',
        'system': 'System'
    };
    return labels[type] || type;
}

// =============================================
// ARCHIVES FUNCTIONS
// =============================================

async function loadArchives() {
    const archiveData = JSON.parse(localStorage.getItem('archives') || '[]');
    const typeFilter = document.getElementById('archiveTypeFilter')?.value || 'all';
    
    const filtered = typeFilter === 'all' 
        ? archiveData 
        : archiveData.filter(a => a.archive_type === typeFilter);
    
    renderArchives(filtered);
}

function renderArchives(data) {
    const tbody = document.getElementById('archiveBody');
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                    <p>No archived items</p>
                    <small>Deleted items will appear here</small>
                </td>
            </tr>
        `;
        document.getElementById('archiveCount').textContent = '0';
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td class="checkbox-cell">
                <input type="checkbox" class="archive-checkbox" data-id="${item.archive_id}">
            </td>
            <td>
                <span class="archive-badge badge-${item.archive_type}">
                    ${capitalizeFirst(item.archive_type)}
                </span>
            </td>
            <td>${escapeHtml(item.original_id)}</td>
            <td>${escapeHtml(item.name_description || 'N/A')}</td>
            <td>${formatDate(item.archived_date)}</td>
            <td>${escapeHtml(item.archived_by || 'System')}</td>
            <td class="action-btns">
                <button class="btn-icon restore" onclick="restoreArchive(${item.archive_id})" title="Restore">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteArchive(${item.archive_id})" title="Delete Permanently">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('archiveCount').textContent = data.length;
}

function handleSelectAll(e) {
    document.querySelectorAll('.archive-checkbox').forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
}

async function restoreArchive(archiveId) {
    if (!confirm('Restore this item? It will be moved back to its original location.')) {
        return;
    }
    
    const archives = JSON.parse(localStorage.getItem('archives') || '[]');
    const item = archives.find(a => a.archive_id === archiveId);
    
    if (!item) {
        showNotification('error', 'Error', 'Archive not found');
        return;
    }
    
    try {
        const data = JSON.parse(item.archived_data);
        
        // Restore based on type
        if (item.archive_type === 'employees') {
            await restoreEmployee(data);
        } else if (item.archive_type === 'attendance') {
            await restoreAttendance(data);
        } else if (item.archive_type === 'payroll') {
            await restorePayroll(data);
        }
        
        // Remove from archives
        const updatedArchives = archives.filter(a => a.archive_id !== archiveId);
        localStorage.setItem('archives', JSON.stringify(updatedArchives));
        
        showNotification('success', 'Success', 'Item restored successfully');
        loadArchives();
        
    } catch (error) {
        console.error('Error restoring archive:', error);
        showNotification('error', 'Error', 'Failed to restore item');
    }
}

async function restoreEmployee(data) {
    const response = await fetch(`${EMPLOYEES_API}?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message);
    }
}

async function restoreAttendance(data) {
    const response = await fetch(`${ATTENDANCE_API}?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message);
    }
}

async function restorePayroll(data) {
    // Payroll restoration would need special handling
    showNotification('warning', 'Warning', 'Payroll restoration requires manual review');
}

async function deleteArchive(archiveId) {
    if (!confirm('Permanently delete this item? This action cannot be undone!')) {
        return;
    }
    
    const archives = JSON.parse(localStorage.getItem('archives') || '[]');
    const updatedArchives = archives.filter(a => a.archive_id !== archiveId);
    localStorage.setItem('archives', JSON.stringify(updatedArchives));
    
    showNotification('success', 'Success', 'Item permanently deleted');
    loadArchives();
}

async function restoreSelected() {
    const selected = Array.from(document.querySelectorAll('.archive-checkbox:checked'))
        .map(cb => parseInt(cb.dataset.id));
    
    if (selected.length === 0) {
        showNotification('warning', 'Warning', 'No items selected');
        return;
    }
    
    if (!confirm(`Restore ${selected.length} item(s)?`)) {
        return;
    }
    
    let restored = 0;
    let failed = 0;
    
    for (const id of selected) {
        try {
            await restoreArchive(id);
            restored++;
        } catch (error) {
            failed++;
        }
    }
    
    showNotification('success', 'Complete', `Restored ${restored} item(s). Failed: ${failed}`);
    loadArchives();
}

async function deleteSelected() {
    const selected = Array.from(document.querySelectorAll('.archive-checkbox:checked'))
        .map(cb => parseInt(cb.dataset.id));
    
    if (selected.length === 0) {
        showNotification('warning', 'Warning', 'No items selected');
        return;
    }
    
    if (!confirm(`Permanently delete ${selected.length} item(s)? This cannot be undone!`)) {
        return;
    }
    
    const archives = JSON.parse(localStorage.getItem('archives') || '[]');
    const updatedArchives = archives.filter(a => !selected.includes(a.archive_id));
    localStorage.setItem('archives', JSON.stringify(updatedArchives));
    
    showNotification('success', 'Success', `${selected.length} item(s) permanently deleted`);
    loadArchives();
}

async function clearAllArchives() {
    const archives = JSON.parse(localStorage.getItem('archives') || '[]');
    
    if (archives.length === 0) {
        showNotification('info', 'Info', 'No archives to clear');
        return;
    }
    
    if (!confirm(`Permanently delete all ${archives.length} archived items? This cannot be undone!`)) {
        return;
    }
    
    localStorage.setItem('archives', JSON.stringify([]));
    showNotification('success', 'Success', 'All archives cleared');
    loadArchives();
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(type, title, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" style="font-size: 20px;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 13px; opacity: 0.9;">${message}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Make functions globally accessible
window.restoreArchive = restoreArchive;
window.deleteArchive = deleteArchive;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✅ Dynamic Settings Manager loaded successfully');