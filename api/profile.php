<?php
// api/profile.php - User Profile Management API
require_once '../config/config.php';
requireLogin();

$database = new Database();
$db = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Set JSON header
header('Content-Type: application/json');

try {
    switch ($method) {
        case 'GET':
            if ($action === 'get') {
                // Get current user profile
                $userId = $_SESSION['user_id'];
                
                $stmt = $db->prepare("
                    SELECT user_id, username, full_name, email, role, created_at, last_login
                    FROM users 
                    WHERE user_id = ?
                ");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if ($user) {
                    jsonResponse(true, 'Profile retrieved', $user);
                } else {
                    jsonResponse(false, 'User not found');
                }
            } else {
                jsonResponse(false, 'Invalid action');
            }
            break;
            
        case 'PUT':
            if ($action === 'update') {
                $data = json_decode(file_get_contents('php://input'), true);
                $userId = $_SESSION['user_id'];
                
                // Validate required fields
                if (!isset($data['full_name']) || !isset($data['email'])) {
                    jsonResponse(false, 'Full name and email are required');
                    break;
                }
                
                // Check if email is already used by another user
                $stmt = $db->prepare("
                    SELECT user_id FROM users 
                    WHERE email = ? AND user_id != ?
                ");
                $stmt->execute([$data['email'], $userId]);
                
                if ($stmt->fetch()) {
                    jsonResponse(false, 'Email is already in use by another user');
                    break;
                }
                
                // Update profile
                $stmt = $db->prepare("
                    UPDATE users 
                    SET full_name = ?, email = ?
                    WHERE user_id = ?
                ");
                
                $result = $stmt->execute([
                    $data['full_name'],
                    $data['email'],
                    $userId
                ]);
                
                if ($result) {
                    // Update session
                    $_SESSION['full_name'] = $data['full_name'];
                    
                    logAudit($db, 'system', 'Profile Updated', 
                        "Updated profile information", 'fa-user-edit');
                    
                    jsonResponse(true, 'Profile updated successfully');
                } else {
                    jsonResponse(false, 'Failed to update profile');
                }
                
            } elseif ($action === 'change-password') {
                $data = json_decode(file_get_contents('php://input'), true);
                $userId = $_SESSION['user_id'];
                
                // Validate required fields
                if (!isset($data['current_password']) || !isset($data['new_password'])) {
                    jsonResponse(false, 'Current password and new password are required');
                    break;
                }
                
                // Verify current password
                $stmt = $db->prepare("SELECT password_hash FROM users WHERE user_id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if (!$user || !password_verify($data['current_password'], $user['password_hash'])) {
                    jsonResponse(false, 'Current password is incorrect');
                    break;
                }
                
                // Validate new password strength
                if (strlen($data['new_password']) < 6) {
                    jsonResponse(false, 'New password must be at least 6 characters long');
                    break;
                }
                
                // Update password
                $newHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
                
                $stmt = $db->prepare("
                    UPDATE users 
                    SET password_hash = ?
                    WHERE user_id = ?
                ");
                
                $result = $stmt->execute([$newHash, $userId]);
                
                if ($result) {
                    logAudit($db, 'system', 'Password Changed', 
                        "Changed account password", 'fa-key');
                    
                    jsonResponse(true, 'Password changed successfully');
                } else {
                    jsonResponse(false, 'Failed to change password');
                }
            } else {
                jsonResponse(false, 'Invalid action');
            }
            break;
            
        default:
            jsonResponse(false, 'Invalid request method');
    }
    
} catch (PDOException $e) {
    error_log('Profile API Error: ' . $e->getMessage());
    jsonResponse(false, 'An error occurred: ' . $e->getMessage());
} catch (Exception $e) {
    error_log('Profile API Error: ' . $e->getMessage());
    jsonResponse(false, 'An error occurred: ' . $e->getMessage());
}
?>