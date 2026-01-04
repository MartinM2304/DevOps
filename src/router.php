<?php
// Serve API requests directly
if (preg_match('/^\/backend\/api\//', $_SERVER["REQUEST_URI"])) {
    return false;
}

// Serve static files if they exist
$file = __DIR__ . '/frontend' . parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
if (php_sapi_name() === 'cli-server' && is_file($file)) {
    return false;
}

// Otherwise, serve the SPA
require __DIR__ . '/frontend/index.html';