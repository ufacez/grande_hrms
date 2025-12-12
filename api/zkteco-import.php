<?php
// api/zkteco-import.php - Import ZKTeco Excel/CSV Data with Full Excel Support
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
            $data = parseExcelWithLibrary($file['tmp_name'], $fileExt);
        }

        if (empty($data)) {
            jsonResponse(false, 'No data found in file');
            exit;
        }

        // Process and import the data
        $result = importZKTecoData($db, $data);
        
        // Log the import
        logAudit($db, 'attendance', 'ZKTeco Data Import', 
            "Imported {$result['imported']} records. Updated: {$result['updated']}. Failed: {$result['failed']}", 
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
    
    // Clean header
    $header = array_map(function($h) {
        return trim($h, " \t\n\r\0\x0B\"'");
    }, $header);
    
    // Read data rows
    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) === count($header)) {
            $rowData = array_combine($header, $row);
            // Clean values
            $rowData = array_map(function($v) {
                return trim($v, " \t\n\r\0\x0B\"'");
            }, $rowData);
            $data[] = $rowData;
        }
    }
    
    fclose($handle);
    return $data;
}

/**
 * Parse Excel file - Direct to simple parser (no external libraries needed)
 */
function parseExcelWithLibrary($filePath, $fileExt) {
    return parseExcelSimple($filePath, $fileExt);
}

/**
 * Simple Excel parser
 */
function parseExcelSimple($filePath, $fileExt) {
    if ($fileExt === 'xlsx') {
        return parseXLSXSimple($filePath);
    } else {
        throw new Exception('Old Excel format (.xls) not supported. Please save as .xlsx or .csv format and try again.');
    }
}

/**
 * Parse XLSX file using ZIP and XML parsing
 */
function parseXLSXSimple($filePath) {
    $data = [];
    
    try {
        if (!file_exists($filePath)) {
            throw new Exception('Excel file not found');
        }
        
        if (!class_exists('ZipArchive')) {
            throw new Exception('ZipArchive extension not available. Please enable php_zip extension or use CSV format.');
        }
        
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== TRUE) {
            throw new Exception('Cannot open Excel file. File may be corrupted.');
        }
        
        // Read shared strings
        $sharedStrings = [];
        if ($zip->locateName('xl/sharedStrings.xml') !== false) {
            $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
            if ($sharedStringsXml) {
                $xml = @simplexml_load_string($sharedStringsXml);
                if ($xml !== false) {
                    foreach ($xml->si as $si) {
                        $sharedStrings[] = (string)$si->t;
                    }
                }
            }
        }
        
        // Read worksheet
        $worksheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if (!$worksheetXml) {
            $zip->close();
            throw new Exception('Cannot read worksheet from Excel file');
        }
        
        $xml = @simplexml_load_string($worksheetXml);
        if ($xml === false) {
            $zip->close();
            throw new Exception('Cannot parse Excel worksheet. File may be corrupted.');
        }
        
        $rows = [];
        
        if (!isset($xml->sheetData) || !isset($xml->sheetData->row)) {
            $zip->close();
            throw new Exception('No data found in Excel worksheet');
        }
        
        foreach ($xml->sheetData->row as $row) {
            $rowData = [];
            
            foreach ($row->c as $cell) {
                $value = '';
                
                if (isset($cell->v)) {
                    $value = (string)$cell->v;
                    
                    if (isset($cell['t']) && (string)$cell['t'] === 's') {
                        $index = (int)$value;
                        $value = isset($sharedStrings[$index]) ? $sharedStrings[$index] : '';
                    }
                }
                
                $rowData[] = trim($value);
            }
            
            if (!empty(array_filter($rowData))) {
                $rows[] = $rowData;
            }
        }
        
        $zip->close();
        
        if (empty($rows)) {
            throw new Exception('No data rows found in Excel file');
        }
        
        // Convert to associative array
        $header = array_shift($rows);
        $header = array_map('trim', $header);
        
        if (empty(array_filter($header))) {
            throw new Exception('Invalid header row in Excel file');
        }
        
        $data = [];
        
        foreach ($rows as $row) {
            $rowLength = count($row);
            $headerLength = count($header);
            
            if ($rowLength < $headerLength) {
                $row = array_pad($row, $headerLength, '');
            } elseif ($rowLength > $headerLength) {
                $row = array_slice($row, 0, $headerLength);
            }
            
            $rowData = array_combine($header, $row);
            $rowData = array_map('trim', $rowData);
            
            if (!empty(array_filter($rowData))) {
                $data[] = $rowData;
            }
        }
        
        return $data;
        
    } catch (Exception $e) {
        error_log('XLSX parser error: ' . $e->getMessage());
        throw new Exception('Failed to parse Excel file: ' . $e->getMessage());
    }
}

/**
 * Import ZKTeco data - Auto-detect format
 */
