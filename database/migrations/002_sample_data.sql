INSERT INTO users (id, username, password, email) VALUES
(1, 'admin', '12345', 'admin@web.com'),
(2, 'john', '12345', 'john@example.com'),
(3, 'doe', '12345', 'doe@example.com')
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO projects (id, user_id, name, description) VALUES
(1, 1, 'Project 1', 'test descr 1'),
(2, 2, 'Project 2', 'test descr 2')
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

