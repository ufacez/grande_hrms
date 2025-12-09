// Dashboard-specific JavaScript
// Load or initialize schedule data (persisted in localStorage)
let weeklySchedule = JSON.parse(localStorage.getItem('weeklySchedule')) || [
    {
        name: 'Bern Saez',
        schedule: [
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Afternoon', time: '2:00 PM - 10:00 PM' },
            { shift: 'Night', time: '10:00 PM - 6:00 AM' },
            { shift: 'Off', time: '-' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Off', time: '-' }
        ]
    },
    {
        name: 'Earl Espiritu',
        schedule: [
            { shift: 'Afternoon', time: '2:00 PM - 10:00 PM' },
            { shift: 'Night', time: '10:00 PM - 6:00 AM' },
            { shift: 'Off', time: '-' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Off', time: '-' },
            { shift: 'Night', time: '10:00 PM - 6:00 AM' }
        ]
    },
    {
        name: 'Lee Bornoz',
        schedule: [
            { shift: 'Night', time: '10:00 PM - 6:00 AM' },
            { shift: 'Off', time: '-' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Afternoon', time: '2:00 PM - 10:00 PM' },
            { shift: 'Night', time: '10:00 PM - 6:00 AM' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Off', time: '-' }
        ]
    },
    {
        name: 'Dev Jimenez',
        schedule: [
            { shift: 'Off', time: '-' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Night', time: '10:00 PM - 6:00 AM' },
            { shift: 'Off', time: '-' },
            { shift: 'Afternoon', time: '2:00 PM - 10:00 PM' },
            { shift: 'Night', time: '10:00 PM - 6:00 AM' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' }
        ]
    },
    {
        name: 'Karl Gonzales',
        schedule: [
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Afternoon', time: '2:00 PM - 10:00 PM' },
            { shift: 'Off', time: '-' },
            { shift: 'Morning', time: '6:00 AM - 2:00 PM' },
            { shift: 'Night', time: '10:00 PM - 6:00 AM' },
            { shift: 'Off', time: '-' },
            { shift: 'Afternoon', time: '2:00 PM - 10:00 PM' }
        ]
    }
];

function saveWeeklySchedule() {
    localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
    ensureNextWeeklySchedule();
    saveNextWeeklySchedule();
}

// Next week schedule storage (separate from the active week)
let nextWeeklySchedule = JSON.parse(localStorage.getItem('nextWeeklySchedule')) || null;

function saveNextWeeklySchedule() {
    localStorage.setItem('nextWeeklySchedule', JSON.stringify(nextWeeklySchedule));
}

// Ensure nextWeeklySchedule exists and aligns with current employees
function ensureNextWeeklySchedule() {
    if (!Array.isArray(nextWeeklySchedule)) {
        nextWeeklySchedule = weeklySchedule.map(emp => ({
            name: emp.name,
            schedule: emp.schedule.map(d => ({ shift: d.shift, time: d.time }))
        }));
        saveNextWeeklySchedule();
        return;
    }

    const names = weeklySchedule.map(e => e.name);
    nextWeeklySchedule = nextWeeklySchedule.filter(e => names.includes(e.name));
    weeklySchedule.forEach(emp => {
        if (!nextWeeklySchedule.some(e => e.name === emp.name)) {
            nextWeeklySchedule.push({ name: emp.name, schedule: Array.from({ length: 7 }, () => ({ shift: 'Off', time: '-' })) });
        }
    });
    saveNextWeeklySchedule();
}

// Custom shifts storage
let customShifts = JSON.parse(localStorage.getItem('customShifts')) || [];

// Modal handling
let currentEditEmployee = null;
let currentEditDay = null;
let currentEditWeek = 'current'; // 'current' or 'next'

// Populate current week schedule table with click handlers
function populateScheduleTable() {
    const tableBody = document.getElementById('scheduleTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    weeklySchedule.forEach((employee, empIndex) => {
        const row = document.createElement('tr');
        const cells = [
            `<td>${employee.name}</td>`
        ];

        employee.schedule.forEach((day, dayIndex) => {
            let shiftClass = '';
            switch(day.shift) {
                case 'Morning': shiftClass = 'shift-morning'; break;
                case 'Afternoon': shiftClass = 'shift-afternoon'; break;
                case 'Night': shiftClass = 'shift-night'; break;
                case 'Off': shiftClass = 'day-off'; break;
            }
            cells.push(`
                <td class="${shiftClass}" onclick="openEditModalForCell('${employee.name}', ${dayIndex}, 'current')" title="Click to edit">
                    <button class="edit-shift" onclick="event.stopPropagation(); openEditModalForCell('${employee.name}', ${dayIndex}, 'current')"><i class="fas fa-edit"></i></button>
                    ${day.shift}<br><small>${day.time}</small>
                </td>
            `);
        });

        row.innerHTML = cells.join('');
        tableBody.appendChild(row);
    });
}

// Populate next-week schedule table with click handlers
function populateNextScheduleTable() {
    ensureNextWeeklySchedule();
    const tableBody = document.getElementById('nextScheduleTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    nextWeeklySchedule.forEach(employee => {
        const row = document.createElement('tr');
        const cells = [
            `<td>${employee.name}</td>`
        ];

        employee.schedule.forEach((day, dayIndex) => {
            let shiftClass = '';
            switch(day.shift) {
                case 'Morning': shiftClass = 'shift-morning'; break;
                case 'Afternoon': shiftClass = 'shift-afternoon'; break;
                case 'Night': shiftClass = 'shift-night'; break;
                case 'Off': shiftClass = 'day-off'; break;
            }
            cells.push(`
                <td class="${shiftClass}" onclick="openEditModalForCell('${employee.name}', ${dayIndex}, 'next')" title="Click to edit">
                    <button class="edit-shift" onclick="event.stopPropagation(); openEditModalForCell('${employee.name}', ${dayIndex}, 'next')"><i class="fas fa-edit"></i></button>
                    ${day.shift}<br><small>${day.time}</small>
                </td>
            `);
        });

        row.innerHTML = cells.join('');
        tableBody.appendChild(row);
    });
}

// Open edit modal when clicking on a cell
function openEditModalForCell(employeeName, day, week) {
    currentEditEmployee = employeeName;
    currentEditDay = day;
    currentEditWeek = week;
    
    const modal = document.getElementById('scheduleModal');
    const employeeSelect = document.getElementById('employeeName');
    const daySelect = document.getElementById('daySelect');
    const shiftSelect = document.getElementById('shiftSelect');
    const shiftTypeSelect = document.getElementById('shiftTypeSelect');
    const modalTitle = document.getElementById('editModalTitle');
    
    // Update modal title
    modalTitle.textContent = week === 'current' ? 'Edit Current Week Schedule' : 'Edit Next Week Schedule';
    
    // Store which week we're editing
    document.getElementById('editingWeek').value = week;

    // Reset form
    document.getElementById('customShiftName').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('shiftColor').value = '#222';
    shiftTypeSelect.value = 'predefined';
    toggleCustomShift();

    // Populate employee dropdown from appropriate schedule
    const scheduleToUse = week === 'current' ? weeklySchedule : nextWeeklySchedule;
    employeeSelect.innerHTML = scheduleToUse
        .map(emp => `<option value="${emp.name}" ${emp.name === employeeName ? 'selected' : ''}>${emp.name}</option>`)
        .join('');

    // Set day
    daySelect.value = day;

    // Set current shift
    const employee = scheduleToUse.find(emp => emp.name === employeeName);
    if (employee) {
        const currentShift = employee.schedule[day].shift;
        shiftSelect.value = currentShift;
    }

    modal.style.display = 'block';
}

function toggleCustomShift() {
    const shiftType = document.getElementById('shiftTypeSelect').value;
    const predefinedGroup = document.getElementById('predefinedShiftGroup');
    const customGroup = document.getElementById('customShiftGroup');
    const savedShiftsGroup = document.getElementById('savedShiftsGroup');

    if (shiftType === 'custom') {
        predefinedGroup.style.display = 'none';
        customGroup.style.display = 'block';
        savedShiftsGroup.style.display = 'block';
        populateSavedShifts();
    } else {
        predefinedGroup.style.display = 'block';
        customGroup.style.display = 'none';
        savedShiftsGroup.style.display = 'none';
    }
}

function populateSavedShifts() {
    const savedShiftsSelect = document.getElementById('savedShifts');
    savedShiftsSelect.innerHTML = '<option value="">Select a saved shift</option>' +
        customShifts.map(shift => 
            `<option value="${shift.name}" 
                data-start="${shift.startTime}" 
                data-end="${shift.endTime}"
                data-color="${shift.color}">
                ${shift.name} (${shift.startTime} - ${shift.endTime})
            </option>`
        ).join('');
}

function deleteSelectedShift() {
    const savedShiftsSelect = document.getElementById('savedShifts');
    const selectedShift = savedShiftsSelect.value;
    
    if (selectedShift) {
        customShifts = customShifts.filter(shift => shift.name !== selectedShift);
        localStorage.setItem('customShifts', JSON.stringify(customShifts));
        populateSavedShifts();
    }
}

function loadSelectedShift() {
    const savedShiftsSelect = document.getElementById('savedShifts');
    const selectedOption = savedShiftsSelect.selectedOptions[0];
    
    if (selectedOption && selectedOption.value) {
        document.getElementById('customShiftName').value = selectedOption.value;
        document.getElementById('startTime').value = selectedOption.dataset.start;
        document.getElementById('endTime').value = selectedOption.dataset.end;
        document.getElementById('shiftColor').value = selectedOption.dataset.color;
    }
}

function closeModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

function updateSchedule(event) {
    event.preventDefault();

    const employeeName = document.getElementById('employeeName').value;
    const day = parseInt(document.getElementById('daySelect').value);
    const shiftType = document.getElementById('shiftTypeSelect').value;
    const editingWeek = document.getElementById('editingWeek').value;

    let shift, time;

    if (shiftType === 'predefined') {
        shift = document.getElementById('shiftSelect').value;
        switch(shift) {
            case 'Morning': time = '6:00 AM - 2:00 PM'; break;
            case 'Afternoon': time = '2:00 PM - 10:00 PM'; break;
            case 'Night': time = '10:00 PM - 6:00 AM'; break;
            case 'Off': time = '-'; break;
            default: time = '-'; break;
        }
    } else {
        const shiftName = document.getElementById('customShiftName').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const shiftColor = document.getElementById('shiftColor').value;

        if (!shiftName || !startTime || !endTime) {
            alert('Please fill in all custom shift fields');
            return;
        }

        const formatTime = timeStr => {
            const [hours, minutes] = timeStr.split(':');
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes} ${period}`;
        };

        shift = shiftName;
        time = `${formatTime(startTime)} - ${formatTime(endTime)}`;

        if (!customShifts.some(s => s.name === shiftName)) {
            customShifts.push({ name: shiftName, startTime, endTime, color: shiftColor });
            localStorage.setItem('customShifts', JSON.stringify(customShifts));
        }
    }

    // Update the appropriate schedule
    const scheduleToUpdate = editingWeek === 'current' ? weeklySchedule : nextWeeklySchedule;
    const employee = scheduleToUpdate.find(emp => emp.name === employeeName);
    
    if (!employee) {
        alert('Employee not found');
        return;
    }

    employee.schedule[day] = { shift, time };

    // Save to localStorage
    if (editingWeek === 'current') {
        saveWeeklySchedule();
        populateScheduleTable();
    } else {
        saveNextWeeklySchedule();
        populateNextScheduleTable();
    }
    
    closeModal();
}

// Compute and display the current week range header
function getWeekRangeString(date, startWeekDay = 6) {
    const day = new Date(date);
    const diff = (day.getDay() - startWeekDay + 7) % 7;
    const start = new Date(day);
    start.setDate(day.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    const year = end.getFullYear();

    if (start.getMonth() === end.getMonth()) {
        return `Week of ${startMonth} ${start.getDate()}-${end.getDate()}, ${year}`;
    } else {
        return `Week of ${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
    }
}

function updateWeekRangeOnPage() {
    const el = document.getElementById('weekRange');
    if (!el) return;
    el.textContent = getWeekRangeString(new Date());
}

function updateNextWeekRangeOnPage() {
    const el = document.getElementById('nextWeekRange');
    if (!el) return;
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    el.textContent = getWeekRangeString(nextWeekDate);
}

function openAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (!modal) return;
    modal.style.display = 'block';
    const input = document.getElementById('newEmployeeName');
    if (input) input.focus();
}

function openRemoveEmployeeModal() {
    const select = document.getElementById('removeEmployeeSelect');
    const modal = document.getElementById('removeEmployeeModal');
    if (!modal || !select) return;
    select.innerHTML = weeklySchedule.map(e => `<option value="${e.name}">${e.name}</option>`).join('');
    modal.style.display = 'block';
}

// Update dashboard stats
function updateDashboardStats() {
    // Update total employees (only if the element exists)
    const totalEl = document.getElementById('totalEmployees');
    if (totalEl) totalEl.textContent = weeklySchedule.length;

    // Get today's attendance from localStorage
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.date === today);

    const presentEl = document.getElementById('presentToday');
    if (presentEl) presentEl.textContent = todayRecords.filter(r => r.status === 'Present').length;

    const lateEl = document.getElementById('lateToday');
    if (lateEl) lateEl.textContent = todayRecords.filter(r => r.status === 'Late').length;

    const absentEl = document.getElementById('absentToday');
    if (absentEl) absentEl.textContent = todayRecords.filter(r => r.status === 'Absent').length;
}

// Initialize dashboard
function initializeDashboard() {
    populateScheduleTable();
    updateWeekRangeOnPage();
    ensureNextWeeklySchedule();
    populateNextScheduleTable();
    updateNextWeekRangeOnPage();
    updateDashboardStats();
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutConfirmModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const closeLogoutBtns = document.querySelectorAll('.close-logout');
    
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'block';
        });

        closeLogoutBtns.forEach(b => b.onclick = () => { logoutModal.style.display = 'none'; });

        if (confirmLogoutBtn) {
            // Use onclick assignment instead of addEventListener so this handler can be
            // replaced when the modal is reused as an in-page confirmation dialog.
            confirmLogoutBtn.onclick = () => { window.location.href = '../index.html'; };
        }
    }

    // Modal event listeners
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.onsubmit = updateSchedule;
    }

    // Add Employee modal handlers
    const addEmpModal = document.getElementById('addEmployeeModal');
    const addEmpForm = document.getElementById('addEmployeeForm');
    const closeAddBtns = document.querySelectorAll('.close-add-employee');
    
    closeAddBtns.forEach(b => b.onclick = () => { addEmpModal.style.display = 'none'; });
    
    if (addEmpForm) {
        addEmpForm.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('newEmployeeName').value.trim();
            if (!name) return alert('Enter a name');
            if (weeklySchedule.some(s => s.name === name)) return alert('Employee exists');
            weeklySchedule.push({ name, schedule: Array.from({ length: 7 }, () => ({ shift: 'Off', time: '-' })) });
            saveWeeklySchedule();
            populateScheduleTable();
            populateNextScheduleTable();
            updateDashboardStats();
            addEmpModal.style.display = 'none';
            addEmpForm.reset();
        };
    }

    // Remove Employee modal handlers
    const removeEmpModal = document.getElementById('removeEmployeeModal');
    const removeEmpForm = document.getElementById('removeEmployeeForm');
    const closeRemoveBtns = document.querySelectorAll('.close-remove-employee');
    
    closeRemoveBtns.forEach(b => b.onclick = () => { removeEmpModal.style.display = 'none'; });
    
    if (removeEmpForm) {
        removeEmpForm.onsubmit = function(e) {
            e.preventDefault();
            const select = document.getElementById('removeEmployeeSelect');
            const notification = document.getElementById('removeNotification');
            const name = select.value;

            notification.style.display = 'none';
            notification.className = 'notification';

            if (!name) {
                notification.textContent = 'Please select an employee to remove';
                notification.className = 'notification error';
                notification.style.display = 'block';
                return;
            }

            const idx = weeklySchedule.findIndex(e => e.name === name);
            if (idx > -1) {
                weeklySchedule.splice(idx, 1);
                saveWeeklySchedule();
                populateScheduleTable();
                populateNextScheduleTable();
                updateDashboardStats();
                notification.textContent = `${name} has been removed successfully`;
                notification.className = 'notification success';
                notification.style.display = 'block';
                setTimeout(() => {
                    removeEmpModal.style.display = 'none';
                    notification.style.display = 'none';
                }, 1500);
            } else {
                notification.textContent = 'Could not find employee to remove';
                notification.className = 'notification error';
                notification.style.display = 'block';
            }
        };
    }

    // Copy/Clear next-week buttons
    const copyBtn = document.getElementById('copyCurrentToNext');
    const clearBtn = document.getElementById('clearNextWeek');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            nextWeeklySchedule = weeklySchedule.map(emp => ({
                name: emp.name,
                schedule: emp.schedule.map(d => ({ shift: d.shift, time: d.time }))
            }));
            saveNextWeeklySchedule();
            populateNextScheduleTable();
            showGlobalNotification('Current week schedule copied to next week!', 'success', 2500);
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            showInPageConfirm(
                'Confirm Clear',
                "Are you sure you want to clear next week's schedule?",
                'Yes, Clear',
                () => {
                    ensureNextWeeklySchedule();
                    nextWeeklySchedule.forEach(emp => {
                        emp.schedule = Array.from({ length: 7 }, () => ({ shift: 'Off', time: '-' }));
                    });
                    saveNextWeeklySchedule();
                    populateNextScheduleTable();
                    showGlobalNotification('Next week schedule cleared!', 'success', 2500);
                }
            );
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Check if we're on the dashboard page and initialize
if (document.querySelector('.dashboard')) {
    initializeDashboard();
}

