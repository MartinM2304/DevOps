const DEBUG_MODE = true;
class API {
    constructor() {
        this.baseUrl = '../backend/api/';
    }



    // GET заявка
    async get(endpoint) {
        const userId = getUserId();
        var url = endpoint;
        if (userId) {
            url = endpoint.includes('?') ? `${endpoint}&user_id=${userId}` : `${endpoint}?user_id=${userId}`;
        }
        const response = await fetch(`${this.baseUrl}${url}`);
        console.log('GET request response:', response);
        if (response.status !== 200) {
            console.error(`Error fetching ${endpoint}:`, response.status, response.statusText);
            throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
        }
        const text = await response.text();
        console.log('GET request response text:', text);
        return text ? JSON.parse(text) : {};
    }

    // PlantUML encoding functions
    encode64(data) {
        let r = "";
        for (let i=0; i<data.length; i+=3) {
        if (i+2==data.length) {
            r +=this.append3bytes(data.charCodeAt(i), data.charCodeAt(i+1), 0);
            } else if (i+1==data.length) {
            r += this.append3bytes(data.charCodeAt(i), 0, 0);
            } else {
            r += this.append3bytes(data.charCodeAt(i), data.charCodeAt(i+1),
            data.charCodeAt(i+2));
        }
        }
        return r;
    }

    append3bytes(b1, b2, b3) {
        let c1 = b1 >> 2;
        let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
        let c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
        let c4 = b3 & 0x3F;
        let r = "";
        r += this.encode6bit(c1 & 0x3F);
        r += this.encode6bit(c2 & 0x3F);
        r += this.encode6bit(c3 & 0x3F);
        r += this.encode6bit(c4 & 0x3F);
        return r;
        }

    encode6bit(b) {
        if (b < 10) {
        return String.fromCharCode(48 + b);
        }
        b -= 10;
        if (b < 26) {
        return String.fromCharCode(65 + b);
        }
        b -= 26;
        if (b < 26) {
        return String.fromCharCode(97 + b);
        }
        b -= 26;
        if (b == 0) {
        return '-';
        }
        if (b == 1) {
        return '_';
        }
        return '?';
        }

    compress(s) {
        //UTF8
        s = unescape(encodeURIComponent(s));
        document.getElementById('diagram-image').src = "http://www.plantuml.com/plantuml/img/"+this.encode64(deflate(s, 9));
        }

    encodePlantUML(umlText) {
        this.compress(umlText)
    }

