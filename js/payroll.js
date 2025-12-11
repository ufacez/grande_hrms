// js/payroll.js - FIXED VERSION

const PAYROLL_API = '../api/payroll.php';
let payrollData = [];
let currentPeriod = null;

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
    
    // Filters
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
    
    // Edit modal
    document.getElementById('closeEditModalBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('editForm')?.addEventListener('submit', handleEditSubmit);
    
    // Real-time calculation for edit form
    const calcInputs = ['editBasicSalary', 'editOvertimeHours', 'editOvertimeRate', 
                        'editLateDeductions', 'editOtherDeductions'];
    calcInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updatePayrollSummary);
    });
    
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
            select.innerHTML = '<option value="">Select Pay Period</option>' +
                result.data.map(p => 
                    `<option value="${p.pay_period_start}|${p.pay_period_end}">
                        ${formatDate(p.pay_period_start)} - ${formatDate(p.pay_period_end)}
                    </option>`
                ).join('');
            
            if (result.data.length > 0) {
                const first = result.data[0];
                select.value = `${first.pay_period_start}|${first.pay_period_end}`;
                currentPeriod = { start: first.pay_period_start, end: first.pay_period_end };
            }
        } else {
            select.innerHTML = generateDefaultPeriods();
        }
        
        // Add new periods
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
        showNotification('error', 'Error', 'Failed to load pay periods');
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
        
        if (department) params.append('department', department);
        
        const response = await fetch(`${PAYROLL_API}?${params}`);
        const result = await response.json();
        
        if (result.success) {
            payrollData = result.data || [];
            window.payrollData = payrollData; // Make globally available
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
    if (!payroll) {
        console.error('Payroll not found:', id);
        return;
    }
    
    console.log('Editing payroll:', payroll);
    
    // Populate all form fields - check if elements exist
    const fields = {
        'editPayrollId': payroll.payroll_id,
        'editEmployeeId': payroll.employee_id,
        'editName': payroll.name,
        'editPosition': payroll.position,
        'editDepartment': payroll.department,
        'editBasicSalary': parseFloat(payroll.basic_salary).toFixed(2),
        'currentBasicSalary': '₱' + formatNumber(payroll.basic_salary),
        'editOvertimeHours': parseFloat(payroll.overtime_hours || 0).toFixed(2),
        'editOvertimeRate': parseFloat(payroll.overtime_rate || 0).toFixed(2),
        'editLateDeductions': parseFloat(payroll.late_deductions || 0).toFixed(2),
        'editOtherDeductions': parseFloat(payroll.other_deductions || 0).toFixed(2)
    };
    
    for (const [fieldId, value] of Object.entries(fields)) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Field not found: ${fieldId}`);
        }
    }
    
    updatePayrollSummary();
    document.getElementById('editModal').style.display = 'block';
}

function updatePayrollSummary() {
    const basicSalary = parseFloat(document.getElementById('editBasicSalary').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('editOvertimeHours').value) || 0;
    const overtimeRate = parseFloat(document.getElementById('editOvertimeRate').value) || 0;
    const lateDeductions = parseFloat(document.getElementById('editLateDeductions').value) || 0;
    const otherDeductions = parseFloat(document.getElementById('editOtherDeductions').value) || 0;
    
    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = basicSalary + overtimePay;
    const totalDeductions = lateDeductions + otherDeductions;
    const netPay = grossPay - totalDeductions;
    
    document.getElementById('calculatedOvertimePay').textContent = '₱' + formatNumber(overtimePay);
    document.getElementById('summaryBasic').textContent = '₱' + formatNumber(basicSalary);
    document.getElementById('summaryOvertime').textContent = '₱' + formatNumber(overtimePay);
    document.getElementById('summaryGross').textContent = '₱' + formatNumber(grossPay);
    document.getElementById('summaryDeductions').textContent = '₱' + formatNumber(totalDeductions);
    document.getElementById('summaryNet').textContent = '₱' + formatNumber(netPay);
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    console.log('Submitting payroll edit...');
    
    // Get values from form
    const payrollId = document.getElementById('editPayrollId').value;
    const basicSalary = parseFloat(document.getElementById('editBasicSalary').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('editOvertimeHours').value) || 0;
    const overtimeRate = parseFloat(document.getElementById('editOvertimeRate').value) || 0;
    const lateDeductions = parseFloat(document.getElementById('editLateDeductions').value) || 0;
    const otherDeductions = parseFloat(document.getElementById('editOtherDeductions').value) || 0;
    
    const data = {
        payroll_id: payrollId,
        basic_salary: basicSalary,
        overtime_hours: overtimeHours,
        overtime_rate: overtimeRate,
        late_deductions: lateDeductions,
        other_deductions: otherDeductions
    };
    
    console.log('Sending data:', data);
    
    // Validate
    if (data.basic_salary < 0 || isNaN(data.basic_salary)) {
        showNotification('error', 'Error', 'Basic salary must be valid');
        return;
    }
    
    if (data.overtime_hours < 0 || data.overtime_rate < 0) {
        showNotification('error', 'Error', 'Overtime values cannot be negative');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        const response = await fetch(`${PAYROLL_API}?action=update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        if (result.success) {
            showNotification('success', 'Success', 'Payroll updated successfully!');
            closeEditModal();
            await loadPayroll();
        } else {
            showNotification('error', 'Error', result.message || 'Failed to update payroll');
        }
    } catch (error) {
        console.error('Error updating payroll:', error);
        showNotification('error', 'Error', 'Failed to update payroll: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function viewPayslip(id) {
    try {
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
            
            <div class="payslip-details">
                <div class="section-title">Earnings</div>
                <div class="detail-row">
                    <span>Basic Salary</span>
                    <span>₱${formatNumber(payroll.basic_salary)}</span>
                </div>
                <div class="detail-row">
                    <span>Overtime Pay (${payroll.overtime_hours} hrs)</span>
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
                    <span>Other Deductions</span>
                    <span>₱${formatNumber(payroll.other_deductions)}</span>
                </div>
                <div class="detail-row total">
                    <span>Total Deductions</span>
                    <span>₱${formatNumber(payroll.total_deductions)}</span>
                </div>
                
                <div class="detail-row total" style="margin-top: 20px; font-size: 20px;">
                    <span>NET PAY</span>
                    <span>₱${formatNumber(payroll.net_pay)}</span>
                </div>
            </div>
            
            <button class="print-btn" onclick="printPayslip()">
                <i class="fas fa-print"></i> Print Payslip
            </button>
        `;
        
        document.getElementById('payslipModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading payslip:', error);
        showNotification('error', 'Error', 'Failed to load payslip');
    }
}

function closePayslipModal() {
    document.getElementById('payslipModal').style.display = 'none';
}

function printPayslip() {
    window.print();
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
window.printPayslip = printPayslip;
window.payrollData = payrollData;

console.log('✅ Payroll system loaded successfully');