<?php

$host = getenv('DB_HOST');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');
$dbname = getenv('DB_NAME');

if (!$host) {
    $envPath = __DIR__ . '/backend/.env.php';
    
    if (file_exists($envPath)) {
        $env = require $envPath;
        $host = $env['DB_HOST'];
        $user = $env['DB_USER'];
        $pass = $env['DB_PASS'];
        $dbname = $env['DB_NAME'];
    } else {
        if (php_sapi_name() === 'cli' && !getenv('CI')) {
             echo "Warning: No credentials found.\n";
        }
    }
}

try {
    $pdo = new PDO("mysql:host=" . $env['DB_HOST'] . ";charset=utf8mb4", $env['DB_USER'], $env['DB_PASS']);
    $pdo->exec('DROP DATABASE IF EXISTS web_project_db;');
    $pdo->exec('CREATE DATABASE web_project_db;');
    echo "Database reset successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
