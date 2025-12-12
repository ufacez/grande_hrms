<?php
// api/zkteco-import.php - FIXED FOR ZKTECO TRANSACTION REPORT FORMAT
error_reporting(0);
ini_set('display_errors', '0');

require_once '../config/config.php';
requireLogin();

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        if (!isset($_FILES['excelFile']) || $_FILES['excelFile']['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(false, 'No file uploaded or upload error occurred');
            exit;
        }

        $file = $_FILES['excelFile'];
        $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if ($fileExt !== 'csv') {
            jsonResponse(false, 'Please upload CSV files only. To convert Excel: File → Save As → CSV (Comma delimited)');
            exit;
        }

        $data = parseCSV($file['tmp_name']);

        if (empty($data)) {
            jsonResponse(false, 'No data found in CSV file');
            exit;
        }

        $result = importZKTecoData($db, $data);
        
        logAudit($db, 'attendance', 'ZKTeco Data Import', 
            "Imported {$result['imported']} records. Updated: {$result['updated']}. Failed: {$result['failed']}", 
            'fa-file-import');
        
        jsonResponse(true, 'Import completed', $result);
        
    } elseif ($method === 'GET') {
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
        throw new Exception('Cannot open CSV file');
    }
    
    // Read header row
    $header = fgetcsv($handle);
    if (!$header) {
        fclose($handle);
        throw new Exception('CSV file is empty or has no header');
    }
    
    // Clean header - remove BOM, quotes, whitespace
    $header = array_map(function($h) {
        $h = trim($h);
        $h = str_replace("\xEF\xBB\xBF", '', $h); // Remove UTF-8 BOM
        $h = trim($h, " \t\n\r\0\x0B\"'");
        return $h;
    }, $header);
    
    // Read data rows
    $rowCount = 0;
    while (($row = fgetcsv($handle)) !== false) {
        $rowCount++;
        
        // Skip empty rows
        if (empty(array_filter($row))) {
            continue;
        }
        
        // Ensure row has same number of columns as header
        if (count($row) < count($header)) {
            $row = array_pad($row, count($header), '');
        } elseif (count($row) > count($header)) {
            $row = array_slice($row, 0, count($header));
        }
        
        // Combine with header
        $rowData = array_combine($header, $row);
        
        // Clean values
        $rowData = array_map(function($v) {
            return trim($v, " \t\n\r\0\x0B\"'");
        }, $rowData);
        
        // Skip rows with all empty values
        if (!empty(array_filter($rowData))) {
            $data[] = $rowData;
        }
    }
    
    fclose($handle);
    
    if (empty($data)) {
        throw new Exception("CSV file contains no valid data rows");
    }
    
    return $data;
}

/**
 * Import ZKTeco data with format detection
 */
function importZKTecoData($db, $data) {
    if (empty($data)) {
        return [
            'total_rows' => 0,
            'imported' => 0,
            'updated' => 0,
            'failed' => 0,
            'errors' => ['No data provided']
        ];
    }
    
    // Detect format by checking column names
    $firstRow = $data[0];
    $columns = array_keys($firstRow);
    
    // Check if it's ZKTeco Transaction Report format
    $isTransactionReport = false;
    foreach ($columns as $col) {
        $colLower = strtolower($col);
        if (strpos($colLower, 'person id') !== false || 
            strpos($colLower, 'person name') !== false ||
            strpos($colLower, 'punch time') !== false) {
            $isTransactionReport = true;
            break;
        }
    }
    
    if ($isTransactionReport) {
        return importTransactionReport($db, $data);
    } else {
        return importStandardFormat($db, $data);
    }
}

/**
 * Import ZKTeco Transaction Report format
 * Columns: Person ID, Person Name, Department, Type, Source, Punch Time, Time Zone, Verification Mode, Mobile Punch, Device SN, Device Name, Upload Time
 */
