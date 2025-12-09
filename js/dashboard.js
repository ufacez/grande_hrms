// js/dashboard.js - Dynamic Dashboard

const SCHEDULE_API = '../api/schedules.php';
let scheduleData = [];

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

function initializeDashboard() {
    updateWeekRanges();
    loadCurrentSchedule();
    loadNextSchedule();
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

async function loadCurrentSchedule() {
    try {
        const response = await fetch(`${SCHEDULE_API}?action=current`);
        const result = await response.json();
        
        if (result.success) {
            renderSchedule(result.data, 'scheduleTableBody');
        }
    } catch (error) {
        console.error('Error loading current schedule:', error);
    }
}

async function loadNextSchedule() {
    try {
        const response = await fetch(`${SCHEDULE_API}?action=next`);
        const result = await response.json();
        
        if (result.success) {
            renderSchedule(result.data, 'nextScheduleTableBody');
        }
    } catch (error) {
        console.error('Error loading next schedule:', error);
    }
}

function renderSchedule(data, tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    
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
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-calendar-times" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                    No schedule configured for this week
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = Object.entries(employeeSchedules).map(([empId, schedule]) => `
        <tr>
            <td>${schedule.name}</td>
            ${schedule.days.map((day, index) => `
                <td class="${day ? getShiftClass(day.shift_name) : 'day-off'}">
                    ${day ? `
                        <div>${day.shift_name}</div>
                        <small style="opacity: 0.7;">${day.shift_time}</small>
                    ` : 'Day Off'}
                    <button class="edit-shift" onclick="openScheduleModal('${empId}', ${index}, '${tableBodyId === 'nextScheduleTableBody' ? 'next' : 'current'}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `).join('')}
        </tr>
    `).join('');
}

function getShiftClass(shiftName) {
    if (shiftName.toLowerCase().includes('morning')) return 'shift-morning';
    if (shiftName.toLowerCase().includes('afternoon')) return 'shift-afternoon';
    if (shiftName.toLowerCase().includes('night')) return 'shift-night';
    return '';
}

function openScheduleModal(employeeId, dayIndex, week) {
    // Implementation for schedule editing modal
    alert(`Edit schedule for employee ${employeeId}, day ${dayIndex}, week ${week}`);
}

function openAddEmployeeModal() {
    alert('Add employee to schedule - To be implemented');
}

function openRemoveEmployeeModal() {
    alert('Remove employee from schedule - To be implemented');
}

document.getElementById('copyCurrentToNext')?.addEventListener('click', async () => {
    if (!confirm('Copy current week schedule to next week?')) return;
    
    // Implementation for copying schedule
    alert('Copy schedule - To be implemented');
});

document.getElementById('clearNextWeek')?.addEventListener('click', async () => {
    if (!confirm('Clear next week schedule?')) return;
    
    // Implementation for clearing schedule
    alert('Clear schedule - To be implemented');
});