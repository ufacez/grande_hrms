<?php
// api/zkteco-import.php - Import ZKTeco Excel Data
require_once '../config/config.php';
requireLogin();

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        // Check if file was uploaded
        if (!isset($_FILES['excelFile']) || $_FILES['excelFile']['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(false, 'No file uploaded or upload error occurred');
            exit;
        }

        $file = $_FILES['excelFile'];
        $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        // Validate file type
        if (!in_array($fileExt, ['xlsx', 'xls', 'csv'])) {
            jsonResponse(false, 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed');
            exit;
        }

        // Read the file based on type
        if ($fileExt === 'csv') {
            $data = parseCSV($file['tmp_name']);
        } else {
            $data = parseExcel($file['tmp_name']);
        }

        if (empty($data)) {
            jsonResponse(false, 'No data found in file');
            exit;
        }

        // Process and import the data
        $result = importZKTecoData($db, $data);
        
        // Log the import
        logAudit($db, 'attendance', 'ZKTeco Data Import', 
            "Imported {$result['imported']} records. Failed: {$result['failed']}", 
            'fa-file-import');
        
        jsonResponse(true, 'Import completed', $result);
        
    } elseif ($method === 'GET') {
        // Return import statistics
        $action = $_GET['action'] ?? '';
        
        if ($action === 'stats') {
            $stmt = $db->query("
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT employee_id) as unique_employees,
                    MAX(attendance_date) as latest_date,
                    MIN(attendance_date) as earliest_date
                FROM attendance_records
            ");
            $stats = $stmt->fetch();
            jsonResponse(true, 'Statistics retrieved', $stats);
        }
    }
    
} catch (Exception $e) {
    error_log('ZKTeco Import Error: ' . $e->getMessage());
    jsonResponse(false, 'Import failed: ' . $e->getMessage());
}

/**
 * Parse CSV file
 */
function parseCSV($filePath) {
    $data = [];
    $handle = fopen($filePath, 'r');
    
    if ($handle === false) {
        return $data;
    }
    
    // Read header row
    $header = fgetcsv($handle);
    if (!$header) {
        fclose($handle);
        return $data;
    }
    
    // Read data rows
    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) === count($header)) {
            $data[] = array_combine($header, $row);
        }
    }
    
    fclose($handle);
    return $data;
}

/**
 * Parse Excel file using simple PHP
 * This is a basic implementation - for production use SheetJS or PhpSpreadsheet
 */
function parseExcel($filePath) {
    // For Excel files, we'll convert to CSV first
    // In production, use PhpSpreadsheet or similar library
    
    // Simple approach: require CSV export from ZKTeco software
    // Most ZKTeco software can export to CSV format
    
    jsonResponse(false, 'Excel files not yet supported. Please export as CSV from ZKTeco software');
    exit;
}

/**
 * Import ZKTeco data into database
 * Expected CSV format:
 * Employee ID, Name, Date, Time In, Time Out, Status
 */
