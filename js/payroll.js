// js/payroll.js - Updated with Archive System

const PAYROLL_API = '../api/payroll.php';
let payrollData = [];
let currentPeriod = null;

document.addEventListener('DOMContentLoaded', () => {
    initializePayPeriods();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('mainContent').classList.toggle('expanded');
    });
    
    document.getElementById('applyFilters')?.addEventListener('click', loadPayroll);
    
    document.getElementById('payPeriod')?.addEventListener('change', (e) => {
        if (e.target.value) {
            const [start, end] = e.target.value.split('|');
            currentPeriod = { start, end };
            loadPayroll();
        }
    });
    
    document.getElementById('departmentFilter')?.addEventListener('change', loadPayroll);
    
    document.getElementById('searchInput')?.addEventListener('input', renderPayrollTable);
    
    document.getElementById('closeEditModalBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('editForm')?.addEventListener('submit', handleEditSubmit);
    
    document.getElementById('closePayslipModalBtn')?.addEventListener('click', closePayslipModal);
    
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
            select.innerHTML = '<option value="">Select Pay Period</option>' +
                result.data.map(p => 
                    `<option value="${p.pay_period_start}|${p.pay_period_end}">
                        ${formatDate(p.pay_period_start)} - ${formatDate(p.pay_period_end)}
                    </option>`
                ).join('');
            
            if (result.data.length > 0) {
                const first = result.data[0];
                select.value = `${first.pay_period_start}|${first.pay_period_end}`;
                currentPeriod = { 
                    start: first.pay_period_start, 
                    end: first.pay_period_end 
                };
            }
        } else {
            select.innerHTML = generateDefaultPeriods();
        }
        
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
    
    for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
        const month = currentMonth - monthOffset;
        const year = month < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = month < 0 ? month + 12 : month;
        
        const period1Start = `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-01`;
        const period1End = `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-15`;
        
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
    
    for (let i = 0; i < 2; i++) {
        const month = currentMonth + Math.floor(i / 2);
        const year = month > 11 ? currentYear + 1 : currentYear;
        const adjustedMonth = month > 11 ? month - 12 : month;
        
        if (i % 2 === 0) {
            periods.push({
                start: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-01`,
                end: `${year}-${String(adjustedMonth + 1).padStart(2, '0')}-15`
            });
        } else {
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
            window.payrollData = result.data || []; // Make globally available for archive system
            console.log('Loaded payroll data:', payrollData.length, 'records');
            
            if (payrollData.length === 0) {
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
                    <button class="btn-icon" onclick="archivePayroll(${p.payroll_id})" title="Archive" style="background-color: #ff9800;">
                        <i class="fas fa-archive"></i>
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

// Add this function to js/payroll.js
// Replace the existing viewPayslip function

async function viewPayslip(id) {
    try {
        // Fetch detailed payslip data
        const response = await fetch(`${PAYROLL_API}?action=payslip-detail&id=${id}`);
        const result = await response.json();
        
        if (!result.success) {
            showNotification('error', 'Error', result.message);
            return;
        }
        
        const data = result.data;
        const payroll = data.payroll;
        const breakdown = data.breakdown;
        const hourlyRate = data.hourly_rate;
        
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
            
            <!-- Daily Attendance Breakdown -->
            <div class="attendance-breakdown" style="margin: 25px 0;">
                <h3 style="background: #f8f9fa; padding: 12px 15px; margin: 0 -20px 15px -20px; border-left: 4px solid #222; font-size: 16px; color: #333;">
                    📅 Daily Attendance Breakdown
                </h3>
                
                <div style="overflow-x: auto; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #222; color: white;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Time In</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Time Out</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Hours</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Night Diff</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${breakdown.daily_records.map(record => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px; border: 1px solid #eee;">${formatDate(record.date)}</td>
                                    <td style="padding: 10px; border: 1px solid #eee; color: #666;">${record.day_name}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #eee;">${record.time_in}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #eee;">${record.time_out}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #eee; font-weight: bold;">
                                        ${record.hours_worked.toFixed(1)}h
                                        ${record.shift_type === 'Overnight' ? '<span style="color: #dc3545; font-size: 10px; display: block;">Overnight</span>' : ''}
                                    </td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #eee; color: #ffc107; font-weight: bold;">
                                        ${record.night_hours > 0 ? record.night_hours.toFixed(1) + 'h' : '-'}
                                    </td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #eee;">
                                        <span style="
                                            padding: 4px 8px; 
                                            border-radius: 4px; 
                                            font-size: 11px; 
                                            font-weight: bold;
                                            background: ${record.status === 'Present' ? '#d4edda' : record.status === 'Late' ? '#fff3cd' : record.status === 'Absent' ? '#f8d7da' : '#d1ecf1'};
                                            color: ${record.status === 'Present' ? '#155724' : record.status === 'Late' ? '#856404' : record.status === 'Absent' ? '#721c24' : '#0c5460'};
                                        ">
                                            ${record.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot style="background: #f8f9fa; font-weight: bold;">
                            <tr>
                                <td colspan="4" style="padding: 10px; text-align: right; border: 1px solid #ddd;">TOTAL:</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #222;">
                                    ${breakdown.total_regular_hours.toFixed(1)}h
                                </td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #ffc107;">
                                    ${breakdown.total_night_hours.toFixed(1)}h
                                </td>
                                <td style="padding: 10px; border: 1px solid #ddd;"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
                    <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #2e7d32;">${breakdown.present_days}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">Present</div>
                    </div>
                    <div style="background: #fff3e0; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #ef6c00;">${breakdown.late_days}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">Late</div>
                    </div>
                    <div style="background: #ffebee; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #c62828;">${breakdown.absent_days}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">Absent</div>
                    </div>
                    <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #1565c0;">${breakdown.leave_days}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">On Leave</div>
                    </div>
                </div>
            </div>
            
            <div class="payslip-details">
                <div class="section-title">Earnings</div>
                <div class="detail-row">
                    <span>Basic Salary (${breakdown.total_regular_hours.toFixed(1)} hrs × ₱${hourlyRate.toFixed(2)}/hr)</span>
                    <span>₱${formatNumber(payroll.basic_salary)}</span>
                </div>
                ${breakdown.total_night_hours > 0 ? `
                <div class="detail-row">
                    <span>Night Differential (${breakdown.total_night_hours.toFixed(1)} hrs × ₱${hourlyRate.toFixed(2)} × 10%)</span>
                    <span>₱${formatNumber(breakdown.total_night_hours * hourlyRate * 0.10)}</span>
                </div>
                ` : ''}
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
            
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #666; font-size: 12px;">
                <p style="margin: 0;">This is a computer-generated payslip and does not require a signature.</p>
                <p style="margin: 5px 0 0 0;">For any questions or concerns, please contact HR Department.</p>
            </div>
            
            <button class="print-btn" onclick="printPayslip()">
                <i class="fas fa-print"></i> Print Payslip
            </button>
        `;
        
        document.getElementById('payslipModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading detailed payslip:', error);
        showNotification('error', 'Error', 'Failed to load payslip details');
    }
}

// Update the print function to hide the daily breakdown when printing (optional)
function printPayslip() {
    // Store original title
    const originalTitle = document.title;
    
    // Get payslip content
    const payslipContent = document.getElementById('payslipContent');
    const employeeName = payslipContent.querySelector('.info-group p strong').nextSibling.textContent.trim();
    
    // Set title for print
    document.title = `Payslip - ${employeeName}`;
    
    // Print
    window.print();
    
    // Restore title
    setTimeout(() => {
        document.title = originalTitle;
    }, 100);
}

function closePayslipModal() {
    document.getElementById('payslipModal').style.display = 'none';
}

function printPayslip() {
    window.print();
}

// DELETE FUNCTION REMOVED - NOW USING archivePayroll() from archive-system.js

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

window.generatePayroll = generatePayroll;
window.editPayroll = editPayroll;
window.viewPayslip = viewPayslip;
window.printPayslip = printPayslip;
window.payrollData = payrollData;

console.log('✅ Payroll system loaded with archive functionality');

// Enhanced Payroll.js with Full Edit Control

const PAYROLL_API = '../api/payroll.php';
let payrollData = [];
let currentPeriod = null;

document.addEventListener('DOMContentLoaded', () => {
    initializePayPeriods();
    setupEventListeners();
});

function setupEventListeners() {
    // ... (keep existing sidebar, filter, search listeners)
    
    // Enhanced edit form listeners
    document.getElementById('closeEditModalBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('editForm')?.addEventListener('submit', handleEnhancedEditSubmit);
    
    // Real-time calculation listeners
    const calcInputs = ['editBasicSalary', 'editOvertimeHours', 'editOvertimeRate', 
                        'editLateDeductions', 'editOtherDeductions'];
    
    calcInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updatePayrollSummary);
    });
    
    // ... (keep other listeners)
}

