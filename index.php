<?php
// index.php - Login Page
session_start();

// If already logged in, redirect to dashboard
if (isset($_SESSION['user_id'])) {
    header('Location: pages/dashboard.php');
    exit();
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once 'config/config.php';
    
    $username = sanitize($_POST['username']);
    $password = $_POST['password'];
    
    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password';
    } else {
        $database = new Database();
        $db = $database->connect();
        
        try {
            $stmt = $db->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password_hash'])) {
                // Set session variables
                $_SESSION['user_id'] = $user['user_id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['role'] = $user['role'];
                
                // Update last login
                $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
                $stmt->execute([$user['user_id']]);
                
                // Redirect to dashboard
                header('Location: pages/dashboard.php');
                exit();
            } else {
                $error = 'Invalid username or password';
            }
        } catch (PDOException $e) {
            $error = 'Login failed. Please try again.';
            error_log($e->getMessage());
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grande. PAN DE SAL + COFFEE</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="login-container" id="loginPage">
        <div class="login-logo">
            <h1>WELCOME!</h1>
            <h2>Grande.</h2>
            <p>PAN DE SAL + COFFEE</p>
        </div>
        <div class="login-form">
            <?php if ($error): ?>
                <div class="notification error" style="display: block; margin-bottom: 15px;">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>
            <form method="POST" action="">
                <div class="form-group">
                    <input type="text" name="username" placeholder="Username" required>
                </div>
                <div class="form-group">
                    <input type="password" name="password" placeholder="Password" required>
                </div>
                <button type="submit" class="login-btn">LOGIN</button>
            </form>
            <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #666;">
            </p>
        </div>
    </div>
</body>
</html>