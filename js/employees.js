// js/employees.js - FIXED VERSION

const API_URL = '../api/employees.php';
const SCHEDULE_API = '../api/schedules.php';
let employees = [];
let editingEmployeeId = null;
let viewingBlocklisted = false;
let currentScheduleEmployee = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Employees page initializing...');
    loadEmployees();
    setupEventListeners();
    generateNextEmployeeId();
});

function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });
    }
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', renderEmployees);
    }
    
    // Filter
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', renderEmployees);
    }
    
    // Add Employee button - FIXED
    const addBtn = document.getElementById('addEmployeeBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
        console.log('✅ Add Employee button listener attached');
    } else {
        console.error('❌ Add Employee button not found!');
    }
    
    // Modal close buttons
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEmployeeModal);
    }
    
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeEmployeeModal);
    }
    
    // Schedule modal close buttons
    const closeScheduleModalBtn = document.getElementById('closeScheduleModalBtn');
    if (closeScheduleModalBtn) {
        closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
    }
    
    const cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
    if (cancelScheduleBtn) {
        cancelScheduleBtn.addEventListener('click', closeScheduleModal);
    }
    
    // Blocklist toggle button
    const blocklistToggleBtn = document.getElementById('blocklistToggleBtn');
    if (blocklistToggleBtn) {
        blocklistToggleBtn.addEventListener('click', toggleBlocklistView);
    }
    
    // Form submission
    const form = document.getElementById('employeeForm');
    if (form) {
        form.addEventListener('submit', saveEmployee);
    }
    
    // Schedule form submission
    const scheduleForm = document.getElementById('scheduleEditForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', saveSchedule);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const logoutModal = document.getElementById('logoutConfirmModal');
            if (logoutModal) {
                logoutModal.style.display = 'block';
            }
        });
    }
    
    document.querySelectorAll('.close-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            const logoutModal = document.getElementById('logoutConfirmModal');
            if (logoutModal) {
                logoutModal.style.display = 'none';
            }
        });
    });
    
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            window.location.href = '../logout.php';
        });
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        const employeeModal = document.getElementById('employeeModal');
        const scheduleModal = document.getElementById('scheduleModal');
        const scheduleEditModal = document.getElementById('scheduleEditModal');
        
        if (e.target === employeeModal) {
            closeEmployeeModal();
        }
        if (e.target === scheduleModal) {
            closeScheduleModal();
        }
        if (e.target === scheduleEditModal) {
            closeScheduleEditModal();
        }
    });
}

// =============================================
// EMPLOYEE CRUD OPERATIONS
// =============================================

