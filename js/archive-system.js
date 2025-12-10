// js/archive-system.js - Universal Archive System for All Pages
// Replaces delete functionality with archive functionality

class ArchiveManager {
    constructor() {
        this.currentUser = this.getCurrentUser();
    }

    getCurrentUser() {
        // Get current user from page context
        const userSpan = document.querySelector('.user-profile span');
        return userSpan ? userSpan.textContent : 'System';
    }

    /**
     * Archive an item instead of deleting
     * @param {string} type - 'employees', 'attendance', 'payroll', 'biometric'
     * @param {string} id - Item ID
     * @param {object} data - Item data to archive
     * @param {string} description - Human readable description
     */
    async archiveItem(type, id, data, description) {
        try {
            // Create archive entry
            const archive = {
                archive_id: Date.now(),
                archive_type: type,
                original_id: id,
                name_description: description,
                archived_data: JSON.stringify(data),
                archived_by: this.currentUser,
                archived_date: new Date().toISOString()
            };

            // Save to localStorage (can be moved to database later)
            const archives = this.getArchives();
            archives.unshift(archive);
            localStorage.setItem('archives', JSON.stringify(archives));

            // Log to audit trail
            this.logAudit({
                type: type.replace('s', ''), // employees -> employee
                action: 'Item Archived',
                details: `Archived ${type} item: ${description}`,
                icon: 'fa-archive'
            });

            return { success: true, message: 'Item archived successfully' };
        } catch (error) {
            console.error('Archive error:', error);
            return { success: false, message: 'Failed to archive item' };
        }
    }

    /**
     * Get all archives
     */
    getArchives() {
        return JSON.parse(localStorage.getItem('archives') || '[]');
    }

