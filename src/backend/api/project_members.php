<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once __DIR__ . '/../core/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);


function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

try {
    if ($method === 'GET') {
        $project_id = $_GET['project_id'] ?? null;
        $user_id = $_GET['user_id'] ?? null;
        if (!$project_id) {
            sendResponse(['status' => 'error', 'message' => 'Specify a project ID'], 404);
            exit;
        }

        // Get owner info
        $stmt = $pdo->prepare("
    SELECT u.username, u.email
    FROM users u
    JOIN projects p ON u.id = p.user_id
    WHERE p.id = ?
");
        $stmt->execute([$project_id]);
        $owner = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get members (excluding owner)
        $stmt = $pdo->prepare("
    SELECT u.username, u.email
    FROM users u
    JOIN project_users pu ON u.id = pu.user_id
    WHERE pu.project_id = ? AND u.id != (SELECT user_id FROM projects WHERE id = ?)
");
        $stmt->execute([$project_id, $project_id]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(['status' => 'ok', 'owner' => $owner, 'members' => $members]);
    } elseif ($method === 'POST') {
        $project_id = $input['project_id'] ?? null;
        $user_id = $input['user_id'] ?? null;
        $username = $input['username'] ?? null;
        if (!$input || empty($project_id)) {
            sendResponse(['status' => 'error', 'message' => 'Project ID is required'], 400);
        }
        if (empty($username)) {
            sendResponse(['status' => 'error', 'message' => 'Provide a username for the user you want to add'], 400);
        }

        // Get the target user's id by username
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $target_user_id = $stmt->fetchColumn();
        
        if (!$target_user_id) {
            error_log("User not found for username: " . $username);
            sendResponse(['status' => 'error', 'message' => 'User not found'], 404);
        }

        // Prevent adding the owner as a member
        $stmt = $pdo->prepare("SELECT user_id FROM projects WHERE id = ?");
        $stmt->execute([$project_id]);
        $owner_id = $stmt->fetchColumn();
        
        if (!$owner_id) {
            error_log("Project not found or invalid project_id: " . $project_id);
            sendResponse(['status' => 'error', 'message' => 'Project not found'], 404);
        }
        
        if ($owner_id == $target_user_id) {
            sendResponse(['status' => 'error', 'message' => 'Owner cannot be added as a member'], 400);
        }

        // Insert into project_users if not already present
        $stmt = $pdo->prepare("INSERT IGNORE INTO project_users (project_id, user_id) VALUES (?, ?)");
        $result = $stmt->execute([$project_id, $target_user_id]);
        
        if (!$result) {
            error_log("Failed to insert into project_users: " . print_r($stmt->errorInfo(), true));
            sendResponse(['status' => 'error', 'message' => 'Failed to add member'], 500);
        }

        sendResponse(['status' => 'ok', 'message' => 'User added to project']);
    }

} catch (Exception $e) {
    sendResponse(['status' => 'error', 'message' => $e->getMessage()]);
    error_log('PDOException in project_members.php: ' . $e->getMessage());
}
