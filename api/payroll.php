<?php
// api/payroll.php - Payroll Management API
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
                $startDate = $_GET['start_date'] ?? '';
                $endDate = $_GET['end_date'] ?? '';
                $department = $_GET['department'] ?? '';
                
                $sql = "SELECT p.*, e.name, e.position, e.department
                       FROM payroll p
                       JOIN employees e ON p.employee_id = e.employee_id
                       WHERE 1=1";
                $params = [];
                
                if ($startDate && $endDate) {
                    $sql .= " AND p.pay_period_start = ? AND p.pay_period_end = ?";
                    $params[] = $startDate;
                    $params[] = $endDate;
                }
                
                if ($department) {
                    $sql .= " AND e.department = ?";
                    $params[] = $department;
                }
                
                $sql .= " ORDER BY p.created_at DESC";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                jsonResponse(true, 'Payroll retrieved', $stmt->fetchAll());
                
            } elseif ($action === 'periods') {
                // Get available pay periods
                $stmt = $db->query("
                    SELECT DISTINCT pay_period_start, pay_period_end
                    FROM payroll
                    ORDER BY pay_period_start DESC
                ");
                jsonResponse(true, 'Pay periods retrieved', $stmt->fetchAll());
                
            } elseif ($action === 'stats') {
                $startDate = $_GET['start_date'] ?? '';
                $endDate = $_GET['end_date'] ?? '';
                
                $sql = "SELECT 
                        SUM(net_pay) as total_payroll,
                        SUM(overtime_pay) as total_overtime,
                        SUM(total_deductions) as total_deductions
                       FROM payroll
                       WHERE 1=1";
                $params = [];
                
                if ($startDate && $endDate) {
                    $sql .= " AND pay_period_start = ? AND pay_period_end = ?";
                    $params[] = $startDate;
                    $params[] = $endDate;
                }
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                jsonResponse(true, 'Stats retrieved', $stmt->fetch());
                
            } elseif ($action === 'generate') {
                // Generate payroll for a period
                $startDate = $_GET['start_date'];
                $endDate = $_GET['end_date'];
                
                // Get all active employees
                $stmt = $db->query("SELECT * FROM employees WHERE status = 'Active'");
                $employees = $stmt->fetchAll();
                
                $generated = [];
                foreach ($employees as $emp) {
                    // Check if payroll already exists
                    $stmt = $db->prepare("
                        SELECT * FROM payroll 
                        WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ?
                    ");
                    $stmt->execute([$emp['employee_id'], $startDate, $endDate]);
                    
                    if ($stmt->rowCount() == 0) {
                        // Calculate basic salary (monthly / 2 for semi-monthly)
                        $basicSalary = $emp['monthly_salary'] / 2;
                        
                        $stmt = $db->prepare("
                            INSERT INTO payroll 
                            (employee_id, pay_period_start, pay_period_end, basic_salary, gross_pay, net_pay, status)
                            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
                        ");
                        $stmt->execute([
                            $emp['employee_id'],
                            $startDate,
                            $endDate,
                            $basicSalary,
                            $basicSalary,
                            $basicSalary
                        ]);
                        $generated[] = $emp['employee_id'];
                    }
                }
                
                logAudit($db, 'payroll', 'Payroll Generated', 
                    "Generated payroll for period $startDate to $endDate", 'fa-money-bill-wave');
                    
                jsonResponse(true, 'Payroll generated', ['count' => count($generated)]);
            }
            break;
            
        case 'PUT':
            if ($action === 'update') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Calculate overtime pay
                $overtimePay = $data['overtime_hours'] * $data['overtime_rate'];
                
                // Calculate gross pay
                $grossPay = $data['basic_salary'] + $overtimePay;
                
                // Calculate total deductions
                $totalDeductions = $data['late_deductions'] + $data['other_deductions'];
                
                // Calculate net pay
                $netPay = $grossPay - $totalDeductions;
                
                $stmt = $db->prepare("
                    UPDATE payroll 
                    SET overtime_hours = ?, overtime_rate = ?, overtime_pay = ?,
                        gross_pay = ?, late_deductions = ?, other_deductions = ?,
                        total_deductions = ?, net_pay = ?, status = 'Configured'
                    WHERE payroll_id = ?
                ");
                
                $result = $stmt->execute([
                    $data['overtime_hours'],
                    $data['overtime_rate'],
                    $overtimePay,
                    $grossPay,
                    $data['late_deductions'],
                    $data['other_deductions'],
                    $totalDeductions,
                    $netPay,
                    $data['payroll_id']
                ]);
                
                if ($result) {
                    logAudit($db, 'payroll', 'Payroll Updated', 
                        "Updated payroll for employee {$data['employee_id']}", 'fa-edit');
                    jsonResponse(true, 'Payroll updated successfully');
                }
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            
            $stmt = $db->prepare("SELECT employee_id FROM payroll WHERE payroll_id = ?");
            $stmt->execute([$id]);
            $record = $stmt->fetch();
            
            if ($record) {
                // Archive before delete
                $stmt = $db->prepare("SELECT * FROM payroll WHERE payroll_id = ?");
                $stmt->execute([$id]);
                $payroll = $stmt->fetch();
                
                $stmt = $db->prepare("
                    INSERT INTO archives (archive_type, original_id, name_description, archived_data, archived_by)
                    VALUES ('payroll', ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id,
                    "Payroll for {$record['employee_id']}",
                    json_encode($payroll),
                    $_SESSION['user_id']
                ]);
                
                // Delete
                $stmt = $db->prepare("DELETE FROM payroll WHERE payroll_id = ?");
                if ($stmt->execute([$id])) {
                    logAudit($db, 'payroll', 'Payroll Deleted', 
                        "Deleted payroll for employee {$record['employee_id']}", 'fa-trash');
                    jsonResponse(true, 'Payroll deleted successfully');
                }
            }
            break;
    }
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred');
}
?>