    /**
     * Log to audit trail
     */
    logAudit(entry) {
        const auditData = JSON.parse(localStorage.getItem('auditTrail') || '[]');
        auditData.unshift({
            id: Date.now(),
            type: entry.type,
            action: entry.action,
            details: entry.details,
            icon: entry.icon,
            user: this.currentUser,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('auditTrail', JSON.stringify(auditData));
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `archive-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" 
               style="font-size: 20px;"></i>
            <div style="flex: 1;">${message}</div>
            <button onclick="this.parentElement.remove()" 
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0 5px;">
                ×
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Create global instance
window.archiveManager = new ArchiveManager();

// ============================================
// EMPLOYEE ARCHIVE FUNCTIONS
// ============================================

async function archiveEmployee(employeeId) {
    const confirmed = await showArchiveConfirm(
        'Archive Employee',
        'This employee will be moved to archives. You can restore it later from Settings.',
        'employee'
    );
    
    if (!confirmed) return;

    try {
        // Get employee data from API
        const response = await fetch(`../api/employees.php?action=get&id=${employeeId}`);
        const result = await response.json();
        
        if (!result.success) {
            archiveManager.showNotification('Failed to fetch employee data', 'error');
            return;
        }

        const employee = result.data;
        
        // Archive the employee
        const archiveResult = await archiveManager.archiveItem(
            'employees',
            employeeId,
            employee,
            `${employee.name} (${employeeId})`
        );

        if (archiveResult.success) {
            // Now delete from database
            const deleteResponse = await fetch(`../api/employees.php?action=delete&id=${employeeId}`, {
                method: 'DELETE'
            });
            
            const deleteResult = await deleteResponse.json();
            
            if (deleteResult.success) {
                archiveManager.showNotification('Employee archived successfully', 'success');
                
                // Reload employee list if function exists
                if (typeof loadEmployees === 'function') {
                    await loadEmployees();
                }
            }
        }
    } catch (error) {
        console.error('Archive employee error:', error);
        archiveManager.showNotification('Failed to archive employee', 'error');
    }
}

// ============================================
// ATTENDANCE ARCHIVE FUNCTIONS
// ============================================

async function archiveAttendance(attendanceId) {
    const confirmed = await showArchiveConfirm(
        'Archive Attendance Record',
        'This attendance record will be moved to archives.',
        'attendance'
    );
    
    if (!confirmed) return;

    try {
        // Get attendance data
        const allAttendance = window.attendanceData || [];
        const record = allAttendance.find(a => a.attendance_id == attendanceId);
        
        if (!record) {
            archiveManager.showNotification('Attendance record not found', 'error');
            return;
        }

        // Archive the record
        const archiveResult = await archiveManager.archiveItem(
            'attendance',
            attendanceId,
            record,
            `${record.employee_name} - ${record.attendance_date}`
        );

        if (archiveResult.success) {
            // Delete from database
            const response = await fetch(`../api/attendance.php?action=delete&id=${attendanceId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                archiveManager.showNotification('Attendance record archived', 'success');
                
                // Reload attendance if function exists
                if (typeof loadAttendance === 'function') {
                    await loadAttendance();
                }
            }
        }
    } catch (error) {
        console.error('Archive attendance error:', error);
        archiveManager.showNotification('Failed to archive attendance', 'error');
    }
}

// ============================================
// PAYROLL ARCHIVE FUNCTIONS
// ============================================

async function archivePayroll(payrollId) {
    const confirmed = await showArchiveConfirm(
        'Archive Payroll Record',
        'This payroll record will be moved to archives.',
        'payroll'
    );
    
    if (!confirmed) return;

    try {
        // Get payroll data
        const allPayroll = window.payrollData || [];
        const record = allPayroll.find(p => p.payroll_id == payrollId);
        
        if (!record) {
            archiveManager.showNotification('Payroll record not found', 'error');
            return;
        }

        // Archive the record
        const archiveResult = await archiveManager.archiveItem(
            'payroll',
            payrollId,
            record,
            `${record.name} - ${record.pay_period_start} to ${record.pay_period_end}`
        );

        if (archiveResult.success) {
            // Delete from database
            const response = await fetch(`../api/payroll.php?action=delete&id=${payrollId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                archiveManager.showNotification('Payroll record archived', 'success');
                
                // Reload payroll if function exists
                if (typeof loadPayroll === 'function') {
                    await loadPayroll();
                }
            }
        }
    } catch (error) {
        console.error('Archive payroll error:', error);
        archiveManager.showNotification('Failed to archive payroll', 'error');
    }
}

// ============================================
// BIOMETRIC ARCHIVE FUNCTIONS
// ============================================

async function archiveBiometric(biometricId) {
    const confirmed = await showArchiveConfirm(
        'Archive Biometric Record',
        'This biometric record will be moved to archives.',
        'biometric'
    );
    
    if (!confirmed) return;

    try {
        // Get biometric data
        const allBiometric = window.biometricData || [];
        const record = allBiometric.find(b => b.biometric_id == biometricId);
        
        if (!record) {
            archiveManager.showNotification('Biometric record not found', 'error');
            return;
        }

        // Archive the record
        const archiveResult = await archiveManager.archiveItem(
            'biometric',
            biometricId,
            record,
            `${record.employee_name} - Biometric Registration`
        );

        if (archiveResult.success) {
            // Delete from database
            const response = await fetch(`../api/biometric.php?action=delete&id=${biometricId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                archiveManager.showNotification('Biometric record archived', 'success');
                
                // Reload biometric if function exists
                if (typeof loadBiometricData === 'function') {
                    await loadBiometricData();
                }
            }
        }
    } catch (error) {
        console.error('Archive biometric error:', error);
        archiveManager.showNotification('Failed to archive biometric', 'error');
    }
}

// ============================================
// CUSTOM ARCHIVE CONFIRMATION MODAL
// ============================================

function showArchiveConfirm(title, message, type) {
    return new Promise((resolve) => {
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'archiveConfirmModal';
        modal.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        const typeIcons = {
            'employee': 'fa-user',
            'attendance': 'fa-clock',
            'payroll': 'fa-money-bill-wave',
            'biometric': 'fa-fingerprint'
        };
        
        const typeColors = {
            'employee': '#17a2b8',
            'attendance': '#ffc107',
            'payroll': '#28a745',
            'biometric': '#6f42c1'
        };
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 30px; max-width: 450px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2); animation: slideDown 0.3s ease;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 60px; height: 60px; background: ${typeColors[type]}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        <i class="fas ${typeIcons[type]}" style="font-size: 28px; color: white;"></i>
                    </div>
                    <h2 style="margin: 0; font-size: 22px; color: #222;">${title}</h2>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #555; line-height: 1.6; font-size: 14px;">${message}</p>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelArchive" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; color: #666; transition: all 0.2s;">
                        Cancel
                    </button>
                    <button id="confirmArchive" style="padding: 10px 20px; border: none; background: #ff9800; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
                        <i class="fas fa-archive"></i> Archive
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('confirmArchive').onclick = () => {
            modal.remove();
            resolve(true);
        };
        
        document.getElementById('cancelArchive').onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}

// ============================================
// CSS ANIMATIONS
// ============================================

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
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideDown {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    #archiveConfirmModal button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    #confirmArchive:hover {
        background: #f57c00 !important;
    }
    
    #cancelArchive:hover {
        background: #f8f9fa !important;
        border-color: #999 !important;
    }
`;
document.head.appendChild(style);

// Make functions globally accessible
window.archiveEmployee = archiveEmployee;
window.archiveAttendance = archiveAttendance;
window.archivePayroll = archivePayroll;
window.archiveBiometric = archiveBiometric;

console.log('✅ Universal Archive System loaded - Delete functions replaced with Archive');