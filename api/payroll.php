<?php
// api/payroll.php - ENHANCED VERSION with Full Edit Control
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Pay calculation constants (Philippine Labor Standards)
define('DAILY_RATE_JT', 525);
define('DAILY_RATE_SENIOR', 540);
define('STANDARD_HOURS', 8);
define('NIGHT_DIFF_RATE', 0.10);
define('OVERTIME_MULTIPLIER', 1.25);
define('HOLIDAY_RATE', 2.0);
define('NIGHT_START', 22);
define('NIGHT_END', 6);

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
                
                $start = new DateTime($startDate);
                $end = new DateTime($endDate);
                $interval = $start->diff($end);
                $days = $interval->days;
                
                if ($days < 13 || $days > 16) {
                    jsonResponse(false, 'Pay period should be biweekly (13-16 days)');
                    break;
                }
                
                $stmt = $db->query("SELECT * FROM employees WHERE status = 'Active'");
                $employees = $stmt->fetchAll();
                
                $generated = [];
                $errors = [];
                
                foreach ($employees as $emp) {
                    $stmt = $db->prepare("
                        SELECT * FROM payroll 
                        WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ?
                    ");
                    $stmt->execute([$emp['employee_id'], $startDate, $endDate]);
                    
                    if ($stmt->rowCount() == 0) {
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
                
            } elseif ($action === 'payslip-detail') {
                $payrollId = $_GET['id'];
                
                if (!$payrollId) {
                    jsonResponse(false, 'Payroll ID is required');
                    break;
                }
                
                $stmt = $db->prepare("
                    SELECT p.*, e.name, e.position, e.department, e.employee_id
                    FROM payroll p
                    JOIN employees e ON p.employee_id = e.employee_id
                    WHERE p.payroll_id = ?
                ");
                $stmt->execute([$payrollId]);
                $payroll = $stmt->fetch();
                
                if (!$payroll) {
                    jsonResponse(false, 'Payroll record not found');
                    break;
                }
                
                // Determine employee's daily rate based on position
                $position = strtolower($payroll['position']);
                $dailyRate = DAILY_RATE_SENIOR;
                if (strpos($position, 'junior') !== false || 
                    strpos($position, 'trainee') !== false || 
                    strpos($position, 'apprentice') !== false) {
                    $dailyRate = DAILY_RATE_JT;
                }
                $hourlyRate = $dailyRate / STANDARD_HOURS;
                
                // Get all dates in pay period
                $start = new DateTime($payroll['pay_period_start']);
                $end = new DateTime($payroll['pay_period_end']);
                $end->modify('+1 day');
                $period = new DatePeriod($start, new DateInterval('P1D'), $end);
                
                $allDates = [];
                foreach ($period as $date) {
                    $allDates[$date->format('Y-m-d')] = [
                        'date' => $date->format('Y-m-d'),
                        'day_name' => $date->format('l'),
                        'time_in' => '-',
                        'time_out' => '-',
                        'status' => 'Absent',
                        'hours_worked' => 0,
                        'regular_hours' => 0,
                        'overtime_hours' => 0,
                        'night_hours' => 0,
                        'shift_type' => 'Regular',
                        'remarks' => ''
                    ];
                }
                
                // Get actual attendance records
                $stmt = $db->prepare("
                    SELECT 
                        a.attendance_date,
                        a.time_in,
                        a.time_out,
                        a.status,
                        a.hours_worked,
                        a.remarks
                    FROM attendance_records a
                    WHERE a.employee_id = ?
                    AND a.attendance_date BETWEEN ? AND ?
                    ORDER BY a.attendance_date ASC
                ");
                $stmt->execute([
                    $payroll['employee_id'],
                    $payroll['pay_period_start'],
                    $payroll['pay_period_end']
                ]);
                $attendanceRecords = $stmt->fetchAll();
                
                $breakdown = [
                    'total_days_worked' => 0,
                    'total_regular_hours' => 0,
                    'total_night_hours' => 0,
                    'total_overtime_hours' => 0,
                    'present_days' => 0,
                    'late_days' => 0,
                    'absent_days' => 0,
                    'leave_days' => 0,
                    'daily_records' => []
                ];
                
                // Process attendance records
                foreach ($attendanceRecords as $record) {
                    $date = $record['attendance_date'];
                    
                    $hours = 0;
                    $nightHours = 0;
                    
                    if ($record['time_in'] && $record['time_out']) {
                        $hours = calculateHoursWorkedFixed(
                            $date,
                            $record['time_in'], 
                            $record['time_out']
                        );
                        
                        $nightHours = calculateNightHoursForPayslip(
                            $date,
                            $record['time_in'], 
                            $record['time_out']
                        );
                    }
                    
                    $regularHours = min($hours, STANDARD_HOURS);
                    $overtimeHours = max(0, $hours - STANDARD_HOURS);
                    
                    $shiftType = 'Regular';
                    if ($record['time_in'] && $record['time_out']) {
                        $timeInHour = (int)date('H', strtotime($record['time_in']));
                        $timeOutHour = (int)date('H', strtotime($record['time_out']));
                        
                        if ($timeOutHour < $timeInHour || 
                            ($timeInHour >= 18 || $timeInHour < 6)) {
                            $shiftType = 'Overnight';
                        }
                    }
                    
                    if ($record['status'] === 'Present') {
                        $breakdown['present_days']++;
                        $breakdown['total_days_worked']++;
                    } elseif ($record['status'] === 'Late') {
                        $breakdown['late_days']++;
                        $breakdown['total_days_worked']++;
                    } elseif ($record['status'] === 'On Leave') {
                        $breakdown['leave_days']++;
                    }
                    
                    $breakdown['total_regular_hours'] += $regularHours;
                    $breakdown['total_night_hours'] += $nightHours;
                    $breakdown['total_overtime_hours'] += $overtimeHours;
                    
                    if (isset($allDates[$date])) {
                        $allDates[$date] = [
                            'date' => $date,
                            'day_name' => date('l', strtotime($date)),
                            'time_in' => $record['time_in'] ?: '-',
                            'time_out' => $record['time_out'] ?: '-',
                            'status' => $record['status'],
                            'hours_worked' => $hours,
                            'regular_hours' => $regularHours,
                            'overtime_hours' => $overtimeHours,
                            'night_hours' => $nightHours,
                            'shift_type' => $shiftType,
                            'remarks' => $record['remarks']
                        ];
                    }
                }
                
                foreach ($allDates as $dateData) {
                    if ($dateData['status'] === 'Absent' && 
                        $dateData['day_name'] !== 'Sunday') {
                        $breakdown['absent_days']++;
                    }
                }
                
                ksort($allDates);
                $breakdown['daily_records'] = array_values($allDates);
                
                $regularPay = $breakdown['total_regular_hours'] * $hourlyRate;
                $nightDiffPay = $breakdown['total_night_hours'] * $hourlyRate * NIGHT_DIFF_RATE;
                $overtimePay = $breakdown['total_overtime_hours'] * $hourlyRate * OVERTIME_MULTIPLIER;
                
                $result = [
                    'payroll' => $payroll,
                    'breakdown' => $breakdown,
                    'hourly_rate' => $hourlyRate,
                    'daily_rate' => $dailyRate,
                    'pay_components' => [
                        'regular_pay' => round($regularPay, 2),
                        'night_diff_pay' => round($nightDiffPay, 2),
                        'overtime_pay' => round($overtimePay, 2)
                    ]
                ];
                
                jsonResponse(true, 'Detailed payslip retrieved', $result);
            }
            break;
            
        case 'PUT':
            if ($action === 'update') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                // ✅ ENHANCED: Allow full control over all payroll fields
                $basicSalary = isset($data['basic_salary']) ? floatval($data['basic_salary']) : 0;
                $overtimeHours = isset($data['overtime_hours']) ? floatval($data['overtime_hours']) : 0;
                $overtimeRate = isset($data['overtime_rate']) ? floatval($data['overtime_rate']) : 0;
                $overtimePay = $overtimeHours * $overtimeRate;
                $lateDeductions = isset($data['late_deductions']) ? floatval($data['late_deductions']) : 0;
                $otherDeductions = isset($data['other_deductions']) ? floatval($data['other_deductions']) : 0;
                
                // Calculate totals
                $grossPay = $basicSalary + $overtimePay;
                $totalDeductions = $lateDeductions + $otherDeductions;
                $netPay = $grossPay - $totalDeductions;
                
                $stmt = $db->prepare("
                    UPDATE payroll 
                    SET basic_salary = ?,
                        overtime_hours = ?, 
                        overtime_rate = ?, 
                        overtime_pay = ?,
                        gross_pay = ?, 
                        late_deductions = ?, 
                        other_deductions = ?,
                        total_deductions = ?, 
                        net_pay = ?, 
                        status = 'Configured'
                    WHERE payroll_id = ?
                ");
                
                $result = $stmt->execute([
                    $basicSalary,
                    $overtimeHours,
                    $overtimeRate,
                    $overtimePay,
                    $grossPay,
                    $lateDeductions,
                    $otherDeductions,
                    $totalDeductions,
                    $netPay,
                    $data['payroll_id']
                ]);
                
                if ($result) {
                    logAudit($db, 'payroll', 'Payroll Updated', 
                        "Updated payroll ID {$data['payroll_id']} - Net Pay: ₱{$netPay}", 'fa-edit');
                    jsonResponse(true, 'Payroll updated successfully');
                } else {
                    jsonResponse(false, 'Failed to update payroll');
                }
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            
            $stmt = $db->prepare("SELECT p.*, e.name FROM payroll p JOIN employees e ON p.employee_id = e.employee_id WHERE payroll_id = ?");
            $stmt->execute([$id]);
            $record = $stmt->fetch();
            
            if ($record) {
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

function calculatePayrollPH($db, $employee, $startDate, $endDate) {
    $dailyRate = DAILY_RATE_SENIOR;
    $position = strtolower($employee['position']);
    
    if (strpos($position, 'junior') !== false || 
        strpos($position, 'trainee') !== false || 
        strpos($position, 'apprentice') !== false) {
        $dailyRate = DAILY_RATE_JT;
    }
    
    $hourlyRate = $dailyRate / STANDARD_HOURS;
    
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
    
    $holidays = getPhilippineHolidays($startDate, $endDate);
    
    $regularHours = 0;
    $nightDiffHours = 0;
    $overtimeHours = 0;
    $holidayHours = 0;
    $lateMinutes = 0;
    
    foreach ($attendance as $record) {
        $date = $record['attendance_date'];
        $isHoliday = isset($holidays[$date]);
        
        if ($record['status'] === 'Present' || $record['status'] === 'Late') {
            if ($record['status'] === 'Late' && $record['time_in']) {
                $standardTime = strtotime('08:00:00');
                $actualTime = strtotime($record['time_in']);
                if ($actualTime > $standardTime) {
                    $lateMinutes += ($actualTime - $standardTime) / 60;
                }
            }
            
            $hoursWorked = calculateHoursWorkedFixed($date, $record['time_in'], $record['time_out']);
            
            if ($hoursWorked > 0) {
                $nightHours = calculateNightDifferentialFixed($date, $record['time_in'], $record['time_out']);
                $nightDiffHours += $nightHours;
                
                if ($isHoliday) {
                    $holidayHours += min($hoursWorked, STANDARD_HOURS);
                    if ($hoursWorked > STANDARD_HOURS) {
                        $overtimeHours += ($hoursWorked - STANDARD_HOURS);
                    }
                } else {
                    if ($hoursWorked <= STANDARD_HOURS) {
                        $regularHours += $hoursWorked;
                    } else {
                        $regularHours += STANDARD_HOURS;
                        $overtimeHours += ($hoursWorked - STANDARD_HOURS);
                    }
                }
            }
        }
    }
    
    $regularPay = $regularHours * $hourlyRate;
    $nightDiffPay = $nightDiffHours * $hourlyRate * NIGHT_DIFF_RATE;
    $holidayPay = $holidayHours * $hourlyRate * HOLIDAY_RATE;
    $basicSalary = $regularPay + $nightDiffPay + $holidayPay;
    
    $overtimeRate = $hourlyRate * OVERTIME_MULTIPLIER;
    $overtimePay = 0;
    
    $lateDeduction = ($lateMinutes / 60) * $hourlyRate;
    
    $grossPay = $basicSalary + $overtimePay;
    $sss = calculateSSS($grossPay);
    $philHealth = calculatePhilHealth($grossPay);
    $pagIbig = 100;
    
    $otherDeductions = $sss + $philHealth + $pagIbig;
    $totalDeductions = $lateDeduction + $otherDeductions;
    $netPay = $grossPay - $totalDeductions;
    
    return [
        'error' => false,
        'basic_salary' => round($basicSalary, 2),
        'overtime_hours' => round($overtimeHours, 2),
        'overtime_rate' => round($overtimeRate, 2),
        'overtime_pay' => round($overtimePay, 2),
        'gross_pay' => round($grossPay, 2),
        'late_deductions' => round($lateDeduction, 2),
        'other_deductions' => round($otherDeductions, 2),
        'total_deductions' => round($totalDeductions, 2),
        'net_pay' => round($netPay, 2)
    ];
}

function calculateHoursWorkedFixed($date, $timeIn, $timeOut) {
    if (!$timeIn || !$timeOut) return 0;
    
    $start = new DateTime($date . ' ' . $timeIn);
    $end = new DateTime($date . ' ' . $timeOut);
    
    if ($end <= $start) {
        $end->modify('+1 day');
    }
    
    $interval = $start->diff($end);
    $hours = $interval->h + ($interval->i / 60);
    
    return max(0, round($hours * 2) / 2);
}

function calculateNightDifferentialFixed($date, $timeIn, $timeOut) {
    if (!$timeIn || !$timeOut) return 0;
    
    $start = new DateTime($date . ' ' . $timeIn);
    $end = new DateTime($date . ' ' . $timeOut);
    
    if ($end <= $start) {
        $end->modify('+1 day');
    }
    
    $nightHours = 0;
    $currentTime = clone $start;
    
    while ($currentTime < $end) {
        $hour = (int)$currentTime->format('H');
        
        if ($hour >= NIGHT_START || $hour < NIGHT_END) {
            $nextHour = clone $currentTime;
            $nextHour->modify('+1 hour');
            
            if ($nextHour > $end) {
                $minutes = ($end->getTimestamp() - $currentTime->getTimestamp()) / 60;
                $nightHours += $minutes / 60;
            } else {
                $nightHours += 1;
            }
        }
        
        $currentTime->modify('+1 hour');
    }
    
    return max(0, round($nightHours * 2) / 2);
}

function calculateNightHoursForPayslip($date, $timeIn, $timeOut) {
    return calculateNightDifferentialFixed($date, $timeIn, $timeOut);
}

function getPhilippineHolidays($startDate, $endDate) {
    $holidays = [
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
    ];
    
    $filtered = [];
    foreach ($holidays as $date => $name) {
        if ($date >= $startDate && $date <= $endDate) {
            $filtered[$date] = $name;
        }
    }
    
    return $filtered;
}

function calculateSSS($grossPay) {
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
    return 900.00;
}

function calculatePhilHealth($grossPay) {
    $monthlyEquivalent = $grossPay * 2;
    $monthlyEquivalent = max(10000, min($monthlyEquivalent, 100000));
    $contribution = $monthlyEquivalent * 0.04;
    $employeeShare = $contribution / 2;
    return round($employeeShare / 2, 2);
}
?>