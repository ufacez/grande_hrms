<?php
// api/payroll.php - Philippine Labor Standards (DOLE Compliant)
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Pay calculation constants (Philippine Labor Standards)
define('DAILY_RATE_JT', 525);        // Junior Employee (Training/Entry Level)
define('DAILY_RATE_SENIOR', 540);    // Senior Employee
define('STANDARD_HOURS', 8);
define('NIGHT_DIFF_RATE', 0.10);     // 10% night differential (DOLE)
define('OVERTIME_MULTIPLIER', 1.25); // 25% premium (DOLE)
define('HOLIDAY_RATE', 2.0);         // 200% for regular holidays (DOLE)
define('SPECIAL_HOLIDAY_RATE', 1.30); // 130% for special holidays (DOLE)

// Night shift hours (10PM - 6AM as per DOLE)
define('NIGHT_START', 22); // 10:00 PM
define('NIGHT_END', 6);    // 6:00 AM

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
                    LIMIT 20
                ");
                jsonResponse(true, 'Pay periods retrieved', $stmt->fetchAll());
                
            } elseif ($action === 'stats') {
                $startDate = $_GET['start_date'] ?? '';
                $endDate = $_GET['end_date'] ?? '';
                
                $sql = "SELECT 
                        COUNT(*) as employee_count,
                        SUM(net_pay) as total_payroll,
                        SUM(overtime_pay) as total_overtime,
                        SUM(total_deductions) as total_deductions,
                        SUM(gross_pay) as total_gross
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
                
                if (!$startDate || !$endDate) {
                    jsonResponse(false, 'Start date and end date are required');
                    break;
                }
                
                // Validate biweekly period (13-16 days)
                $start = new DateTime($startDate);
                $end = new DateTime($endDate);
                $interval = $start->diff($end);
                $days = $interval->days;
                
                if ($days < 13 || $days > 16) {
                    jsonResponse(false, 'Pay period should be biweekly (13-16 days)');
                    break;
                }
                
                // Get all active employees
                $stmt = $db->query("SELECT * FROM employees WHERE status = 'Active'");
                $employees = $stmt->fetchAll();
                
                $generated = [];
                $errors = [];
                
                foreach ($employees as $emp) {
                    // Check if payroll already exists
                    $stmt = $db->prepare("
                        SELECT * FROM payroll 
                        WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ?
                    ");
                    $stmt->execute([$emp['employee_id'], $startDate, $endDate]);
                    
                    if ($stmt->rowCount() == 0) {
                        // Calculate salary based on attendance
                        $salary = calculatePayrollPH($db, $emp, $startDate, $endDate);
                        
                        if ($salary['error']) {
                            $errors[] = [
                                'employee_id' => $emp['employee_id'],
                                'name' => $emp['name'],
                                'error' => $salary['message']
                            ];
                            continue;
                        }
                        
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
                        
                        $generated[] = [
                            'employee_id' => $emp['employee_id'],
                            'name' => $emp['name'],
                            'net_pay' => $salary['net_pay']
                        ];
                    }
                }
                
                logAudit($db, 'payroll', 'Payroll Generated', 
                    "Generated biweekly payroll for period $startDate to $endDate - " . count($generated) . " employees", 
                    'fa-money-bill-wave');
                    
                jsonResponse(true, 'Payroll generated', [
                    'generated' => count($generated),
                    'errors' => count($errors),
                    'details' => $generated,
                    'error_details' => $errors
                ]);
            }
            break;
            
        case 'PUT':
            if ($action === 'update') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Recalculate with updated values
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
                        "Updated payroll (OT approved by owner)", 'fa-edit');
                    jsonResponse(true, 'Payroll updated successfully');
                }
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            
            $stmt = $db->prepare("SELECT p.*, e.name FROM payroll p JOIN employees e ON p.employee_id = e.employee_id WHERE payroll_id = ?");
            $stmt->execute([$id]);
            $record = $stmt->fetch();
            
            if ($record) {
                // Archive before delete
                $stmt = $db->prepare("
                    INSERT INTO archives (archive_type, original_id, name_description, archived_data, archived_by)
                    VALUES ('payroll', ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id,
                    "Payroll for {$record['name']} ({$record['pay_period_start']} to {$record['pay_period_end']})",
                    json_encode($record),
                    $_SESSION['user_id']
                ]);
                
                $stmt = $db->prepare("DELETE FROM payroll WHERE payroll_id = ?");
                if ($stmt->execute([$id])) {
                    logAudit($db, 'payroll', 'Payroll Deleted', 
                        "Deleted payroll for {$record['name']}", 'fa-trash');
                    jsonResponse(true, 'Payroll deleted successfully');
                }
            } else {
                jsonResponse(false, 'Payroll record not found');
            }
            break;
    }
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred: ' . $e->getMessage());
}

// ============================================
// PHILIPPINE LABOR STANDARDS PAYROLL CALCULATION
// ============================================

