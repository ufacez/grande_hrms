// js/employees-schedule.js - Enhanced Employee Management with Schedule

const API_URL = '../api/employees.php';
const SCHEDULE_API = '../api/schedules.php';
let employees = [];
let editingEmployeeId = null;
let viewingBlocklisted = false;
let currentScheduleEmployee = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    setupEventListeners();
});

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
    });
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', renderEmployees);
    
    // Filter
    document.getElementById('filterStatus')?.addEventListener('change', renderEmployees);
    
    // Add Employee button
    document.getElementById('addEmployeeBtn')?.addEventListener('click', openAddModal);
    
    // Modal close buttons
    document.getElementById('closeModalBtn')?.addEventListener('click', closeEmployeeModal);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closeEmployeeModal);
    
    // Schedule modal close buttons
    document.getElementById('closeScheduleModalBtn')?.addEventListener('click', closeScheduleModal);
    document.getElementById('cancelScheduleBtn')?.addEventListener('click', closeScheduleModal);
    
    // Blocklist toggle button
    document.getElementById('blocklistToggleBtn')?.addEventListener('click', showBlocklistedOnly);
    
    // Form submission
    const form = document.getElementById('employeeForm');
    if (form) {
        form.addEventListener('submit', saveEmployee);
    }
    
    // Schedule form submission
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', saveSchedule);
    }
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        document.getElementById('logoutConfirmModal').style.display = 'block';
    });
    
    document.querySelectorAll('.close-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('logoutConfirmModal').style.display = 'none';
        });
    });
    
    document.getElementById('confirmLogoutBtn')?.addEventListener('click', () => {
        window.location.href = '../logout.php';
    });
}