function editPayroll(id) {
    const payroll = payrollData.find(p => p.payroll_id == id);
    if (!payroll) return;
    
    // Populate form fields
    document.getElementById('editPayrollId').value = payroll.payroll_id;
    document.getElementById('editEmployeeId').value = payroll.employee_id;
    document.getElementById('editName').value = payroll.name;
    document.getElementById('editPosition').value = payroll.position;
    document.getElementById('editDepartment').value = payroll.department;
    
    // ✅ ENHANCED: Populate all editable fields
    document.getElementById('editBasicSalary').value = parseFloat(payroll.basic_salary).toFixed(2);
    document.getElementById('currentBasicSalary').value = '₱' + formatNumber(payroll.basic_salary);
    document.getElementById('editOvertimeHours').value = parseFloat(payroll.overtime_hours).toFixed(2);
    document.getElementById('editOvertimeRate').value = parseFloat(payroll.overtime_rate).toFixed(2);
    document.getElementById('editLateDeductions').value = parseFloat(payroll.late_deductions).toFixed(2);
    document.getElementById('editOtherDeductions').value = parseFloat(payroll.other_deductions).toFixed(2);
    
    // Update summary immediately
    updatePayrollSummary();
    
    // Show modal
    document.getElementById('editModal').style.display = 'block';
}

