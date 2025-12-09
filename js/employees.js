// Employee Management with Analytics JavaScript
let employees = [];
let editingEmployeeId = null;
let blocklistAction = null;
let isShowingBlocklistedOnly = false;

// Remove any existing department distribution elements
document.addEventListener('DOMContentLoaded', () => {
    const departmentElements = document.querySelectorAll('[id*="department"], [class*="department"]');
    departmentElements.forEach(el => el.remove());
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

// Load employees from localStorage
function loadEmployees() {
    const stored = localStorage.getItem('employees');
    if (stored) {
        employees = JSON.parse(stored);
    } else {
        // Default employees
        employees = [
            {
                id: 'EMP001',
                name: 'Bern Saez',
                position: 'Barista',
                email: 'bern.saez@grande.com',
                phone: '09171234567',
                dateHired: '2023-01-15',
                birthdate: '1995-03-20',
                address: '123 Main St, Quezon City',
                emergencyContact: 'Maria Saez',
                emergencyPhone: '09181234567',
                salary: '18000',
                status: 'Active',
                sss: '12-3456789-0',
                tin: '123-456-789-000',
                philhealth: 'PH-123456789',
                blocklistReason: ''
            },
            {
                id: 'EMP002',
                name: 'Earl Espiritu',
                position: 'Barista',
                email: 'earl.espiritu@grande.com',
                phone: '09171234568',
                dateHired: '2023-02-01',
                birthdate: '1996-05-15',
                address: '456 Second St, Manila',
                emergencyContact: 'Anna Espiritu',
                emergencyPhone: '09181234568',
                salary: '17000',
                status: 'Active',
                sss: '12-3456789-1',
                tin: '123-456-789-001',
                philhealth: 'PH-123456790',
                blocklistReason: ''
            },
            {
                id: 'EMP003',
                name: 'Lee Bornoz',
                position: 'Barista',
                email: 'lee.bornoz@grande.com',
                phone: '09171234569',
                dateHired: '2023-03-10',
                birthdate: '1994-08-22',
                address: '789 Third St, Makati',
                emergencyContact: 'John Bornoz',
                emergencyPhone: '09181234569',
                salary: '20000',
                status: 'Active',
                sss: '12-3456789-2',
                tin: '123-456-789-002',
                philhealth: 'PH-123456791',
                blocklistReason: ''
            },
            {
                id: 'EMP004',
                name: 'Dev Jimenez',
                position: 'Barista',
                email: 'dev.jimenez@grande.com',
                phone: '09171234570',
                dateHired: '2022-11-01',
                birthdate: '1992-12-10',
                address: '321 Fourth St, Pasig',
                emergencyContact: 'Lisa Jimenez',
                emergencyPhone: '09181234570',
                salary: '25000',
                status: 'Active',
                sss: '12-3456789-3',
                tin: '123-456-789-003',
                philhealth: 'PH-123456792',
                blocklistReason: ''
            },
            {
                id: 'EMP005',
                name: 'Karl Gonzales',
                position: 'Barista',
                email: 'karl.gonzales@grande.com',
                phone: '09171234571',
                dateHired: '2023-04-15',
                birthdate: '1997-02-28',
                address: '654 Fifth St, Taguig',
                emergencyContact: 'Rosa Gonzales',
                emergencyPhone: '09181234571',
                salary: '18000',
                status: 'Active',
                sss: '12-3456789-4',
                tin: '123-456-789-004',
                philhealth: 'PH-123456793',
                blocklistReason: ''
            }
        ];
        saveEmployees();
    }
    updateAnalytics();
    renderEmployees();
}

// Save employees to localStorage
function saveEmployees() {
    localStorage.setItem('employees', JSON.stringify(employees));
}

// Update analytics dashboard
function updateAnalytics() {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Active').length;
    const onLeave = employees.filter(e => e.status === 'On Leave').length;
    const blocklisted = employees.filter(e => e.status === 'Blocklisted').length;

    document.getElementById('totalEmployees').textContent = total;
    document.getElementById('activeEmployees').textContent = active;
    document.getElementById('onLeaveEmployees').textContent = onLeave;
    document.getElementById('blocklistedEmployees').textContent = blocklisted;
}
// Render employee cards
function renderEmployees(searchTerm = '', statusFilter = 'all') {
    const grid = document.getElementById('employeeGrid');
    if (!grid) return;

    let filtered = employees;
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No employees found</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(emp => {
        const isBlocklisted = emp.status === 'Blocklisted';
        const statusClass = emp.status.toLowerCase().replace(' ', '-');
        
        return `
            <div class="employee-card ${isBlocklisted ? 'blocklisted' : ''} ${emp.status === 'Inactive' ? 'inactive' : ''}" onclick="viewEmployee('${emp.id}')">
                <div class="employee-header">
                    <div>
                        <div class="employee-name">${emp.name}</div>
                        <span style="font-size: 12px; color: #888;">${emp.id}</span>
                    </div>
                    <div class="employee-actions">
                        ${isBlocklisted ? `
                            <button class="icon-btn unblock" onclick="handleActionClick(event, () => openBlocklistModal('${emp.id}', 'unblock'))" title="Remove from Blocklist">
                                <i class="fas fa-check-circle"></i>
                            </button>
                        ` : `
                            <button class="icon-btn blocklist" onclick="handleActionClick(event, () => openBlocklistModal('${emp.id}', 'blocklist'))" title="Add to Blocklist">
                                <i class="fas fa-ban"></i>
                            </button>
                        `}
                        <button class="icon-btn" onclick="handleActionClick(event, () => editEmployee('${emp.id}'))" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete-action" onclick="handleActionClick(event, () => deleteEmployee('${emp.id}'))" title="Delete">
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
                        <div class="status-indicator ${statusClass}">
                            <i class="fas fa-circle"></i>
                            <span>${emp.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Open blocklist modal
function openBlocklistModal(id, action) {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    blocklistAction = { id, action };
    
    const modal = document.getElementById('blocklistModal');
    const title = document.getElementById('blocklistModalTitle');
    const message = document.getElementById('blocklistMessage');
    const reasonField = document.getElementById('blocklistReason');

    if (action === 'blocklist') {
        title.textContent = 'Blocklist Employee';
        message.textContent = `Are you sure you want to blocklist ${employee.name}?`;
        reasonField.value = '';
        reasonField.parentElement.style.display = 'block';
    } else {
        title.textContent = 'Remove from Blocklist';
        message.textContent = `Are you sure you want to remove ${employee.name} from the blocklist?`;
        reasonField.parentElement.style.display = 'none';
    }

    modal.style.display = 'block';
}

// Close blocklist modal
function closeBlocklistModal() {
    document.getElementById('blocklistModal').style.display = 'none';
    blocklistAction = null;
}

// Show only blocklisted employees
function showBlocklistedOnly() {
    const btn = document.querySelector('.blocklisted-view-btn');
    const filterSelect = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');
    
    isShowingBlocklistedOnly = !isShowingBlocklistedOnly;
    
    if (isShowingBlocklistedOnly) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-list"></i> Show All';
        filterSelect.value = 'Blocklisted';
        renderEmployees(searchInput.value, 'Blocklisted');
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-ban"></i> View Blocklisted';
        filterSelect.value = 'all';
        renderEmployees(searchInput.value, 'all');
    }
}

// Confirm blocklist action
function confirmBlocklistAction() {
    if (!blocklistAction) return;

    const { id, action } = blocklistAction;
    const employee = employees.find(e => e.id === id);
    
    if (!employee) return;

    if (action === 'blocklist') {
        const reason = document.getElementById('blocklistReason').value;
        employee.status = 'Blocklisted';
        employee.blocklistReason = reason;
        showNotification(`${employee.name} has been blocklisted`, 'success');
    } else {
        employee.status = 'Active';
        employee.blocklistReason = '';
        showNotification(`${employee.name} has been removed from blocklist`, 'success');
    }

    saveEmployees();
    updateAnalytics();
    renderEmployees();
    closeBlocklistModal();
}

// Open add modal
function openAddModal() {
    editingEmployeeId = null;
    document.getElementById('modalTitle').textContent = 'Add Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('notification').style.display = 'none';
    document.getElementById('employeeModal').style.display = 'block';
}

// Open edit modal
function editEmployee(id) {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    editingEmployeeId = id;
    document.getElementById('modalTitle').textContent = 'Edit Employee';
    
    // Fill form
    document.getElementById('employeeId').value = employee.id;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('employeePosition').value = employee.position;
    document.getElementById('employeeDepartment').value = employee.department;
    document.getElementById('employeeEmail').value = employee.email;
    document.getElementById('employeePhone').value = employee.phone;
    document.getElementById('employeeDateHired').value = employee.dateHired;
    document.getElementById('employeeBirthdate').value = employee.birthdate;
    document.getElementById('employeeAddress').value = employee.address;
    document.getElementById('employeeEmergencyContact').value = employee.emergencyContact;
    document.getElementById('employeeEmergencyPhone').value = employee.emergencyPhone;
    document.getElementById('employeeSalary').value = employee.salary;
    document.getElementById('employeeStatus').value = employee.status;
    document.getElementById('employeeSSS').value = employee.sss || '';
    document.getElementById('employeeTIN').value = employee.tin || '';
    document.getElementById('employeePhilhealth').value = employee.philhealth || '';
    
    document.getElementById('notification').style.display = 'none';
    document.getElementById('employeeModal').style.display = 'block';
}

// View employee details
function viewEmployee(id) {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    const isBlocklisted = employee.status === 'Blocklisted';
    const content = document.getElementById('employeeDetailsContent');
    
    content.innerHTML = `
        ${isBlocklisted ? `
            <div class="blocklist-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>This employee is blocklisted</strong>
                    ${employee.blocklistReason ? `<p style="margin: 5px 0 0 0;">Reason: ${employee.blocklistReason}</p>` : ''}
                </div>
            </div>
        ` : ''}
        
        <div class="detail-section">
            <h3>Personal Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Employee ID</span>
                    <span class="detail-value">${employee.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Full Name</span>
                    <span class="detail-value">${employee.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Birthdate</span>
                    <span class="detail-value">${formatDate(employee.birthdate)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value ${isBlocklisted ? 'blocklisted' : ''}">${employee.status}</span>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">Address</span>
                    <span class="detail-value">${employee.address}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Employment Details</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Position</span>
                    <span class="detail-value">${employee.position}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Department</span>
                    <span class="detail-value">${employee.department}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date Hired</span>
                    <span class="detail-value">${formatDate(employee.dateHired)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Monthly Salary</span>
                    <span class="detail-value">₱${parseFloat(employee.salary).toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Contact Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${employee.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${employee.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Emergency Contact</span>
                    <span class="detail-value">${employee.emergencyContact}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Emergency Phone</span>
                    <span class="detail-value">${employee.emergencyPhone}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Government IDs</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">SSS Number</span>
                    <span class="detail-value">${employee.sss || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">TIN Number</span>
                    <span class="detail-value">${employee.tin || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">PhilHealth Number</span>
                    <span class="detail-value">${employee.philhealth || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="view-actions">
            ${isBlocklisted ? `
                <button class="unblock-btn" onclick="closeViewModal(); openBlocklistModal('${employee.id}', 'unblock')">
                    <i class="fas fa-check-circle"></i> Remove from Blocklist
                </button>
            ` : `
                <button class="blocklist-btn" onclick="closeViewModal(); openBlocklistModal('${employee.id}', 'blocklist')">
                    <i class="fas fa-ban"></i> Add to Blocklist
                </button>
            `}
            <button class="edit-btn" onclick="closeViewModal(); editEmployee('${employee.id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn" onclick="closeViewModal(); deleteEmployee('${employee.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    document.getElementById('viewEmployeeModal').style.display = 'block';
}

// Close modals
function closeModal() {
    document.getElementById('employeeModal').style.display = 'none';
    editingEmployeeId = null;
}

function closeViewModal() {
    document.getElementById('viewEmployeeModal').style.display = 'none';
}

// Handle action button clicks
function handleActionClick(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback();
}

// Delete employee
function deleteEmployee(id) {
    try {
        const employee = employees.find(e => e.id === id);
        if (!employee) return;

        const modal = document.getElementById('blocklistModal');
        const modalTitle = document.getElementById('blocklistModalTitle');
        const modalMessage = document.getElementById('blocklistMessage');
        const reasonField = document.getElementById('blocklistReason');
        const reasonLabel = reasonField.previousElementSibling;
        const confirmBtn = document.getElementById('confirmBlocklistBtn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        modalTitle.textContent = 'Confirm Delete';
        modalMessage.textContent = `Are you sure you want to delete ${employee.name}?`;
        reasonField.style.display = 'none';
        reasonLabel.style.display = 'none';
        confirmBtn.textContent = 'OK';
        confirmBtn.style.backgroundColor = '#888';
        cancelBtn.textContent = 'Cancel';
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.onclick = () => {
            employees = employees.filter(e => e.id !== id);
            localStorage.setItem('employees', JSON.stringify(employees));
            updateAnalytics();
            renderEmployees();
            modal.style.display = 'none';
        };
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error in deleteEmployee:', error);
    }
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Show notification
function showNotification(message, type) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification ${type}`;
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load employees
    loadEmployees();

    // Form submit
    document.getElementById('employeeForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const employeeData = {
            id: document.getElementById('employeeId').value,
            name: document.getElementById('employeeName').value,
            position: document.getElementById('employeePosition').value,
            department: document.getElementById('employeeDepartment').value,
            email: document.getElementById('employeeEmail').value,
            phone: document.getElementById('employeePhone').value,
            dateHired: document.getElementById('employeeDateHired').value,
            birthdate: document.getElementById('employeeBirthdate').value,
            address: document.getElementById('employeeAddress').value,
            emergencyContact: document.getElementById('employeeEmergencyContact').value,
            emergencyPhone: document.getElementById('employeeEmergencyPhone').value,
            salary: document.getElementById('employeeSalary').value,
            status: document.getElementById('employeeStatus').value,
            sss: document.getElementById('employeeSSS').value,
            tin: document.getElementById('employeeTIN').value,
            philhealth: document.getElementById('employeePhilhealth').value,
            blocklistReason: ''
        };

        if (editingEmployeeId) {
            // Update existing employee
            const index = employees.findIndex(e => e.id === editingEmployeeId);
            if (index !== -1) {
                // Preserve blocklist reason if status is still blocklisted
                if (employees[index].status === 'Blocklisted' && employeeData.status === 'Blocklisted') {
                    employeeData.blocklistReason = employees[index].blocklistReason;
                }
                employees[index] = employeeData;
                showNotification('Employee updated successfully', 'success');
            }
        } else {
            // Check for duplicate ID
            if (employees.some(e => e.id === employeeData.id)) {
                showNotification('Employee ID already exists', 'error');
                return;
            }
            // Add new employee
            employees.push(employeeData);
            showNotification('Employee added successfully', 'success');
        }

        saveEmployees();
        updateAnalytics();
        renderEmployees();
        
        setTimeout(() => {
            closeModal();
        }, 1500);
    });

    // Blocklist confirmation
    document.getElementById('confirmBlocklistBtn').addEventListener('click', confirmBlocklistAction);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const statusFilter = document.getElementById('filterStatus').value;
        renderEmployees(e.target.value, statusFilter);
    });

    // Status filter
    document.getElementById('filterStatus').addEventListener('change', function(e) {
        const searchTerm = document.getElementById('searchInput').value;
        const btn = document.querySelector('.blocklisted-view-btn');
        
        // Update button state based on filter
        if (e.target.value === 'Blocklisted') {
            isShowingBlocklistedOnly = true;
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-list"></i> Show All';
        } else {
            isShowingBlocklistedOnly = false;
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-ban"></i> View Blocklisted';
        }
        
        renderEmployees(searchTerm, e.target.value);
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('employeeModal');
        const viewModal = document.getElementById('viewEmployeeModal');
        const blocklistModal = document.getElementById('blocklistModal');
        
        if (event.target === modal) {
            closeModal();
        }
        if (event.target === viewModal) {
            closeViewModal();
        }
        if (event.target === blocklistModal) {
            closeBlocklistModal();
        }
    });

    // Sidebar toggle functionality
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

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const modal = document.getElementById('logoutConfirmModal');
            if (modal) {
                modal.style.display = 'block';
            }
        });
    }
});