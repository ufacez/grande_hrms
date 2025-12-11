// js/attendance-manual-overnight.js
// FULL FILE - Copy this ENTIRE thing and save as attendance-manual-overnight.js

let allEmployees = [];
let selectedEmployee = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEmployeesForSelection();
    setupManualEntryListeners();
    setupOvernightShiftUI();
});

function setupManualEntryListeners() {
    document.getElementById('addRecordBtn')?.addEventListener('click', openAddRecordModal);
    document.getElementById('closeAddModal')?.addEventListener('click', closeAddRecordModal);
    document.getElementById('cancelAddBtn')?.addEventListener('click', closeAddRecordModal);
    document.getElementById('employeeSearch')?.addEventListener('input', handleEmployeeSearch);
    document.getElementById('clearSelection')?.addEventListener('click', clearEmployeeSelection);
    
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            document.querySelectorAll('.quick-action-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('statusSelect').value = status;
            
            const now = new Date();
            const timeIn = document.getElementById('timeIn');
            const timeOut = document.getElementById('timeOut');
            
            if (status === 'Present') {
                timeIn.value = '08:00';
                timeOut.value = '';
            } else if (status === 'Late') {
                timeIn.value = '08:15';
                timeOut.value = '';
            } else if (status === 'Absent' || status === 'On Leave') {
                timeIn.value = '';
                timeOut.value = '';
            }
        });
    });
    
    setTimeout(() => {
        const form = document.getElementById('addRecordForm');
        if (form) {
            form.addEventListener('submit', handleAddRecordEnhanced);
        }
    }, 500);
}

// Setup overnight shift UI
function setupOvernightShiftUI() {
    setTimeout(() => {
        const dateGroup = document.querySelector('#attendanceDate')?.closest('.form-group');
        if (!dateGroup) return;
        
        const originalDateInput = document.getElementById('attendanceDate');
        if (!originalDateInput) return;
        
        dateGroup.innerHTML = `
            <label>Date Range *</label>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center;">
                <div>
                    <input type="date" id="attendanceDateIn" required>
                    <small style="color: #666; font-size: 11px; display: block; margin-top: 4px;">
                        Start Date
                    </small>
                </div>
                <div style="text-align: center; color: #666;">→</div>
                <div>
                    <input type="date" id="attendanceDateOut" required>
                    <small style="color: #666; font-size: 11px; display: block; margin-top: 4px;">
                        End Date
                    </small>
                </div>
            </div>
            <div id="overnightIndicator" style="display: none; margin-top: 10px; padding: 8px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 13px;">
                <i class="fas fa-moon"></i> <strong>Overnight Shift</strong>
            </div>
        `;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendanceDateIn').value = today;
        document.getElementById('attendanceDateOut').value = today;
        
        setupDateListeners();
    }, 500);
}

function setupDateListeners() {
    const timeIn = document.getElementById('timeIn');
    const timeOut = document.getElementById('timeOut');
    
    function checkOvernight() {
        const dateIn = document.getElementById('attendanceDateIn')?.value;
        const dateOut = document.getElementById('attendanceDateOut')?.value;
        const tIn = timeIn?.value;
        const tOut = timeOut?.value;
        
        if (tIn && tOut) {
            const [inH] = tIn.split(':').map(Number);
            const [outH] = tOut.split(':').map(Number);
            const isOvernight = outH < inH || (inH >= 20 && outH <= 10);
            
            if (isOvernight && dateIn === dateOut) {
                const next = new Date(dateIn);
                next.setDate(next.getDate() + 1);
                document.getElementById('attendanceDateOut').value = next.toISOString().split('T')[0];
                document.getElementById('overnightIndicator').style.display = 'block';
            } else if (!isOvernight) {
                document.getElementById('overnightIndicator').style.display = 'none';
            }
        }
    }
    
    timeIn?.addEventListener('change', checkOvernight);
    timeOut?.addEventListener('change', checkOvernight);
}

async function loadEmployeesForSelection() {
    try {
        const response = await fetch('../api/employees.php?action=list&status=Active');
        const result = await response.json();
        
        if (result.success) {
            allEmployees = result.data;
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function handleEmployeeSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchTerm.length < 1) {
        resultsContainer.classList.remove('show');
        return;
    }
    
    const filtered = allEmployees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.employee_id.toLowerCase().includes(searchTerm) ||
        emp.department.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 10px; color: #999; text-align: center;">No employees found</div>';
        resultsContainer.classList.add('show');
        return;
    }
    
    resultsContainer.innerHTML = filtered.map(emp => `
        <div class="employee-result-item" onclick="selectEmployee('${emp.employee_id}')">
            <strong>${emp.name}</strong>
            <small>${emp.employee_id} - ${emp.department}</small>
        </div>
    `).join('');
    
    resultsContainer.classList.add('show');
}

