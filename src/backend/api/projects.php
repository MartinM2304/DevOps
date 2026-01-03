<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

function validateId($id)
{
    return is_numeric($id) && intval($id) > 0;
}

function getPriorityLabel($priority) {
    switch (strtolower($priority)) {
        case 'high': return 'Висок';
        case 'medium': return 'Среден';
        case 'low': return 'Нисък';
        default: return $priority;
    }
}

function getStatusLabel($status) {
    switch (strtolower($status)) {
        case 'active': return 'Активно';
        case 'inactive': return 'Неактивно';
        case 'closed': return 'Затворено';
        default: return $status;
    }
}

try {
    $user_id = $_GET['user_id'] ?? null;
    $project_id = $_GET['project_id'] ?? null;
    if ($method === 'GET' && isset($_GET['export_to']) && $_GET['export_to'] === 'json') {
        $projectId = $_GET['id'] ?? null;
        if (!$projectId)
            sendResponse(['status' => 'error', 'message' => 'Missing project ID'], 400);
        // Fetch project details
        $stmt = $pdo->prepare("SELECT user_id, name, description FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$project)
            sendResponse(['status' => 'error', 'message' => 'Project not found'], 404);

        // Fetch author
        $stmt = $pdo->prepare("SELECT username, email FROM users WHERE id = ?");
        $stmt->execute([$project['user_id']]);
        $author = $stmt->fetch(PDO::FETCH_ASSOC);

        // Fetch members
        $stmt = $pdo->prepare("SELECT u.username, u.email FROM users u JOIN project_users pm ON u.id = pm.user_id WHERE pm.project_id = ?");
        $stmt->execute([$projectId]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch requirements
        $stmt = $pdo->prepare("SELECT id, title, description, type, priority, complexity, layer, component, assignee, tags, status, created_at, updated_at FROM requirements WHERE project_id = ?");
        $stmt->execute([$projectId]);
        $requirements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch indicators for each requirement
        foreach ($requirements as &$req) {
            $stmt = $pdo->prepare("SELECT name, unit, value, description FROM indicators WHERE requirement_id = ?");
            $stmt->execute([$req['id']]);
            $req['indicators'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        // Hide ids from user
        unset($project['user_id']); // or unset($project['id']); if present

        // Remove ids from requirements and their indicators
        foreach ($requirements as &$req) {
            unset($req['id']); // Remove requirement id
            unset($req['assignee']); // Optional: remove assignee if you want
            // Remove ids from indicators if present
            if (isset($req['indicators'])) {
                foreach ($req['indicators'] as &$indicator) {
                    unset($indicator['id']);
                    unset($indicator['requirement_id']);
                }
            }
        }
        unset($req); // break reference

        $export = [
            'project' => $project,
            'author' => $author,
            'members' => $members,
            'requirements' => $requirements
        ];

        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="project_' . $projectId . '.json"');
        echo json_encode($export, JSON_PRETTY_PRINT);
        exit;
    } elseif ($method === 'GET' && isset($_GET['export_to']) && $_GET['export_to'] === 'md') {
        $projectId = $_GET['id'] ?? null;
        if (!$projectId)
            sendResponse(['status' => 'error', 'message' => 'Missing project ID'], 400);

        // Fetch project details (reuse your existing code)
        $stmt = $pdo->prepare("SELECT user_id, name, description FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$project)
            sendResponse(['status' => 'error', 'message' => 'Project not found'], 404);

        $stmt = $pdo->prepare("SELECT username, email FROM users WHERE id = ?");
        $stmt->execute([$project['user_id']]);
        $author = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT u.username, u.email FROM users u JOIN project_users pm ON u.id = pm.user_id WHERE pm.project_id = ?");
        $stmt->execute([$projectId]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT id, title, description, type, priority, complexity, layer, component, assignee, tags, status, created_at, updated_at FROM requirements WHERE project_id = ?");
        $stmt->execute([$projectId]);
        $requirements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($requirements as &$req) {
            $stmt = $pdo->prepare("SELECT name, unit, value, description FROM indicators WHERE requirement_id = ?");
            $stmt->execute([$req['id']]);
            $req['indicators'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $req['priority'] = getPriorityLabel($req['priority']);
            $req['status'] = getStatusLabel($req['status']);
        }

        $functional = [];
        $nonfunctional = [];
        foreach ($requirements as $req) {
            if (strtolower($req['type']) === 'functional') {
                $functional[] = $req;
            } else {
                $nonfunctional[] = $req;
            }
        }
        // Build Markdown
        $md = "# Проект: {$project['name']}\n\n";
        $md .= "## Описание\n{$project['description']}\n\n";
        $md .= "### Автор\n- {$author['username']} ({$author['email']})\n\n";
        $md .= "### Членове\n";
        foreach ($members as $member) {
            $md .= "- {$member['username']} ({$member['email']})\n";
        }
        
        // Functional requirements
        $md .= "\n## Функционални изисквания\n";
        foreach ($functional as $i => $req) {
            $number = $i + 1;
            $md .= "### {$number}. {$req['title']}\n";
            $md .= "- **Описание:** {$req['description']}\n";
            $md .= "- **Приоритет:** {$req['priority']}\n";
            $md .= "- **Сложност:** {$req['complexity']}\n";
            $md .= "- **Слой:** {$req['layer']}\n";
            $md .= "- **Компонент:** {$req['component']}\n";
            $md .= "- **Тагове:** {$req['tags']}\n";
            $md .= "- **Статус:** {$req['status']}\n";
            $md .= "- **Създадено на:** {$req['created_at']}\n";
            $md .= "- **Обновено на:** {$req['updated_at']}\n";
            if (!empty($req['indicators'])) {
                $md .= "- **Индикатори:**\n";
                foreach ($req['indicators'] as $ind) {
                    $md .= "  - {$ind['name']} ({$ind['unit']}): {$ind['value']} \t\t {$ind['description']}\n";
                }
            }
            $md .= "\n";
        }
        
        // Nonfunctional requirements
        $md .= "\n## Нефункционални изисквания\n";
        foreach ($nonfunctional as $i => $req) {
            $number = $i + 1;
            $md .= "### {$number}. {$req['title']}\n";
            $md .= "- **Описание:** {$req['description']}\n";
            $md .= "- **Приоритет:** {$req['priority']}\n";
            $md .= "- **Сложност:** {$req['complexity']}\n";
            $md .= "- **Слой:** {$req['layer']}\n";
            $md .= "- **Компонент:** {$req['component']}\n";
            $md .= "- **Тагове:** {$req['tags']}\n";
            $md .= "- **Статус:** {$req['status']}\n";
            $md .= "- **Създадено на:** {$req['created_at']}\n";
            $md .= "- **Обновено на:** {$req['updated_at']}\n";
            if (!empty($req['indicators'])) {
                $md .= "- **Индикатори:**\n";
                foreach ($req['indicators'] as $ind) {
                    $md .= "  - {$ind['name']} ({$ind['unit']}): {$ind['value']} \t\t {$ind['description']}\n";
                }
            }
            $md .= "\n";
        }

        $filename = preg_replace('/\s+/', '_', $project['name']) . '.md';
        header('Content-Type: text/markdown; charset=utf-8');
        header("Content-Disposition: attachment; filename=\"$filename\"");
        echo $md;
        exit;
    } elseif ($method === 'GET') {
        if (isset($project_id) && validateId($project_id)) {
            // For specific project
            if ($user_id === '1') {
                // Special case for user ID=1 - can access any project
                $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
                $stmt->execute([$project_id]);
            } else {
                // Regular users can only access their own projects
                $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
                $stmt->execute([$project_id, $user_id]);
            }
            $project = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$project) {
                sendResponse(['status' => 'error', 'message' => 'Project not found'], 404);
            }
            sendResponse(['status' => 'ok', 'data' => $project]);
        } else {
            // For project list
            if ($user_id === '1') {
                // Special case for user ID=1 - show all projects
                $stmt = $pdo->prepare("SELECT * FROM projects");
                $stmt->execute();
                $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                // Regular users see their own projects plus projects they're a member of
                $sql = "
                SELECT DISTINCT p.*
                FROM projects p
                LEFT JOIN project_users pu ON p.id = pu.project_id
                WHERE p.user_id = :user_id OR pu.user_id = :user_id
            ";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['user_id' => $user_id]);
                $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            sendResponse(['status' => 'ok', 'data' => $projects]);
        }
    } elseif ($method === 'POST') {
        if (!$input || empty($input['name'])) {
            sendResponse(['status' => 'error', 'message' => 'Name is required'], 400);
        }
        $name = $input['name'];
        $user_id = $input['user_id'] ?? null;
        if (!$user_id) {
            sendResponse(['status' => 'error', 'message' => 'User ID is required'], 400);
        }
        $description = $input['description'] ?? null;

        // Start transaction
        $pdo->beginTransaction();
        try {
            // Insert into projects table
            $stmt = $pdo->prepare("INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $name, $description]);
            $project_id = $pdo->lastInsertId();

            // Insert into project_users table
            $stmt = $pdo->prepare("INSERT INTO project_users (user_id, project_id) VALUES (?, ?)");
            $stmt->execute([$user_id, $project_id]);

            // Commit transaction
            $pdo->commit();

            sendResponse(['status' => 'ok', 'id' => $project_id], 201);
        } catch (PDOException $e) {
            // Rollback transaction on error
            $pdo->rollBack();
            error_log('Error creating project: ' . $e->getMessage());
            sendResponse(['status' => 'error', 'message' => 'Failed to create project'], 500);
        }
    } elseif ($method === 'DELETE') {
        if (!isset($_GET['id']) || !validateId($_GET['id'])) {
            sendResponse(['status' => 'error', 'message' => 'Invalid or missing ID'], 400);
        }
        $id = $_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['status' => 'ok', 'message' => 'Project deleted']);
    } else {
        sendResponse(['status' => 'error', 'message' => 'Unsupported method'], 405);
    }
} catch (PDOException $e) {
    error_log('PDOException in projects.php: ' . $e->getMessage());
    sendResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
}