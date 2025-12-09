<?php
// api/audit.php - Audit Trail API
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
                $type = $_GET['type'] ?? 'all';
                $search = $_GET['search'] ?? '';
                
                $sql = "SELECT a.*, u.full_name as user_name 
                       FROM audit_trail a
                       LEFT JOIN users u ON a.user_id = u.user_id
                       WHERE 1=1";
                $params = [];
                
                if ($type !== 'all') {
                    $sql .= " AND a.action_type = ?";
                    $params[] = $type;
                }
                
                if ($search) {
                    $sql .= " AND (a.action LIKE ? OR a.details LIKE ?)";
                    $searchTerm = "%$search%";
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }
                
                $sql .= " ORDER BY a.timestamp DESC LIMIT 100";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $logs = $stmt->fetchAll();
                
                jsonResponse(true, 'Audit logs retrieved', $logs);
                
            } elseif ($action === 'stats') {
                $stmt = $db->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN action_type = 'employee' THEN 1 ELSE 0 END) as employee_count,
                        SUM(CASE WHEN action_type = 'payroll' THEN 1 ELSE 0 END) as payroll_count,
                        SUM(CASE WHEN action_type = 'attendance' THEN 1 ELSE 0 END) as attendance_count,
                        SUM(CASE WHEN action_type = 'biometric' THEN 1 ELSE 0 END) as biometric_count
                    FROM audit_trail
                ");
                $stats = $stmt->fetch();
                jsonResponse(true, 'Stats retrieved', $stats);
            }
            break;
            
        default:
            jsonResponse(false, 'Invalid request method');
    }
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    jsonResponse(false, 'An error occurred');
}
?>