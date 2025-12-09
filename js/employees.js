// js/employees.js - Dynamic Employee Management

const API_URL = '../api/employees.php';
let employees = [];
let editingEmployeeId = null;
let viewingBlocklisted = false;

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

function openAddModal() {
    editingEmployeeId = null;
    document.getElementById('employeeModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Add New Employee';
    document.getElementById('employeeForm').reset();
}

function openEditModal(id) {
    const employee = employees.find(e => e.employee_id === id);
    if (!employee) return;
    
    editingEmployeeId = id;
    document.getElementById('employeeModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Edit Employee';
    
    // Populate form
    document.getElementById('employeeId').value = employee.employee_id;
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

async function saveEmployee(e) {
    e.preventDefault();
    
    const formData = {
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
        monthly_salary: document.getElementById('monthlySalary').value,
        status: document.getElementById('status').value,
        sss_number: document.getElementById('sssNumber').value,
        tin_number: document.getElementById('tinNumber').value,
        philhealth_number: document.getElementById('philhealthNumber').value
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
            document.getElementById('employeeModal').style.display = 'none';
            loadEmployees();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        showNotification('Failed to save employee', 'error');
    }
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=delete&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadEmployees();
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
            loadEmployees();
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
    // Create notification element
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