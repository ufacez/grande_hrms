// js/employees.js - Fixed Version

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
    
    // Add Employee button
    const addBtn = document.getElementById('addEmployeeBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
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
        blocklistToggleBtn.addEventListener('click', showBlocklistedOnly);
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function openScheduleModal(employeeId, employeeName) {
    currentScheduleEmployee = employeeId;
    const nameEl = document.getElementById('scheduleEmployeeName');
    const modal = document.getElementById('scheduleModal');
    
    if (nameEl) nameEl.textContent = employeeName;
    if (modal) modal.style.display = 'block';
    
    await loadEmployeeSchedule(employeeId);
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.style.display = 'none';
    currentScheduleEmployee = null;
}

async function loadEmployeeSchedule(employeeId) {
    try {
        const currentResponse = await fetch(`${SCHEDULE_API}?action=current`);
        const currentResult = await currentResponse.json();
        
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
    
    const currentSchedule = currentData.filter(s => s.employee_id === employeeId);
    const nextSchedule = nextData.filter(s => s.employee_id === employeeId);
    
    const currentDays = Array(7).fill(null);
    const nextDays = Array(7).fill(null);
    
    currentSchedule.forEach(s => {
        currentDays[s.day_of_week] = s;
    });
    
    nextSchedule.forEach(s => {
        nextDays[s.day_of_week] = s;
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
    
    if (!weekEl || !dayIndexEl || !employeeIdEl || !shiftNameEl) return;
    
    const week = weekEl.value;
    const dayIndex = parseInt(dayIndexEl.value);
    const employeeId = employeeIdEl.value;
    const shiftName = shiftNameEl.value;
    
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
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Schedule updated successfully!', 'success');
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

async function openAddModal() {
    editingEmployeeId = null;
    const modal = document.getElementById('employeeModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('employeeForm');
    const employeeIdEl = document.getElementById('employeeId');
    
    if (modal) modal.style.display = 'block';
    if (modalTitle) modalTitle.textContent = 'Add New Employee';
    if (form) form.reset();
    
    const nextId = await generateEmployeeId();
    if (employeeIdEl) {
        employeeIdEl.value = nextId;
        employeeIdEl.readOnly = true;
    }
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
    const modal = document.getElementById('employeeModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modal) modal.style.display = 'block';
    if (modalTitle) modalTitle.textContent = 'Edit Employee';
    
    // Populate form fields
    const fields = {
        'employeeId': employee.employee_id,
        'employeeName': employee.name,
        'position': employee.position,
        'department': employee.department,
        'email': employee.email,
        'phone': employee.phone,
        'dateHired': employee.date_hired,
        'birthdate': employee.birthdate,
        'address': employee.address,
        'emergencyContact': employee.emergency_contact,
        'emergencyPhone': employee.emergency_phone,
        'monthlySalary': employee.monthly_salary,
        'status': employee.status,
        'sssNumber': employee.sss_number || '',
        'tinNumber': employee.tin_number || '',
        'philhealthNumber': employee.philhealth_number || ''
    };
    
    Object.keys(fields).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = fields[key];
    });
    
    const employeeIdEl = document.getElementById('employeeId');
    if (employeeIdEl) employeeIdEl.readOnly = true;
}

function closeEmployeeModal() {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    editingEmployeeId = null;
}

async function saveEmployee(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        employee_id: document.getElementById('employeeId')?.value || '',
        name: document.getElementById('employeeName')?.value || '',
        position: document.getElementById('position')?.value || '',
        department: document.getElementById('department')?.value || '',
        email: document.getElementById('email')?.value || 'N/A',
        phone: document.getElementById('phone')?.value || '',
        date_hired: document.getElementById('dateHired')?.value || '',
        birthdate: document.getElementById('birthdate')?.value || '1990-01-01',
        address: document.getElementById('address')?.value || 'N/A',
        emergency_contact: document.getElementById('emergencyContact')?.value || 'N/A',
        emergency_phone: document.getElementById('emergencyPhone')?.value || 'N/A',
        monthly_salary: document.getElementById('monthlySalary')?.value || '0',
        status: document.getElementById('status')?.value || 'Active',
        sss_number: document.getElementById('sssNumber')?.value || null,
        tin_number: document.getElementById('tinNumber')?.value || null,
        philhealth_number: document.getElementById('philhealthNumber')?.value || null
    };
    
    // Validate required fields
    if (!formData.employee_id || !formData.name || !formData.position || 
        !formData.department || !formData.phone || !formData.date_hired || 
        !formData.monthly_salary) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
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
    // Could open a detail modal or navigate to detail page
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
    const btn = document.getElementById('blocklistToggleBtn');
    const filterStatus = document.getElementById('filterStatus');
    
    if (!btn || !filterStatus) return;
    
    if (viewingBlocklisted) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-users"></i> View All';
        filterStatus.value = 'Blocklisted';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-ban"></i> View Blocklisted';
        filterStatus.value = 'all';
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
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Window click handler for modals
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

// Export functions for global access
window.openScheduleModal = openScheduleModal;
window.editScheduleDay = editScheduleDay;
window.openEditModal = openEditModal;
window.toggleBlocklist = toggleBlocklist;
window.viewEmployee = viewEmployee;
window.closeScheduleEditModal = closeScheduleEditModal;