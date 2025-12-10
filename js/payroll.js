// js/payroll.js - Enhanced Payroll System with Auto-Calculation

const PAYROLL_API = '../api/payroll.php';
let payrollData = [];
let currentPeriod = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializePayPeriods();
    setupEventListeners();
});

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('mainContent').classList.toggle('expanded');
    });
    
    // Apply filters
    document.getElementById('applyFilters')?.addEventListener('click', loadPayroll);
    
    // Period change
    document.getElementById('payPeriod')?.addEventListener('change', (e) => {
        if (e.target.value) {
            const [start, end] = e.target.value.split('|');
            currentPeriod = { start, end };
            loadPayroll();
        }
    });
    
    // Department filter
    document.getElementById('departmentFilter')?.addEventListener('change', loadPayroll);
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', renderPayrollTable);
    
    // Edit modal
    document.getElementById('closeEditModalBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('editForm')?.addEventListener('submit', handleEditSubmit);
    
    // Payslip modal
    document.getElementById('closePayslipModalBtn')?.addEventListener('click', closePayslipModal);
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        document.getElementById('logoutConfirmModal').style.display = 'block';
    });
    
    document.querySelectorAll('.close-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('logoutConfirmModal').style.display = 'none';
        });
    });
}

async function initializePayPeriods() {
    try {
        const response = await fetch(`${PAYROLL_API}?action=periods`);
        const result = await response.json();
        
        const select = document.getElementById('payPeriod');
        
        if (result.success && result.data.length > 0) {
            // Populate existing periods
            select.innerHTML = '<option value="">Select Pay Period</option>' +
                result.data.map(p => 
                    `<option value="${p.pay_period_start}|${p.pay_period_end}">
                        ${formatDate(p.pay_period_start)} - ${formatDate(p.pay_period_end)}
                    </option>`
                ).join('');
            
            // Auto-select first period
            if (result.data.length > 0) {
                const first = result.data[0];
                select.value = `${first.pay_period_start}|${first.pay_period_end}`;
                currentPeriod = { 
                    start: first.pay_period_start, 
                    end: first.pay_period_end 
                };
            }
        } else {
            // No periods exist - create default options
            select.innerHTML = generateDefaultPeriods();
        }
        
        // Add "Generate New Period" option
        const optgroup = document.createElement('optgroup');
        optgroup.label = '── Generate New Period ──';
        select.appendChild(optgroup);
        
        const newPeriods = generateNextPeriods();
        newPeriods.forEach(period => {
            const option = document.createElement('option');
            option.value = `${period.start}|${period.end}`;
            option.textContent = `${formatDate(period.start)} - ${formatDate(period.end)} (NEW)`;
            option.style.fontWeight = 'bold';
            option.style.color = '#28a745';
            select.appendChild(option);
        });
        
        await loadPayroll();
        
    } catch (error) {
        console.error('Error initializing pay periods:', error);
    }
}

function generateDefaultPeriods() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    let options = '<option value="">Select Pay Period</option>';
    
    // Generate periods for current and previous month
    for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
        const month = currentMonth - monthOffset;
        const year = month < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = month < 0 ? month + 12 : month;
        
        // First period (1st to 15th)
        const period1Start = `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-01`;
        const period1End = `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-15`;
        
        // Second period (16th to end of month)
        const lastDay = new Date(year, adjustedMonth + 1, 0).getDate();
        const period2Start = `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-16`;
        const period2End = `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-${lastDay}`;
        
        options += `<option value="${period2Start}|${period2End}">${formatDate(period2Start)} - ${formatDate(period2End)}</option>`;
        options += `<option value="${period1Start}|${period1End}">${formatDate(period1Start)} - ${formatDate(period1End)}</option>`;
    }
    
    return options;
}

function generateNextPeriods() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const periods = [];
    
    // Generate next 2 periods
    for (let i = 0; i < 2; i++) {
        const month = currentMonth + Math.floor(i / 2);
        const year = month > 11 ? currentYear + 1 : currentYear;
        const adjustedMonth = month > 11 ? month - 12 : month;
        
        if (i % 2 === 0) {
            // First period (1st to 15th)
            periods.push({
                start: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-01`,
                end: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-15`
            });
        } else {
            // Second period (16th to end of month)
            const lastDay = new Date(year, adjustedMonth + 1, 0).getDate();
            periods.push({
                start: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-16`,
                end: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-${lastDay}`
            });
        }
    }
    
    return periods;
}

