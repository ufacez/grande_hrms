// js/dashboard.js - FIXED VERSION with proper schedule updates

const SCHEDULE_API = '../api/schedules.php';
const EMPLOYEES_API = '../api/employees.php';
let currentWeekSchedule = [];
let nextWeekSchedule = [];
let allEmployees = [];
let currentEditingEmployee = null;
let currentEditingDay = null;
let currentEditingWeek = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard initializing...');
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
    
    // Modal close on outside click
    window.onclick = (event) => {
        const modal = document.getElementById('scheduleModal');
        if (event.target === modal) {
            closeModal();
        }
    };
}

async function initializeDashboard() {
    console.log('📅 Starting dashboard initialization...');
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
    
    console.log('📆 Week ranges:', { current: weekRangeText, next: nextWeekRangeText });
    
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
        daysToSubtract = 0;
    } else if (day === 0) {
        daysToSubtract = 1;
    } else {
        daysToSubtract = day + 1;
    }
    
    d.setDate(d.getDate() - daysToSubtract);
    return d;
}

function formatWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`;
}

async function loadEmployees() {
    console.log('👥 Loading employees...');
    try {
        const response = await fetch(`${EMPLOYEES_API}?action=list&status=Active`);
        const result = await response.json();
        
        if (result.success) {
            allEmployees = result.data || [];
            console.log(`✅ Loaded ${allEmployees.length} employees`);
        } else {
            console.error('❌ Failed to load employees:', result.message);
            showNotification('Failed to load employees', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading employees:', error);
        showNotification('Failed to load employees', 'error');
    }
}

async function loadCurrentSchedule() {
    console.log('📋 Loading current week schedule...');
    const tbody = document.getElementById('scheduleTableBody');
    
    if (!tbody) {
        console.error('❌ scheduleTableBody not found!');
        return;
    }
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=current`);
        const result = await response.json();
        
        if (result.success) {
            currentWeekSchedule = result.data || [];
            console.log(`✅ Loaded ${currentWeekSchedule.length} current week entries`);
            renderSchedule(currentWeekSchedule, 'scheduleTableBody', false);
        } else {
            console.error('❌ Current schedule error:', result.message);
            renderEmptySchedule('scheduleTableBody', result.message);
        }
    } catch (error) {
        console.error('❌ Error loading current schedule:', error);
        renderEmptySchedule('scheduleTableBody', 'Failed to load schedule');
    }
}