async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}?action=list`);
        const result = await response.json();
        
        if (result.success) {
            employees = result.data;
            console.log(`✅ Loaded ${employees.length} employees`);
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
            const totalEl = document.getElementById('totalEmployees');
            const activeEl = document.getElementById('activeEmployees');
            const leaveEl = document.getElementById('onLeaveEmployees');
            const blocklistEl = document.getElementById('blocklistedEmployees');
            
            if (totalEl) totalEl.textContent = stats.total_employees || 0;
            if (activeEl) activeEl.textContent = stats.active_employees || 0;
            if (leaveEl) leaveEl.textContent = stats.on_leave || 0;
            if (blocklistEl) blocklistEl.textContent = stats.blocklisted || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function renderEmployees() {
    const grid = document.getElementById('employeeGrid');
    if (!grid) return;
    
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    
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
                    <div class="employee-name">${escapeHtml(emp.name)}</div>
                    <div style="color: #888; font-size: 13px;">${escapeHtml(emp.employee_id)}</div>
                </div>
                <div class="employee-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="openScheduleModal('${emp.employee_id}', '${escapeHtml(emp.name)}')" title="Manage Schedule">
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
                    <button class="icon-btn archive" onclick="archiveEmployee('${emp.employee_id}')" title="Archive" style="color: #ff9800;">
                        <i class="fas fa-archive"></i>
                    </button>
                </div>
            </div>
            <div class="employee-info">
                <div class="info-row">
                    <i class="fas fa-briefcase"></i>
                    <span>${escapeHtml(emp.position)}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-building"></i>
                    <span>${escapeHtml(emp.department)}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-envelope"></i>
                    <span>${escapeHtml(emp.email)}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-phone"></i>
                    <span>${escapeHtml(emp.phone)}</span>
                </div>
                <div class="info-row">
                    <span class="status-indicator ${emp.status.toLowerCase().replace(' ', '-')}">
                        <i class="fas fa-circle"></i>
                        ${escapeHtml(emp.status)}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// =============================================
// MODAL FUNCTIONS - FIXED
// =============================================

function openAddModal() {
    console.log('📝 Opening Add Employee modal...');
    
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const title = document.getElementById('modalTitle');
    
    if (!modal) {
        console.error('❌ Employee modal not found!');
        showNotification('Modal element not found', 'error');
        return;
    }
    
    // Reset form
    if (form) {
        form.reset();
    }
    
    // Set title
    if (title) {
        title.textContent = 'Add New Employee';
    }
    
    // Generate new employee ID
    generateNextEmployeeId();
    
    // Enable employee ID field for new employee
    const empIdInput = document.getElementById('employeeId');
    if (empIdInput) {
        empIdInput.removeAttribute('readonly');
    }
    
    // Clear editing flag
    editingEmployeeId = null;
    
    // Show modal
    modal.style.display = 'block';
    
    console.log('✅ Add Employee modal opened');
}

function openEditModal(employeeId) {
    console.log('📝 Opening Edit Employee modal for:', employeeId);
    
    const employee = employees.find(e => e.employee_id === employeeId);
    if (!employee) {
        showNotification('Employee not found', 'error');
        return;
    }
    
    const modal = document.getElementById('employeeModal');
    const title = document.getElementById('modalTitle');
    
    if (!modal) {
        console.error('❌ Employee modal not found!');
        return;
    }
    
    // Set editing flag
    editingEmployeeId = employeeId;
    
    // Set title
    if (title) {
        title.textContent = 'Edit Employee';
    }
    
    // Populate form
    document.getElementById('employeeId').value = employee.employee_id;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('position').value = employee.position;
    document.getElementById('department').value = employee.department;
    document.getElementById('email').value = employee.email || '';
    document.getElementById('phone').value = employee.phone;
    document.getElementById('dateHired').value = employee.date_hired;
    document.getElementById('birthdate').value = employee.birthdate || '';
    document.getElementById('address').value = employee.address || '';
    document.getElementById('emergencyContact').value = employee.emergency_contact || '';
    document.getElementById('emergencyPhone').value = employee.emergency_phone || '';
    document.getElementById('monthlySalary').value = employee.monthly_salary;
    document.getElementById('status').value = employee.status;
    document.getElementById('sssNumber').value = employee.sss_number || '';
    document.getElementById('tinNumber').value = employee.tin_number || '';
    document.getElementById('philhealthNumber').value = employee.philhealth_number || '';
    
    // Disable employee ID field for editing
    document.getElementById('employeeId').setAttribute('readonly', true);
    
    // Show modal
    modal.style.display = 'block';
    
    console.log('✅ Edit Employee modal opened');
}

function closeEmployeeModal() {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (form) {
        form.reset();
    }
    
    editingEmployeeId = null;
    
    console.log('✅ Employee modal closed');
}

async function saveEmployee(e) {
    e.preventDefault();
    
    console.log('💾 Saving employee...');
    
    const data = {
        employee_id: document.getElementById('employeeId').value,
        name: document.getElementById('employeeName').value,
        position: document.getElementById('position').value,
        department: document.getElementById('department').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date_hired: document.getElementById('dateHired').value,
        birthdate: document.getElementById('birthdate').value,
        address: document.getElementById('address').value,
        emergency_contact: document.getElementById('emergencyContact').value,
        emergency_phone: document.getElementById('emergencyPhone').value,
        monthly_salary: parseFloat(document.getElementById('monthlySalary').value),
        status: document.getElementById('status').value,
        sss_number: document.getElementById('sssNumber').value,
        tin_number: document.getElementById('tinNumber').value,
        philhealth_number: document.getElementById('philhealthNumber').value
    };
    
    try {
        const action = editingEmployeeId ? 'update' : 'create';
        const method = editingEmployeeId ? 'PUT' : 'POST';
        
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(editingEmployeeId ? 'Employee updated successfully' : 'Employee added successfully', 'success');
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

function generateNextEmployeeId() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Find highest number for this month
    const prefix = `EMP`;
    const existingIds = employees
        .filter(e => e.employee_id.startsWith(prefix))
        .map(e => {
            const num = e.employee_id.split('-')[1];
            return parseInt(num.substring(6)) || 0;
        });
    
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const newId = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    
    const empIdInput = document.getElementById('employeeId');
    if (empIdInput) {
        empIdInput.value = newId;
    }
    
    return newId;
}

function toggleBlocklistView() {
    viewingBlocklisted = !viewingBlocklisted;
    const btn = document.getElementById('blocklistToggleBtn');
    
    if (viewingBlocklisted) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-check"></i> Show All Employees';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-ban"></i> View Blocklisted';
    }
    
    renderEmployees();
}

// =============================================
// SCHEDULE MANAGEMENT - FIXED
// =============================================

async function openScheduleModal(employeeId, employeeName) {
    console.log('📅 Opening schedule modal for:', employeeId, employeeName);
    
    currentScheduleEmployee = employeeId;
    const nameEl = document.getElementById('scheduleEmployeeName');
    const modal = document.getElementById('scheduleModal');
    
    if (nameEl) nameEl.textContent = employeeName;
    if (modal) modal.style.display = 'block';
    
    // Show loading state
    const currentBody = document.getElementById('currentWeekScheduleBody');
    const nextBody = document.getElementById('nextWeekScheduleBody');
    
    if (currentBody) {
        currentBody.innerHTML = `
            <tr><td colspan="4" style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i> Loading current week...
            </td></tr>
        `;
    }
    
    if (nextBody) {
        nextBody.innerHTML = `
            <tr><td colspan="4" style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i> Loading next week...
            </td></tr>
        `;
    }
    
    await loadEmployeeSchedule(employeeId);
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.style.display = 'none';
    currentScheduleEmployee = null;
}

async function loadEmployeeSchedule(employeeId) {
    try {
        // Add cache busting to force fresh data
        const timestamp = Date.now();
        
        const currentResponse = await fetch(`${SCHEDULE_API}?action=current&t=${timestamp}`);
        const currentResult = await currentResponse.json();
        
        const nextResponse = await fetch(`${SCHEDULE_API}?action=next&t=${timestamp}`);
        const nextResult = await nextResponse.json();
        
        if (currentResult.success && nextResult.success) {
            renderEmployeeSchedule(employeeId, currentResult.data, nextResult.data);
        } else {
            showNotification('Failed to load schedule', 'error');
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        showNotification('Failed to load schedule', 'error');
    }
}

function renderEmployeeSchedule(employeeId, currentData, nextData) {
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    const currentSchedule = currentData.filter(s => s.employee_id === employeeId);
    const nextSchedule = nextData.filter(s => s.employee_id === employeeId);
    
    const currentDays = Array(7).fill(null);
    const nextDays = Array(7).fill(null);
    
    currentSchedule.forEach(s => {
        const dayIndex = parseInt(s.day_of_week);
        if (dayIndex >= 0 && dayIndex < 7) {
            currentDays[dayIndex] = s;
        }
    });
    
    nextSchedule.forEach(s => {
        const dayIndex = parseInt(s.day_of_week);
        if (dayIndex >= 0 && dayIndex < 7) {
            nextDays[dayIndex] = s;
        }
    });
    
    const currentBody = document.getElementById('currentWeekScheduleBody');
    if (currentBody) {
        currentBody.innerHTML = days.map((day, index) => {
            const shift = currentDays[index];
            return `
                <tr>
                    <td style="font-weight: 500;">${day}</td>
                    <td>${shift ? escapeHtml(shift.shift_name) : 'Not Set'}</td>
                    <td>${shift ? escapeHtml(shift.shift_time) : '-'}</td>
                    <td>
                        <button class="schedule-edit-btn" onclick="editScheduleDay('${employeeId}', ${index}, 'current')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    const nextBody = document.getElementById('nextWeekScheduleBody');
    if (nextBody) {
        nextBody.innerHTML = days.map((day, index) => {
            const shift = nextDays[index];
            return `
                <tr>
                    <td style="font-weight: 500;">${day}</td>
                    <td>${shift ? escapeHtml(shift.shift_name) : 'Not Set'}</td>
                    <td>${shift ? escapeHtml(shift.shift_time) : '-'}</td>
                    <td>
                        <button class="schedule-edit-btn" onclick="editScheduleDay('${employeeId}', ${index}, 'next')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function editScheduleDay(employeeId, dayIndex, week) {
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    const weekEl = document.getElementById('editDayWeek');
    const indexEl = document.getElementById('editDayIndex');
    const empEl = document.getElementById('editDayEmployee');
    const nameEl = document.getElementById('editDayName');
    const modal = document.getElementById('scheduleEditModal');
    
    if (weekEl) weekEl.value = week;
    if (indexEl) indexEl.value = dayIndex;
    if (empEl) empEl.value = employeeId;
    if (nameEl) nameEl.textContent = days[dayIndex];
    if (modal) modal.style.display = 'block';
}

function closeScheduleEditModal() {
    const modal = document.getElementById('scheduleEditModal');
    const form = document.getElementById('scheduleEditForm');
    
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

async function saveSchedule(e) {
    e.preventDefault();
    
    const weekEl = document.getElementById('editDayWeek');
    const dayIndexEl = document.getElementById('editDayIndex');
    const employeeIdEl = document.getElementById('editDayEmployee');
    const shiftNameEl = document.getElementById('editShiftSelect');
    
    if (!weekEl || !dayIndexEl || !employeeIdEl || !shiftNameEl) {
        showNotification('Form elements not found', 'error');
        return;
    }
    
    const week = weekEl.value;
    const dayIndex = parseInt(dayIndexEl.value);
    const employeeId = employeeIdEl.value;
    const shiftName = shiftNameEl.value;
    
    if (!shiftName) {
        showNotification('Please select a shift', 'error');
        return;
    }
    
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
    
    console.log('💾 Saving schedule:', data);
    
    // Disable submit button
    const submitBtn = document.querySelector('#scheduleEditForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Schedule updated successfully!', 'success');
            closeScheduleEditModal();
            
            // Force reload the employee schedule
            console.log('🔄 Reloading employee schedule...');
            await loadEmployeeSchedule(employeeId);
            
            console.log('✅ Schedule reloaded!');
        } else {
            showNotification('❌ ' + (result.message || 'Failed to update schedule'), 'error');
            // Re-enable button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Schedule';
            }
        }
    } catch (error) {
        console.error('Error saving schedule:', error);
        showNotification('❌ Failed to update schedule', 'error');
        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Schedule';
        }
    }
}

function getLastSaturday(date) {
    const d = new Date(date);
    const day = d.getDay();
    
    let daysToSubtract;
    if (day === 6) {
        daysToSubtract = 0;
    } else if (day === 0) {
        daysToSubtract = 1;
    } else {
        daysToSubtract = day + 1;
    }
    
    d.setDate(d.getDate() - daysToSubtract);
    return d;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Make functions globally accessible
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.openScheduleModal = openScheduleModal;
window.editScheduleDay = editScheduleDay;
window.closeScheduleEditModal = closeScheduleEditModal;
window.saveSchedule = saveSchedule;
window.viewEmployee = function(id) { openEditModal(id); };
window.toggleBlocklist = async function(employeeId, blocklist) {
    // Placeholder for blocklist functionality
    console.log('Blocklist function called for:', employeeId, blocklist);
};

console.log('✅ Fixed employees.js loaded successfully');