function importTransactionReport($db, $data) {
    $imported = 0;
    $updated = 0;
    $failed = 0;
    $errors = [];
    $checkInRecords = [];
    
    foreach ($data as $index => $row) {
        try {
            $rowNum = $index + 2;
            
            // Get Person ID (exact column name from your export)
            $personId = trim($row['Person ID'] ?? '');
            
            // Get Person Name (exact column name from your export)
            $personName = trim($row['Person Name'] ?? '');
            
            // Get Punch Time (exact column name from your export)
            $punchTime = trim($row['Punch Time'] ?? '');
            
            if (empty($personId)) {
                $failed++;
                $errors[] = "Row $rowNum: Missing Person ID";
                continue;
            }
            
            if (empty($punchTime)) {
                $failed++;
                $errors[] = "Row $rowNum: Missing Punch Time";
                continue;
            }
            
            // Parse punch time - ZKTeco format is typically "YYYY-MM-DD HH:MM:SS"
            $timestamp = strtotime($punchTime);
            if ($timestamp === false) {
                $failed++;
                $errors[] = "Row $rowNum: Invalid Punch Time format: $punchTime";
                continue;
            }
            
            $date = date('Y-m-d', $timestamp);
            $time = date('H:i:s', $timestamp);
            
            // Find employee in system
            $employeeId = findEmployeeId($db, $personId, $personName);
            
            if (!$employeeId) {
                // Try to find by partial name match
                if (!empty($personName)) {
                    $stmt = $db->prepare("SELECT employee_id FROM employees WHERE name LIKE ? AND status = 'Active' LIMIT 1");
                    $stmt->execute(["%$personName%"]);
                    $result = $stmt->fetch();
                    if ($result) {
                        $employeeId = $result['employee_id'];
                    }
                }
                
                if (!$employeeId) {
                    $failed++;
                    $errors[] = "Row $rowNum: Employee not found - Person ID: $personId, Name: $personName";
                    continue;
                }
            }
            
            // Group punches by employee and date
            $recordKey = $employeeId . '|' . $date;
            
            if (!isset($checkInRecords[$recordKey])) {
                $checkInRecords[$recordKey] = [
                    'employee_id' => $employeeId,
                    'date' => $date,
                    'punches' => []
                ];
            }
            
            $checkInRecords[$recordKey]['punches'][] = $time;
            
        } catch (Exception $e) {
            $failed++;
            $errors[] = "Row $rowNum: " . $e->getMessage();
        }
    }
    
    // Process grouped punch records
    foreach ($checkInRecords as $record) {
        try {
            $employeeId = $record['employee_id'];
            $date = $record['date'];
            $punches = $record['punches'];
            
            // Sort punches chronologically
            sort($punches);
            
            // First punch = Time In, Last punch = Time Out
            $timeIn = $punches[0];
            $timeOut = count($punches) > 1 ? $punches[count($punches) - 1] : null;
            
            // Determine status
            $status = determineStatus($timeIn, $timeOut);
            
            // Calculate hours worked
            $hoursWorked = 0;
            if ($timeIn && $timeOut) {
                $hoursWorked = calculateHoursWorked($timeIn, $timeOut);
            }
            
            // Check if record already exists
            $stmt = $db->prepare("
                SELECT attendance_id FROM attendance_records 
                WHERE employee_id = ? AND attendance_date = ?
            ");
            $stmt->execute([$employeeId, $date]);
            
            if ($stmt->fetch()) {
                // Update existing record
                $stmt = $db->prepare("
                    UPDATE attendance_records 
                    SET time_in = ?, time_out = ?, status = ?, hours_worked = ?,
                        remarks = CONCAT('Updated from ZKTeco - ', ?, ' punches'),
                        updated_at = NOW()
                    WHERE employee_id = ? AND attendance_date = ?
                ");
                $stmt->execute([$timeIn, $timeOut, $status, $hoursWorked, count($punches), $employeeId, $date]);
                $updated++;
            } else {
                // Insert new record
                $stmt = $db->prepare("
                    INSERT INTO attendance_records 
                    (employee_id, attendance_date, time_in, time_out, status, hours_worked, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $employeeId, 
                    $date, 
                    $timeIn, 
                    $timeOut, 
                    $status, 
                    $hoursWorked,
                    'Imported from ZKTeco - ' . count($punches) . ' punches'
                ]);
                $imported++;
            }
            
        } catch (Exception $e) {
            $failed++;
            $errors[] = "Processing error for $employeeId on $date: " . $e->getMessage();
        }
    }
    
    return [
        'total_rows' => count($data),
        'imported' => $imported,
        'updated' => $updated,
        'failed' => $failed,
        'errors' => array_slice($errors, 0, 20)
    ];
}

/**
 * Import Standard format (Employee ID, Date, Time In, Time Out)
 */
function importStandardFormat($db, $data) {
    $imported = 0;
    $updated = 0;
    $failed = 0;
    $errors = [];
    
    foreach ($data as $index => $row) {
        try {
            $rowNum = $index + 2;
            
            $employeeId = trim($row['Employee ID'] ?? $row['employee_id'] ?? $row['ID'] ?? '');
            $date = trim($row['Date'] ?? $row['date'] ?? $row['Attendance Date'] ?? '');
            $timeIn = trim($row['Time In'] ?? $row['time_in'] ?? $row['Check In'] ?? '');
            $timeOut = trim($row['Time Out'] ?? $row['time_out'] ?? $row['Check Out'] ?? '');
            
            if (empty($employeeId) || empty($date)) {
                $failed++;
                $errors[] = "Row $rowNum: Missing employee ID or date";
                continue;
            }
            
            // Parse date
            $dateTimestamp = strtotime($date);
            if ($dateTimestamp === false) {
                $failed++;
                $errors[] = "Row $rowNum: Invalid date format: $date";
                continue;
            }
            $formattedDate = date('Y-m-d', $dateTimestamp);
            
            // Parse times
            $formattedTimeIn = null;
            $formattedTimeOut = null;
            
            if (!empty($timeIn)) {
                $timeInTimestamp = strtotime($timeIn);
                if ($timeInTimestamp !== false) {
                    $formattedTimeIn = date('H:i:s', $timeInTimestamp);
                }
            }
            
            if (!empty($timeOut)) {
                $timeOutTimestamp = strtotime($timeOut);
                if ($timeOutTimestamp !== false) {
                    $formattedTimeOut = date('H:i:s', $timeOutTimestamp);
                }
            }
            
            $status = determineStatus($formattedTimeIn, $formattedTimeOut);
            
            $hoursWorked = 0;
            if ($formattedTimeIn && $formattedTimeOut) {
                $hoursWorked = calculateHoursWorked($formattedTimeIn, $formattedTimeOut);
            }
            
            // Check if employee exists
            $stmt = $db->prepare("SELECT employee_id FROM employees WHERE employee_id = ?");
            $stmt->execute([$employeeId]);
            if (!$stmt->fetch()) {
                $failed++;
                $errors[] = "Row $rowNum: Employee $employeeId not found";
                continue;
            }
            
            // Check if record exists
            $stmt = $db->prepare("
                SELECT attendance_id FROM attendance_records 
                WHERE employee_id = ? AND attendance_date = ?
            ");
            $stmt->execute([$employeeId, $formattedDate]);
            
            if ($stmt->fetch()) {
                $stmt = $db->prepare("
                    UPDATE attendance_records 
                    SET time_in = ?, time_out = ?, status = ?, hours_worked = ?,
                        remarks = 'Updated from import', updated_at = NOW()
                    WHERE employee_id = ? AND attendance_date = ?
                ");
                $stmt->execute([$formattedTimeIn, $formattedTimeOut, $status, $hoursWorked, 
                               $employeeId, $formattedDate]);
                $updated++;
            } else {
                $stmt = $db->prepare("
                    INSERT INTO attendance_records 
                    (employee_id, attendance_date, time_in, time_out, status, hours_worked, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, 'Imported from CSV')
                ");
                $stmt->execute([$employeeId, $formattedDate, $formattedTimeIn, $formattedTimeOut, 
                               $status, $hoursWorked]);
                $imported++;
            }
            
        } catch (Exception $e) {
            $failed++;
            $errors[] = "Row $rowNum: " . $e->getMessage();
        }
    }
    
    return [
        'total_rows' => count($data),
        'imported' => $imported,
        'updated' => $updated,
        'failed' => $failed,
        'errors' => array_slice($errors, 0, 20)
    ];
}

/**
 * Find employee ID by ZKTeco Person ID or name
 */
function findEmployeeId($db, $personId, $personName) {
    // 1. Try ZKTeco mapping table first
    $stmt = $db->prepare("SELECT employee_id FROM zkteco_mapping WHERE zkteco_id = ?");
    $stmt->execute([$personId]);
    $result = $stmt->fetch();
    if ($result) {
        return $result['employee_id'];
    }
    
    // 2. Try direct employee ID match
    $stmt = $db->prepare("SELECT employee_id FROM employees WHERE employee_id = ? AND status = 'Active'");
    $stmt->execute([$personId]);
    $result = $stmt->fetch();
    if ($result) {
        return $result['employee_id'];
    }
    
    // 3. Try exact name match
    if (!empty($personName)) {
        $stmt = $db->prepare("SELECT employee_id FROM employees WHERE name = ? AND status = 'Active'");
        $stmt->execute([$personName]);
        $result = $stmt->fetch();
        if ($result) {
            return $result['employee_id'];
        }
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
    
    // Consider on-time if checked in by 8:00 AM
    if ($timeIn <= '08:00:00') {
        return 'Present';
    } 
    // Grace period until 8:15 AM
    elseif ($timeIn <= '08:15:00') {
        return 'Late';
    } 
    else {
        return 'Late';
    }
}

/**
 * Calculate hours worked (handles overnight shifts)
 */
function calculateHoursWorked($timeIn, $timeOut) {
    if (!$timeIn || !$timeOut) {
        return 0;
    }
    
    // Parse time strings
    $timeInParts = explode(':', $timeIn);
    $timeOutParts = explode(':', $timeOut);
    
    $startHour = (int)$timeInParts[0];
    $startMin = (int)($timeInParts[1] ?? 0);
    $endHour = (int)$timeOutParts[0];
    $endMin = (int)($timeOutParts[1] ?? 0);
    
    // Convert to decimal hours
    $startDecimal = $startHour + ($startMin / 60);
    $endDecimal = $endHour + ($endMin / 60);
    
    // Calculate hours
    $hours = 0;
    
    // Handle overnight shifts
    if ($endDecimal < $startDecimal) {
        $hours = (24 - $startDecimal) + $endDecimal;
    } else {
        $hours = $endDecimal - $startDecimal;
    }
    
    // Round to nearest 0.5 hour
    return max(0, round($hours * 2) / 2);
}
?>