<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../core/db.php';

function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
try {
    if ($method === 'POST') {
        $action = $_GET['action'] ?? null;

        if ($action === 'register') {
            // Registration
            $username = trim($input['username'] ?? '');
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';

            if (!$username || !$email || !$password) {
                sendResponse(['status' => 'error', 'message' => 'Всички полета са задължителни.'], 400);
            }

            // Check if username or email exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->fetch()) {
                sendResponse(['status' => 'error', 'message' => 'Потребителското име или имейл вече съществува.'], 409);
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
            $stmt->execute([$username, $email, $hash]);
            sendResponse(['status' => 'ok', 'message' => 'Регистрацията е успешна.']);
        } elseif ($action === 'login') {
            // Login
            $username = trim($input['username'] ?? '');
            $password = $input['password'] ?? '';

            if (!$username || !$password) {
                sendResponse(['status' => 'error', 'message' => 'Всички полета са задължителни.'], 400);
            }

            $stmt = $pdo->prepare("SELECT id, password FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($password, $user['password'])) {
                sendResponse(['status' => 'error', 'message' => 'Грешно потребителско име или парола.'], 401);
            }

            sendResponse(['status' => 'ok', 'user_id' => $user['id'], 'message' => 'Успешен вход.']);
        } else {
            sendResponse(['status' => 'error', 'message' => 'Невалидно действие.'], 400);
        }
    } else {
        sendResponse(['status' => 'error', 'message' => 'Невалиден метод.'], 405);
    }
} catch (Exception $e) {
    error_log('PDOException in users.php: ' . $e->getMessage());
    sendResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
}
