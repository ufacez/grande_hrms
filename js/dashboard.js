// js/dashboard.js - Dynamic Dashboard with Database Integration

const SCHEDULE_API = '../api/schedules_v2.php';
const EMPLOYEES_API = '../api/employees.php';
let currentWeekSchedule = [];
let nextWeekSchedule = [];
let allEmployees = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
});

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
    });
    
    // Copy schedule button
    document.getElementById('copyCurrentToNext')?.addEventListener('click', copyScheduleToNext);
    
    // Clear schedule button
    document.getElementById('clearNextWeek')?.addEventListener('click', clearNextWeek);
    
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

async function initializeDashboard() {
    updateWeekRanges();
    await loadEmployees();
    await loadCurrentSchedule();
    await loadNextSchedule();
}

function updateWeekRanges() {
    const today = new Date();
    const currentSaturday = getLastSaturday(today);
    const nextSaturday = new Date(currentSaturday);
    nextSaturday.setDate(nextSaturday.getDate() + 7);
    
    document.getElementById('weekRange').textContent = formatWeekRange(currentSaturday);
    document.getElementById('nextWeekRange').textContent = formatWeekRange(nextSaturday);
}

function getLastSaturday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 6 ? 0 : (day + 1);
    d.setDate(d.getDate() - diff);
    return d;
}

function formatWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`;
}

async function loadEmployees() {
    try {
        const response = await fetch(`${EMPLOYEES_API}?action=list&status=Active`);
        const result = await response.json();
        
        if (result.success) {
            allEmployees = result.data;
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function loadCurrentSchedule() {
    try {
        const response = await fetch(`${SCHEDULE_API}?action=current`);
        const result = await response.json();
        
        if (result.success) {
            currentWeekSchedule = result.data;
            renderSchedule(result.data, 'scheduleTableBody');
        }
    } catch (error) {
        console.error('Error loading current schedule:', error);
        renderEmptySchedule('scheduleTableBody');
    }
}

async function loadNextSchedule() {
    try {
        const response = await fetch(`${SCHEDULE_API}?action=next`);
        const result = await response.json();
        
        if (result.success) {
            nextWeekSchedule = result.data;
            renderSchedule(result.data, 'nextScheduleTableBody');
        }
    } catch (error) {
        console.error('Error loading next schedule:', error);
        renderEmptySchedule('nextScheduleTableBody');
    }
}

function renderSchedule(data, tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    const isNextWeek = tableBodyId === 'nextScheduleTableBody';
    
    // Group by employee
    const employeeSchedules = {};
    data.forEach(item => {
        if (!employeeSchedules[item.employee_id]) {
            employeeSchedules[item.employee_id] = {
                name: item.employee_name,
                days: Array(7).fill(null)
            };
        }
        employeeSchedules[item.employee_id].days[item.day_of_week] = {
            shift_name: item.shift_name,
            shift_time: item.shift_time
        };
    });
    
    if (Object.keys(employeeSchedules).length === 0) {
        renderEmptySchedule(tableBodyId);
        return;
    }
    
    tbody.innerHTML = Object.entries(employeeSchedules).map(([empId, schedule]) => `
        <tr>
            <td style="font-weight: bold;">${schedule.name}</td>
            ${schedule.days.map((day, index) => `
                <td class="${day ? getShiftClass(day.shift_name) : 'day-off'}" style="position: relative;">
                    ${day ? `
                        <div style="font-weight: 500;">${day.shift_name}</div>
                        <small style="opacity: 0.7; font-size: 11px;">${day.shift_time}</small>
                    ` : '<span style="color: #999;">Day Off</span>'}
                    <button class="edit-shift" onclick="openScheduleModal('${empId}', ${index}, '${isNextWeek ? 'next' : 'current'}', '${schedule.name}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `).join('')}
        </tr>
    `).join('');
}

function renderEmptySchedule(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-calendar-times" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                <p style="margin: 0;">No schedule configured for this week</p>
                <small style="color: #bbb;">Schedules will appear here once configured</small>
            </td>
        </tr>
    `;
}

function getShiftClass(shiftName) {
    const name = shiftName.toLowerCase();
    if (name.includes('morning')) return 'shift-morning';
    if (name.includes('afternoon')) return 'shift-afternoon';
    if (name.includes('night')) return 'shift-night';
    return '';
}

function openScheduleModal(employeeId, dayIndex, week, employeeName) {
    const modal = document.getElementById('scheduleModal');
    const form = document.getElementById('scheduleForm');
    
    // Set form data
    document.getElementById('editModalTitle').textContent = `Edit Schedule - ${employeeName}`;
    document.getElementById('editingWeek').value = week;
    document.getElementById('daySelect').value = dayIndex;
    
    // Populate employee select (read-only for editing)
    const employeeSelect = document.getElementById('employeeName');
    employeeSelect.innerHTML = `<option value="${employeeId}">${employeeName}</option>`;
    employeeSelect.disabled = true;
    
    // Get current shift for this day
    const scheduleData = week === 'next' ? nextWeekSchedule : currentWeekSchedule;
    const currentShift = scheduleData.find(s => 
        s.employee_id === employeeId && s.day_of_week == dayIndex
    );
    
    if (currentShift) {
        document.getElementById('shiftSelect').value = currentShift.shift_name || 'Morning';
    }
    
    modal.style.display = 'block';
    
    // Form submit
    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveSchedule(employeeId, dayIndex, week);
    };
}

async function saveSchedule(employeeId, dayIndex, week) {
    const shiftName = document.getElementById('shiftSelect').value;
    
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
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Schedule updated successfully', 'success');
            closeModal();
            
            if (week === 'next') {
                await loadNextSchedule();
            } else {
                await loadCurrentSchedule();
            }
        } else {
            showNotification(result.message || 'Failed to update schedule', 'error');
        }
    } catch (error) {
        console.error('Error saving schedule:', error);
        showNotification('Failed to update schedule', 'error');
    }
}

function closeModal() {
    document.getElementById('scheduleModal').style.display = 'none';
    document.getElementById('scheduleForm').reset();
    document.getElementById('employeeName').disabled = false;
}

async function copyScheduleToNext() {
    if (!confirm('Copy current week schedule to next week? This will overwrite any existing next week schedule.')) return;
    
    showNotification('Copying schedule...', 'success');
    try {
        const response = await fetch(`${SCHEDULE_API}?action=copy`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Schedule copied to next week', 'success');
            await loadNextSchedule();
        } else {
            showNotification(result.message || 'Failed to copy schedule', 'error');
        }
    } catch (err) {
        console.error('Error copying schedule:', err);
        showNotification('Failed to copy schedule', 'error');
    }
}

async function clearNextWeek() {
    if (!confirm('Clear next week schedule? This action cannot be undone.')) return;
    
    showNotification('Clearing schedule...', 'success');
    try {
        const response = await fetch(`${SCHEDULE_API}?action=clear`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Next week schedule cleared', 'success');
            await loadNextSchedule();
        } else {
            showNotification(result.message || 'Failed to clear schedule', 'error');
        }
    } catch (err) {
        console.error('Error clearing schedule:', err);
        showNotification('Failed to clear schedule', 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('globalNotification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Close modal when clicking outside
window.onclick = (event) => {
    const modal = document.getElementById('scheduleModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Redirect functions for buttons
function openAddEmployeeModal() {
    window.location.href = 'employees.php';
}

function openRemoveEmployeeModal() {
    window.location.href = 'employees.php';
}