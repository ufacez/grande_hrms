<?php
// api/employees.php - Employee Management API
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'list') {
                // Get all employees with optional filters
                $status = $_GET['status'] ?? 'all';
                $search = $_GET['search'] ?? '';
                
                $sql = "SELECT * FROM employees WHERE 1=1";
                $params = [];
                
                if ($status !== 'all') {
                    $sql .= " AND status = ?";
                    $params[] = $status;
                }
                
                if ($search) {
                    $sql .= " AND (name LIKE ? OR employee_id LIKE ? OR position LIKE ?)";
                    $searchTerm = "%$search%";
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }
                
                $sql .= " ORDER BY created_at DESC";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $employees = $stmt->fetchAll();
                
                jsonResponse(true, 'Employees retrieved', $employees);
                
            } elseif ($action === 'get' && isset($_GET['id'])) {
                // Get single employee
                $stmt = $db->prepare("SELECT * FROM employees WHERE employee_id = ?");
                $stmt->execute([$_GET['id']]);
                $employee = $stmt->fetch();
                
                if ($employee) {
                    jsonResponse(true, 'Employee found', $employee);
                } else {
                    jsonResponse(false, 'Employee not found');
                }
                
            } elseif ($action === 'stats') {
                // Get employee statistics
                $stmt = $db->query("SELECT * FROM employee_statistics");
                $stats = $stmt->fetch();
                jsonResponse(true, 'Statistics retrieved', $stats);
            }
            break;
            
        case 'POST':
            if ($action === 'create') {
                // Create new employee
                $data = json_decode(file_get_contents('php://input'), true);
                
                $stmt = $db->prepare("
                    INSERT INTO employees (
                        employee_id, name, position, department, email, phone,
                        date_hired, birthdate, address, emergency_contact, emergency_phone,
                        monthly_salary, status, sss_number, tin_number, philhealth_number
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $data['employee_id'],
                    $data['name'],
                    $data['position'],
                    $data['department'],
                    $data['email'],
                    $data['phone'],
                    $data['date_hired'],
                    $data['birthdate'],
                    $data['address'],
                    $data['emergency_contact'],
                    $data['emergency_phone'],
                    $data['monthly_salary'],
                    $data['status'] ?? 'Active',
                    $data['sss_number'] ?? null,
                    $data['tin_number'] ?? null,
                    $data['philhealth_number'] ?? null
                ]);
                
                if ($result) {
                    logAudit($db, 'employee', 'Employee Added', "Added employee: {$data['name']} ({$data['employee_id']})", 'fa-user-plus');
                    jsonResponse(true, 'Employee created successfully', ['employee_id' => $data['employee_id']]);
                } else {
                    jsonResponse(false, 'Failed to create employee');
                }
            }
            break;
            
        case 'PUT':
            if ($action === 'update') {
                // Update employee
                $data = json_decode(file_get_contents('php://input'), true);
                
                $stmt = $db->prepare("
                    UPDATE employees SET
                        name = ?, position = ?, department = ?, email = ?, phone = ?,
                        date_hired = ?, birthdate = ?, address = ?, emergency_contact = ?,
                        emergency_phone = ?, monthly_salary = ?, status = ?,
                        sss_number = ?, tin_number = ?, philhealth_number = ?
                    WHERE employee_id = ?
                ");
                
                $result = $stmt->execute([
                    $data['name'],
                    $data['position'],
                    $data['department'],
                    $data['email'],
                    $data['phone'],
                    $data['date_hired'],
                    $data['birthdate'],
                    $data['address'],
                    $data['emergency_contact'],
                    $data['emergency_phone'],
                    $data['monthly_salary'],
                    $data['status'],
                    $data['sss_number'] ?? null,
                    $data['tin_number'] ?? null,
                    $data['philhealth_number'] ?? null,
                    $data['employee_id']
                ]);
                
                if ($result) {
                    logAudit($db, 'employee', 'Employee Updated', "Updated employee: {$data['name']} ({$data['employee_id']})", 'fa-user-edit');
                    jsonResponse(true, 'Employee updated successfully');
                } else {
                    jsonResponse(false, 'Failed to update employee');
                }
                
            } elseif ($action === 'blocklist') {
                // Blocklist/Unblocklist employee
                $data = json_decode(file_get_contents('php://input'), true);
                $newStatus = $data['blocklist'] ? 'Blocklisted' : 'Active';
                
                $stmt = $db->prepare("
                    UPDATE employees 
                    SET status = ?, blocklist_reason = ?
                    WHERE employee_id = ?
                ");
                
                $result = $stmt->execute([
                    $newStatus,
                    $data['reason'] ?? '',
                    $data['employee_id']
                ]);
                
                if ($result) {
                    $action = $data['blocklist'] ? 'blocklisted' : 'removed from blocklist';
                    logAudit($db, 'employee', 'Employee Status Changed', "Employee {$data['employee_id']} {$action}", 'fa-ban');
                    jsonResponse(true, "Employee {$action} successfully");
                } else {
                    jsonResponse(false, 'Failed to update employee status');
                }
            }
            break;
            
        case 'DELETE':
            if ($action === 'delete' && isset($_GET['id'])) {
                $employeeId = $_GET['id'];
                
                // Get employee data for archive
                $stmt = $db->prepare("SELECT * FROM employees WHERE employee_id = ?");
                $stmt->execute([$employeeId]);
                $employee = $stmt->fetch();
                
                if ($employee) {
                    // Archive the employee
                    $stmt = $db->prepare("
                        INSERT INTO archives (archive_type, original_id, name_description, archived_data, archived_by)
                        VALUES ('employees', ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $employeeId,
                        $employee['name'],
                        json_encode($employee),
                        $_SESSION['user_id']
                    ]);
                    
                    // Delete employee
                    $stmt = $db->prepare("DELETE FROM employees WHERE employee_id = ?");
                    $result = $stmt->execute([$employeeId]);
                    
                    if ($result) {
                        logAudit($db, 'employee', 'Employee Deleted', "Deleted employee: {$employee['name']} ({$employeeId})", 'fa-user-times');
                        jsonResponse(true, 'Employee deleted successfully');
                    } else {
                        jsonResponse(false, 'Failed to delete employee');
                    }
                } else {
                    jsonResponse(false, 'Employee not found');
                }
            }
            break;
            
        default:
            jsonResponse(false, 'Invalid request method');
    }
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred. Please try again.');
}
?>