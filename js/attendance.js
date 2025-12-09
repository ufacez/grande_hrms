// Attendance Management JavaScript
let attendanceRecords = [];
let employees = [];

// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        // Restore sidebar state
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
    }
});

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
        confirmLogoutBtn.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
}

// Initialize event listeners for filters
document.addEventListener('DOMContentLoaded', () => {
    const departmentFilter = document.getElementById('departmentFilter');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilterSingle = document.getElementById('dateFilterSingle');
    const monthFilter = document.getElementById('monthFilter');
    const dateFilterStart = document.getElementById('dateFilterStart');
    const dateFilterEnd = document.getElementById('dateFilterEnd');
    const viewBySelect = document.getElementById('viewBySelect');
    const dateFilterDay = document.getElementById('dateFilterDay');
    const dateFilterMonth = document.getElementById('dateFilterMonth');
    const dateFilterRange = document.getElementById('dateFilterRange');
    const searchInput = document.getElementById('searchInput');

    // Set default date to today
    if (dateFilterSingle) {
        const today = new Date();
        dateFilterSingle.value = today.toISOString().split('T')[0];
    }

    // Set default month to current month
    if (monthFilter) {
        const today = new Date();
        monthFilter.value = today.toISOString().slice(0,7);
    }

    // View by selector logic
    if (viewBySelect) {
        viewBySelect.addEventListener('change', function() {
            console.log('View changed to:', this.value);
            if (this.value === 'day') {
                dateFilterDay.style.display = '';
                dateFilterMonth.style.display = 'none';
                dateFilterRange.style.display = 'none';
            } else if (this.value === 'month') {
                dateFilterDay.style.display = 'none';
                dateFilterMonth.style.display = '';
                dateFilterRange.style.display = 'none';
            } else if (this.value === 'range') {
                dateFilterDay.style.display = 'none';
                dateFilterMonth.style.display = 'none';
                dateFilterRange.style.display = '';
            }
            setTimeout(() => applyFilters(), 0); // Ensure UI updates before filtering
        });
    }

    if (dateFilterSingle) {
        dateFilterSingle.addEventListener('change', () => {
            console.log('Date filter changed:', dateFilterSingle.value);
            applyFilters();
        });
    }
    if (monthFilter) {
        monthFilter.addEventListener('change', () => {
            console.log('Month filter changed:', monthFilter.value);
            applyFilters();
        });
    }
    if (dateFilterStart) dateFilterStart.addEventListener('change', applyFilters);
    if (dateFilterEnd) dateFilterEnd.addEventListener('change', applyFilters);
    if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (searchInput) searchInput.addEventListener('input', (e) => applyFilters(e.target.value));

    // Initial load with sample historical data
    loadData();
    generateSampleHistoricalData(); // Add sample data for testing
    
    // Ensure default date filter is set and applied
    const today = new Date();
    if (dateFilterSingle) {
        dateFilterSingle.value = today.toISOString().split('T')[0];
    }
    if (monthFilter) {
        monthFilter.value = today.toISOString().slice(0,7);
    }
    
    // Initial filter application
    setTimeout(() => applyFilters(), 100); // Give time for data to load
});

// Load data from localStorage
function loadData() {
    // Load employees
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
        employees = JSON.parse(storedEmployees);
    } else {
        employees = [
            { id: 'EMP001', name: 'Bern Saez', department: 'Service' },
            { id: 'EMP002', name: 'Earl Espiritu', department: 'Kitchen' },
            { id: 'EMP003', name: 'Lee Bornoz', department: 'Sales' },
            { id: 'EMP004', name: 'Dev Jimenez', department: 'Management' },
            { id: 'EMP005', name: 'Karl Gonzales', department: 'Service' }
        ];
    }

    // Load attendance records
    const storedAttendance = localStorage.getItem('attendanceRecords');
    if (storedAttendance) {
        attendanceRecords = JSON.parse(storedAttendance);
    } else {
        // Sample data for today
        const today = new Date().toISOString().split('T')[0];
        attendanceRecords = [
            {
                id: generateId(),
                employeeId: 'EMP001',
                employeeName: 'Bern Saez',
                date: today,
                timeIn: '08:00',
                timeOut: '17:00',
                status: 'Present',
                remarks: ''
            },
            {
                id: generateId(),
                employeeId: 'EMP002',
                employeeName: 'Earl Espiritu',
                date: today,
                timeIn: '08:15',
                timeOut: '17:10',
                status: 'Late',
                remarks: 'Traffic'
            }
        ];
        saveAttendance();
    }

    renderAttendanceTable();
    updateStats();
}

