// js/dashboard.js - Fixed Dashboard with Better Error Handling

const SCHEDULE_API = '../api/schedules.php';
const EMPLOYEES_API = '../api/employees.php';
let currentWeekSchedule = [];
let nextWeekSchedule = [];
let allEmployees = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initializing...');
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
    console.log('Starting dashboard initialization...');
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
    
    const weekRangeText = formatWeekRange(currentSaturday);
    const nextWeekRangeText = formatWeekRange(nextSaturday);
    
    console.log('Week ranges:', { current: weekRangeText, next: nextWeekRangeText });
    
    const weekRangeEl = document.getElementById('weekRange');
    const nextWeekRangeEl = document.getElementById('nextWeekRange');
    
    if (weekRangeEl) weekRangeEl.textContent = weekRangeText;
    if (nextWeekRangeEl) nextWeekRangeEl.textContent = nextWeekRangeText;
}

function getLastSaturday(date) {
    const d = new Date(date);
    const day = d.getDay();
    
    let daysToSubtract;
    if (day === 6) {
        daysToSubtract = 0; // Already Saturday
    } else if (day === 0) {
        daysToSubtract = 1; // Sunday
    } else {
        daysToSubtract = day + 1; // Monday(1)→2, etc.
    }
    
    d.setDate(d.getDate() - daysToSubtract);
    console.log(`Calculated Saturday: ${d.toISOString().split('T')[0]} (from day ${day}, subtract ${daysToSubtract})`);
    return d;
}

function formatWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`;
}

async function loadEmployees() {
    console.log('Loading employees...');
    try {
        const response = await fetch(`${EMPLOYEES_API}?action=list&status=Active`);
        const text = await response.text();
        console.log('Employees API raw response:', text.substring(0, 200));
        
        const result = JSON.parse(text);
        
        if (result.success) {
            allEmployees = result.data || [];
            console.log(`✅ Loaded ${allEmployees.length} employees`);
        } else {
            console.error('❌ Employees API error:', result.message);
        }
    } catch (error) {
        console.error('❌ Error loading employees:', error);
        showNotification('Failed to load employees: ' + error.message, 'error');
    }
}

async function loadCurrentSchedule() {
    console.log('Loading current week schedule...');
    const tbody = document.getElementById('scheduleTableBody');
    
    if (!tbody) {
        console.error('scheduleTableBody not found!');
        return;
    }
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=current`);
        const text = await response.text();
        console.log('Current schedule API raw response:', text.substring(0, 500));
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ Invalid JSON response:', text);
            tbody.innerHTML = `
                <tr><td colspan="8" style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                    <p>API Error: Invalid response format</p>
                    <small>Check browser console for details</small>
                </td></tr>
            `;
            return;
        }
        
        if (result.success) {
            currentWeekSchedule = result.data || [];
            console.log(`✅ Loaded ${currentWeekSchedule.length} current week schedules`);
            
            if (currentWeekSchedule.length > 0) {
                console.log('Sample schedule entry:', currentWeekSchedule[0]);
            }
            
            renderSchedule(currentWeekSchedule, 'scheduleTableBody', false);
        } else {
            console.error('❌ Current schedule API error:', result.message);
            renderEmptySchedule('scheduleTableBody', result.message);
        }
    } catch (error) {
        console.error('❌ Error loading current schedule:', error);
        tbody.innerHTML = `
            <tr><td colspan="8" style="text-align: center; padding: 40px; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                <p>Error: ${error.message}</p>
            </td></tr>
        `;
    }
}

async function loadNextSchedule() {
    console.log('Loading next week schedule...');
    const tbody = document.getElementById('nextScheduleTableBody');
    
    if (!tbody) {
        console.error('nextScheduleTableBody not found!');
        return;
    }
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=next`);
        const text = await response.text();
        console.log('Next schedule API raw response:', text.substring(0, 500));
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ Invalid JSON response:', text);
            tbody.innerHTML = `
                <tr><td colspan="8" style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                    <p>API Error: Invalid response format</p>
                </td></tr>
            `;
            return;
        }
        
        if (result.success) {
            nextWeekSchedule = result.data || [];
            console.log(`✅ Loaded ${nextWeekSchedule.length} next week schedules`);
            renderSchedule(nextWeekSchedule, 'nextScheduleTableBody', true);
        } else {
            console.error('❌ Next schedule API error:', result.message);
            renderEmptySchedule('nextScheduleTableBody', result.message);
        }
    } catch (error) {
        console.error('❌ Error loading next schedule:', error);
        tbody.innerHTML = `
            <tr><td colspan="8" style="text-align: center; padding: 40px; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                <p>Error: ${error.message}</p>
            </td></tr>
        `;
    }
}

function renderSchedule(data, tableBodyId, isNextWeek) {
    console.log(`Rendering ${isNextWeek ? 'next' : 'current'} week schedule with ${data.length} entries`);
    
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) {
        console.error(`Table body ${tableBodyId} not found!`);
        return;
    }
    
    // Group by employee
    const employeeSchedules = {};
    data.forEach(item => {
        if (!employeeSchedules[item.employee_id]) {
            employeeSchedules[item.employee_id] = {
                name: item.employee_name || item.employee_id,
                days: Array(7).fill(null)
            };
        }
        
        // Ensure day_of_week is a number
        const dayIndex = parseInt(item.day_of_week);
        if (dayIndex >= 0 && dayIndex < 7) {
            employeeSchedules[item.employee_id].days[dayIndex] = {
                shift_name: item.shift_name,
                shift_time: item.shift_time
            };
        } else {
            console.warn(`Invalid day_of_week: ${item.day_of_week}`, item);
        }
    });
    
    const employeeCount = Object.keys(employeeSchedules).length;
    console.log(`Grouped into ${employeeCount} employees`);
    
    if (employeeCount === 0) {
        renderEmptySchedule(tableBodyId);
        return;
    }
    
    tbody.innerHTML = Object.entries(employeeSchedules).map(([empId, schedule]) => `
        <tr>
            <td style="font-weight: bold; background-color: #f8f9fa;">${schedule.name}</td>
            ${schedule.days.map((day, index) => `
                <td class="${day ? getShiftClass(day.shift_name) : 'day-off'}" style="position: relative;">
                    ${day ? `
                        <div style="font-weight: 500; font-size: 13px;">${day.shift_name}</div>
                        <small style="opacity: 0.7; font-size: 11px; display: block; margin-top: 2px;">${day.shift_time}</small>
                    ` : '<span style="color: #999;">Day Off</span>'}
                    <button class="edit-shift" onclick="openScheduleModal('${empId}', ${index}, '${isNextWeek ? 'next' : 'current'}', '${escapeHtml(schedule.name)}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `).join('')}
        </tr>
    `).join('');
    
    console.log(`✅ Rendered ${employeeCount} employee schedules to ${tableBodyId}`);
}

function renderEmptySchedule(tableBodyId, message = null) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    const displayMessage = message || 'No schedule configured for this week';
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-calendar-times" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                <p style="margin: 0; font-size: 16px;">${displayMessage}</p>
                <small style="color: #bbb; display: block; margin-top: 8px;">Schedules will appear here once configured</small>
            </td>
        </tr>
    `;
}

