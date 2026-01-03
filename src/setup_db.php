<?php
$env = include 'backend/.env.php';

$host = $env['DB_HOST'];
$db   = $env['DB_NAME'];
$user = $env['DB_USER'];
$pass = $env['DB_PASS'];

$dsnWithoutDb = "mysql:host=$host;charset=utf8mb4";

try {
    $pdo = new PDO($dsnWithoutDb, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "Database '$db' created or already exists.\n";

    $dsnWithDb = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsnWithDb, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "Connected to database '$db' successfully.\n";

    $sql = file_get_contents('sample_schema.sql');
    if ($sql === false) {
        throw new Exception("Failed to read schema_and_data.sql");
    }

    $pdo->exec($sql);
    echo "Tables and sample data inserted successfully.\n";

} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
} catch (Exception $e) {
    die("General error: " . $e->getMessage());
}