    // GET from backend (e.g., /api/uml/UseCase1)
    async getUMLString(endpoint) {
        if (DEBUG_MODE) {
            return `@startuml
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
@enduml`;

        }


        try {
            const userId = getUserId();
            let url = endpoint;
            if (userId) {
                url = endpoint.includes('?') ? `${endpoint}&user_id=${userId}` : `${endpoint}?user_id=${userId}`;
            }
            const response = await fetch(`${this.baseUrl}${url}`);
            console.log('GET UML string response:', response);
            if (response.status !== 200) {
                console.error(`Error fetching ${endpoint}:`, response.status, response.statusText);
                throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.text || '';
        } catch (error) {
            console.error('Error fetching UML string:', error);
            throw error;
        }
    }

    // GET from PlantUML API
    async getPlanUML(endpoint, plantUMLText) {
        try {
            const encoded = this.encodePlantUML(plantUMLText);
            const diagramUrl = `https://kroki.io/plantuml/png/${encoded}`;
            return { encoded, diagramUrl };
        } catch (error) {
            console.error('Error encoding PlantUML text:', error);
            throw error;
        }
    }

    async getFile(endpoint) {
        const userId = getUserId();
        var url = endpoint;
        if (userId) {
            url = endpoint.includes('?') ? `${endpoint}&user_id=${userId}` : `${endpoint}?user_id=${userId}`;
        }
        const response = await fetch(`${this.baseUrl}${url}`);
        console.log('GET request response:', response);
        if (response.status !== 200) {
            console.error(`Error fetching ${endpoint}:`, response.status, response.statusText);
            throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
        }
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'download.md'; // fallback

        if (disposition && disposition.includes('filename=')) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) {
                filename = match[1];
            }
        }
        const text = await response.text();
        console.log('GET request response text:', text);
        return { content: text, filename };
    }
    // POST заявка
    async post(endpoint, data) {
        data.user_id = getUserId();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }

    // PUT заявка
    async put(endpoint, data) {
        data.user_id = getUserId();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }

    // PATCH заявка
    async patch(endpoint, data) {
        data.user_id = getUserId();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }

    // Обща метод за HTTP заявки
    async request(endpoint, options = {}) {
        const userId = getUserId();
        const url = endpoint.includes('?') ? `${endpoint}&user_id=${userId}` : `${endpoint}?user_id=${userId}`;

        const defaultOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const requestOptions = { ...defaultOptions, ...options };

        const response = await fetch(`${this.baseUrl}${url}`, requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // DELETE заявка
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: getUserId() })
        });
    }

    async getProjects() {
        return this.get('projects.php');
    }

    async getProject(id) {
        return this.get(`projects.php?id=${id}`);
    }

    async getProjectMembers(id) {
        return this.get(`project_members.php?project_id=${id}`);
    }

    // Получаване на всички изисквания
    async getRequirements() {
        return this.get('requirements.php');
    }

    async getRequirementsByProject(projectId) {
        return this.get(`requirements.php?project_id=${projectId}`);
    }

    // Получаване на изискване по ID
    async getRequirement(id) {
        return this.get(`requirements.php?id=${id}`);
    }

    // Създаване на ново изискване
    async createRequirement(data) {
        return this.post('requirements.php', data);
    }
    async addRequirementToAll(data) {
        data.project_id = 0;
        return this.post('requirements.php', data);
    }
    // Редактиране на изискване
    async updateRequirement(id, data) {
        return this.patch(`requirements.php?id=${id}`, data);
    }

    // Изтриване на изискване
    async deleteRequirement(id) {
        return this.delete(`requirements.php?id=${id}`);
    }

    async getDiagramsByProject(projectId) {
        return this.get(`diagrams.php?project_id=${projectId}`);
    }

    async createDiagram(data) {
        return this.post('diagrams.php', data);
    }



    // Получаване на индикатори за изискване
    async getIndicators(requirementId) {
        return this.get(`indicators.php?requirement_id=${requirementId}`);
    }

    // Създаване на индикатор
    async createIndicator(data) {
        return this.post('indicators.php', data);
    }

    // Редактиране на индикатор
    async updateIndicator(id, data) {
        return this.put(`indicators.php?id=${id}`, data);
    }

    // Изтриване на индикатор
    async deleteIndicator(id) {
        return this.delete(`indicators.php?id=${id}`);
    }

    // Получаване на статистики
    async getStatistics() {
        return this.get('statistics.php');
    }

    // Експорт на данни
    async exportData(format, filters = {}) {
        const params = new URLSearchParams({
            format: format,
            ...filters
        });

        // За експорт използваме обикновена заявка, защото очакваме файл
        const response = await fetch(`${this.baseUrl}export.php?${params}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Грешка при експорт');
        }

        return response;
    }

    // Импорт на данни
    async importData(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            showLoading();
            const response = await fetch(`${this.baseUrl}import.php`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Грешка при импорт');
            }

            return data;
        } catch (error) {
            debugLog('Import Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Получаване на списък с всички компоненти
    async getComponents() {
        return this.get('components.php');
    }

    // Получаване на списък с всички отговорни
    async getAssignees() {
        return this.get('assignees.php');
    }

    // Получаване на списък с всички хеш-тагове
    async getTags() {
        return this.get('tags.php');
    }

    // Генериране на отчет
    async generateReport(type, filters = {}) {
        const params = new URLSearchParams({
            type: type,
            ...filters
        });

        return this.get(`reports.php?${params}`);
    }

    // Търсене в изисквания
    async searchRequirements(query, filters = {}) {
        const params = new URLSearchParams({
            search: query,
            ...filters
        });

        return this.get(`search.php?${params}`);
    }

    // Bulk операции
    async bulkOperation(operation, ids, data = {}) {
        return this.post('bulk.php', {
            operation: operation,
            ids: ids,
            data: data
        });
    }

    async requestExportProjectToJson(projectId) {
        return this.get(`projects.php?export_to=json&id=${projectId}`);
    }

    async requestExportProjectToMarkdown(projectId) {
        return this.getFile(`projects.php?export_to=md&id=${projectId}`);
    }

    async importProjectFromJson(file, projectId) {
        const endpoint = 'import_project.php';
        const formData = new FormData();
        const userId = getUserId();

        if (!userId) {
            throw new Error('User is not logged in');
        }

        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('user_id', userId);  // No need to JSON.stringify since it's already a string

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to import project');
            }

            const result = await response.json();
            if (result.status !== 'ok') {
                throw new Error(result.message || 'Import failed');
            }
            return result;
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        }
    }

    async generatePlantUMLDiagram(umlText, format = 'png') {
        try {
            const encodeUML = this.encodeUML(umlText);
            const plantUMLUrl = `https://www.plantuml.com/plantuml/${format}/${encodedUML}`;
            const response = await fetch(plantUMLUrl);

            if (!response.ok) {
                throw new Error(`PlantUML API error: ${response.status} ${response.statusText}`);
            }

            // Return blob for image data
            const blob = await response.blob();
            return {
                blob: blob,
                url: URL.createObjectURL(blob),
                plantUMLUrl: plantUMLUrl
            };

        } catch (error) {
            console.error('PlantUML generation failed:', error);
            throw error;
        }
    }

    // encodePlantUML(umlText) {
    // // PlantUML uses a specific encoding scheme
    // // This is a simplified version - for production, use the official PlantUML encoder
    // const compressed = this.compressUML(umlText);
    // return this.encode64(compressed);
    // }

    // create project
    async createProject(data) {
        try {
            return this.post('projects.php', data);
        } catch (error) {
            debugLog('Create project failed:', error);
            throw error;
        }
    }

    async addMemberToProject(projectId, username) {
        try {
            return this.post('project_members.php', { 'project_id': projectId, 'username': username });
        } catch (error) {
            debugLog('Add user failed:', error);
            throw error;
        }
    }

    async registerUser({ username, email, password }) {
        const response = await fetch(`${this.baseUrl}users.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        return response.json();
    }

    async loginUser({ username, password }) {
        const response = await fetch(`${this.baseUrl}users.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        console.log('Login response:', response);
        return response.json();
    }

}

// Глобална инстанция на API
const api = new API();

// Initialize diagram form submission


// Обработка на грешки в заявките
window.addEventListener('unhandledrejection', event => {
    debugLog('Unhandled API rejection:', event.reason);

    // Показваме грешката на потребителя, ако не е била обработена
    if (event.reason instanceof Error) {
        showError('Възникна грешка: ' + event.reason.message);
    }
});


// Получаване на ID на потребителя
function getUserId() {
    return window.userHelper.getUserId();
}