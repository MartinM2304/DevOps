<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/backend/core/db.php';

class DatabaseTest extends TestCase
{
    private $pdo;

    protected function setUp(): void
    {
        try {
            $config = require __DIR__ . '/../../src/backend/.env.php';
            $this->pdo = new PDO(
                "mysql:host={$config['DB_HOST']};dbname={$config['DB_NAME']}",
                $config['DB_USER'],
                $config['DB_PASS']
            );
        } catch (PDOException $e) {
            $this->markTestSkipped('Database connection not available');
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