function calculatePayrollPH($db, $employee, $startDate, $endDate) {
    // Determine daily rate based on position/level
    $dailyRate = DAILY_RATE_SENIOR; // Default
    $position = strtolower($employee['position']);
    
    // Check if Junior/Training level
    if (strpos($position, 'junior') !== false || 
        strpos($position, 'trainee') !== false || 
        strpos($position, 'apprentice') !== false) {
        $dailyRate = DAILY_RATE_JT;
    }
    
    $hourlyRate = $dailyRate / STANDARD_HOURS;
    
    // Get attendance records
    $stmt = $db->prepare("
        SELECT * FROM attendance_records 
        WHERE employee_id = ? 
        AND attendance_date BETWEEN ? AND ?
        ORDER BY attendance_date
    ");
    $stmt->execute([$employee['employee_id'], $startDate, $endDate]);
    $attendance = $stmt->fetchAll();
    
    if (count($attendance) === 0) {
        return [
            'error' => true,
            'message' => 'No attendance records found for this period'
        ];
    }
    
    // Get Philippine holidays for the period
    $holidays = getPhilippineHolidays($startDate, $endDate);
    
    // Initialize counters
    $regularHours = 0;
    $nightDiffHours = 0;
    $overtimeHours = 0; // Pending owner approval
    $holidayHours = 0;
    $lateMinutes = 0;
    $presentDays = 0;
    
    foreach ($attendance as $record) {
        $date = $record['attendance_date'];
        $isHoliday = isset($holidays[$date]);
        
        if ($record['status'] === 'Present' || $record['status'] === 'Late') {
            $presentDays++;
            
            // Calculate late deductions
            if ($record['status'] === 'Late' && $record['time_in']) {
                $standardTime = strtotime('08:00:00');
                $actualTime = strtotime($record['time_in']);
                if ($actualTime > $standardTime) {
                    $lateMinutes += ($actualTime - $standardTime) / 60;
                }
            }
            
            // Calculate hours worked
            $hoursWorked = floatval($record['hours_worked']);
            
            if ($hoursWorked > 0) {
                // Check for night differential (10PM - 6AM)
                $nightHours = calculateNightDifferentialFixed(
                    $date . ' ' . $record['time_in'], 
                    $date . ' ' . $record['time_out']
                );
                
                if ($isHoliday) {
                    // Holiday work - paid at holiday rate
                    $holidayHours += min($hoursWorked, STANDARD_HOURS);
                    // Overtime on holidays goes to pending OT
                    if ($hoursWorked > STANDARD_HOURS) {
                        $overtimeHours += ($hoursWorked - STANDARD_HOURS);
                    }
                } else {
                    // Regular day
                    if ($hoursWorked <= STANDARD_HOURS) {
                        $regularHours += $hoursWorked;
                    } else {
                        $regularHours += STANDARD_HOURS;
                        // OT pending owner approval
                        $overtimeHours += ($hoursWorked - STANDARD_HOURS);
                    }
                }
            }
        }
    }
    
    // Calculate earnings
    $basicSalary = $regularHours * $hourlyRate;
    $nightDiffPay = $nightDiffHours * $hourlyRate * NIGHT_DIFF_RATE; // 10% additional
    $holidayPay = $holidayHours * $hourlyRate * HOLIDAY_RATE; // 200% for holidays
    
    // OT pay (pending approval, set to 0 initially)
    $overtimeRate = $hourlyRate * OVERTIME_MULTIPLIER; // 125% rate
    $overtimePay = 0; // Owner must approve and edit
    
    // Gross pay
    $grossPay = $basicSalary + $nightDiffPay + $holidayPay + $overtimePay;
    
    // Calculate deductions
    $lateDeductions = ($lateMinutes / 60) * $hourlyRate;
    
    // Government deductions
    $sss = calculateSSS($grossPay);
    $philHealth = calculatePhilHealth($grossPay);
    $pagIbig = 100; // Standard HDMF
    
    $otherDeductions = $sss + $philHealth + $pagIbig;
    $totalDeductions = $lateDeductions + $otherDeductions;
    
    // Net pay
    $netPay = $grossPay - $totalDeductions;
    
    return [
        'error' => false,
        'present_days' => $presentDays,
        'regular_hours' => $regularHours,
        'night_diff_hours' => $nightDiffHours,
        'holiday_hours' => $holidayHours,
        'overtime_hours' => round($overtimeHours, 2), // Pending approval
        'basic_salary' => round($basicSalary + $nightDiffPay + $holidayPay, 2),
        'overtime_rate' => round($overtimeRate, 2),
        'overtime_pay' => round($overtimePay, 2), // 0 until approved
        'gross_pay' => round($grossPay, 2),
        'late_deductions' => round($lateDeductions, 2),
        'other_deductions' => round($otherDeductions, 2),
        'total_deductions' => round($totalDeductions, 2),
        'net_pay' => round($netPay, 2),
        'daily_rate' => $dailyRate,
        'note' => $overtimeHours > 0 ? "OT: {$overtimeHours} hrs pending owner approval" : null
    ];
}

function calculateNightDifferentialFixed($timeIn, $timeOut) {
    if (!$timeIn || !$timeOut) return 0;
    
    $start = new DateTime($timeIn);
    $end = new DateTime($timeOut);
    
    // Night shift hours: 22:00 (10 PM) to 06:00 (6 AM)
    $NIGHT_START = 22;
    $NIGHT_END = 6;
    
    $startHour = (int)$start->format('H') + ((int)$start->format('i') / 60);
    $endHour = (int)$end->format('H') + ((int)$end->format('i') / 60);
    
    $nightHours = 0;
    
    // Handle overnight shift
    if ($endHour < $startHour) {
        // Part 1: From start to midnight
        if ($startHour >= $NIGHT_START) {
            $nightHours += (24 - $startHour);
        } elseif ($startHour < $NIGHT_END) {
            $nightHours += ($NIGHT_END - $startHour);
        }
        
        // Part 2: From midnight to end
        if ($endHour <= $NIGHT_END) {
            $nightHours += $endHour;
        }
    } else {
        // Same day shift
        if ($startHour >= $NIGHT_START && $endHour <= 24) {
            $nightHours = $endHour - $startHour;
        } elseif ($endHour <= $NIGHT_END && $startHour < $NIGHT_END) {
            $nightHours = $endHour - max($startHour, 0);
        } elseif ($startHour < $NIGHT_END && $endHour > $NIGHT_END) {
            $nightHours = $NIGHT_END - $startHour;
        }
    }
    
    return max(0, round($nightHours * 2) / 2);
}

function getPhilippineHolidays($startDate, $endDate) {
    // 2025 Philippine Regular Holidays (as per Proclamation)
    $holidays = [
        // Regular Holidays (200% pay if worked)
        '2025-01-01' => 'New Year\'s Day',
        '2025-04-09' => 'Araw ng Kagitingan',
        '2025-04-17' => 'Maundy Thursday',
        '2025-04-18' => 'Good Friday',
        '2025-05-01' => 'Labor Day',
        '2025-06-12' => 'Independence Day',
        '2025-08-25' => 'National Heroes Day',
        '2025-11-30' => 'Bonifacio Day',
        '2025-12-25' => 'Christmas Day',
        '2025-12-30' => 'Rizal Day',
        
        // Special Non-Working Days (130% pay if worked)
        '2025-02-09' => 'Chinese New Year',
        '2025-02-25' => 'EDSA Revolution',
        '2025-04-19' => 'Black Saturday',
        '2025-08-21' => 'Ninoy Aquino Day',
        '2025-11-01' => 'All Saints\' Day',
        '2025-11-02' => 'All Souls\' Day',
        '2025-12-08' => 'Feast of Immaculate Conception',
        '2025-12-24' => 'Christmas Eve',
        '2025-12-31' => 'New Year\'s Eve',
    ];
    
    // Filter holidays within date range
    $filtered = [];
    foreach ($holidays as $date => $name) {
        if ($date >= $startDate && $date <= $endDate) {
            $filtered[$date] = $name;
        }
    }
    
    return $filtered;
}

function calculateSSS($grossPay) {
    // 2024 SSS Contribution Table (Employee Share)
    if ($grossPay < 4250) return 180.00;
    if ($grossPay < 4750) return 202.50;
    if ($grossPay < 5250) return 225.00;
    if ($grossPay < 5750) return 247.50;
    if ($grossPay < 6250) return 270.00;
    if ($grossPay < 6750) return 292.50;
    if ($grossPay < 7250) return 315.00;
    if ($grossPay < 7750) return 337.50;
    if ($grossPay < 8250) return 360.00;
    if ($grossPay < 8750) return 382.50;
    if ($grossPay < 9250) return 405.00;
    if ($grossPay < 9750) return 427.50;
    if ($grossPay < 10250) return 450.00;
    if ($grossPay < 10750) return 472.50;
    if ($grossPay < 11250) return 495.00;
    if ($grossPay < 11750) return 517.50;
    if ($grossPay < 12250) return 540.00;
    if ($grossPay < 12750) return 562.50;
    if ($grossPay < 13250) return 585.00;
    if ($grossPay < 13750) return 607.50;
    if ($grossPay < 14250) return 630.00;
    if ($grossPay < 14750) return 652.50;
    if ($grossPay < 15250) return 675.00;
    return 900.00; // Maximum
}

function calculatePhilHealth($grossPay) {
    // 2024 PhilHealth (4% of basic salary, employee pays 2%)
    $monthlyEquivalent = $grossPay * 2; // Biweekly to monthly
    $monthlyEquivalent = max(10000, min($monthlyEquivalent, 100000));
    $contribution = $monthlyEquivalent * 0.04;
    $employeeShare = $contribution / 2;
    return round($employeeShare / 2, 2); // Biweekly
}
?>