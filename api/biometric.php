<?php
// api/biometric.php - Biometric Management API
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
                $stmt = $db->query("
                    SELECT b.*, e.name as employee_name, e.department
                    FROM biometric_records b
                    JOIN employees e ON b.employee_id = e.employee_id
                    ORDER BY b.created_at DESC
                ");
                $records = $stmt->fetchAll();
                
                // Update status based on expiry
                foreach ($records as &$record) {
                    $expiryDate = new DateTime($record['expiry_date']);
                    $today = new DateTime();
                    $diff = $today->diff($expiryDate)->days;
                    
                    if ($expiryDate < $today) {
                        $record['status'] = 'Expired';
                    } elseif ($diff <= 7) {
                        $record['status'] = 'Expiring Soon';
                    } else {
                        $record['status'] = 'Active';
                    }
                }
                
                jsonResponse(true, 'Biometric records retrieved', $records);
                
            } elseif ($action === 'stats') {
                $stmt = $db->query("SELECT * FROM biometric_summary");
                $stats = $stmt->fetch();
                jsonResponse(true, 'Stats retrieved', $stats);
                
            } elseif ($action === 'employees') {
                // Get employees without biometric
                $stmt = $db->query("
                    SELECT e.employee_id, e.name, e.department
                    FROM employees e
                    LEFT JOIN biometric_records b ON e.employee_id = b.employee_id
                    WHERE b.biometric_id IS NULL AND e.status = 'Active'
                    ORDER BY e.name
                ");
                jsonResponse(true, 'Available employees', $stmt->fetchAll());
            }
            break;
            
        case 'POST':
            if ($action === 'register') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Calculate expiry date (30 days from registration)
                $registrationDate = date('Y-m-d');
                $expiryDate = date('Y-m-d', strtotime('+30 days'));
                
                $stmt = $db->prepare("
                    INSERT INTO biometric_records 
                    (employee_id, registration_date, expiry_date, status)
                    VALUES (?, ?, ?, 'Active')
                ");
                
                $result = $stmt->execute([
                    $data['employee_id'],
                    $registrationDate,
                    $expiryDate
                ]);
                
                if ($result) {
                    logAudit($db, 'biometric', 'Biometric Registered', 
                        "Registered biometric for employee {$data['employee_id']}", 'fa-fingerprint');
                    jsonResponse(true, 'Biometric registered successfully');
                }
            }
            break;
            
        case 'PUT':
            if ($action === 'renew') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                $registrationDate = date('Y-m-d');
                $expiryDate = date('Y-m-d', strtotime('+30 days'));
                
                $stmt = $db->prepare("
                    UPDATE biometric_records 
                    SET registration_date = ?, expiry_date = ?, status = 'Active'
                    WHERE employee_id = ?
                ");
                
                $result = $stmt->execute([
                    $registrationDate,
                    $expiryDate,
                    $data['employee_id']
                ]);
                
                if ($result) {
                    logAudit($db, 'biometric', 'Biometric Renewed', 
                        "Renewed biometric for employee {$data['employee_id']}", 'fa-sync-alt');
                    jsonResponse(true, 'Biometric renewed successfully');
                }
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            
            $stmt = $db->prepare("SELECT employee_id FROM biometric_records WHERE biometric_id = ?");
            $stmt->execute([$id]);
            $record = $stmt->fetch();
            
            if ($record) {
                $stmt = $db->prepare("DELETE FROM biometric_records WHERE biometric_id = ?");
                if ($stmt->execute([$id])) {
                    logAudit($db, 'biometric', 'Biometric Deleted', 
                        "Deleted biometric for employee {$record['employee_id']}", 'fa-trash');
                    jsonResponse(true, 'Biometric deleted successfully');
                }
            } else {
                jsonResponse(false, 'Record not found');
            }
            break;
    }
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred');
}
?>