<?php
// config.php - Database Configuration

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'grande_hrms');

// Database Connection Class
class Database {
    private $host = DB_HOST;
    private $user = DB_USER;
    private $pass = DB_PASS;
    private $dbname = DB_NAME;
    private $conn;
    
    public function connect() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->dbname,
                $this->user,
                $this->pass
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo 'Connection Error: ' . $e->getMessage();
        }
        
        return $this->conn;
    }
}

// Helper Functions

// Check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['username']);
}

// Redirect if not logged in
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: ../index.php');
        exit();
    }
}

// Get current user info
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'full_name' => $_SESSION['full_name'],
        'role' => $_SESSION['role']
    ];
}

// Log audit trail
function logAudit($db, $actionType, $action, $details, $icon = 'fa-info-circle') {
    $user = getCurrentUser();
    if (!$user) return false;
    
    try {
        $stmt = $db->prepare("
            INSERT INTO audit_trail (user_id, action_type, action, details, icon)
            VALUES (?, ?, ?, ?, ?)
        ");
        return $stmt->execute([
            $user['user_id'],
            $actionType,
            $action,
            $details,
            $icon
        ]);
    } catch (PDOException $e) {
        return false;
    }
}

// Format currency
function formatCurrency($amount) {
    return '₱' . number_format($amount, 2);
}

// Format date
function formatDate($date) {
    return date('F d, Y', strtotime($date));
}

// Calculate hours worked
function calculateHoursWorked($timeIn, $timeOut) {
    if (!$timeIn || !$timeOut) {
        return 0;
    }
    
    $start = new DateTime($timeIn);
    $end = new DateTime($timeOut);
    $diff = $start->diff($end);
    
    return $diff->h + ($diff->i / 60);
}

// Sanitize input
function sanitize($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// JSON Response
function jsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// Error Handler
function handleError($message) {
    error_log($message);
    return ['success' => false, 'message' => 'An error occurred. Please try again.'];
}
?>