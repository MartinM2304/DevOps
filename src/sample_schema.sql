-- schema_and_data.sql

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create project_users table
CREATE TABLE IF NOT EXISTS project_users (
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create requirements table
CREATE TABLE IF NOT EXISTS requirements (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('functional','non-functional') NOT NULL,
    priority ENUM('low','medium','high') DEFAULT 'medium',
    complexity INT DEFAULT 3,
    layer ENUM('client','routing','business','database','meta') NOT NULL,
    component VARCHAR(255),
    assignee VARCHAR(255),
    tags TEXT,
    status ENUM('active','inactive','closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    project_id INT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Create indicators table
CREATE TABLE IF NOT EXISTS indicators (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    requirement_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(64),
    value VARCHAR(64),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requirement_id) REFERENCES requirements(id)
);

CREATE TABLE IF NOT EXISTS diagrams (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    diagram_name VARCHAR(255) NOT NULL,
    diagram_text TEXT NOT NULL,
    project_id INT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Insert sample data
/*Inserts users into the users table. The passwords as plaintext are as follows:
username: admin, password: admin
username: alice, password: alice
username: bob, password: bob
*/
INSERT INTO users (id, username, password, email) VALUES
(1, 'admin', '$2y$10$rTqP/RvoVGEVCJSgO30.fO6Av7PSkn6jB5Ug6.JA2d7nJgJvEpw3S', 'admin@web.com'),
(2, 'alice', '$2y$10$9rY6i/MvtcA.gooeGG9qcODOmqMi1NifBom7ach/wSD3NjGLEy1pG', 'alice@example.com'),
(3, 'bob', '$2y$10$VecmvrErvJtKu8Gz1x94.e5auP.wrYGCb6/eTaIz7Q6BFjecgTw06', 'bob@example.com');

INSERT INTO projects (id, user_id, name, description) VALUES
(1, 1, 'Project Alpha', 'A sample project for demonstration'),
(2, 2, 'Project Beta', 'Another example project');

INSERT INTO project_users (project_id, user_id) VALUES
(1, 2), -- alice in Project Alpha
(2, 3); -- bob in Project Beta

INSERT INTO requirements (title, description, type, priority, complexity, layer, component, assignee, tags, status, project_id)
VALUES
('Login Feature', 'Users must be able to log in.', 'functional', 'high', 5, 'client', 'auth', 'alice', 'login,auth', 'active', 1),
('Data Backup', 'System should backup data daily.', 'non-functional', 'medium', 4, 'database', 'backup', 'bob', 'backup,data', 'active', 2);

INSERT INTO indicators (requirement_id, name, unit, value, description)
VALUES
(1, 'Max Login Time', 'seconds', '2', 'Maximum time allowed for login'),
(2, 'Backup Frequency', 'days', '1', 'Daily backup interval');

INSERT INTO diagrams(id, diagram_name, diagram_text, project_id)
VALUES
(1, 'System Architecture', '@startuml
left to right direction
skinparam packageStyle rectangle

actor Student
actor Instructor
actor Admin
actor Guest
actor "Payment Gateway" as PG

rectangle "Online Learning Management System" {

(Browse Courses) as BC
(Enroll in Course) as EC
(Make Payment) as MP
(Watch Lectures) as WL
(Submit Assignments) as SA
(Receive Certificate) as RC

(Create Course) as CC
(Upload Content) as UC
(Grade Assignments) as GA
(Manage Enrollments) as ME

(Manage Users) as MU
(Generate Reports) as GR
(Moderate Content) as MC

(Register) as REG
(Login) as LOGIN

Guest --> BC
Guest --> REG
Guest --> LOGIN

Student --> BC
Student --> EC
Student --> MP
Student --> WL
Student --> SA
Student --> RC
Student --> LOGIN

EC --> MP
MP --> PG

Instructor --> LOGIN
Instructor --> CC
Instructor --> UC
Instructor --> GA
Instructor --> ME

Admin --> LOGIN
Admin --> MU
Admin --> GR
Admin --> MC
}
@enduml', 1),
(2, 'Data Flow', '@startuml
                Alice -> Bob: Authentication Request
                Bob --> Alice: Authentication Response
                Alice -> Bob: Another authentication Request
                Alice <-- Bob: Another authentication Response
                @enduml', 2);
