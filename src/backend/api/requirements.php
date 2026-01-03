<?php

require_once __DIR__ . '/../core/db.php';

function respond($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// GET /requirements или /requirements?id=...
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = $_GET['id'] ?? null;
    $user_id = $_GET['user_id'] ?? null;
    $project_id = $_GET['project_id'] ?? null;


    try {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM requirements WHERE id = ?");
            $stmt->execute([$id]);
            $requirement = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$requirement) {
                respond(['status' => 'error', 'message' => 'Requirement not found'], 404);
            }

            // Join with projects if needed
            if ($requirement['project_id']) {
                $stmtProj = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
                $stmtProj->execute([$requirement['project_id']]);
                $requirement['project'] = $stmtProj->fetch(PDO::FETCH_ASSOC);
            }

            // Вземаме индикаторите
            $stmtIndicators = $pdo->prepare("SELECT * FROM indicators WHERE requirement_id = ?");
            $stmtIndicators->execute([$id]);
            $requirement['indicators'] = $stmtIndicators->fetchAll(PDO::FETCH_ASSOC);
            $requirement['tags'] = json_decode($requirement['tags'] ?? '[]');

            respond(['status' => 'ok', 'requirement' => $requirement]);
        } elseif ($project_id) {
            $stmt = $pdo->prepare("SELECT * FROM requirements WHERE project_id = ?");
            $stmt->execute([$project_id]);
            $requirements = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($requirements as &$req) {
                $stmtInd = $pdo->prepare("SELECT * FROM indicators WHERE requirement_id = ?");
                $stmtInd->execute([$req['id']]);
                $req['indicators'] = $stmtInd->fetchAll(PDO::FETCH_ASSOC);
                $req['tags'] = json_decode($req['tags'] ?? '[]');
            }

            respond(['status' => 'ok', 'requirements' => $requirements]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM requirements WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $requirements = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($requirements as &$req) {
                $stmtInd = $pdo->prepare("SELECT * FROM indicators WHERE requirement_id = ?");
                $stmtInd->execute([$req['id']]);
                $req['indicators'] = $stmtInd->fetchAll(PDO::FETCH_ASSOC);
                $req['tags'] = json_decode($req['tags'] ?? '[]');
            }

            respond(['status' => 'ok', 'requirements' => $requirements]);
        }
    } catch (PDOException $e) {
        error_log('PDOException in requirements.php: ' . $e->getMessage());
        respond(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

// POST /requirements – Създаване
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $project_id = $data['project_id'] ?? null;
    $user_id = $data['user_id'] ?? null;

    if (!$data || !isset($data['title'], $data['description'], $data['type'])) {
        respond(['status' => 'error', 'message' => 'Missing required fields'], 400);
    }

    try {
        if (strval($user_id) === '1' && $project_id === 0) {
            // Special case for user ID=1 - add requirement to all projects
            $stmt = $pdo->prepare("SELECT id FROM projects");
            $stmt->execute();
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $affectedProjects = [];
            foreach ($projects as $project) {
                $stmt = $pdo->prepare("
                INSERT INTO requirements (title, description, type, priority, complexity, layer, component, assignee, tags, project_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['type'],
                $data['priority'] ?? 'medium',
                $data['complexity'] ?? 3,
                $data['layer'] ?? 'business',
                $data['component'] ?? null,
                $data['assignee'] ?? null,
                json_encode($data['tags'] ?? []),
                $project['id']
            ]);
                $affectedProjects[] = $project['id'];
            }

            respond([
                'status' => 'ok',
                'message' => 'Requirement added to all projects successfully',
                'affected_projects' => $affectedProjects
            ]);
        } else {
            // Normal case - add requirement to single project
            $stmt = $pdo->prepare("
                INSERT INTO requirements (title, description, type, priority, complexity, layer, component, assignee, tags, project_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['type'],
                $data['priority'] ?? 'medium',
                $data['complexity'] ?? 3,
                $data['layer'] ?? 'business',
                $data['component'] ?? null,
                $data['assignee'] ?? null,
                json_encode($data['tags'] ?? []),
                $project_id
            ]);

            $lastId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM requirements WHERE id = ?");
            $stmt->execute([$lastId]);
            $requirement = $stmt->fetch(PDO::FETCH_ASSOC);

            // Вземаме индикаторите
            $stmtIndicators = $pdo->prepare("SELECT * FROM indicators WHERE requirement_id = ?");
            $stmtIndicators->execute([$lastId]);
            $requirement['indicators'] = $stmtIndicators->fetchAll(PDO::FETCH_ASSOC);
            $requirement['tags'] = json_decode($requirement['tags'] ?? '[]');

            respond(['status' => 'ok', 'requirement' => $requirement]);
        }
    } catch (PDOException $e) {
        error_log('PDOException in requirements.php: ' . $e->getMessage());
        respond(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

// PATCH /requirements?id=...
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    parse_str($_SERVER['QUERY_STRING'], $params);
    $id = $params['id'] ?? null;
    if (!$id) respond(['status' => 'error', 'message' => 'Missing ID'], 400);

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) respond(['status' => 'error', 'message' => 'Invalid input'], 400);

    try {
        $fields = [];
        $values = [];

        foreach (['title', 'description', 'type', 'priority', 'complexity', 'layer', 'component', 'assignee', 'tags'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = ($field === 'tags') ? json_encode($data[$field]) : $data[$field];
            }
        }

        if (count($fields) === 0) {
            respond(['status' => 'error', 'message' => 'No fields to update'], 400);
        }

        $sql = "UPDATE requirements SET " . implode(", ", $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $values[] = $id;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        respond(['status' => 'ok', 'updated' => $id]);
    } catch (PDOException $e) {
        error_log(message: 'PDOException in requirements.php: ' . $e->getMessage());
        respond(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

// DELETE /requirements?id=...
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str($_SERVER['QUERY_STRING'], $params);
    $id = $params['id'] ?? null;
    if (!$id) respond(['status' => 'error', 'message' => 'Missing ID'], 400);

    try {
        // Изтриваме първо индикаторите
        $stmt1 = $pdo->prepare("DELETE FROM indicators WHERE requirement_id = ?");
        $stmt1->execute([$id]);

        // После изискването
        $stmt2 = $pdo->prepare("DELETE FROM requirements WHERE id = ?");
        $stmt2->execute([$id]);

        respond(['status' => 'ok', 'deleted' => $id]);
    } catch (PDOException $e) {
        error_log(message: 'PDOException in requirements.php: ' . $e->getMessage());
        respond(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

// Ако методът не е поддържан
respond(['status' => 'error', 'message' => 'Unsupported HTTP method'], 405);
