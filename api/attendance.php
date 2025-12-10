<?php
// api/attendance.php - Updated with Create Action
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
                $date = $_GET['date'] ?? date('Y-m-d');
                $status = $_GET['status'] ?? '';
                
                $sql = "SELECT a.*, e.name as employee_name 
                       FROM attendance_records a
                       JOIN employees e ON a.employee_id = e.employee_id
                       WHERE a.attendance_date = ?";
                $params = [$date];
                
                if ($status) {
                    $sql .= " AND a.status = ?";
                    $params[] = $status;
                }
                
                $sql .= " ORDER BY a.time_in DESC";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                jsonResponse(true, 'Attendance retrieved', $stmt->fetchAll());
                
            } elseif ($action === 'stats') {
                $date = $_GET['date'] ?? date('Y-m-d');
                
                $stmt = $db->prepare("
                    SELECT 
                        COUNT(*) as total_records,
                        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
                        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave
                    FROM attendance_records
                    WHERE attendance_date = ?
                ");
                $stmt->execute([$date]);
                jsonResponse(true, 'Stats retrieved', $stmt->fetch());
            }
            break;
            
        case 'POST':
            if ($action === 'create') {
                // Manual attendance entry
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Validate required fields
                if (!isset($data['employee_id']) || !isset($data['date']) || !isset($data['status'])) {
                    jsonResponse(false, 'Missing required fields: employee_id, date, status');
                    break;
                }
                
                // Check for duplicate
                $checkStmt = $db->prepare("
                    SELECT attendance_id FROM attendance_records 
                    WHERE employee_id = ? AND attendance_date = ?
                ");
                $checkStmt->execute([$data['employee_id'], $data['date']]);
                
                if ($checkStmt->fetch()) {
                    jsonResponse(false, 'Attendance record already exists for this employee on this date');
                    break;
                }
                
                // Calculate hours worked
                $hoursWorked = 0;
                if (!empty($data['time_in']) && !empty($data['time_out'])) {
                    $hoursWorked = calculateHoursWorked($data['time_in'], $data['time_out']);
                }
                
                // Insert record
                $stmt = $db->prepare("
                    INSERT INTO attendance_records 
                    (employee_id, attendance_date, time_in, time_out, status, hours_worked, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $data['employee_id'],
                    $data['date'],
                    $data['time_in'] ?? null,
                    $data['time_out'] ?? null,
                    $data['status'],
                    $hoursWorked,
                    $data['remarks'] ?? ''
                ]);
                
                if ($result) {
                    logAudit($db, 'attendance', 'Manual Attendance Added', 
                        "Added manual attendance for {$data['employee_id']} on {$data['date']} - Status: {$data['status']}", 
                        'fa-plus-circle');
                    jsonResponse(true, 'Attendance record added successfully');
                } else {
                    jsonResponse(false, 'Failed to add attendance record');
                }
            } else {
                // Legacy POST endpoint for compatibility
                $data = json_decode(file_get_contents('php://input'), true);
                
                $hoursWorked = 0;
                if ($data['time_in'] && $data['time_out']) {
                    $hoursWorked = calculateHoursWorked($data['time_in'], $data['time_out']);
                }
                
                $stmt = $db->prepare("
                    INSERT INTO attendance_records 
                    (employee_id, attendance_date, time_in, time_out, status, hours_worked, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $data['employee_id'],
                    $data['date'],
                    $data['time_in'],
                    $data['time_out'],
                    $data['status'],
                    $hoursWorked,
                    $data['remarks'] ?? ''
                ]);
                
                if ($result) {
                    logAudit($db, 'attendance', 'Attendance Added', 
                        "Added attendance for {$data['employee_id']}", 'fa-clock');
                    jsonResponse(true, 'Attendance recorded');
                }
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $hoursWorked = 0;
            if ($data['time_in'] && $data['time_out']) {
                $hoursWorked = calculateHoursWorked($data['time_in'], $data['time_out']);
            }
            
            $stmt = $db->prepare("
                UPDATE attendance_records 
                SET time_in = ?, time_out = ?, status = ?, 
                    hours_worked = ?, remarks = ?
                WHERE attendance_id = ?
            ");
            
            $result = $stmt->execute([
                $data['time_in'],
                $data['time_out'],
                $data['status'],
                $hoursWorked,
                $data['remarks'] ?? '',
                $data['id']
            ]);
            
            if ($result) {
                logAudit($db, 'attendance', 'Attendance Updated', 
                    "Updated attendance record", 'fa-edit');
                jsonResponse(true, 'Attendance updated');
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            
            // Get employee info before deleting
            $stmt = $db->prepare("
                SELECT a.*, e.name as employee_name 
                FROM attendance_records a
                JOIN employees e ON a.employee_id = e.employee_id
                WHERE a.attendance_id = ?
            ");
            $stmt->execute([$id]);
            $record = $stmt->fetch();
            
            if ($record) {
                $stmt = $db->prepare("DELETE FROM attendance_records WHERE attendance_id = ?");
                
                if ($stmt->execute([$id])) {
                    logAudit($db, 'attendance', 'Attendance Deleted', 
                        "Deleted attendance for {$record['employee_name']} ({$record['employee_id']}) on {$record['attendance_date']}", 
                        'fa-trash');
                    jsonResponse(true, 'Attendance deleted');
                }
            } else {
                jsonResponse(false, 'Attendance record not found');
            }
            break;
    }
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred: ' . $e->getMessage());
}
?>