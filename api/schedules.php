<?php
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($action === 'current') {
        $weekStart = date('Y-m-d', strtotime('last saturday'));
        
        $stmt = $db->prepare("
            SELECT s.*, e.name as employee_name
            FROM schedules s
            JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? AND s.is_next_week = 0
            ORDER BY s.employee_id, s.day_of_week
        ");
        $stmt->execute([$weekStart]);
        jsonResponse(true, 'Schedule retrieved', $stmt->fetchAll());
        
    } elseif ($action === 'next') {
        $weekStart = date('Y-m-d', strtotime('next saturday'));
        
        $stmt = $db->prepare("
            SELECT s.*, e.name as employee_name
            FROM schedules s
            JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? AND s.is_next_week = 1
            ORDER BY s.employee_id, s.day_of_week
        ");
        $stmt->execute([$weekStart]);
        jsonResponse(true, 'Schedule retrieved', $stmt->fetchAll());
        
    } elseif ($action === 'update' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("
            INSERT INTO schedules 
            (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            shift_name = VALUES(shift_name), 
            shift_time = VALUES(shift_time)
        ");
        
        $result = $stmt->execute([
            $data['employee_id'],
            $data['week_start'],
            $data['day'],
            $data['shift_name'],
            $data['shift_time'],
            $data['is_next_week']
        ]);
        
        if ($result) {
            logAudit($db, 'system', 'Schedule Updated', 
                "Updated schedule for {$data['employee_id']}", 'fa-calendar');
            jsonResponse(true, 'Schedule updated');
        }
    }
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred');
}
?>