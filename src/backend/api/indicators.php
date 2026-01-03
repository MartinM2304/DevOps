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
            $stmt = $pdo->prepare("SELECT * FROM indicators WHERE id = ?");
            $stmt->execute([$id]);
            $indicator = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$indicator) {
                sendResponse(['status' => 'error', 'message' => 'Индикатор не е намерен'], 404);
            }
            sendResponse(['status' => 'ok', 'data' => $indicator]);
        } else {
            // Възможни филтри - по type, related_requirement_id, date range и др.
            $query = "SELECT * FROM indicators WHERE 1=1";
            $params = [];

            if (isset($_GET['type']) && in_array($_GET['type'], $validTypes)) {
                $query .= " AND type = ?";
                $params[] = $_GET['type'];
            }

            if (isset($_GET['requirement_id']) && validateId($_GET['requirement_id'])) {
                $query .= " AND requirement_id = ?";
                $params[] = $_GET['requirement_id'];
            }

            if (isset($_GET['from_date'])) {
                $query .= " AND date_recorded >= ?";
                $params[] = $_GET['from_date'];
            }

            if (isset($_GET['to_date'])) {
                $query .= " AND date_recorded <= ?";
                $params[] = $_GET['to_date'];
            }

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $indicators = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendResponse(['status' => 'ok', 'data' => $indicators]);
        }
    }
    elseif ($method === 'POST') {
        // Създаване на индикатор
        if (!$input || empty($input['name']) || !isset($input['value'])) {
            sendResponse(['status' => 'error', 'message' => 'Липсват задължителни полета (name, value)'], 400);
        }
        $name = $input['name'];
        $description = $input['description'] ?? null;
        $value = $input['value'];
        $unit = $input['unit'] ?? null;
        $requirement_id = isset($input['requirement_id']) && validateId($input['requirement_id']) ? $input['requirement_id'] : null;

        $stmt = $pdo->prepare("INSERT INTO indicators (name, description, value, unit, requirement_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $description, $value, $unit, $requirement_id]);

        sendResponse(['status' => 'ok', 'message' => 'Индикаторът е създаден', 'id' => $pdo->lastInsertId()], 201);
    }
    elseif ($method === 'PUT') {
        if (!isset($_GET['id']) || !validateId($_GET['id'])) {
            sendResponse(['status' => 'error', 'message' => 'Невалидно или липсващо ID'], 400);
        }
        $id = $_GET['id'];

        $stmt = $pdo->prepare("SELECT * FROM indicators WHERE id = ?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            sendResponse(['status' => 'error', 'message' => 'Индикаторът не е намерен'], 404);
        }

        $fields = [];
        $params = [];

        if (isset($input['name'])) {
            $fields[] = 'name = ?';
            $params[] = $input['name'];
        }
        if (isset($input['description'])) {
            $fields[] = 'description = ?';
            $params[] = $input['description'];
        }
        if (isset($input['type'])) {
            if (!in_array($input['type'], $validTypes)) {
                sendResponse(['status' => 'error', 'message' => 'Невалидна стойност за type'], 400);
            }
            $fields[] = 'type = ?';
            $params[] = $input['type'];
        }
        if (isset($input['value'])) {
            $fields[] = 'value = ?';
            $params[] = $input['value'];
        }
        if (array_key_exists('unit', $input)) {
            $fields[] = 'unit = ?';
            $params[] = $input['unit'];
        }
        if (isset($input['date_recorded'])) {
            $fields[] = 'date_recorded = ?';
            $params[] = $input['date_recorded'];
        }
        if (array_key_exists('related_requirement_id', $input)) {
            $val = validateId($input['related_requirement_id']) ? $input['related_requirement_id'] : null;
            $fields[] = 'related_requirement_id = ?';
            $params[] = $val;
        }

        if (empty($fields)) {
            sendResponse(['status' => 'error', 'message' => 'Няма подадени полета за редакция'], 400);
        }

        $params[] = $id;
        $sql = "UPDATE indicators SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse(['status' => 'ok', 'message' => 'Индикаторът е обновен']);
    }
    elseif ($method === 'DELETE') {
        if (!isset($_GET['id']) || !validateId($_GET['id'])) {
            sendResponse(['status' => 'error', 'message' => 'Невалидно или липсващо ID'], 400);
        }
        $id = $_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM indicators WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['status' => 'ok', 'message' => 'Индикаторът е изтрит']);
    }
    else {
        sendResponse(['status' => 'error', 'message' => 'Методът не е разрешен'], 405);
    }
} catch (PDOException $e) {
    error_log('PDOException in indicators.php: ' . $e->getMessage());
    sendResponse(['status' => 'error', 'message' => 'Грешка в базата данни: ' . $e->getMessage()], 500);
}