async function loadNextSchedule() {
    console.log('📋 Loading next week schedule...');
    const tbody = document.getElementById('nextScheduleTableBody');
    
    if (!tbody) {
        console.error('❌ nextScheduleTableBody not found!');
        return;
    }
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=next`);
        const result = await response.json();
        
        if (result.success) {
            nextWeekSchedule = result.data || [];
            console.log(`✅ Loaded ${nextWeekSchedule.length} next week entries`);
            renderSchedule(nextWeekSchedule, 'nextScheduleTableBody', true);
        } else {
            console.error('❌ Next schedule error:', result.message);
            renderEmptySchedule('nextScheduleTableBody', result.message);
        }
    } catch (error) {
        console.error('❌ Error loading next schedule:', error);
        renderEmptySchedule('nextScheduleTableBody', 'Failed to load schedule');
    }
}

function renderSchedule(data, tableBodyId, isNextWeek) {
    console.log(`🎨 Rendering ${isNextWeek ? 'next' : 'current'} week schedule (${data.length} entries)`);
    
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) {
        console.error(`❌ Table body ${tableBodyId} not found!`);
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
        
        const dayIndex = parseInt(item.day_of_week);
        if (dayIndex >= 0 && dayIndex < 7) {
            employeeSchedules[item.employee_id].days[dayIndex] = {
                shift_name: item.shift_name,
                shift_time: item.shift_time
            };
        }
    });
    
    const employeeCount = Object.keys(employeeSchedules).length;
    
    if (employeeCount === 0) {
        renderEmptySchedule(tableBodyId);
        return;
    }
    
    tbody.innerHTML = Object.entries(employeeSchedules).map(([empId, schedule]) => `
        <tr>
            <td style="font-weight: bold; background-color: #f8f9fa;">${escapeHtml(schedule.name)}</td>
            ${schedule.days.map((day, index) => `
                <td class="${day ? getShiftClass(day.shift_name) : 'day-off'}" style="position: relative;">
                    ${day ? `
                        <div style="font-weight: 500; font-size: 13px;">${escapeHtml(day.shift_name)}</div>
                        <small style="opacity: 0.7; font-size: 11px; display: block; margin-top: 2px;">${escapeHtml(day.shift_time)}</small>
                    ` : '<span style="color: #999;">Day Off</span>'}
                    <button class="edit-shift" onclick="openScheduleModal('${empId}', ${index}, '${isNextWeek ? 'next' : 'current'}', '${escapeHtml(schedule.name)}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `).join('')}
        </tr>
    `).join('');
    
    console.log(`✅ Rendered ${employeeCount} employee schedules`);
}

function renderEmptySchedule(tableBodyId, message = null) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    const displayMessage = message || 'No schedule configured for this week';
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-calendar-times" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                <p style="margin: 0; font-size: 16px;">${escapeHtml(displayMessage)}</p>
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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openScheduleModal(employeeId, dayIndex, week, employeeName) {
    console.log('📝 Opening schedule modal:', { employeeId, dayIndex, week, employeeName });
    
    // Store current editing info
    currentEditingEmployee = employeeId;
    currentEditingDay = dayIndex;
    currentEditingWeek = week;
    
    const modal = document.getElementById('scheduleModal');
    const form = document.getElementById('scheduleForm');
    
    if (!modal || !form) {
        console.error('❌ Modal elements not found!');
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
        s.employee_id === employeeId && parseInt(s.day_of_week) === parseInt(dayIndex)
    );
    
    const shiftSelect = document.getElementById('shiftSelect');
    if (currentShift) {
        shiftSelect.value = currentShift.shift_name || 'Morning';
        console.log('📌 Current shift:', currentShift.shift_name);
    } else {
        shiftSelect.value = 'Morning';
        console.log('📌 No existing shift, defaulting to Morning');
    }
    
    modal.style.display = 'block';
    
    // Form submit - FIXED VERSION
    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveSchedule();
    };
}

async function saveSchedule() {
    console.log('💾 Saving schedule...');
    
    if (!currentEditingEmployee || currentEditingDay === null || !currentEditingWeek) {
        console.error('❌ Missing editing context!');
        showNotification('Error: Missing schedule information', 'error');
        return;
    }
    
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
    if (currentEditingWeek === 'next') {
    saturday.setDate(saturday.getDate() + 7); // CORRECT - single setDate
    }
    
    const data = {
        employee_id: currentEditingEmployee,
        week_start: saturday.toISOString().split('T')[0],
        day: parseInt(currentEditingDay),
        shift_name: shiftName,
        shift_time: shiftTimes[shiftName],
        is_next_week: currentEditingWeek === 'next' ? 1 : 0
    };
    
    console.log('📤 Sending to API:', data);
    
    // Disable submit button to prevent double-clicks
    const submitBtn = document.querySelector('#scheduleForm button[type="submit"]');
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
        console.log('📥 API response:', result);
        
        if (result.success) {
            showNotification('✅ Schedule updated successfully!', 'success');
            closeModal();
            
            // Force reload both schedules to ensure fresh data
            console.log('🔄 Reloading schedules...');
            await Promise.all([
                loadCurrentSchedule(),
                loadNextSchedule()
            ]);
            
            console.log('✅ Schedules reloaded!');
        } else {
            showNotification('❌ ' + (result.message || 'Failed to update schedule'), 'error');
            // Re-enable button on error
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Save';
            }
        }
    } catch (error) {
        console.error('❌ Error saving schedule:', error);
        showNotification('❌ Failed to update schedule: ' + error.message, 'error');
        // Re-enable button on error
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save';
        }
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
    
    // Clear editing context
    currentEditingEmployee = null;
    currentEditingDay = null;
    currentEditingWeek = null;
}

async function copyScheduleToNext() {
    if (currentWeekSchedule.length === 0) {
        showNotification('❌ No current week schedule to copy', 'error');
        return;
    }
    
    if (!confirm('Copy current week schedule to next week? This will overwrite any existing next week schedule.')) {
        return;
    }
    
    console.log('📋 Copying schedule to next week...');
    showNotification('📋 Copying schedule...', 'info');
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=copy`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Schedule copied successfully!', 'success');
            await loadNextSchedule();
        } else {
            showNotification('❌ ' + (result.message || 'Failed to copy schedule'), 'error');
        }
    } catch (error) {
        console.error('❌ Error copying schedule:', error);
        showNotification('❌ Failed to copy schedule: ' + error.message, 'error');
    }
}

async function clearNextWeek() {
    if (!confirm('Clear next week schedule? This action cannot be undone.')) {
        return;
    }
    
    console.log('🗑️ Clearing next week schedule...');
    showNotification('🗑️ Clearing schedule...', 'info');
    
    try {
        const response = await fetch(`${SCHEDULE_API}?action=clear`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Next week schedule cleared!', 'success');
            await loadNextSchedule();
        } else {
            showNotification('❌ ' + (result.message || 'Failed to clear schedule'), 'error');
        }
    } catch (error) {
        console.error('❌ Error clearing schedule:', error);
        showNotification('❌ Failed to clear schedule: ' + error.message, 'error');
    }
}

function showNotification(message, type = 'success') {
    console.log(`📢 Notification: [${type}] ${message}`);
    
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

// Make functions globally accessible
window.openScheduleModal = openScheduleModal;
window.closeModal = closeModal;

console.log('✅ Dashboard script loaded successfully');