function importZKTecoData($db, $data) {
    if (empty($data)) {
        return [
            'total_rows' => 0,
            'imported' => 0,
            'updated' => 0,
            'failed' => 0,
            'errors' => ['No data found']
        ];
    }
    
    // Detect format
    $firstRow = $data[0];
    $columns = array_keys($firstRow);
    
    $isTransactionReport = false;
    foreach ($columns as $col) {
        if (stripos($col, 'punc') !== false || stripos($col, 'person id') !== false) {
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
 * Import Transaction Report format
 */
function importTransactionReport($db, $data) {
    $imported = 0;
    $failed = 0;
    $updated = 0;
    $errors = [];
    $checkInRecords = [];
    
    foreach ($data as $index => $row) {
        try {
            $rowNum = $index + 2;
            
            // Get Person ID
            $personId = trim(
                $row['Person ID'] ?? 
                $row['person id'] ?? 
                $row['PersonID'] ?? 
                ''
            );
            
            // Get Person Name
            $personName = trim(
                $row['Person Name'] ?? 
                $row['person name'] ?? 
                $row['Name'] ?? 
                ''
            );
            
            // Get Punch Time
            $punchTime = trim(
                $row['Punc-Time'] ?? 
                $row['punc-time'] ?? 
                $row['Punch Time'] ?? 
                ''
            );
            
            // Validate
            if (empty($personId)) {
                $failed++;
                $errors[] = "Row $rowNum: Missing Person ID";
                continue;
            }
            
            if (empty($punchTime)) {
                $failed++;
                $errors[] = "Row $rowNum: Missing Punc-Time";
                continue;
            }
            
            // Parse punch time
            $dateTime = parsePunchTime($punchTime);
            if (!$dateTime) {
                $failed++;
                $errors[] = "Row $rowNum: Invalid Punc-Time format: $punchTime";
                continue;
            }
            
            $date = $dateTime['date'];
            $time = $dateTime['time'];
            
            // Find employee
            $stmt = $db->prepare("SELECT employee_id FROM employees WHERE employee_id = ?");
            $stmt->execute([$personId]);
            $result = $stmt->fetch();
            
            $employeeId = null;
            
            if ($result) {
                $employeeId = $result['employee_id'];
            } else {
                // Try by name
                $stmt = $db->prepare("SELECT employee_id FROM employees WHERE name LIKE ?");
                $stmt->execute(["%$personName%"]);
                $result = $stmt->fetch();
                
                if ($result) {
                    $employeeId = $result['employee_id'];
                } else {
                    $failed++;
                    $errors[] = "Row $rowNum: Employee not found - ID: $personId, Name: $personName";
                    continue;
                }
            }
            
            // Store punch
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
    
    // Process records
    foreach ($checkInRecords as $record) {
        try {
            $employeeId = $record['employee_id'];
            $date = $record['date'];
            $punches = $record['punches'];
            
            sort($punches);
            
            $timeIn = $punches[0];
            $timeOut = count($punches) > 1 ? $punches[count($punches) - 1] : null;
            
            $status = determineStatus($timeIn, $timeOut);
            
            $hoursWorked = 0;
            if ($timeIn && $timeOut) {
                $hoursWorked = calculateHoursWorked($date, $timeIn, $timeOut);
            }
            
            // Check existing
            $stmt = $db->prepare("
                SELECT attendance_id FROM attendance_records 
                WHERE employee_id = ? AND attendance_date = ?
            ");
            $stmt->execute([$employeeId, $date]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                $stmt = $db->prepare("
                    UPDATE attendance_records 
                    SET time_in = ?, time_out = ?, status = ?, hours_worked = ?,
                        remarks = 'Updated from ZKTeco Transaction Report',
                        updated_at = NOW()
                    WHERE employee_id = ? AND attendance_date = ?
                ");
                $stmt->execute([$timeIn, $timeOut, $status, $hoursWorked, $employeeId, $date]);
                $updated++;
            } else {
                $stmt = $db->prepare("
                    INSERT INTO attendance_records 
                    (employee_id, attendance_date, time_in, time_out, status, hours_worked, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, 'Imported from ZKTeco Transaction Report')
                ");
                $stmt->execute([$employeeId, $date, $timeIn, $timeOut, $status, $hoursWorked]);
                $imported++;
            }
            
        } catch (Exception $e) {
            $failed++;
            $errors[] = "Processing error: " . $e->getMessage();
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
 * Parse punch time
 */
function parsePunchTime($punchTime) {
    if (empty($punchTime)) return null;
    
    $punchTime = trim($punchTime);
    
    $formats = [
        'Y-m-d H:i:s',
        'Y-m-d H:i',
        'd/m/Y H:i:s',
        'd/m/Y H:i',
        'm/d/Y H:i:s',
        'm/d/Y H:i',
        'Y/m/d H:i:s',
        'Y/m/d H:i'
    ];
    
    foreach ($formats as $format) {
        $dt = DateTime::createFromFormat($format, $punchTime);
        if ($dt !== false) {
            return [
                'date' => $dt->format('Y-m-d'),
                'time' => $dt->format('H:i:s')
            ];
        }
    }
    
    $timestamp = strtotime($punchTime);
    if ($timestamp !== false) {
        return [
            'date' => date('Y-m-d', $timestamp),
            'time' => date('H:i:s', $timestamp)
        ];
    }
    
    return null;
}

/**
 * Import standard format
 */
function importStandardFormat($db, $data) {
    $imported = 0;
    $failed = 0;
    $updated = 0;
    $errors = [];
    
    foreach ($data as $index => $row) {
        try {
            $rowNum = $index + 2;
            
            $employeeId = trim($row['Employee ID'] ?? $row['employee_id'] ?? '');
            $date = trim($row['Date'] ?? $row['date'] ?? '');
            $timeIn = trim($row['Time In'] ?? $row['time_in'] ?? '');
            $timeOut = trim($row['Time Out'] ?? $row['time_out'] ?? '');
            
            if (empty($employeeId) || empty($date)) {
                $failed++;
                $errors[] = "Row $rowNum: Missing employee ID or date";
                continue;
            }
            
            $formattedDate = formatDate($date);
            if (!$formattedDate) {
                $failed++;
                $errors[] = "Row $rowNum: Invalid date format: $date";
                continue;
            }
            
            $formattedTimeIn = formatTime($timeIn);
            $formattedTimeOut = formatTime($timeOut);
            
            $status = determineStatus($formattedTimeIn, $formattedTimeOut);
            
            $hoursWorked = 0;
            if ($formattedTimeIn && $formattedTimeOut) {
                $hoursWorked = calculateHoursWorked($formattedDate, $formattedTimeIn, $formattedTimeOut);
            }
            
            $stmt = $db->prepare("SELECT employee_id FROM employees WHERE employee_id = ?");
            $stmt->execute([$employeeId]);
            if (!$stmt->fetch()) {
                $failed++;
                $errors[] = "Row $rowNum: Employee $employeeId not found";
                continue;
            }
            
            $stmt = $db->prepare("
                SELECT attendance_id FROM attendance_records 
                WHERE employee_id = ? AND attendance_date = ?
            ");
            $stmt->execute([$employeeId, $formattedDate]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                $stmt = $db->prepare("
                    UPDATE attendance_records 
                    SET time_in = ?, time_out = ?, status = ?, hours_worked = ?,
                        remarks = 'Updated from ZKTeco import', updated_at = NOW()
                    WHERE employee_id = ? AND attendance_date = ?
                ");
                $stmt->execute([$formattedTimeIn, $formattedTimeOut, $status, $hoursWorked, $employeeId, $formattedDate]);
                $updated++;
            } else {
                $stmt = $db->prepare("
                    INSERT INTO attendance_records 
                    (employee_id, attendance_date, time_in, time_out, status, hours_worked, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, 'Imported from ZKTeco')
                ");
                $stmt->execute([$employeeId, $formattedDate, $formattedTimeIn, $formattedTimeOut, $status, $hoursWorked]);
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
 * Format date
 */
function formatDate($dateStr) {
    if (empty($dateStr)) return null;
    
    $formats = ['Y-m-d', 'd/m/Y', 'm/d/Y', 'Y/m/d'];
    
    foreach ($formats as $format) {
        $date = DateTime::createFromFormat($format, $dateStr);
        if ($date !== false) {
            return $date->format('Y-m-d');
        }
    }
    
    $timestamp = strtotime($dateStr);
    if ($timestamp !== false) {
        return date('Y-m-d', $timestamp);
    }
    
    return null;
}

/**
 * Format time
 */
function formatTime($timeStr) {
    if (empty($timeStr)) return null;
    
    if (strpos($timeStr, ' ') !== false) {
        $parts = explode(' ', $timeStr);
        $timeStr = end($parts);
    }
    
    $formats = ['H:i:s', 'H:i', 'h:i:s A', 'h:i A'];
    
    foreach ($formats as $format) {
        $time = DateTime::createFromFormat($format, $timeStr);
        if ($time !== false) {
            return $time->format('H:i:s');
        }
    }
    
    $timestamp = strtotime($timeStr);
    if ($timestamp !== false) {
        return date('H:i:s', $timestamp);
    }
    
    return null;
}

/**
 * Determine status
 */
function determineStatus($timeIn, $timeOut) {
    if (!$timeIn) {
        return 'Absent';
    }
    
    if ($timeIn <= '08:00:00') {
        return 'Present';
    } elseif ($timeIn <= '08:15:00') {
        return 'Late';
    } else {
        return 'Late';
    }
}

/**
 * Calculate hours worked
 */
function calculateHoursWorked($date, $timeIn, $timeOut) {
    if (!$timeIn || !$timeOut) {
        return 0;
    }
    
    $start = new DateTime("$date $timeIn");
    $end = new DateTime("$date $timeOut");
    
    if ($end <= $start) {
        $end->modify('+1 day');
    }
    
    $interval = $start->diff($end);
    $hours = $interval->h + ($interval->i / 60);
    
    return max(0, round($hours * 2) / 2);
}
?>