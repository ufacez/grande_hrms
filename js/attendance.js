// js/attendance.js - Dynamic Attendance Management

const API_URL = '../api/attendance.php';
let attendanceData = [];
let currentFilter = {
    status: '',
    date: new Date().toISOString().split('T')[0],
    viewBy: 'day'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    loadAttendance();
    setupEventListeners();
});

function initializeFilters() {
    const dateFilter = document.getElementById('dateFilterSingle');
    const monthFilter = document.getElementById('monthFilter');
    
    if (dateFilter) {
        dateFilter.value = currentFilter.date;
    }
    
    if (monthFilter) {
        const today = new Date();
        monthFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
}

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
    });
    
    // View type toggle
    document.getElementById('viewBySelect')?.addEventListener('change', (e) => {
        currentFilter.viewBy = e.target.value;
        document.getElementById('dateFilterDay').style.display = e.target.value === 'day' ? 'block' : 'none';
        document.getElementById('dateFilterMonth').style.display = e.target.value === 'month' ? 'block' : 'none';
        loadAttendance();
    });
    
    // Date filters
    document.getElementById('dateFilterSingle')?.addEventListener('change', (e) => {
        currentFilter.date = e.target.value;
        loadAttendance();
    });
    
    document.getElementById('monthFilter')?.addEventListener('change', (e) => {
        const [year, month] = e.target.value.split('-');
        currentFilter.date = `${year}-${month}-01`;
        loadAttendance();
    });
    
    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', (e) => {
        currentFilter.status = e.target.value;
        loadAttendance();
    });
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', renderAttendance);
    
    // Edit modal
    document.getElementById('closeEditModal')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('editAttendanceForm')?.addEventListener('submit', handleEditSubmit);
    
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

async function loadAttendance() {
    try {
        const params = new URLSearchParams({
            action: 'list',
            date: currentFilter.date,
            status: currentFilter.status
        });
        
        const response = await fetch(`${API_URL}?${params}`);
        const result = await response.json();
        
        if (result.success) {
            attendanceData = result.data;
            updateStats();
            renderAttendance();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        showNotification('Failed to load attendance records', 'error');
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}?action=stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('presentCount').textContent = stats.present || 0;
            document.getElementById('absentCount').textContent = stats.absent || 0;
            document.getElementById('lateCount').textContent = stats.late || 0;
            document.getElementById('leaveCount').textContent = stats.on_leave || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStats() {
    const stats = {
        present: 0,
        absent: 0,
        late: 0,
        leave: 0
    };
    
    attendanceData.forEach(record => {
        switch(record.status) {
            case 'Present': stats.present++; break;
            case 'Absent': stats.absent++; break;
            case 'Late': stats.late++; break;
            case 'On Leave': stats.leave++; break;
        }
    });
    
    document.getElementById('presentCount').textContent = stats.present;
    document.getElementById('absentCount').textContent = stats.absent;
    document.getElementById('lateCount').textContent = stats.late;
    document.getElementById('leaveCount').textContent = stats.leave;
}

function renderAttendance() {
    const tbody = document.getElementById('attendanceTableBody');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    const filtered = attendanceData.filter(record => {
        const matchSearch = !searchTerm || 
            record.employee_id.toLowerCase().includes(searchTerm) ||
            record.employee_name.toLowerCase().includes(searchTerm);
        return matchSearch;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No attendance records found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(record => `
        <tr>
            <td>${record.employee_id}</td>
            <td>${record.employee_name}</td>
            <td>${formatDate(record.attendance_date)}</td>
            <td>${record.time_in || '-'}</td>
            <td>${record.time_out || '-'}</td>
            <td><span class="status-badge ${getStatusClass(record.status)}">${record.status}</span></td>
            <td>${record.hours_worked || '0.00'} hrs</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" onclick="editAttendance(${record.attendance_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteAttendance(${record.attendance_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    const classes = {
        'Present': 'present',
        'Absent': 'absent',
        'Late': 'late',
        'On Leave': 'on-leave'
    };
    return classes[status] || '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function editAttendance(id) {
    const record = attendanceData.find(r => r.attendance_id == id);
    if (!record) return;
    
    document.getElementById('editAttendanceId').value = record.attendance_id;
    document.getElementById('editEmployeeName').value = record.employee_name;
    document.getElementById('editAttendanceDate').value = record.attendance_date;
    document.getElementById('editTimeIn').value = record.time_in || '';
    document.getElementById('editTimeOut').value = record.time_out || '';
    document.getElementById('editStatusSelect').value = record.status;
    document.getElementById('editRemarks').value = record.remarks || '';
    
    document.getElementById('editAttendanceModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editAttendanceModal').style.display = 'none';
    document.getElementById('editAttendanceForm').reset();
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const data = {
        id: document.getElementById('editAttendanceId').value,
        time_in: document.getElementById('editTimeIn').value,
        time_out: document.getElementById('editTimeOut').value,
        status: document.getElementById('editStatusSelect').value,
        remarks: document.getElementById('editRemarks').value
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Attendance updated successfully', 'success');
            closeEditModal();
            loadAttendance();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error updating attendance:', error);
        showNotification('Failed to update attendance', 'error');
    }
}

async function deleteAttendance(id) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=delete&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Attendance deleted successfully', 'success');
            loadAttendance();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showNotification('Failed to delete attendance', 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('editNotification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Close modals on outside click
window.onclick = (event) => {
    const editModal = document.getElementById('editAttendanceModal');
    if (event.target === editModal) {
        closeEditModal();
    }
};