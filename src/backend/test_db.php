<?php
header('Content-Type: application/json');

require_once __DIR__ . '/core/db.php';

try {
    $stmt = $pdo->query("SELECT 1 AS test");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'Връзката към базата е успешна.',
        'test_value' => $row['test']
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Неуспешна заявка към базата: ' . $e->getMessage()
    ]);
}