function selectEmployee(employeeId) {
    const employee = allEmployees.find(e => e.employee_id === employeeId);
    if (!employee) return;
    
    selectedEmployee = employee;
    document.getElementById('selectedEmployeeId').value = employee.employee_id;
    document.getElementById('selectedName').textContent = employee.name;
    document.getElementById('selectedDetails').textContent = `${employee.employee_id} - ${employee.department}`;
    document.getElementById('selectedEmployee').classList.add('show');
    document.getElementById('employeeSearch').value = '';
    document.getElementById('searchResults').classList.remove('show');
    document.getElementById('employeeSearch').disabled = true;
}

function clearEmployeeSelection() {
    selectedEmployee = null;
    document.getElementById('selectedEmployee').classList.remove('show');
    document.getElementById('employeeSearch').disabled = false;
    document.getElementById('selectedEmployeeId').value = '';
    document.getElementById('employeeSearch').focus();
}

function openAddRecordModal() {
    document.getElementById('addRecordForm').reset();
    clearEmployeeSelection();
    
    const today = new Date().toISOString().split('T')[0];
    
    setTimeout(() => {
        const dateIn = document.getElementById('attendanceDateIn');
        const dateOut = document.getElementById('attendanceDateOut');
        if (dateIn) dateIn.value = today;
        if (dateOut) dateOut.value = today;
    }, 100);
    
    document.querySelectorAll('.quick-action-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('addRecordModal').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('employeeSearch').focus();
    }, 100);
}

function closeAddRecordModal() {
    document.getElementById('addRecordModal').style.display = 'none';
    document.getElementById('addRecordForm').reset();
    clearEmployeeSelection();
    document.getElementById('searchResults').classList.remove('show');
    const indicator = document.getElementById('overnightIndicator');
    if (indicator) indicator.style.display = 'none';
}

async function handleAddRecordEnhanced(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('selectedEmployeeId').value;
    const dateIn = document.getElementById('attendanceDateIn')?.value;
    const dateOut = document.getElementById('attendanceDateOut')?.value;
    const timeIn = document.getElementById('timeIn').value || null;
    const timeOut = document.getElementById('timeOut').value || null;
    const status = document.getElementById('statusSelect').value;
    const remarks = document.getElementById('remarksInput').value;
    
    if (!employeeId) {
        showAddNotification('Please select an employee', 'error');
        return;
    }
    
    if (!dateIn || !dateOut) {
        showAddNotification('Please select dates', 'error');
        return;
    }
    
    if (!status) {
        showAddNotification('Please select a status', 'error');
        return;
    }
    
    if ((status === 'Present' || status === 'Late') && !timeIn) {
        showAddNotification('Time In is required', 'error');
        return;
    }
    
    // Validate time out after time in for overnight
    if (timeIn && timeOut) {
        const start = new Date(`${dateIn}T${timeIn}:00`);
        const end = new Date(`${dateOut}T${timeOut}:00`);
        
        if (end <= start) {
            showAddNotification('End time must be after start time', 'error');
            return;
        }
    }
    
    try {
        const checkResponse = await fetch(`../api/attendance.php?action=list&date=${dateIn}`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.success) {
            const duplicate = checkResult.data.find(r => r.employee_id === employeeId);
            if (duplicate) {
                showAddNotification('Attendance already exists for this date', 'error');
                return;
            }
        }
    } catch (error) {
        console.error('Error checking duplicates:', error);
    }
    
    const isOvernight = dateIn !== dateOut;
    let finalRemarks = remarks || '';
    if (isOvernight) {
        finalRemarks = `[OVERNIGHT: ${dateIn} ${timeIn} to ${dateOut} ${timeOut}] ${finalRemarks}`.trim();
    }
    
    const data = {
        employee_id: employeeId,
        date: dateIn,
        time_in: timeIn,
        time_out: timeOut,
        status: status,
        remarks: finalRemarks
    };
    
    try {
        const response = await fetch('../api/attendance.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAddNotification('Attendance added successfully!', 'success');
            setTimeout(() => {
                closeAddRecordModal();
                if (typeof loadAttendance === 'function') {
                    loadAttendance();
                }
            }, 1500);
        } else {
            showAddNotification(result.message || 'Failed to add', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAddNotification('Failed to add record', 'error');
    }
}

function showAddNotification(message, type = 'success') {
    const notification = document.getElementById('addNotification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
}

document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.employee-search-container');
    const resultsContainer = document.getElementById('searchResults');
    if (searchContainer && !searchContainer.contains(e.target)) {
        resultsContainer?.classList.remove('show');
    }
});

window.addEventListener('click', function(e) {
    const modal = document.getElementById('addRecordModal');
    if (e.target === modal) {
        closeAddRecordModal();
    }
});

window.selectEmployee = selectEmployee;

console.log('✅ Overnight attendance loaded');