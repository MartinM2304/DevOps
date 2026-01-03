    <?php
require_once __DIR__ . '/../core/db.php';

header('Content-Type: application/json');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Get project ID from request
    $projectId = $_POST['projectId'] ?? null;
    if (!$projectId) {
        throw new Exception('Project ID is required');
    }

    // Get user ID from request
    $user_id = $_POST['user_id'] ?? null;
    if (!$user_id) {
        throw new Exception('User ID is required');
    }

    // Get the uploaded file
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['file']['tmp_name'];
    $content = file_get_contents($file);
    $data = json_decode($content, true);

    if (!$data || !isset($data['projectData']) || !isset($data['projectData']['requirements'])) {
        throw new Exception('Invalid file format. Expected projectData with requirements array');
    }

    $requirements = $data['projectData']['requirements'];

    // Validate project exists
    $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ?");
    $stmt->execute([$projectId]);
    if (!$stmt->fetch()) {
        throw new Exception('Project not found');
    }

    $pdo->beginTransaction();
    try {
        // Get current user's username
        $stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $username = $stmt->fetchColumn();
        
        if (!$username) { 
            throw new Exception('Current user not found');
        }

        // Import requirements and indicators
        foreach ($requirements as $req) {
            try {
                // Validate requirement data
                if (!isset($req['title']) || !isset($req['description'])) {
                    throw new Exception('Missing required fields in requirement');
                }

                // Clean and validate data
                $title = trim($req['title']);
                $description = trim($req['description']);
                $type = isset($req['type']) ? trim($req['type']) : 'functional';
                $priority = isset($req['priority']) ? trim($req['priority']) : 'medium';
                $complexity = isset($req['complexity']) ? (int)$req['complexity'] : 3;
                $layer = isset($req['layer']) ? trim($req['layer']) : '';
                $component = isset($req['component']) ? trim($req['component']) : '';
                $tags = isset($req['tags']) ? $req['tags'] : [];

                // Check if requirement with same title already exists in project
                $stmt = $pdo->prepare("SELECT id FROM requirements WHERE project_id = ? AND title = ?");
                $stmt->execute([$projectId, $title]);
                if ($stmt->fetch()) {
                    throw new Exception("Requirement with title '{$title}' already exists in project");
                }

                // Insert requirement
                $stmt = $pdo->prepare("
                    INSERT INTO requirements (
                        project_id, title, description, type, priority, complexity,
                        layer, component, assignee, tags, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                ");
                $stmt->execute([
                    $projectId,
                    $title,
                    $description,
                    $type,
                    $priority,
                    $complexity,
                    $layer,
                    $component,
                    $username,
                    json_encode($tags)
                ]);
                
                $requirementId = $pdo->lastInsertId();
                
                // Import indicators for this requirement
                if (isset($req['indicators']) && is_array($req['indicators'])) {
                    foreach ($req['indicators'] as $indicator) {
                        if (!isset($indicator['name']) || !isset($indicator['description'])) {
                            continue; // Skip invalid indicators
                        }

                        $stmt = $pdo->prepare("
                            INSERT INTO indicators (
                                requirement_id, name, unit, value, description
                            ) VALUES (?, ?, ?, ?, ?)
                        ");
                        $stmt->execute([
                            $requirementId,
                            trim($indicator['name']),
                            isset($indicator['unit']) ? trim($indicator['unit']) : '',
                            isset($indicator['value']) ? $indicator['value'] : null,
                            trim($indicator['description'])
                        ]);
                    }
                }
            } catch (PDOException $e) {
                error_log('Failed to import requirement: ' . $e->getMessage());
                throw new Exception('Failed to import requirement: ' . $e->getMessage());
            }
        }

        $pdo->commit();
        echo json_encode(['status' => 'ok', 'message' => 'Requirements imported successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Import error: ' . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to import requirements: ' . $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}