// Show a global in-page notification
function showGlobalNotification(message, type = 'success', duration = 2000) {
    const notif = document.getElementById('globalNotification');
    if (!notif) return;
    notif.textContent = message;
    notif.className = `notification ${type}`;
    notif.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => { notif.style.display = 'none'; }, duration);
    }
}

// Reusable in-page confirm modal using the existing logoutConfirmModal structure
function showInPageConfirm(title, message, confirmText, onConfirm) {
    const modal = document.getElementById('logoutConfirmModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h2');
    const msg = modal.querySelector('p');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const closeBtns = modal.querySelectorAll('.close-logout');

    // Backup original title/message
    const origTitle = header ? header.textContent : '';
    const origMsg = msg ? msg.textContent : '';
    const origConfirmText = confirmBtn ? confirmBtn.textContent : '';

    if (header) header.textContent = title;
    if (msg) msg.textContent = message;
    if (confirmBtn) confirmBtn.textContent = confirmText || origConfirmText;

    // Clear previous handlers and attach new one
    const newHandler = () => {
        try { if (typeof onConfirm === 'function') onConfirm(); } finally { modal.style.display = 'none'; }
    };
    // Remove existing onclick listeners by replacing the element handler
    if (confirmBtn) {
        confirmBtn.onclick = newHandler;
    }

    // Close handlers
    closeBtns.forEach(b => b.onclick = () => { modal.style.display = 'none'; });

    // Show modal
    modal.style.display = 'block';

    // When modal closes, restore original title/message/text after a short delay
    const restore = () => {
        if (header) header.textContent = origTitle;
        if (msg) msg.textContent = origMsg;
        if (confirmBtn) confirmBtn.textContent = origConfirmText;
        // restore default logout handler
        if (confirmBtn) confirmBtn.onclick = () => { window.location.href = '../index.html'; };
    };

    // Hook into modal close by watching clicks on modal background or close buttons
    const onWindowClick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            restore();
            window.removeEventListener('click', onWindowClick);
        }
    };
    window.addEventListener('click', onWindowClick);

    // Also restore when modal hidden by close buttons (they call modal.style.display='none')
    closeBtns.forEach(b => b.addEventListener('click', () => {
        setTimeout(restore, 0);
        window.removeEventListener('click', onWindowClick);
    }));
}