function updatePayrollSummary() {
    // Get values
    const basicSalary = parseFloat(document.getElementById('editBasicSalary').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('editOvertimeHours').value) || 0;
    const overtimeRate = parseFloat(document.getElementById('editOvertimeRate').value) || 0;
    const lateDeductions = parseFloat(document.getElementById('editLateDeductions').value) || 0;
    const otherDeductions = parseFloat(document.getElementById('editOtherDeductions').value) || 0;
    
    // Calculate
    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = basicSalary + overtimePay;
    const totalDeductions = lateDeductions + otherDeductions;
    const netPay = grossPay - totalDeductions;
    
    // Update calculated overtime pay display
    document.getElementById('calculatedOvertimePay').textContent = '₱' + formatNumber(overtimePay);
    
    // Update summary section
    document.getElementById('summaryBasic').textContent = '₱' + formatNumber(basicSalary);
    document.getElementById('summaryOvertime').textContent = '₱' + formatNumber(overtimePay);
    document.getElementById('summaryGross').textContent = '₱' + formatNumber(grossPay);
    document.getElementById('summaryDeductions').textContent = '₱' + formatNumber(totalDeductions);
    document.getElementById('summaryNet').textContent = '₱' + formatNumber(netPay);
    
    // Add visual feedback for changes
    const netElement = document.getElementById('summaryNet');
    netElement.style.animation = 'pulse 0.3s ease';
    setTimeout(() => {
        netElement.style.animation = '';
    }, 300);
}

async function handleEnhancedEditSubmit(e) {
    e.preventDefault();
    
    // Get all values
    const data = {
        payroll_id: document.getElementById('editPayrollId').value,
        basic_salary: parseFloat(document.getElementById('editBasicSalary').value),
        overtime_hours: parseFloat(document.getElementById('editOvertimeHours').value),
        overtime_rate: parseFloat(document.getElementById('editOvertimeRate').value),
        late_deductions: parseFloat(document.getElementById('editLateDeductions').value),
        other_deductions: parseFloat(document.getElementById('editOtherDeductions').value)
    };
    
    // Validate
    if (data.basic_salary < 0 || isNaN(data.basic_salary)) {
        showNotification('error', 'Error', 'Basic salary must be a valid positive number');
        return;
    }
    
    if (data.overtime_hours < 0 || data.overtime_rate < 0) {
        showNotification('error', 'Error', 'Overtime values cannot be negative');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#editForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        const response = await fetch(`${PAYROLL_API}?action=update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Success', 'Payroll updated successfully! ✓');
            closeEditModal();
            await loadPayroll();
        } else {
            showNotification('error', 'Error', result.message || 'Failed to update payroll');
        }
    } catch (error) {
        console.error('Error updating payroll:', error);
        showNotification('error', 'Error', 'Failed to update payroll');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editForm').reset();
}

function formatNumber(num) {
    return parseFloat(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showNotification(type, title, message) {
    const container = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.innerHTML = `
        <i class="notification-icon fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" 
           style="font-size: 20px;"></i>
        <div class="notification-content" style="flex: 1;">
            <div class="notification-title" style="font-weight: 600; margin-bottom: 4px;">${title}</div>
            <div class="notification-message" style="font-size: 13px; opacity: 0.9;">${message}</div>
        </div>
        <span class="notification-close" onclick="this.parentElement.remove()" 
              style="cursor: pointer; font-size: 20px; opacity: 0.7; transition: opacity 0.2s;"
              onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</span>
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
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);

// Make functions globally accessible
window.editPayroll = editPayroll;
window.payrollData = payrollData;

console.log('✅ Enhanced Payroll system loaded with full edit control');