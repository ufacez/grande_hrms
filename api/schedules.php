<?php
// api/schedules.php - FIXED VERSION with better error handling
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Enable detailed error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set JSON header
header('Content-Type: application/json');

try {
    // Compute current week start (Saturday)
    $today = new DateTime();
    $weekday = (int)$today->format('w');
    
    if ($weekday === 6) {
        $daysToSubtract = 0;
    } else if ($weekday === 0) {
        $daysToSubtract = 1;
    } else {
        $daysToSubtract = $weekday + 1;
    }
    
    $currentWeekStart = date('Y-m-d', strtotime("-{$daysToSubtract} days"));
    $nextWeekStart = date('Y-m-d', strtotime($currentWeekStart . ' +7 days'));
    
    error_log("=== SCHEDULE API ===");
    error_log("Action: $action");
    error_log("Method: $method");
    error_log("Current Saturday: $currentWeekStart");
    error_log("Next Saturday: $nextWeekStart");

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
        
        jsonResponse(true, 'Next week schedule retrieved', $results);

    } elseif ($action === 'update' && $method === 'POST') {
        // FIXED UPDATE LOGIC
        $rawInput = file_get_contents('php://input');
        error_log("Raw input: " . $rawInput);
        
        $data = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON decode error: " . json_last_error_msg());
            jsonResponse(false, 'Invalid JSON data');
            exit;
        }
        
        error_log("Decoded data: " . print_r($data, true));
        
        // Validate required fields
        if (!isset($data['employee_id']) || !isset($data['week_start']) || 
            !isset($data['day']) || !isset($data['shift_name']) || !isset($data['shift_time'])) {
            error_log("Missing required fields");
            jsonResponse(false, 'Missing required fields: employee_id, week_start, day, shift_name, shift_time');
            exit;
        }

        $employeeId = $data['employee_id'];
        $weekStart = $data['week_start'];
        $dayOfWeek = (int)$data['day'];
        $shiftName = $data['shift_name'];
        $shiftTime = $data['shift_time'];
        $isNextWeek = isset($data['is_next_week']) ? (int)$data['is_next_week'] : 0;

        error_log("Processing update:");
        error_log("  Employee ID: $employeeId");
        error_log("  Week Start: $weekStart");
        error_log("  Day: $dayOfWeek");
        error_log("  Shift: $shiftName");
        error_log("  Is Next Week: $isNextWeek");

        // Check if schedule already exists - FIXED to prevent duplicates
        $checkStmt = $db->prepare("
            SELECT schedule_id, shift_name, shift_time FROM schedules 
            WHERE employee_id = ? 
            AND week_start_date = ? 
            AND day_of_week = ? 
            AND is_next_week = ?
        ");
        $checkStmt->execute([$employeeId, $weekStart, $dayOfWeek, $isNextWeek]);
        $existing = $checkStmt->fetch();
        
        error_log("Check existing - employee_id: $employeeId, week_start: $weekStart, day: $dayOfWeek, is_next: $isNextWeek");
        error_log("Existing record: " . ($existing ? "Found (ID: {$existing['schedule_id']})" : "Not found"));
        
        if ($existing) {
            // UPDATE existing schedule
            error_log("Updating existing schedule_id: " . $existing['schedule_id']);
            
            $updateStmt = $db->prepare("
                UPDATE schedules 
                SET shift_name = ?, 
                    shift_time = ?, 
                    updated_at = NOW()
                WHERE schedule_id = ?
            ");
            
            $result = $updateStmt->execute([
                $shiftName,
                $shiftTime,
                $existing['schedule_id']
            ]);
            
            if ($result) {
                error_log("✅ Successfully updated schedule");
                logAudit($db, 'system', 'Schedule Updated', 
                    "Updated schedule for employee {$employeeId} - Day {$dayOfWeek}: {$shiftName}", 
                    'fa-calendar');
                jsonResponse(true, 'Schedule updated successfully');
            } else {
                error_log("❌ Failed to update schedule");
                $errorInfo = $updateStmt->errorInfo();
                error_log("PDO Error: " . print_r($errorInfo, true));
                jsonResponse(false, 'Failed to update schedule: ' . $errorInfo[2]);
            }
        } else {
            // INSERT new schedule
            error_log("Inserting new schedule entry");
            
            $insertStmt = $db->prepare("
                INSERT INTO schedules 
                (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $result = $insertStmt->execute([
                $employeeId,
                $weekStart,
                $dayOfWeek,
                $shiftName,
                $shiftTime,
                $isNextWeek
            ]);
            
            if ($result) {
                error_log("✅ Successfully inserted new schedule");
                logAudit($db, 'system', 'Schedule Created', 
                    "Created schedule for employee {$employeeId} - Day {$dayOfWeek}: {$shiftName}", 
                    'fa-calendar');
                jsonResponse(true, 'Schedule created successfully');
            } else {
                error_log("❌ Failed to insert schedule");
                $errorInfo = $insertStmt->errorInfo();
                error_log("PDO Error: " . print_r($errorInfo, true));
                jsonResponse(false, 'Failed to create schedule: ' . $errorInfo[2]);
            }
        }

    } elseif ($action === 'copy' && $method === 'POST') {
        // Copy current week schedules to next week
        try {
            $db->beginTransaction();

            // Delete existing next week schedules
            $delStmt = $db->prepare("DELETE FROM schedules WHERE week_start_date = ? AND is_next_week = 1");
            $delStmt->execute([$nextWeekStart]);
            
            error_log("Deleted old next week schedules");

            // Copy current week entries to next week
            $selStmt = $db->prepare("
                SELECT employee_id, day_of_week, shift_name, shift_time 
                FROM schedules 
                WHERE week_start_date = ? AND is_next_week = 0
            ");
            $selStmt->execute([$currentWeekStart]);
            $rows = $selStmt->fetchAll();
            
            error_log("Found " . count($rows) . " schedules to copy");

            if (count($rows) === 0) {
                $db->rollBack();
                jsonResponse(false, 'No schedules found to copy');
                exit;
            }

            $insStmt = $db->prepare("
                INSERT INTO schedules 
                (employee_id, week_start_date, day_of_week, shift_name, shift_time, is_next_week) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            
            foreach ($rows as $r) {
                $insStmt->execute([
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

    } else {
        error_log("Invalid action or method: $action / $method");
        jsonResponse(false, 'Invalid action or method');
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    jsonResponse(false, 'Database error occurred: ' . $e->getMessage());
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    jsonResponse(false, 'An error occurred: ' . $e->getMessage());
}
?>