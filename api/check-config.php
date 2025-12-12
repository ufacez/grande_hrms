<?php
header('Content-Type: text/plain');

echo "=== PHP Configuration Check ===\n\n";

echo "PHP Version: " . phpversion() . "\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n\n";

echo "=== Required Extensions ===\n\n";

$extensions = ['pdo', 'pdo_mysql', 'zip', 'xml', 'simplexml'];
foreach ($extensions as $ext) {
    $loaded = extension_loaded($ext);
    echo "$ext: " . ($loaded ? "✓ Loaded" : "✗ MISSING") . "\n";
}

echo "\n=== File Upload Test ===\n\n";

$tmpDir = sys_get_temp_dir();
echo "Temp directory: $tmpDir\n";
echo "Writable: " . (is_writable($tmpDir) ? "✓ Yes" : "✗ No") . "\n";

echo "\n=== Database Connection ===\n\n";

try {
    require_once '../config/config.php';
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        echo "✓ Database connected successfully\n";
        
        $stmt = $db->query("SELECT COUNT(*) as count FROM employees");
        $result = $stmt->fetch();
        echo "✓ Found " . $result['count'] . " employees\n";
    } else {
        echo "✗ Database connection failed\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}