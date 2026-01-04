-- Sample data migration
INSERT INTO users (id, username, password, email) VALUES
(1, 'admin', '$2y$10$rTqP/RvoVGEVCJSgO30.fO6Av7PSkn6jB5Ug6.JA2d7nJgJvEpw3S', 'admin@web.com'),
(2, 'alice', '$2y$10$9rY6i/MvtcA.gooeGG9qcODOmqMi1NifBom7ach/wSD3NjGLEy1pG', 'alice@example.com'),
(3, 'bob', '$2y$10$VecmvrErvJtKu8Gz1x94.e5auP.wrYGCb6/eTaIz7Q6BFjecgTw06', 'bob@example.com')
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO projects (id, user_id, name, description) VALUES
(1, 1, 'Project Alpha', 'A sample project for demonstration'),
(2, 2, 'Project Beta', 'Another example project')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO project_users (project_id, user_id) VALUES
(1, 2),
(2, 3)
ON DUPLICATE KEY UPDATE project_id=project_id;

INSERT INTO requirements (title, description, type, priority, complexity, layer, component, assignee, tags, status, project_id)
VALUES
('Login Feature', 'Users must be able to log in.', 'functional', 'high', 5, 'client', 'auth', 'alice', 'login,auth', 'active', 1),
('Data Backup', 'System should backup data daily.', 'non-functional', 'medium', 4, 'database', 'backup', 'bob', 'backup,data', 'active', 2)
ON DUPLICATE KEY UPDATE title=title;

