<?php require_once '../config/config.php';
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
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                jsonResponse(true, 'Attendance retrieved', $stmt->fetchAll());
                
            } elseif ($action === 'stats') {
                $stmt = $db->query("SELECT * FROM todays_attendance");
                jsonResponse(true, 'Stats retrieved', $stmt->fetch());
            }
            break;
            
        case 'POST':
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
            $stmt = $db->prepare("DELETE FROM attendance_records WHERE attendance_id = ?");
            
            if ($stmt->execute([$id])) {
                logAudit($db, 'attendance', 'Attendance Deleted', 
                    "Deleted attendance record", 'fa-trash');
                jsonResponse(true, 'Attendance deleted');
            }
            break;
    }
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred');
}
?>