function importZKTecoData($db, $data) {
    $imported = 0;
    $failed = 0;
    $updated = 0;
    $errors = [];
    
    foreach ($data as $row) {
        try {
            // Map ZKTeco fields to our database
            // Adjust these field names based on your ZKTeco export format
            $employeeId = trim($row['Employee ID'] ?? $row['employee_id'] ?? $row['ID'] ?? '');
            $date = trim($row['Date'] ?? $row['date'] ?? $row['Attendance Date'] ?? '');
            $timeIn = trim($row['Time In'] ?? $row['Check In'] ?? $row['time_in'] ?? '');
            $timeOut = trim($row['Time Out'] ?? $row['Check Out'] ?? $row['time_out'] ?? '');
            
            // Validate required fields
            if (empty($employeeId) || empty($date)) {
                $failed++;
                $errors[] = "Missing employee ID or date in row";
                continue;
            }
            
            // Format date
            $formattedDate = formatDate($date);
            if (!$formattedDate) {
                $failed++;
                $errors[] = "Invalid date format: $date";
                continue;
            }
            
            // Format times
            $formattedTimeIn = formatTime($timeIn);
            $formattedTimeOut = formatTime($timeOut);
            
            // Determine status
            $status = determineStatus($formattedTimeIn, $formattedTimeOut);
            
            // Calculate hours worked
            $hoursWorked = 0;
            if ($formattedTimeIn && $formattedTimeOut) {
                $hoursWorked = calculateHoursWorked($formattedDate, $formattedTimeIn, $formattedTimeOut);
            }
            
            // Check if employee exists
            $stmt = $db->prepare("SELECT employee_id FROM employees WHERE employee_id = ?");
            $stmt->execute([$employeeId]);
            if (!$stmt->fetch()) {
                $failed++;
                $errors[] = "Employee $employeeId not found in system";
                continue;
            }
            
            // Check if record already exists
            $stmt = $db->prepare("
                SELECT attendance_id FROM attendance_records 
                WHERE employee_id = ? AND attendance_date = ?
            ");
            $stmt->execute([$employeeId, $formattedDate]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                // Update existing record
                $stmt = $db->prepare("
                    UPDATE attendance_records 
                    SET time_in = ?, time_out = ?, status = ?, hours_worked = ?,
                        remarks = 'Updated from ZKTeco import',
                        updated_at = NOW()
                    WHERE employee_id = ? AND attendance_date = ?
                ");
                $stmt->execute([
                    $formattedTimeIn,
                    $formattedTimeOut,
                    $status,
                    $hoursWorked,
                    $employeeId,
                    $formattedDate
                ]);
                $updated++;
            } else {
                // Insert new record
                $stmt = $db->prepare("
                    INSERT INTO attendance_records 
                    (employee_id, attendance_date, time_in, time_out, status, hours_worked, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, 'Imported from ZKTeco')
                ");
                $stmt->execute([
                    $employeeId,
                    $formattedDate,
                    $formattedTimeIn,
                    $formattedTimeOut,
                    $status,
                    $hoursWorked
                ]);
                $imported++;
            }
            
        } catch (Exception $e) {
            $failed++;
            $errors[] = $e->getMessage();
            error_log("ZKTeco Import Row Error: " . $e->getMessage());
        }
    }
    
    return [
        'total_rows' => count($data),
        'imported' => $imported,
        'updated' => $updated,
        'failed' => $failed,
        'errors' => array_slice($errors, 0, 10) // Return first 10 errors
    ];
}

/**
 * Format date to Y-m-d
 */
function formatDate($dateStr) {
    if (empty($dateStr)) return null;
    
    // Try common date formats
    $formats = [
        'Y-m-d',
        'd/m/Y',
        'm/d/Y',
        'd-m-Y',
        'm-d-Y',
        'Y/m/d'
    ];
    
    foreach ($formats as $format) {
        $date = DateTime::createFromFormat($format, $dateStr);
        if ($date !== false) {
            return $date->format('Y-m-d');
        }
    }
    
    // Try strtotime as fallback
    $timestamp = strtotime($dateStr);
    if ($timestamp !== false) {
        return date('Y-m-d', $timestamp);
    }
    
    return null;
}

/**
 * Format time to HH:MM:SS
 */
function formatTime($timeStr) {
    if (empty($timeStr)) return null;
    
    // Remove any date part if present
    if (strpos($timeStr, ' ') !== false) {
        $parts = explode(' ', $timeStr);
        $timeStr = end($parts);
    }
    
    // Try common time formats
    $formats = [
        'H:i:s',
        'H:i',
        'h:i:s A',
        'h:i A',
        'g:i:s A',
        'g:i A'
    ];
    
    foreach ($formats as $format) {
        $time = DateTime::createFromFormat($format, $timeStr);
        if ($time !== false) {
            return $time->format('H:i:s');
        }
    }
    
    // Try strtotime as fallback
    $timestamp = strtotime($timeStr);
    if ($timestamp !== false) {
        return date('H:i:s', $timestamp);
    }
    
    return null;
}

/**
 * Determine attendance status based on time in
 */
function determineStatus($timeIn, $timeOut) {
    if (!$timeIn) {
        return 'Absent';
    }
    
    // Standard start time: 08:00
    $standardStart = '08:00:00';
    
    if ($timeIn <= $standardStart) {
        return 'Present';
    } elseif ($timeIn <= '08:15:00') {
        return 'Late';
    } else {
        return 'Late';
    }
}

/**
 * Calculate hours worked (handles overnight shifts)
 */
function calculateHoursWorked($date, $timeIn, $timeOut) {
    if (!$timeIn || !$timeOut) {
        return 0;
    }
    
    $start = new DateTime("$date $timeIn");
    $end = new DateTime("$date $timeOut");
    
    // Handle overnight shift
    if ($end <= $start) {
        $end->modify('+1 day');
    }
    
    $interval = $start->diff($end);
    $hours = $interval->h + ($interval->i / 60);
    
    // Round to nearest 0.5 hour
    return max(0, round($hours * 2) / 2);
}
?>