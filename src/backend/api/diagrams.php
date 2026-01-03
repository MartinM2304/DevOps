<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../core/db.php';

function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

$validTypes = ['quantitative', 'qualitative'];

function validateId($id) {
    return is_numeric($id) && intval($id) > 0;
}

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            if (!validateId($id)) {
                sendResponse(['status' => 'error', 'message' => 'Невалидно ID'], 400);
            }
            $stmt = $pdo->prepare("SELECT * FROM diagrams WHERE id = ?");
            $stmt->execute([$id]);
            $diagram = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$diagram) {
                sendResponse(['status' => 'error', 'message' => 'Диаграмата не е намерена'], 404);
            }
            sendResponse(['status' => 'ok', 'data' => $diagram]);
        } else {
            if (!isset($_GET['project_id'])) {
                sendResponse(['status' => 'error', 'message' => 'Липсва project_id'], 400);
            }

            $query = "SELECT * FROM diagrams WHERE project_id = ?";
            $params = [];

            if (isset($_GET['project_id'])) {
                $params[] = $_GET['project_id'];
            } else {
                sendResponse(['status' => 'error', 'message' => 'Липсва project_id'], 400);
            }

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $diagrams = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendResponse(['status' => 'ok', 'data' => $diagrams]);
        }
    }
    elseif ($method === 'POST') {
        // Създаване на диаграмма
        if (!$input || empty($input['diagram_name']) || !isset($input['diagram_text'])) {
            sendResponse(['status' => 'error', 'message' => 'Липсват задължителни полета (diagram_name, diagram_text)'], 400);
        }
        $name = $input['diagram_name'];
        $text = $input['diagram_text'];
        $project_id = isset($input['project_id']) ? $input['project_id'] : null;
        if (!validateId($project_id)) {
            sendResponse(['status' => 'error', 'message' => 'Невалидно project_id'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO diagrams (diagram_name, diagram_text, project_id) VALUES (?, ?, ?)");
        $stmt->execute([$name, $text, $project_id]);

        sendResponse(['status' => 'ok', 'message' => 'Диаграмата е създадена', 'id' => $pdo->lastInsertId()], 201);
    }
    elseif ($method === 'DELETE') {
        if (!isset($_GET['id']) || !validateId($_GET['id'])) {
            sendResponse(['status' => 'error', 'message' => 'Невалидно или липсващо ID'], 400);
        }
        $id = $_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM diagrams WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['status' => 'ok', 'message' => 'диаграмата е изтрита']);
    }
    else {
        sendResponse(['status' => 'error', 'message' => 'Методът не е разрешен'], 405);
    }
} catch (PDOException $e) {
    error_log('PDOException in diagrams.php: ' . $e->getMessage());
    sendResponse(['status' => 'error', 'message' => 'Грешка в базата данни: ' . $e->getMessage()], 500);
}
