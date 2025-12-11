<?php
// api/zkteco-mapping-api.php - Manage ZKTeco ID Mappings
require_once '../config/config.php';
requireLogin();

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'list') {
                // Get all mappings with employee info
                $stmt = $db->query("
                    SELECT 
                        zm.zkteco_id,
                        zm.employee_id,
                        zm.employee_name as zkteco_name,
                        e.name as system_name,
                        e.department,
                        e.status,
                        zm.created_at as mapped_date,
                        CASE 
                            WHEN e.employee_id IS NULL THEN 'Unmapped'
                            WHEN e.status != 'Active' THEN 'Inactive Employee'
                            ELSE 'Active'
                        END as mapping_status
                    FROM zkteco_mapping zm
                    LEFT JOIN employees e ON zm.employee_id = e.employee_id
                    ORDER BY zm.created_at DESC
                ");
                
                $mappings = $stmt->fetchAll();
                jsonResponse(true, 'Mappings retrieved', $mappings);
                
            } elseif ($action === 'stats') {
                // Get mapping statistics
                $stmt = $db->query("
                    SELECT 
                        COUNT(*) as total_mappings,
                        COUNT(DISTINCT zm.employee_id) as mapped_employees,
                        COUNT(CASE WHEN e.status = 'Active' THEN 1 END) as active_mappings
                    FROM zkteco_mapping zm
                    LEFT JOIN employees e ON zm.employee_id = e.employee_id
                ");
                
                $stats = $stmt->fetch();
                jsonResponse(true, 'Statistics retrieved', $stats);
            }
            break;
            
        case 'POST':
            if ($action === 'save') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                if (empty($data['zkteco_id']) || empty($data['employee_id'])) {
                    jsonResponse(false, 'ZKTeco ID and Employee ID are required');
                    break;
                }
                
                // Verify employee exists
                $stmt = $db->prepare("SELECT name FROM employees WHERE employee_id = ?");
                $stmt->execute([$data['employee_id']]);
                $employee = $stmt->fetch();
                
                if (!$employee) {
                    jsonResponse(false, 'Employee not found');
                    break;
                }
                
                // Insert or update mapping
                $stmt = $db->prepare("
                    INSERT INTO zkteco_mapping (zkteco_id, employee_id, employee_name, created_at)
                    VALUES (?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        employee_id = VALUES(employee_id),
                        employee_name = VALUES(employee_name),
                        updated_at = NOW()
                ");
                
                $result = $stmt->execute([
                    $data['zkteco_id'],
                    $data['employee_id'],
                    $employee['name']
                ]);
                
                if ($result) {
                    logAudit($db, 'system', 'ZKTeco Mapping Created', 
                        "Mapped ZKTeco ID {$data['zkteco_id']} to {$data['employee_id']}", 
                        'fa-link');
                    jsonResponse(true, 'Mapping saved successfully');
                } else {
                    jsonResponse(false, 'Failed to save mapping');
                }
            }
            break;
            
        case 'DELETE':
            if ($action === 'delete') {
                $zktecoId = $_GET['zkteco_id'] ?? '';
                
                if (empty($zktecoId)) {
                    jsonResponse(false, 'ZKTeco ID is required');
                    break;
                }
                
                $stmt = $db->prepare("DELETE FROM zkteco_mapping WHERE zkteco_id = ?");
                $result = $stmt->execute([$zktecoId]);
                
                if ($result) {
                    logAudit($db, 'system', 'ZKTeco Mapping Deleted', 
                        "Deleted mapping for ZKTeco ID {$zktecoId}", 
                        'fa-unlink');
                    jsonResponse(true, 'Mapping deleted successfully');
                } else {
                    jsonResponse(false, 'Failed to delete mapping');
                }
            }
            break;
            
        default:
            jsonResponse(false, 'Invalid request method');
    }
    
} catch (PDOException $e) {
    error_log('ZKTeco Mapping API Error: ' . $e->getMessage());
    jsonResponse(false, 'Database error occurred');
} catch (Exception $e) {
    error_log('ZKTeco Mapping API Error: ' . $e->getMessage());
    jsonResponse(false, 'An error occurred: ' . $e->getMessage());
}
?>