// Generate unique ID
function generateId() {
    return 'ATT' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// Generate sample historical data for testing
function generateSampleHistoricalData() {
    const past30Days = new Date();
    past30Days.setDate(past30Days.getDate() - 30);
    
    // Generate records for each employee for the past 30 days
    employees.forEach(emp => {
        for (let date = new Date(past30Days); date <= new Date(); date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            
            // Skip weekends
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            // Skip if record already exists
            if (attendanceRecords.some(r => r.employeeId === emp.id && r.date === dateStr)) {
                continue;
            }

            // Randomly generate status and times
            const rand = Math.random();
            let status, timeIn, timeOut;
            
            if (rand < 0.7) { // 70% Present
                const minutesLate = Math.floor(Math.random() * 30);
                timeIn = `08:${minutesLate.toString().padStart(2, '0')}`;
                timeOut = `17:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}`;
                status = minutesLate > 15 ? 'Late' : 'Present';
            } else if (rand < 0.85) { // 15% Absent
                timeIn = '';
                timeOut = '';
                status = 'Absent';
            } else { // 15% On Leave
                timeIn = '';
                timeOut = '';
                status = 'On Leave';
            }

            attendanceRecords.push({
                id: generateId(),
                employeeId: emp.id,
                employeeName: emp.name,
                date: dateStr,
                timeIn: timeIn,
                timeOut: timeOut,
                status: status,
                remarks: status === 'On Leave' ? 'Scheduled leave' : 
                        status === 'Late' ? 'Traffic' : ''
            });
        }
    });
    
    saveAttendance();
}

// Save attendance to localStorage
function saveAttendance() {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
}

// Quick action functions
function markAttendance(type) {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const currentDate = now.toISOString().split('T')[0];
    
    // Show employee selection modal
    const employeeId = prompt('Enter Employee ID:'); // In real app, replace with proper modal
    if (!employeeId) return;
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
        alert('Employee not found!');
        return;
    }
    
    // Find or create today's record
    let record = attendanceRecords.find(r => 
        r.employeeId === employeeId && r.date === currentDate
    );
    
    if (!record) {
        record = {
            id: generateId(),
            employeeId,
            employeeName: employee.name,
            date: currentDate,
            timeIn: '',
            timeOut: '',
            status: 'Present',
            remarks: ''
        };
        attendanceRecords.push(record);
    }
    
    // Update time
    if (type === 'timeIn' && !record.timeIn) {
        record.timeIn = currentTime;
        if (parseInt(currentTime) > 8 * 60) { // If after 8:00
            record.status = 'Late';
        }
    } else if (type === 'timeOut' && !record.timeOut) {
        record.timeOut = currentTime;
    }
    
    saveAttendance();
    renderAttendanceTable();
    updateStats();
}

function openBatchUpdateModal() {
    // In real app, implement proper modal
    alert('Batch update feature - Coming soon!');
}

