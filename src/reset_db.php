<?php
require 'backend/.env.php';

try {
    $pdo = new PDO("mysql:host=" . $env['DB_HOST'] . ";charset=utf8mb4", $env['DB_USER'], $env['DB_PASS']);
    $pdo->exec('DROP DATABASE IF EXISTS web_project_db;');
    $pdo->exec('CREATE DATABASE web_project_db;');
    echo "Database reset successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}