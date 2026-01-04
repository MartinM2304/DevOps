<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/backend/core/db.php';

class DatabaseTest extends TestCase
{
    private $pdo;

    protected function setUp(): void
    {
        $dbHost = getenv('DB_HOST');
        $dbName = getenv('DB_NAME');
        $dbUser = getenv('DB_USER');
        $dbPass = getenv('DB_PASS') ?: 'root'; 

        try {
            $this->pdo = new PDO("mysql:host={$dbHost};dbname={$dbName}", $dbUser, $dbPass);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            $this->markTestSkipped('Check your CI/CD MySQL service: ' . $e->getMessage());
        }
    }

    public function testDatabaseConnection()
    {
        $this->assertInstanceOf(PDO::class, $this->pdo);
    }

    public function testDatabaseHasTables()
    {
        $stmt = $this->pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $this->assertNotEmpty($tables);
    }
}

