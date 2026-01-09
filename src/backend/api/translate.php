<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../core/db.php';
require_once __DIR__ . '/../core/translator_rpc.php';

function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    if ($method === 'POST') {
        $requirement_id = $input['requirement_id'] ?? null;
        $target_lang = $input['target_lang'] ?? 'en';
        
        if (!$requirement_id) {
            sendResponse(['status' => 'error', 'message' => 'Requirement ID is required'], 400);
        }
        
        // Fetch requirement from database
        $stmt = $pdo->prepare("SELECT * FROM requirements WHERE id = ?");
        $stmt->execute([$requirement_id]);
        $requirement = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$requirement) {
            sendResponse(['status' => 'error', 'message' => 'Requirement not found'], 404);
        }
        
        // Fetch indicators
        $stmt = $pdo->prepare("SELECT * FROM indicators WHERE requirement_id = ?");
        $stmt->execute([$requirement_id]);
        $indicators = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $requirement['indicators'] = $indicators;
        
        // Parse tags if JSON string
        if (isset($requirement['tags']) && is_string($requirement['tags'])) {
            $requirement['tags'] = json_decode($requirement['tags'], true) ?? [];
        }
        
        // Call RPC translation service
        $translator = new TranslatorRPC();
        $result = $translator->translateRequirement($requirement, $target_lang);
        
        if ($result['status'] === 'ok') {
            sendResponse($result);
        } else {
            sendResponse($result, 500);
        }
        
    } elseif ($method === 'GET' && isset($_GET['languages'])) {
        // Get supported languages
        $translator = new TranslatorRPC();
        $result = $translator->getSupportedLanguages();
        sendResponse($result);
        
    } else {
        sendResponse(['status' => 'error', 'message' => 'Unsupported method'], 405);
    }
} catch (Exception $e) {
    error_log('Translation error: ' . $e->getMessage());
    sendResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
}