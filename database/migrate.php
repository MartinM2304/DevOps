#!/usr/bin/env php
<?php

function getDbConnection() {
    $host = getenv('DB_HOST') ?: 'localhost';
    $db   = getenv('DB_NAME') ?: 'requirements_db';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';
    
    try {
        $pdo = new PDO("mysql:host=$host", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4");
        $pdo->exec("USE `$db` text");
        
        $pdo->exec("CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB");
        
        return $pdo;
    } catch (PDOException $e) {
        fwrite(STDERR, "DATABASE ERROR: " . $e->getMessage() . PHP_EOL);
        exit(1);
    }
}

$migrationsDir = __DIR__ . '/migrations';
$pdo = getDbConnection();

$executed = $pdo->query("SELECT version FROM schema_migrations")->fetchAll(PDO::FETCH_COLUMN);

$files = glob("$migrationsDir/*.sql");
sort($files);

foreach ($files as $file) {
    $version = basename($file, '.sql');
    
    if (in_array($version, $executed)) {
        continue;
    }

    echo "Applying: $version" . PHP_EOL;
    
    $sql = file_get_contents($file);
    if ($sql === false) {
        fwrite(STDERR, "Could not read file: $file" . PHP_EOL);
        exit(1);
    }

    try {
        $pdo->exec($sql);
        $stmt = $pdo->prepare("INSERT INTO schema_migrations (version) VALUES (?)");
        $stmt->execute([$version]);
    } catch (Exception $e) {
        fwrite(STDERR, "FAILED: $version - " . $e->getMessage() . PHP_EOL);
        exit(1);
    }
}

exit(0);