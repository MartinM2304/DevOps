<?php

$host = getenv('DB_HOST');

if ($host) {
    $dbname   = getenv('DB_NAME');
    $username = getenv('DB_USER');
    $password = getenv('DB_PASS');
} else {
    $envPath = __DIR__ . '/../.env.php';
    
    if (!file_exists($envPath)) {
        die("Configuration error: .env.php not found and no environment variables set.");
    }
    
    $config = require $envPath;
    $host     = $config['DB_HOST'];
    $dbname   = $config['DB_NAME'];
    $username = $config['DB_USER'];
    $password = $config['DB_PASS'];
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
