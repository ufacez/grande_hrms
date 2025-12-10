<?php
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display to user
ini_set('log_errors', 1);

// Set JSON header
header('Content-Type: application/json');

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
    $nextWeekStart = date('Y-m-d', strtotime($currentWeekStart . ' +7 days'));
    
    error_log("=== SCHEDULE API DEBUG ===");
    error_log("Today: " . $today->format('Y-m-d') . " (day " . $weekday . ")");
    error_log("Days to subtract: $daysToSubtract");
    error_log("Current Saturday: $currentWeekStart");
    error_log("Next Saturday: $nextWeekStart");
    error_log("Action: $action");

    if ($action === 'current') {
        // Fetch current week schedules
        $stmt = $db->prepare("
            SELECT 
                s.schedule_id,
                s.employee_id,
                s.day_of_week,
                s.shift_name,
                s.shift_time,
                s.is_next_week,
                s.week_start_date,
                e.name as employee_name,
                e.department
            FROM schedules s
            INNER JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? 
            AND s.is_next_week = 0
            AND e.status = 'Active'
            ORDER BY e.name, s.day_of_week
        ");
        
        $stmt->execute([$currentWeekStart]);
        $results = $stmt->fetchAll();
        
        error_log("Current week query returned: " . count($results) . " rows");
        error_log("SQL: week_start_date = '$currentWeekStart' AND is_next_week = 0");
        
        // Debug: Check what dates exist in database
        $debugStmt = $db->query("
            SELECT DISTINCT week_start_date, is_next_week, COUNT(*) as count 
            FROM schedules 
            GROUP BY week_start_date, is_next_week
        ");
        $debugResults = $debugStmt->fetchAll();
        error_log("Available dates in DB: " . json_encode($debugResults));
        
        jsonResponse(true, 'Current week schedule retrieved', $results);

    } elseif ($action === 'next') {
        // Fetch next week schedules
        $stmt = $db->prepare("
            SELECT 
                s.schedule_id,
                s.employee_id,
                s.day_of_week,
                s.shift_name,
                s.shift_time,
                s.is_next_week,
                s.week_start_date,
                e.name as employee_name,
                e.department
            FROM schedules s
            INNER JOIN employees e ON s.employee_id = e.employee_id
            WHERE s.week_start_date = ? 
            AND s.is_next_week = 1
            AND e.status = 'Active'
            ORDER BY e.name, s.day_of_week
        ");
        
        $stmt->execute([$nextWeekStart]);
        $results = $stmt->fetchAll();
        
        error_log("Next week query returned: " . count($results) . " rows");
        error_log("SQL: week_start_date = '$nextWeekStart' AND is_next_week = 1");
        
        jsonResponse(true, 'Next week schedule retrieved', $results);

    } elseif ($action === 'update' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        error_log("Update request data: " . json_encode($data));
        
        if (!isset($data['employee_id']) || !isset($data['week_start']) || 
            !isset($data['day']) || !isset($data['shift_name']) || !isset($data['shift_time'])) {
            jsonResponse(false, 'Missing required fields');
            exit;
        }

        // Check if schedule already exists
        $checkStmt = $db->prepare("
            SELECT schedule_id FROM schedules 
            WHERE employee_id = ? 
            AND week_start_date = ? 
            AND day_of_week = ? 
            AND is_next_week = ?
        ");
        $checkStmt->execute([
            $data['employee_id'],
            $data['week_start'],
            $data['day'],
            $data['is_next_week'] ?? 0
        ]);
        
        $existing = $checkStmt->fetch();
        
        if ($existing) {
            // Update existing schedule
            $stmt = $db->prepare("
                UPDATE schedules 
                SET shift_name = ?, shift_time = ?, updated_at = NOW()
                WHERE schedule_id = ?
            ");
            
            $result = $stmt->execute([
                $data['shift_name'],
                $data['shift_time'],
                $existing['schedule_id']
            ]);
            
            error_log("Updated schedule_id: " . $existing['schedule_id']);
        } else {
            // Insert new schedule
            $stmt = $db->prepare("
                INSERT INTO schedules 
                (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $data['employee_id'],
                $data['week_start'],
                $data['day'],
                $data['shift_name'],
                $data['shift_time'],
                $data['is_next_week'] ?? 0
            ]);
            
            error_log("Inserted new schedule for employee: " . $data['employee_id']);
        }

        if ($result) {
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
        try {
            $db->beginTransaction();

            // Delete existing next week schedules
            $del = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 1");
            $del->execute([$nextWeekStart]);
            
            error_log("Deleted old next week schedules");

            // Copy current week entries to next week
            $sel = $db->prepare("
                SELECT employee_id, day_of_week, shift_name, shift_time 
                FROM schedules 
                WHERE week_start_date = ? AND is_next_week = 0
            ");
            $sel->execute([$currentWeekStart]);
            $rows = $sel->fetchAll();
            
            error_log("Found " . count($rows) . " schedules to copy");

            if (count($rows) === 0) {
                $db->rollBack();
                jsonResponse(false, 'No schedules found to copy. Please create current week schedule first.');
                exit;
            }

            $ins = $db->prepare("
                INSERT INTO schedules 
                (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            
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
            
            error_log("Successfully copied " . count($rows) . " schedules");
            
            logAudit($db, 'system', 'Schedule Copied', 
                "Copied schedules from {$currentWeekStart} to {$nextWeekStart}", 
                'fa-calendar');
            
            jsonResponse(true, 'Schedule copied to next week successfully');
        } catch (Exception $e) {
            $db->rollBack();
            error_log("Copy schedule error: " . $e->getMessage());
            jsonResponse(false, 'Failed to copy schedule: ' . $e->getMessage());
        }

    } elseif ($action === 'clear' && $method === 'POST') {
        // Clear next week schedule
        try {
            $stmt = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 1");
            $stmt->execute([$nextWeekStart]);
            
            error_log("Cleared next week schedules for: $nextWeekStart");
            
            logAudit($db, 'system', 'Schedule Cleared', 
                "Cleared schedules for {$nextWeekStart}", 
                'fa-calendar');
            
            jsonResponse(true, 'Next week schedule cleared');
        } catch (Exception $e) {
            error_log("Clear schedule error: " . $e->getMessage());
            jsonResponse(false, 'Failed to clear schedule: ' . $e->getMessage());
        }

    } elseif ($action === 'populate_sample' && $method === 'POST') {
        // HELPER: Populate sample schedules for testing
        try {
            $db->beginTransaction();
            
            // Get all active employees
            $empStmt = $db->query("SELECT employee_id FROM employees WHERE status = 'Active'");
            $employees = $empStmt->fetchAll();
            
            if (count($employees) === 0) {
                $db->rollBack();
                jsonResponse(false, 'No active employees found');
                exit;
            }
            
            // Delete existing schedules for current week
            $delStmt = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 0");
            $delStmt->execute([$currentWeekStart]);
            
            // Insert sample schedules
            $shifts = [
                ['Morning', '6:00 AM - 2:00 PM'],
                ['Afternoon', '2:00 PM - 10:00 PM'],
                ['Night', '10:00 PM - 6:00 AM']
            ];
            
            $insStmt = $db->prepare("
                INSERT INTO schedules 
                (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week)
                VALUES (?, ?, ?, ?, ?, 0)
            ");
            
            $count = 0;
            foreach ($employees as $emp) {
                for ($day = 0; $day < 7; $day++) {
                    if ($day === 6) { // Friday off
                        $insStmt->execute([
                            $emp['employee_id'],
                            $currentWeekStart,
                            $day,
                            'Off',
                            'Day Off'
                        ]);
                    } else {
                        $shiftIndex = ($day + array_search($emp['employee_id'], array_column($employees, 'employee_id'))) % 3;
                        $shift = $shifts[$shiftIndex];
                        $insStmt->execute([
                            $emp['employee_id'],
                            $currentWeekStart,
                            $day,
                            $shift[0],
                            $shift[1]
                        ]);
                    }
                    $count++;
                }
            }
            
            $db->commit();
            
            jsonResponse(true, "Populated $count sample schedules for current week", [
                'week_start' => $currentWeekStart,
                'employees' => count($employees),
                'schedules' => $count
            ]);
            
        } catch (Exception $e) {
            $db->rollBack();
            error_log("Populate error: " . $e->getMessage());
            jsonResponse(false, 'Failed to populate: ' . $e->getMessage());
        }

    } else {
        jsonResponse(false, 'Invalid action or method');
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    jsonResponse(false, 'Database error occurred');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    jsonResponse(false, 'An error occurred');
}
?>