async function loadPayroll() {
    if (!currentPeriod) return;
    
    const department = document.getElementById('departmentFilter')?.value || '';
    
    try {
        const params = new URLSearchParams({
            action: 'list',
            start_date: currentPeriod.start,
            end_date: currentPeriod.end
        });
        
        if (department) {
            params.append('department', department);
        }
        
        const response = await fetch(`${PAYROLL_API}?${params}`);
        const result = await response.json();
        
        if (result.success) {
            payrollData = result.data || [];
            
            if (payrollData.length === 0) {
                // No payroll data - offer to generate
                showGeneratePrompt();
            } else {
                renderPayrollTable();
                await loadStats();
            }
        } else {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error loading payroll:', error);
        showNotification('error', 'Error', 'Failed to load payroll data');
    }
}

function showGeneratePrompt() {
    const tbody = document.getElementById('payrollBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="11" style="text-align: center; padding: 40px;">
                <i class="fas fa-calculator" style="font-size: 48px; color: #ddd; display: block; margin-bottom: 15px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">No Payroll Generated</h3>
                <p style="color: #999; margin-bottom: 20px;">
                    Generate payroll for period: ${formatDate(currentPeriod.start)} - ${formatDate(currentPeriod.end)}
                </p>
                <button onclick="generatePayroll()" class="add-btn" style="margin: 0 auto;">
                    <i class="fas fa-cog"></i> Generate Payroll
                </button>
            </td>
        </tr>
    `;
    
    // Clear stats
    document.getElementById('totalPayroll').textContent = '₱0.00';
    document.getElementById('totalOvertime').textContent = '₱0.00';
    document.getElementById('totalDeductions').textContent = '₱0.00';
}

async function generatePayroll() {
    if (!currentPeriod) {
        showNotification('error', 'Error', 'Please select a pay period');
        return;
    }
    
    if (!confirm(`Generate payroll for ${formatDate(currentPeriod.start)} - ${formatDate(currentPeriod.end)}?\n\nThis will calculate salaries based on attendance records.`)) {
        return;
    }
    
    showNotification('info', 'Processing', 'Generating payroll... Please wait.');
    
    try {
        const response = await fetch(`${PAYROLL_API}?action=generate&start_date=${currentPeriod.start}&end_date=${currentPeriod.end}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            let message = `Payroll generated successfully!\n\n`;
            message += `✓ Generated: ${data.generated} employees\n`;
            
            if (data.errors > 0) {
                message += `⚠ Errors: ${data.errors} employees\n\n`;
                message += `Employees with errors:\n`;
                data.error_details.forEach(err => {
                    message += `- ${err.name} (${err.employee_id}): ${err.error}\n`;
                });
            }
            
            showNotification('success', 'Success', 'Payroll generated successfully!');
            await loadPayroll();
        } else {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error generating payroll:', error);
        showNotification('error', 'Error', 'Failed to generate payroll');
    }
}

function renderPayrollTable() {
    const tbody = document.getElementById('payrollBody');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    const filtered = payrollData.filter(p => 
        p.employee_id.toLowerCase().includes(searchTerm) ||
        p.name.toLowerCase().includes(searchTerm) ||
        p.department.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-search" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                    No payroll records found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td>${p.employee_id}</td>
            <td>${p.name}</td>
            <td>${p.position}</td>
            <td>${p.department}</td>
            <td style="text-align: right;">₱${formatNumber(p.basic_salary)}</td>
            <td style="text-align: right;">₱${formatNumber(p.overtime_pay)}</td>
            <td style="text-align: right;">₱${formatNumber(p.gross_pay)}</td>
            <td style="text-align: right;">₱${formatNumber(p.total_deductions)}</td>
            <td style="text-align: right;"><strong>₱${formatNumber(p.net_pay)}</strong></td>
            <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editPayroll(${p.payroll_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-payslip" onclick="viewPayslip(${p.payroll_id})" title="View Payslip">
                        <i class="fas fa-file-invoice"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deletePayroll(${p.payroll_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadStats() {
    if (!currentPeriod) return;
    
    try {
        const response = await fetch(`${PAYROLL_API}?action=stats&start_date=${currentPeriod.start}&end_date=${currentPeriod.end}`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('totalPayroll').textContent = '₱' + formatNumber(stats.total_payroll || 0);
            document.getElementById('totalOvertime').textContent = '₱' + formatNumber(stats.total_overtime || 0);
            document.getElementById('totalDeductions').textContent = '₱' + formatNumber(stats.total_deductions || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function editPayroll(id) {
    const payroll = payrollData.find(p => p.payroll_id == id);
    if (!payroll) return;
    
    document.getElementById('editEmployeeId').value = payroll.payroll_id;
    document.getElementById('editName').value = payroll.name;
    document.getElementById('editPosition').value = payroll.position;
    document.getElementById('editDepartment').value = payroll.department;
    document.getElementById('editOvertimeHours').value = payroll.overtime_hours;
    document.getElementById('editOvertimeRate').value = payroll.overtime_rate;
    document.getElementById('editLateDeductions').value = payroll.late_deductions;
    document.getElementById('editOtherDeductions').value = payroll.other_deductions;
    
    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const data = {
        payroll_id: document.getElementById('editEmployeeId').value,
        overtime_hours: parseFloat(document.getElementById('editOvertimeHours').value),
        overtime_rate: parseFloat(document.getElementById('editOvertimeRate').value),
        late_deductions: parseFloat(document.getElementById('editLateDeductions').value),
        other_deductions: parseFloat(document.getElementById('editOtherDeductions').value),
        basic_salary: payrollData.find(p => p.payroll_id == data.payroll_id)?.basic_salary || 0
    };
    
    try {
        const response = await fetch(`${PAYROLL_API}?action=update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Success', result.message);
            closeEditModal();
            await loadPayroll();
        } else {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error updating payroll:', error);
        showNotification('error', 'Error', 'Failed to update payroll');
    }
}

function viewPayslip(id) {
    const payroll = payrollData.find(p => p.payroll_id == id);
    if (!payroll) return;
    
    const content = document.getElementById('payslipContent');
    content.innerHTML = `
        <div class="payslip-header">
            <h2>Grande. PAN DE SAL + COFFEE</h2>
            <p>Employee Payslip</p>
        </div>
        
        <div class="payslip-info">
            <div class="info-group">
                <p><strong>Employee ID:</strong> ${payroll.employee_id}</p>
                <p><strong>Name:</strong> ${payroll.name}</p>
                <p><strong>Position:</strong> ${payroll.position}</p>
                <p><strong>Department:</strong> ${payroll.department}</p>
            </div>
            <div class="info-group">
                <p><strong>Pay Period:</strong> ${formatDate(payroll.pay_period_start)} - ${formatDate(payroll.pay_period_end)}</p>
                <p><strong>Pay Date:</strong> ${formatDate(payroll.created_at)}</p>
                <p><strong>Status:</strong> ${payroll.status}</p>
            </div>
        </div>
        
        <div class="payslip-details">
            <div class="section-title">Earnings</div>
            <div class="detail-row">
                <span>Basic Salary</span>
                <span>₱${formatNumber(payroll.basic_salary)}</span>
            </div>
            <div class="detail-row">
                <span>Overtime Pay (${payroll.overtime_hours} hrs @ ₱${formatNumber(payroll.overtime_rate)}/hr)</span>
                <span>₱${formatNumber(payroll.overtime_pay)}</span>
            </div>
            <div class="detail-row total">
                <span>Gross Pay</span>
                <span>₱${formatNumber(payroll.gross_pay)}</span>
            </div>
            
            <div class="section-title">Deductions</div>
            <div class="detail-row">
                <span>Late Deductions</span>
                <span>₱${formatNumber(payroll.late_deductions)}</span>
            </div>
            <div class="detail-row">
                <span>Other Deductions (SSS, PhilHealth, Pag-IBIG)</span>
                <span>₱${formatNumber(payroll.other_deductions)}</span>
            </div>
            <div class="detail-row total">
                <span>Total Deductions</span>
                <span>₱${formatNumber(payroll.total_deductions)}</span>
            </div>
            
            <div class="detail-row total" style="margin-top: 20px; font-size: 20px; background: #f8f9fa; padding: 15px;">
                <span>NET PAY</span>
                <span>₱${formatNumber(payroll.net_pay)}</span>
            </div>
        </div>
        
        <button class="print-btn" onclick="printPayslip()">
            <i class="fas fa-print"></i> Print Payslip
        </button>
    `;
    
    document.getElementById('payslipModal').style.display = 'block';
}

function closePayslipModal() {
    document.getElementById('payslipModal').style.display = 'none';
}

function printPayslip() {
    window.print();
}

async function deletePayroll(id) {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;
    
    try {
        const response = await fetch(`${PAYROLL_API}?action=delete&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Success', result.message);
            await loadPayroll();
        } else {
            showNotification('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error deleting payroll:', error);
        showNotification('error', 'Error', 'Failed to delete payroll');
    }
}

function formatNumber(num) {
    return parseFloat(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showNotification(type, title, message) {
    const container = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="notification-icon fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <span class="notification-close" onclick="this.parentElement.remove()">×</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

// Make functions globally accessible
window.generatePayroll = generatePayroll;
window.editPayroll = editPayroll;
window.viewPayslip = viewPayslip;
window.deletePayroll = deletePayroll;
window.printPayslip = printPayslip;

console.log('✅ Payroll system loaded with auto-calculation');