function getShiftClass(shiftName) {
    if (!shiftName) return '';
    const name = shiftName.toLowerCase();
    if (name.includes('morning')) return 'shift-morning';
    if (name.includes('afternoon')) return 'shift-afternoon';
    if (name.includes('night')) return 'shift-night';
    return '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openScheduleModal(employeeId, dayIndex, week, employeeName) {
    console.log('Opening schedule modal:', { employeeId, dayIndex, week, employeeName });
    
    const modal = document.getElementById('scheduleModal');
    const form = document.getElementById('scheduleForm');
    
    if (!modal || !form) {
        console.error('Modal elements not found!');
        return;
    }
    
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
    
    const shiftSelect = document.getElementById('shiftSelect');
    if (currentShift) {
        shiftSelect.value = currentShift.shift_name || 'Morning';
    } else {
        shiftSelect.value = 'Morning';
    }
    
    modal.style.display = 'block';
    
    // Form submit
    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveSchedule(employeeId, dayIndex, week);
    };
}

async function saveSchedule(employeeId, dayIndex, week) {
    console.log('Saving schedule:', { employeeId, dayIndex, week });
    
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
        day: parseInt(dayIndex),
        shift_name: shiftName,
        shift_time: shiftTimes[shiftName],
        is_next_week: week === 'next' ? 1 : 0
    };
    
    console.log('Sending to API:', data);
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const text = await response.text();
        console.log('Save response (raw):', text);
        
        const result = JSON.parse(text);
        console.log('Save response (parsed):', result);
        
        if (result.success) {
            showNotification('Schedule updated successfully!', 'success');
            closeModal();
            
            // Reload appropriate schedule
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
        showNotification('Failed to update schedule: ' + error.message, 'error');
    }
}

function closeModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    const form = document.getElementById('scheduleForm');
    if (form) {
        form.reset();
    }
    
    const employeeSelect = document.getElementById('employeeName');
    if (employeeSelect) {
        employeeSelect.disabled = false;
    }
}

async function copyScheduleToNext() {
    if (currentWeekSchedule.length === 0) {
        showNotification('No current week schedule to copy. Please create one first.', 'error');
        return;
    }
    
    if (!confirm('Copy current week schedule to next week? This will overwrite any existing next week schedule.')) {
        return;
    }
    
    console.log('Copying schedule to next week...');
    showNotification('Copying schedule...', 'success');
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=copy`, {
            method: 'POST'
        });
        
        const text = await response.text();
        console.log('Copy response:', text);
        
        const result = JSON.parse(text);
        
        if (result.success) {
            showNotification('Schedule copied to next week successfully!', 'success');
            await loadNextSchedule();
        } else {
            showNotification(result.message || 'Failed to copy schedule', 'error');
        }
    } catch (err) {
        console.error('Error copying schedule:', err);
        showNotification('Failed to copy schedule: ' + err.message, 'error');
    }
}

async function clearNextWeek() {
    if (!confirm('Clear next week schedule? This action cannot be undone.')) {
        return;
    }
    
    console.log('Clearing next week schedule...');
    showNotification('Clearing schedule...', 'success');
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=clear`, {
            method: 'POST'
        });
        
        const text = await response.text();
        console.log('Clear response:', text);
        
        const result = JSON.parse(text);
        
        if (result.success) {
            showNotification('Next week schedule cleared successfully!', 'success');
            await loadNextSchedule();
        } else {
            showNotification(result.message || 'Failed to clear schedule', 'error');
        }
    } catch (err) {
        console.error('Error clearing schedule:', err);
        showNotification('Failed to clear schedule: ' + err.message, 'error');
    }
}

function showNotification(message, type = 'success') {
    console.log(`Notification: [${type}] ${message}`);
    
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

// Make functions globally accessible
window.openScheduleModal = openScheduleModal;
window.closeModal = closeModal;

console.log('✅ Dashboard script loaded successfully');