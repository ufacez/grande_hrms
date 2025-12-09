<?php
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Compute current week start (Saturday)
    $today = new DateTime();
    $weekday = (int)$today->format('w'); // 0 (Sun) - 6 (Sat)
    
    // Calculate days to subtract to get to last Saturday
    if ($weekday === 6) {
        $daysToSubtract = 0; // Already Saturday
    } else if ($weekday === 0) {
        $daysToSubtract = 1; // Sunday
    } else {
        $daysToSubtract = $weekday + 1; // Mon(1)→2, Tue(2)→3, etc.
    }
    
    $currentWeekStart = date('Y-m-d', strtotime("-{$daysToSubtract} days"));
    
    error_log("Today's weekday: $weekday, Days to subtract: $daysToSubtract, Current Saturday: $currentWeekStart");

    if ($action === 'current') {
        $stmt = $db->prepare(
            "SELECT s.*, e.name as employee_name, e.department
            FROM schedules s
            JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? AND s.is_next_week = 0
            ORDER BY e.name, s.day_of_week"
        );
        $stmt->execute([$currentWeekStart]);
        $results = $stmt->fetchAll();
        
        error_log("Current week schedules: " . json_encode($results));
        
        jsonResponse(true, 'Current week schedule retrieved', $results);

    } elseif ($action === 'next') {
        $nextWeekStart = date('Y-m-d', strtotime($currentWeekStart . ' +7 days'));
        
        $stmt = $db->prepare(
            "SELECT s.*, e.name as employee_name, e.department
            FROM schedules s
            JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? AND s.is_next_week = 1
            ORDER BY e.name, s.day_of_week"
        );
        $stmt->execute([$nextWeekStart]);
        $results = $stmt->fetchAll();
        
        error_log("Next week schedules: " . json_encode($results));
        
        jsonResponse(true, 'Next week schedule retrieved', $results);

    } elseif ($action === 'update' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        error_log("Received schedule update data: " . json_encode($data));
        
        if (!isset($data['employee_id']) || !isset($data['week_start']) || 
            !isset($data['day']) || !isset($data['shift_name']) || !isset($data['shift_time'])) {
            jsonResponse(false, 'Missing required fields');
            exit;
        }

        // Check if schedule already exists
        $checkStmt = $db->prepare(
            "SELECT schedule_id FROM schedules 
            WHERE employee_id = ? AND week_start_date = ? AND day_of_week = ? AND is_next_week = ?"
        );
        $checkStmt->execute([
            $data['employee_id'],
            $data['week_start'],
            $data['day'],
            $data['is_next_week'] ?? 0
        ]);
        
        $existing = $checkStmt->fetch();
        
        if ($existing) {
            // Update existing schedule
            $stmt = $db->prepare(
                "UPDATE schedules 
                SET shift_name = ?, shift_time = ?, updated_at = NOW()
                WHERE schedule_id = ?"
            );
            
            $result = $stmt->execute([
                $data['shift_name'],
                $data['shift_time'],
                $existing['schedule_id']
            ]);
        } else {
            // Insert new schedule
            $stmt = $db->prepare(
                "INSERT INTO schedules 
                (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week)
                VALUES (?, ?, ?, ?, ?, ?)"
            );
            
            $result = $stmt->execute([
                $data['employee_id'],
                $data['week_start'],
                $data['day'],
                $data['shift_name'],
                $data['shift_time'],
                $data['is_next_week'] ?? 0
            ]);
        }

        if ($result) {
            error_log("Schedule updated successfully for employee " . $data['employee_id']);
            
            logAudit($db, 'system', 'Schedule Updated', 
                "Updated schedule for employee {$data['employee_id']} - Day {$data['day']}: {$data['shift_name']}", 
                'fa-calendar');
            
            jsonResponse(true, 'Schedule updated successfully');
        } else {
            error_log("Failed to update schedule");
            jsonResponse(false, 'Failed to update schedule');
        }

    } elseif ($action === 'copy' && $method === 'POST') {
        // Copy current week schedules to next week (overwrite)
        $nextWeekStart = date('Y-m-d', strtotime($currentWeekStart . ' +7 days'));

        try {
            $db->beginTransaction();

            // Delete existing next week schedules
            $del = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 1");
            $del->execute([$nextWeekStart]);

            // Copy current week entries to next week
            $sel = $db->prepare(
                "SELECT employee_id, day_of_week, shift_name, shift_time 
                FROM schedules 
                WHERE week_start_date = ? AND is_next_week = 0"
            );
            $sel->execute([$currentWeekStart]);
            $rows = $sel->fetchAll();

            $ins = $db->prepare(
                "INSERT INTO schedules 
                (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week) 
                VALUES (?, ?, ?, ?, ?, 1)"
            );
            
            foreach ($rows as $r) {
                $ins->execute([
                    $r['employee_id'], 
                    $nextWeekStart, 
                    $r['day_of_week'], 
                    $r['shift_name'], 
                    $r['shift_time']
                ]);
            }

            $db->commit();
            
            logAudit($db, 'system', 'Schedule Copied', 
                "Copied schedules from {$currentWeekStart} to {$nextWeekStart}", 
                'fa-calendar');
            
            jsonResponse(true, 'Schedule copied to next week');
        } catch (Exception $e) {
            $db->rollBack();
            error_log("Copy schedule error: " . $e->getMessage());
            jsonResponse(false, 'Failed to copy schedule: ' . $e->getMessage());
        }

    } elseif ($action === 'clear' && $method === 'POST') {
        // Clear next week schedule
        $nextWeekStart = date('Y-m-d', strtotime($currentWeekStart . ' +7 days'));
        
        try {
            $stmt = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 1");
            $stmt->execute([$nextWeekStart]);
            
            logAudit($db, 'system', 'Schedule Cleared', 
                "Cleared schedules for {$nextWeekStart}", 
                'fa-calendar');
            
            jsonResponse(true, 'Next week schedule cleared');
        } catch (Exception $e) {
            error_log("Clear schedule error: " . $e->getMessage());
            jsonResponse(false, 'Failed to clear schedule: ' . $e->getMessage());
        }

    } else {
        jsonResponse(false, 'Invalid action or method');
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    jsonResponse(false, 'Database error: ' . $e->getMessage());
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    jsonResponse(false, 'An error occurred: ' . $e->getMessage());
}
?>