// js/attendance-manual.js - Manual Attendance Entry System

let allEmployees = [];
let selectedEmployee = null;

// Initialize manual entry system
document.addEventListener('DOMContentLoaded', () => {
    loadEmployeesForSelection();
    setupManualEntryListeners();
});

function setupManualEntryListeners() {
    // Add Record button
    document.getElementById('addRecordBtn')?.addEventListener('click', openAddRecordModal);
    
    // Close modal buttons
    document.getElementById('closeAddModal')?.addEventListener('click', closeAddRecordModal);
    document.getElementById('cancelAddBtn')?.addEventListener('click', closeAddRecordModal);
    
    // Employee search
    document.getElementById('employeeSearch')?.addEventListener('input', handleEmployeeSearch);
    
    // Clear selection
    document.getElementById('clearSelection')?.addEventListener('click', clearEmployeeSelection);
    
    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            
            // Update active state
            document.querySelectorAll('.quick-action-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Set status
            document.getElementById('statusSelect').value = status;
            
            // Auto-fill time based on status
            const now = new Date();
            const timeIn = document.getElementById('timeIn');
            const timeOut = document.getElementById('timeOut');
            
            if (status === 'Present') {
                timeIn.value = '08:00';
                timeOut.value = '';
            } else if (status === 'Late') {
                // Set time to 15 minutes late
                timeIn.value = '08:15';
                timeOut.value = '';
            } else if (status === 'Absent' || status === 'On Leave') {
                timeIn.value = '';
                timeOut.value = '';
            }
        });
    });
    
    // Form submission
    document.getElementById('addRecordForm')?.addEventListener('submit', handleAddRecord);
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = today;
        dateInput.max = today; // Prevent future dates
    }
}

async function loadEmployeesForSelection() {
    try {
        const response = await fetch('../api/employees.php?action=list&status=Active');
        const result = await response.json();
        
        if (result.success) {
            allEmployees = result.data;
            console.log(`Loaded ${allEmployees.length} employees for selection`);
        } else {
            console.error('Failed to load employees:', result.message);
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
            <small>${emp.employee_id} - ${emp.department} - ${emp.position}</small>
        </div>
    `).join('');
    
    resultsContainer.classList.add('show');
}

function selectEmployee(employeeId) {
    const employee = allEmployees.find(e => e.employee_id === employeeId);
    if (!employee) return;
    
    selectedEmployee = employee;
    
    // Update UI
    document.getElementById('selectedEmployeeId').value = employee.employee_id;
    document.getElementById('selectedName').textContent = employee.name;
    document.getElementById('selectedDetails').textContent = `${employee.employee_id} - ${employee.department} - ${employee.position}`;
    
    // Show selected employee box
    document.getElementById('selectedEmployee').classList.add('show');
    
    // Clear and hide search
    document.getElementById('employeeSearch').value = '';
    document.getElementById('searchResults').classList.remove('show');
    
    // Disable search input
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
    // Reset form
    document.getElementById('addRecordForm').reset();
    clearEmployeeSelection();
    
    // Set default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
    
    // Clear quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(b => b.classList.remove('active'));
    
    // Show modal
    document.getElementById('addRecordModal').style.display = 'block';
    
    // Focus on search
    setTimeout(() => {
        document.getElementById('employeeSearch').focus();
    }, 100);
}

function closeAddRecordModal() {
    document.getElementById('addRecordModal').style.display = 'none';
    document.getElementById('addRecordForm').reset();
    clearEmployeeSelection();
    document.getElementById('searchResults').classList.remove('show');
}

async function handleAddRecord(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('selectedEmployeeId').value;
    const date = document.getElementById('attendanceDate').value;
    const timeIn = document.getElementById('timeIn').value || null;
    const timeOut = document.getElementById('timeOut').value || null;
    const status = document.getElementById('statusSelect').value;
    const remarks = document.getElementById('remarksInput').value;
    
    // Validation
    if (!employeeId) {
        showAddNotification('Please select an employee', 'error');
        return;
    }
    
    if (!date) {
        showAddNotification('Please select a date', 'error');
        return;
    }
    
    if (!status) {
        showAddNotification('Please select a status', 'error');
        return;
    }
    
    // Validate time logic
    if ((status === 'Present' || status === 'Late') && !timeIn) {
        showAddNotification('Time In is required for Present/Late status', 'error');
        return;
    }
    
    if (timeOut && !timeIn) {
        showAddNotification('Cannot set Time Out without Time In', 'error');
        return;
    }
    
    if (timeIn && timeOut && timeOut <= timeIn) {
        showAddNotification('Time Out must be after Time In', 'error');
        return;
    }
    
    // Check for duplicate
    try {
        const checkResponse = await fetch(`../api/attendance.php?action=list&date=${date}`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.success) {
            const duplicate = checkResult.data.find(r => r.employee_id === employeeId);
            if (duplicate) {
                showAddNotification('Attendance record already exists for this employee on this date', 'error');
                return;
            }
        }
    } catch (error) {
        console.error('Error checking duplicates:', error);
    }
    
    // Prepare data
    const data = {
        employee_id: employeeId,
        date: date,
        time_in: timeIn,
        time_out: timeOut,
        status: status,
        remarks: remarks
    };
    
    console.log('Submitting attendance record:', data);
    
    try {
        const response = await fetch('../api/attendance.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAddNotification('Attendance record added successfully!', 'success');
            
            // Close modal after a short delay
            setTimeout(() => {
                closeAddRecordModal();
                
                // Reload attendance data
                if (typeof loadAttendance === 'function') {
                    loadAttendance();
                }
            }, 1500);
        } else {
            showAddNotification(result.message || 'Failed to add record', 'error');
        }
    } catch (error) {
        console.error('Error adding attendance record:', error);
        showAddNotification('Failed to add record. Please try again.', 'error');
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

// Close search results when clicking outside
document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.employee-search-container');
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchContainer && !searchContainer.contains(e.target)) {
        resultsContainer?.classList.remove('show');
    }
});

// Close modal on outside click
window.addEventListener('click', function(e) {
    const modal = document.getElementById('addRecordModal');
    if (e.target === modal) {
        closeAddRecordModal();
    }
});

// Make selectEmployee globally accessible
window.selectEmployee = selectEmployee;

console.log('✅ Manual attendance entry system loaded');