<?php
// api/payroll.php - Enhanced Payroll with Schedule-based Salary Calculation
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Constants
define('DAILY_RATE', 540);
define('STANDARD_HOURS', 8);
define('HOURLY_RATE', DAILY_RATE / STANDARD_HOURS); // 67.50
define('OVERTIME_MULTIPLIER', 1.25);

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
                        // Calculate salary based on schedule
                        $salary = calculateScheduleBasedSalary($db, $emp['employee_id'], $startDate, $endDate);
                        
                        $stmt = $db->prepare("
                            INSERT INTO payroll 
                            (employee_id, pay_period_start, pay_period_end, basic_salary, 
                             overtime_hours, overtime_rate, overtime_pay, gross_pay, 
                             late_deductions, other_deductions, total_deductions, net_pay, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Configured')
                        ");
                        
                        $stmt->execute([
                            $emp['employee_id'],
                            $startDate,
                            $endDate,
                            $salary['basic_salary'],
                            $salary['overtime_hours'],
                            $salary['overtime_rate'],
                            $salary['overtime_pay'],
                            $salary['gross_pay'],
                            $salary['late_deductions'],
                            $salary['other_deductions'],
                            $salary['total_deductions'],
                            $salary['net_pay']
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
                
                $overtimePay = $data['overtime_hours'] * $data['overtime_rate'];
                $grossPay = $data['basic_salary'] + $overtimePay;
                $totalDeductions = $data['late_deductions'] + $data['other_deductions'];
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

// Helper function to calculate salary based on schedule
function calculateScheduleBasedSalary($db, $employeeId, $startDate, $endDate) {
    // Get employee schedules for the period
    $stmt = $db->prepare("
        SELECT * FROM schedules 
        WHERE employee_id = ? 
        AND week_start_date BETWEEN ? AND ?
    ");
    $stmt->execute([$employeeId, $startDate, $endDate]);
    $schedules = $stmt->fetchAll();
    
    $workDays = 0;
    $totalHours = 0;
    $overtimeHours = 0;
    
    foreach ($schedules as $schedule) {
        if ($schedule['shift_name'] !== 'Off' && $schedule['shift_name'] !== 'Day Off') {
            $workDays++;
            $hours = calculateShiftHours($schedule['shift_time']);
            $totalHours += $hours;
            
            if ($hours > STANDARD_HOURS) {
                $overtimeHours += ($hours - STANDARD_HOURS);
            }
        }
    }
    
    // Calculate pay
    $regularHours = $totalHours - $overtimeHours;
    $basicSalary = $regularHours * HOURLY_RATE;
    $overtimePay = $overtimeHours * HOURLY_RATE * OVERTIME_MULTIPLIER;
    $grossPay = $basicSalary + $overtimePay;
    
    // Calculate deductions (SSS, PhilHealth, Pag-IBIG)
    $sss = calculateSSS($grossPay);
    $philHealth = calculatePhilHealth($grossPay);
    $pagIbig = 100; // Standard
    
    $totalDeductions = $sss + $philHealth + $pagIbig;
    $netPay = $grossPay - $totalDeductions;
    
    return [
        'work_days' => $workDays,
        'total_hours' => $totalHours,
        'basic_salary' => round($basicSalary, 2),
        'overtime_hours' => round($overtimeHours, 2),
        'overtime_rate' => HOURLY_RATE * OVERTIME_MULTIPLIER,
        'overtime_pay' => round($overtimePay, 2),
        'gross_pay' => round($grossPay, 2),
        'late_deductions' => 0,
        'other_deductions' => round($totalDeductions, 2),
        'total_deductions' => round($totalDeductions, 2),
        'net_pay' => round($netPay, 2)
    ];
}

function calculateShiftHours($shiftTime) {
    if (empty($shiftTime) || $shiftTime === 'Day Off') return 0;
    
    // Parse shift time (e.g., "6:00 AM - 2:00 PM")
    if (preg_match('/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i', $shiftTime, $matches)) {
        $startHour = (int)$matches[1];
        $endHour = (int)$matches[4];
        $startPeriod = strtoupper($matches[3]);
        $endPeriod = strtoupper($matches[6]);
        
        // Convert to 24-hour format
        if ($startPeriod === 'PM' && $startHour !== 12) $startHour += 12;
        if ($startPeriod === 'AM' && $startHour === 12) $startHour = 0;
        if ($endPeriod === 'PM' && $endHour !== 12) $endHour += 12;
        if ($endPeriod === 'AM' && $endHour === 12) $endHour = 0;
        
        $hours = $endHour - $startHour;
        if ($hours < 0) $hours += 24;
        
        return $hours;
    }
    
    return STANDARD_HOURS;
}

function calculateSSS($grossPay) {
    if ($grossPay < 3250) return 135;
    if ($grossPay < 3750) return 157.50;
    if ($grossPay < 4250) return 180;
    if ($grossPay < 4750) return 202.50;
    if ($grossPay < 5250) return 225;
    if ($grossPay < 5750) return 247.50;
    if ($grossPay < 6250) return 270;
    if ($grossPay < 6750) return 292.50;
    if ($grossPay < 7250) return 315;
    if ($grossPay < 7750) return 337.50;
    if ($grossPay < 8250) return 360;
    if ($grossPay < 8750) return 382.50;
    if ($grossPay < 9250) return 405;
    return 450; // Simplified maximum
}

function calculatePhilHealth($grossPay) {
    $monthlyEquivalent = $grossPay * 2;
    $contribution = $monthlyEquivalent * 0.04;
    $employeeShare = $contribution / 2;
    return max(min($employeeShare, 1800), 200);
}
?>