async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}?action=list`);
        const result = await response.json();
        
        if (result.success) {
            employees = result.data;
            updateAnalytics();
            renderEmployees();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        showNotification('Failed to load employees', 'error');
    }
}

async function updateAnalytics() {
    try {
        const response = await fetch(`${API_URL}?action=stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('totalEmployees').textContent = stats.total_employees || 0;
            document.getElementById('activeEmployees').textContent = stats.active_employees || 0;
            document.getElementById('onLeaveEmployees').textContent = stats.on_leave || 0;
            document.getElementById('blocklistedEmployees').textContent = stats.blocklisted || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function renderEmployees() {
    const grid = document.getElementById('employeeGrid');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    
    let filtered = employees.filter(emp => {
        const matchSearch = !searchTerm || 
            emp.name.toLowerCase().includes(searchTerm) ||
            emp.employee_id.toLowerCase().includes(searchTerm);
        
        const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
        
        const matchBlocklist = !viewingBlocklisted || emp.status === 'Blocklisted';
        
        return matchSearch && matchStatus && matchBlocklist;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No employees found</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(emp => `
        <div class="employee-card ${emp.status === 'Blocklisted' ? 'blocklisted' : ''} ${emp.status === 'Inactive' ? 'inactive' : ''}" 
             onclick="viewEmployee('${emp.employee_id}')">
            <div class="employee-header">
                <div>
                    <div class="employee-name">${emp.name}</div>
                    <div style="color: #888; font-size: 13px;">${emp.employee_id}</div>
                </div>
                <div class="employee-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="openScheduleModal('${emp.employee_id}', '${emp.name}')" title="Manage Schedule">
                        <i class="fas fa-calendar-alt"></i>
                    </button>
                    <button class="icon-btn" onclick="openEditModal('${emp.employee_id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${emp.status === 'Blocklisted' ? 
                        `<button class="icon-btn unblock" onclick="toggleBlocklist('${emp.employee_id}', false)" title="Unblock">
                            <i class="fas fa-check-circle"></i>
                        </button>` :
                        `<button class="icon-btn blocklist" onclick="toggleBlocklist('${emp.employee_id}', true)" title="Blocklist">
                            <i class="fas fa-ban"></i>
                        </button>`
                    }
                    <button class="icon-btn" onclick="deleteEmployee('${emp.employee_id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="employee-info">
                <div class="info-row">
                    <i class="fas fa-briefcase"></i>
                    <span>${emp.position}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-building"></i>
                    <span>${emp.department}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-envelope"></i>
                    <span>${emp.email}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-phone"></i>
                    <span>${emp.phone}</span>
                </div>
                <div class="info-row">
                    <span class="status-indicator ${emp.status.toLowerCase().replace(' ', '-')}">
                        <i class="fas fa-circle"></i>
                        ${emp.status}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

async function openScheduleModal(employeeId, employeeName) {
    currentScheduleEmployee = employeeId;
    document.getElementById('scheduleEmployeeName').textContent = employeeName;
    document.getElementById('scheduleModal').style.display = 'block';
    
    await loadEmployeeSchedule(employeeId);
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
    currentScheduleEmployee = null;
}

async function loadEmployeeSchedule(employeeId) {
    try {
        // Load current week schedule
        const currentResponse = await fetch(`${SCHEDULE_API}?action=current`);
        const currentResult = await currentResponse.json();
        
        // Load next week schedule
        const nextResponse = await fetch(`${SCHEDULE_API}?action=next`);
        const nextResult = await nextResponse.json();
        
        if (currentResult.success && nextResult.success) {
            renderEmployeeSchedule(employeeId, currentResult.data, nextResult.data);
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        showNotification('Failed to load schedule', 'error');
    }
}

function renderEmployeeSchedule(employeeId, currentData, nextData) {
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Filter schedules for this employee
    const currentSchedule = currentData.filter(s => s.employee_id === employeeId);
    const nextSchedule = nextData.filter(s => s.employee_id === employeeId);
    
    // Create arrays indexed by day_of_week
    const currentDays = Array(7).fill(null);
    const nextDays = Array(7).fill(null);
    
    currentSchedule.forEach(s => {
        currentDays[s.day_of_week] = s;
    });
    
    nextSchedule.forEach(s => {
        nextDays[s.day_of_week] = s;
    });
    
    // Render current week
    const currentBody = document.getElementById('currentWeekScheduleBody');
    currentBody.innerHTML = days.map((day, index) => {
        const shift = currentDays[index];
        return `
            <tr>
                <td style="font-weight: 500;">${day}</td>
                <td>${shift ? shift.shift_name : 'Not Set'}</td>
                <td>${shift ? shift.shift_time : '-'}</td>
                <td>
                    <button class="schedule-edit-btn" onclick="editScheduleDay('${employeeId}', ${index}, 'current')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Render next week
    const nextBody = document.getElementById('nextWeekScheduleBody');
    nextBody.innerHTML = days.map((day, index) => {
        const shift = nextDays[index];
        return `
            <tr>
                <td style="font-weight: 500;">${day}</td>
                <td>${shift ? shift.shift_name : 'Not Set'}</td>
                <td>${shift ? shift.shift_time : '-'}</td>
                <td>
                    <button class="schedule-edit-btn" onclick="editScheduleDay('${employeeId}', ${index}, 'next')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function editScheduleDay(employeeId, dayIndex, week) {
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    document.getElementById('editDayWeek').value = week;
    document.getElementById('editDayIndex').value = dayIndex;
    document.getElementById('editDayEmployee').value = employeeId;
    document.getElementById('editDayName').textContent = days[dayIndex];
    
    document.getElementById('scheduleEditModal').style.display = 'block';
}

function closeScheduleEditModal() {
    document.getElementById('scheduleEditModal').style.display = 'none';
    document.getElementById('scheduleEditForm').reset();
}

async function saveSchedule(e) {
    e.preventDefault();
    
    const week = document.getElementById('editDayWeek').value;
    const dayIndex = parseInt(document.getElementById('editDayIndex').value);
    const employeeId = document.getElementById('editDayEmployee').value;
    const shiftName = document.getElementById('editShiftSelect').value;
    
    // Define shift times
    const shiftTimes = {
        'Morning': '6:00 AM - 2:00 PM',
        'Afternoon': '2:00 PM - 10:00 PM',
        'Night': '10:00 PM - 6:00 AM',
        'Off': 'Day Off'
    };
    
    const today = new Date();
    const saturday = getLastSaturday(today);
    if (week === 'next') {
        saturday.setDate(saturday.getDate() + 7);
    }
    
    const data = {
        employee_id: employeeId,
        week_start: saturday.toISOString().split('T')[0],
        day: dayIndex,
        shift_name: shiftName,
        shift_time: shiftTimes[shiftName],
        is_next_week: week === 'next' ? 1 : 0
    };
    
    console.log('Saving schedule with data:', data); // Debug log
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        console.log('Schedule save result:', result); // Debug log
        
        if (result.success) {
            showNotification('Schedule updated successfully! Check the dashboard to see changes.', 'success');
            closeScheduleEditModal();
            await loadEmployeeSchedule(employeeId);
        } else {
            showNotification(result.message || 'Failed to update schedule', 'error');
        }
    } catch (error) {
        console.error('Error saving schedule:', error);
        showNotification('Failed to update schedule', 'error');
    }
}

function getLastSaturday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Calculate days to subtract to get to last Saturday
    // If today is Saturday (6), use today
    // Otherwise, go back to last Saturday
    let daysToSubtract;
    if (day === 6) {
        daysToSubtract = 0; // Already Saturday
    } else if (day === 0) {
        daysToSubtract = 1; // Sunday, go back 1 day
    } else {
        daysToSubtract = day + 1; // Monday(1)→2 days back, Tuesday(2)→3 days back, etc.
    }
    
    d.setDate(d.getDate() - daysToSubtract);
    return d;
}

async function openAddModal() {
    editingEmployeeId = null;
    document.getElementById('employeeModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Add New Employee';
    document.getElementById('employeeForm').reset();
    
    const nextId = await generateEmployeeId();
    document.getElementById('employeeId').value = nextId;
    document.getElementById('employeeId').readOnly = true;
}

async function generateEmployeeId() {
    let maxNumber = 0;
    
    employees.forEach(emp => {
        const match = emp.employee_id.match(/EMP(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) {
                maxNumber = num;
            }
        }
    });
    
    const nextNumber = maxNumber + 1;
    return `EMP${String(nextNumber).padStart(3, '0')}`;
}

function openEditModal(id) {
    const employee = employees.find(e => e.employee_id === id);
    if (!employee) return;
    
    editingEmployeeId = id;
    document.getElementById('employeeModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Edit Employee';
    
    document.getElementById('employeeId').value = employee.employee_id;
    document.getElementById('employeeId').readOnly = true;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('position').value = employee.position;
    document.getElementById('department').value = employee.department;
    document.getElementById('email').value = employee.email;
    document.getElementById('phone').value = employee.phone;
    document.getElementById('dateHired').value = employee.date_hired;
    document.getElementById('birthdate').value = employee.birthdate;
    document.getElementById('address').value = employee.address;
    document.getElementById('emergencyContact').value = employee.emergency_contact;
    document.getElementById('emergencyPhone').value = employee.emergency_phone;
    document.getElementById('monthlySalary').value = employee.monthly_salary;
    document.getElementById('status').value = employee.status;
    document.getElementById('sssNumber').value = employee.sss_number || '';
    document.getElementById('tinNumber').value = employee.tin_number || '';
    document.getElementById('philhealthNumber').value = employee.philhealth_number || '';
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'none';
    document.getElementById('employeeForm').reset();
    editingEmployeeId = null;
}

async function saveEmployee(e) {
    e.preventDefault();
    
    const formData = {
        employee_id: document.getElementById('employeeId').value,
        name: document.getElementById('employeeName').value,
        position: document.getElementById('position').value,
        department: document.getElementById('department').value,
        email: document.getElementById('email').value || 'N/A',
        phone: document.getElementById('phone').value,
        date_hired: document.getElementById('dateHired').value,
        birthdate: document.getElementById('birthdate').value || '1990-01-01',
        address: document.getElementById('address').value || 'N/A',
        emergency_contact: document.getElementById('emergencyContact').value || 'N/A',
        emergency_phone: document.getElementById('emergencyPhone').value || 'N/A',
        monthly_salary: document.getElementById('monthlySalary').value,
        status: document.getElementById('status').value,
        sss_number: document.getElementById('sssNumber').value || null,
        tin_number: document.getElementById('tinNumber').value || null,
        philhealth_number: document.getElementById('philhealthNumber').value || null
    };
    
    const action = editingEmployeeId ? 'update' : 'create';
    const method = editingEmployeeId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            closeEmployeeModal();
            await loadEmployees();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        showNotification('Failed to save employee', 'error');
    }
}

function viewEmployee(id) {
    console.log('View employee:', id);
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=delete&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            await loadEmployees();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        showNotification('Failed to delete employee', 'error');
    }
}

async function toggleBlocklist(id, blocklist) {
    const reason = blocklist ? prompt('Enter blocklist reason:') : null;
    if (blocklist && !reason) return;
    
    try {
        const response = await fetch(`${API_URL}?action=blocklist`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employee_id: id,
                blocklist: blocklist,
                reason: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            await loadEmployees();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error updating blocklist:', error);
        showNotification('Failed to update employee status', 'error');
    }
}

function showBlocklistedOnly() {
    viewingBlocklisted = !viewingBlocklisted;
    const btn = document.querySelector('.blocklisted-view-btn');
    
    if (viewingBlocklisted) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-users"></i> View All';
        document.getElementById('filterStatus').value = 'Blocklisted';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-ban"></i> View Blocklisted';
        document.getElementById('filterStatus').value = 'all';
    }
    
    renderEmployees();
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modals when clicking outside
window.onclick = (event) => {
    const employeeModal = document.getElementById('employeeModal');
    const scheduleModal = document.getElementById('scheduleModal');
    const scheduleEditModal = document.getElementById('scheduleEditModal');
    
    if (event.target === employeeModal) {
        closeEmployeeModal();
    }
    if (event.target === scheduleModal) {
        closeScheduleModal();
    }
    if (event.target === scheduleEditModal) {
        closeScheduleEditModal();
    }
};

// Make functions global
window.openScheduleModal = openScheduleModal;
window.editScheduleDay = editScheduleDay;
window.openEditModal = openEditModal;
window.toggleBlocklist = toggleBlocklist;
window.deleteEmployee = deleteEmployee;
window.viewEmployee = viewEmployee;
window.closeScheduleEditModal = closeScheduleEditModal;
window.saveSchedule = saveSchedule;