<?php
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    // Compute current week start (Saturday). If today is Saturday use today, else use last Saturday
    $today = new DateTime();
    $weekday = (int)$today->format('w'); // 0 (Sun) - 6 (Sat)
    if ($weekday === 6) {
        $currentWeekStart = $today->format('Y-m-d');
    } else {
        $currentWeekStart = date('Y-m-d', strtotime('last saturday'));
    }

    if ($action === 'current') {
        $stmt = $db->prepare(
            "SELECT s.*, e.name as employee_name
            FROM schedules s
            JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? AND s.is_next_week = 0
            ORDER BY s.employee_id, s.day_of_week"
        );
        $stmt->execute([$currentWeekStart]);
        jsonResponse(true, 'Schedule retrieved', $stmt->fetchAll());

    } elseif ($action === 'next') {
        $nextWeekStart = (new DateTime($currentWeekStart))->modify('+7 days')->format('Y-m-d');
        $stmt = $db->prepare(
            "SELECT s.*, e.name as employee_name
            FROM schedules s
            JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? AND s.is_next_week = 1
            ORDER BY s.employee_id, s.day_of_week"
        );
        $stmt->execute([$nextWeekStart]);
        jsonResponse(true, 'Schedule retrieved', $stmt->fetchAll());

    } elseif ($action === 'update' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $db->prepare(
            "INSERT INTO schedules 
            (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            shift_name = VALUES(shift_name), 
            shift_time = VALUES(shift_time)"
        );

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
        } else {
            jsonResponse(false, 'Failed to update schedule');
        }

    } elseif ($action === 'copy' && $method === 'POST') {
        // Copy current week schedules to next week (overwrite)
        $nextWeekStart = (new DateTime($currentWeekStart))->modify('+7 days')->format('Y-m-d');

        try {
            $db->beginTransaction();

            // Delete existing next week schedules to overwrite
            $del = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 1");
            $del->execute([$nextWeekStart]);

            // Copy current week entries to next week
            $sel = $db->prepare("SELECT employee_id, day_of_week, shift_name, shift_time FROM schedules WHERE week_start_date = ? AND is_next_week = 0");
            $sel->execute([$currentWeekStart]);
            $rows = $sel->fetchAll();

            $ins = $db->prepare("INSERT INTO schedules (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week) VALUES (?, ?, ?, ?, ?, 1)");
            foreach ($rows as $r) {
                $ins->execute([$r['employee_id'], $nextWeekStart, $r['day_of_week'], $r['shift_name'], $r['shift_time']]);
            }

            $db->commit();
            logAudit($db, 'system', 'Schedule Copied', "Copied schedules from {$currentWeekStart} to {$nextWeekStart}", 'fa-calendar');
            jsonResponse(true, 'Schedule copied to next week');
        } catch (Exception $e) {
            $db->rollBack();
            error_log($e->getMessage());
            jsonResponse(false, 'Failed to copy schedule');
        }

    } elseif ($action === 'clear' && $method === 'POST') {
        // Clear next week schedule
        $nextWeekStart = (new DateTime($currentWeekStart))->modify('+7 days')->format('Y-m-d');
        try {
            $stmt = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 1");
            $stmt->execute([$nextWeekStart]);
            logAudit($db, 'system', 'Schedule Cleared', "Cleared schedules for {$nextWeekStart}", 'fa-calendar');
            jsonResponse(true, 'Next week schedule cleared');
        } catch (Exception $e) {
            error_log($e->getMessage());
            jsonResponse(false, 'Failed to clear schedule');
        }

    } else {
        jsonResponse(false, 'Invalid action');
    }

} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred');
}
?>