function exportAttendance() {
    const data = attendanceRecords.map(record => ({
        'Employee ID': record.employeeId,
        'Name': record.employeeName,
        'Date': record.date,
        'Time In': record.timeIn,
        'Time Out': record.timeOut,
        'Status': record.status,
        'Hours Worked': calculateHoursWorked(record.timeIn, record.timeOut)
    }));
    
    // Create CSV content
    const csvContent = 'data:text/csv;charset=utf-8,' 
        + Object.keys(data[0]).join(',') + '\\n'
        + data.map(row => Object.values(row).join(',')).join('\\n');
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



// Calculate hours worked
function calculateHoursWorked(timeIn, timeOut) {
    if (!timeIn || !timeOut) return '-';
    
    const [inHour, inMin] = timeIn.split(':').map(Number);
    const [outHour, outMin] = timeOut.split(':').map(Number);
    
    let hours = outHour - inHour;
    let minutes = outMin - inMin;
    
    if (minutes < 0) {
        hours--;
        minutes += 60;
    }
    
    return `${hours}h ${minutes}m`;
}

// Render attendance table
function renderAttendanceTable(filter = '', dateFilter = '', preFiltered = null) {
    const tbody = document.getElementById('attendanceTableBody');
    
    // Use preFiltered array (from applyFilters) when provided, otherwise start from full records
    let filtered = Array.isArray(preFiltered) ? preFiltered.slice() : attendanceRecords.slice();
    
    // Apply search filter
    if (filter) {
        filtered = filtered.filter(record =>
            record.employeeName.toLowerCase().includes(filter.toLowerCase()) ||
            record.employeeId.toLowerCase().includes(filter.toLowerCase())
        );
    }
    
    // Apply date filter (string) when provided
    if (dateFilter && typeof dateFilter === 'string') {
        filtered = filtered.filter(record => record.date === dateFilter);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No attendance records found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    filtered.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${record.employeeId}</td>
            <td>${record.employeeName}</td>
            <td>${formatDate(record.date)}</td>
            <td>${record.timeIn || '-'}</td>
            <td>${record.timeOut || '-'}</td>
            <td>
                <span class="status-badge ${record.status.toLowerCase().replace(' ', '-')}">
                    ${record.status}
                </span>
            </td>
            <td>${calculateHoursWorked(record.timeIn, record.timeOut)}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" title="View History">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="icon-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Add event listeners
        const buttons = row.querySelectorAll('.icon-btn');
        buttons[0].addEventListener('click', () => viewEmployeeHistory(record.employeeId, record.employeeName));
        buttons[1].addEventListener('click', () => editAttendance(record.id));
        buttons[2].addEventListener('click', () => deleteAttendance(record.id));
        
        tbody.appendChild(row);
    });
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Update statistics
function applyFilters(search = '') {
    console.log('Applying filters...');
    const departmentFilter = document.getElementById('departmentFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const viewBy = document.getElementById('viewBySelect')?.value || 'day';
    const selectedDate = document.getElementById('dateFilterSingle')?.value || '';
    const selectedMonth = document.getElementById('monthFilter')?.value || '';
    const startDate = document.getElementById('dateFilterStart')?.value || '';
    const endDate = document.getElementById('dateFilterEnd')?.value || '';
    
    console.log('View By:', viewBy);
    console.log('Selected Date:', selectedDate);
    console.log('Selected Month:', selectedMonth);

    let filtered = [...attendanceRecords];

    // Search filter (name or id)
    if (search) {
        filtered = filtered.filter(record =>
            record.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            record.employeeId.toLowerCase().includes(search.toLowerCase())
        );
    }

    if (departmentFilter) {
        filtered = filtered.filter(record => {
            const employee = employees.find(emp => emp.id === record.employeeId);
            return employee && employee.department === departmentFilter;
        });
    }

    if (statusFilter) {
        filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Date filter logic
    if (viewBy === 'day' && selectedDate) {
        console.log('Filtering by day:', selectedDate);
        filtered = filtered.filter(record => {
            const matches = record.date === selectedDate;
            console.log('Record date:', record.date, 'matches:', matches);
            return matches;
        });
    } else if (viewBy === 'month' && selectedMonth) {
        console.log('Filtering by month:', selectedMonth);
        const [year, month] = selectedMonth.split('-');
        filtered = filtered.filter(record => {
            const recordDate = new Date(record.date);
            const matches = recordDate.getFullYear() === parseInt(year) && 
                          recordDate.getMonth() === parseInt(month) - 1;
            console.log('Record date:', record.date, 'matches:', matches);
            return matches;
        });
    } else if (viewBy === 'range' && startDate && endDate) {
        filtered = filtered.filter(record => record.date >= startDate && record.date <= endDate);
    }
    console.log('Filtered records:', filtered.length);

    // render and update stats based on filtered results
    renderAttendanceTable('', '', filtered);
    updateStats(filtered);
}

// Update statistics for the selected date range or filtered records
function updateStats(records = null) {
    let targetRecords;
    if (Array.isArray(records)) {
        targetRecords = records;
    } else {
        // Get selected date range
        const startDate = document.getElementById('dateFilterStart')?.value;
        const endDate = document.getElementById('dateFilterEnd')?.value;
        
        if (startDate && endDate) {
            targetRecords = attendanceRecords.filter(r => {
                return r.date >= startDate && r.date <= endDate;
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            targetRecords = attendanceRecords.filter(r => r.date === today);
        }
    }

    const presentCount = targetRecords.filter(r => r.status === 'Present').length;
    const absentCount = targetRecords.filter(r => r.status === 'Absent').length;
    const lateCount = targetRecords.filter(r => r.status === 'Late').length;
    const leaveCount = targetRecords.filter(r => r.status === 'On Leave').length;

    const presentEl = document.getElementById('presentCount');
    const absentEl = document.getElementById('absentCount');
    const lateEl = document.getElementById('lateCount');
    const leaveEl = document.getElementById('leaveCount');

    if (presentEl) presentEl.textContent = presentCount;
    if (absentEl) absentEl.textContent = absentCount;
    if (lateEl) lateEl.textContent = lateCount;
    if (leaveEl) leaveEl.textContent = leaveCount;
}

// View employee attendance history
function viewEmployeeHistory(employeeId, employeeName) {
    const employeeRecords = attendanceRecords.filter(r => r.employeeId === employeeId);

    // Sort by date (newest first)
    employeeRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update modal title
    const titleEl = document.getElementById('historyEmployeeName');
    if (titleEl) titleEl.textContent = employeeName;

    // Calculate statistics
    const totalDays = employeeRecords.length;
    const presentCount = employeeRecords.filter(r => r.status === 'Present').length;
    const lateCount = employeeRecords.filter(r => r.status === 'Late').length;
    const absentCount = employeeRecords.filter(r => r.status === 'Absent').length;
    const leaveCount = employeeRecords.filter(r => r.status === 'On Leave').length;

    if (document.getElementById('historyTotalDays')) document.getElementById('historyTotalDays').textContent = totalDays;
    if (document.getElementById('historyPresent')) document.getElementById('historyPresent').textContent = presentCount;
    if (document.getElementById('historyLate')) document.getElementById('historyLate').textContent = lateCount;
    if (document.getElementById('historyAbsent')) document.getElementById('historyAbsent').textContent = absentCount;
    if (document.getElementById('historyLeave')) document.getElementById('historyLeave').textContent = leaveCount;

    // Populate history table
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (employeeRecords.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No attendance records found</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = employeeRecords.map(record => `
            <tr>
                <td>${formatDate(record.date)}</td>
                <td>${record.timeIn || '-'}</td>
                <td>${record.timeOut || '-'}</td>
                <td>
                    <span class="status-badge ${record.status.toLowerCase().replace(' ', '-')}">
                        ${record.status}
                    </span>
                </td>
                <td>${calculateHoursWorked(record.timeIn, record.timeOut)}</td>
                <td>${record.remarks || '-'}</td>
            </tr>
        `).join('');
    }

    const historyModal = document.getElementById('viewHistoryModal');
    if (historyModal) historyModal.style.display = 'block';
}

// Close view history modal
function closeViewHistoryModal() {
    document.getElementById('viewHistoryModal').style.display = 'none';
}

// Edit attendance
function editAttendance(id) {
    const record = attendanceRecords.find(r => r.id === id);
    if (!record) return;
    
    document.getElementById('editAttendanceId').value = record.id;
    document.getElementById('editEmployeeName').value = `${record.employeeId} - ${record.employeeName}`;
    document.getElementById('editAttendanceDate').value = record.date;
    document.getElementById('editTimeIn').value = record.timeIn;
    document.getElementById('editTimeOut').value = record.timeOut || '';
    document.getElementById('editStatusSelect').value = record.status;
    document.getElementById('editRemarks').value = record.remarks || '';
    document.getElementById('editNotification').style.display = 'none';
    document.getElementById('editAttendanceModal').style.display = 'block';
}

// Close edit attendance modal
function closeEditAttendanceModal() {
    document.getElementById('editAttendanceModal').style.display = 'none';
}

// Delete attendance record
function deleteAttendance(id) {
    const record = attendanceRecords.find(r => r.id === id);
    if (!record) return;
    
    const modal = document.getElementById('confirmModal');
    const modalTitle = modal.querySelector('.modal-title');
    const modalMessage = modal.querySelector('.modal-message');
    const okBtn = modal.querySelector('.ok-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    modalTitle.textContent = 'Delete Attendance Record';
    modalMessage.textContent = `Are you sure you want to delete attendance record for ${record.employeeName} on ${formatDate(record.date)}?`;

    function handleDelete() {
        attendanceRecords = attendanceRecords.filter(r => r.id !== id);
        saveAttendance();
        renderAttendanceTable();
        updateStats();
        modal.style.display = 'none';
        okBtn.removeEventListener('click', handleDelete);
        cancelBtn.removeEventListener('click', handleCancel);
    }

    function handleCancel() {
        modal.style.display = 'none';
        okBtn.removeEventListener('click', handleDelete);
        cancelBtn.removeEventListener('click', handleCancel);
    }

    okBtn.addEventListener('click', handleDelete);
    cancelBtn.addEventListener('click', handleCancel);
    modal.style.display = 'block';
}

// Show notification
function showNotification(elementId, message, type) {
    const notif = document.getElementById(elementId);
    notif.textContent = message;
    notif.className = `notification ${type}`;
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// Edit attendance form submit
document.getElementById('editAttendanceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editAttendanceId').value;
    const index = attendanceRecords.findIndex(r => r.id === id);
    
    if (index === -1) {
        showNotification('editNotification', 'Record not found', 'error');
        return;
    }
    
    attendanceRecords[index] = {
        ...attendanceRecords[index],
        date: document.getElementById('editAttendanceDate').value,
        timeIn: document.getElementById('editTimeIn').value,
        timeOut: document.getElementById('editTimeOut').value,
        status: document.getElementById('editStatusSelect').value,
        remarks: document.getElementById('editRemarks').value
    };
    
    saveAttendance();
    renderAttendanceTable();
    updateStats();
    
    showNotification('editNotification', 'Attendance updated successfully', 'success');
    setTimeout(() => {
        closeEditAttendanceModal();
    }, 1500);
});

// Search and date input handlers (use applyFilters to keep filtering consistent)
const _searchInput = document.getElementById('searchInput');
if (_searchInput) {
    _searchInput.addEventListener('input', function(e) {
        applyFilters(e.target.value);
    });
}

const _dateFilterInput = document.getElementById('dateFilter');
if (_dateFilterInput) {
    _dateFilterInput.addEventListener('change', function() {
        applyFilters(_searchInput ? _searchInput.value : '');
    });
}

// Close modal buttons
document.getElementById('closeHistoryModal').addEventListener('click', closeViewHistoryModal);
document.getElementById('closeEditModal').addEventListener('click', closeEditAttendanceModal);
document.getElementById('cancelEditBtn').addEventListener('click', closeEditAttendanceModal);

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editAttendanceModal');
    const historyModal = document.getElementById('viewHistoryModal');
    
    if (event.target === editModal) {
        closeEditAttendanceModal();
    }
    if (event.target === historyModal) {
        closeViewHistoryModal();
    }
});

// Initialize on page load
loadData();