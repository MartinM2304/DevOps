// export.js - Система за експорт и импорт на данни

class ExportManager {
    constructor() {
        this.supportedFormats = ['json', 'csv', 'xml'];
    }

    async exportToJSON(projectId = null) {
        if (!projectId) {
            showToast('Моля изберете проект за експорт', 'error');
            return;
        }
        try {
            let data = await api.requestExportProjectToJson(projectId);
            const exportData = {
                exportDate: new Date().toISOString(),
                projectData: data,
                metadata: {
                    version: '1.0',
                    generator: 'Система за управление на изисквания'
                }
            };
            const projectName = (data.project?.name || 'project').replace(/\s+/g, '_');
            const jsonString = JSON.stringify(exportData, null, 2);
            this.downloadFile(jsonString, `${projectName}.json`, 'application/json');
            
            showToast('JSON файлът е изтеглен успешно!', 'success');
        } catch (error) {
            console.error('Грешка при експорт в JSON:', error);
            showToast('Грешка при експорт в JSON формат', 'error');
        }
    }

    async exportToMarkdown(projectId = null) {
        if (!projectId) {
            showToast('Моля изберете проект за експорт', 'error');
            return;
        }
        try {
            const markdown = await api.requestExportProjectToMarkdown(projectId);
            const projectName = markdown.filename ? markdown.filename : 'project';
            this.downloadFile(markdown.content, `${projectName}.md`, 'text/markdown');
            showToast('Markdown файлът е изтеглен успешно!', 'success');
        } catch (error) {
            console.error('Грешка при експорт в Markdown:', error);
            showToast('Грешка при експорт в Markdown формат', 'error');
        }
    }

    // Експорт на изисквания в CSV формат
    exportToCSV(requirements = null) {
        try {
            const data = requirements || window.requirementManager.getAllRequirements();
            
            // Заглавия на колоните
            const headers = [
                'ID', 'Заглавие', 'Описание', 'Тип', 'Приоритет', 'Сложност',
                'Компонент', 'Отговорен', 'Хеш-тагове', 'Индикатори', 
                'Дата на създаване', 'Дата на обновяване'
            ];

            // Преобразуване на данните в CSV редове
            const csvRows = [headers.join(',')];
            
            data.forEach(req => {
                const row = [
                    req.id,
                    this.escapeCsvField(req.title),
                    this.escapeCsvField(req.description),
                    req.type === 'functional' ? 'Функционално' : 'Нефункционално',
                    this.getPriorityText(req.priority),
                    req.complexity,
                    this.escapeCsvField(req.component || ''),
                    this.escapeCsvField(req.assignee || ''),
                    this.escapeCsvField(req.tags.join('; ')),
                    this.escapeCsvField(this.formatIndicators(req.indicators)),
                    this.formatDate(req.createdAt),
                    this.formatDate(req.updatedAt)
                ];
                csvRows.push(row.join(','));
            });

            const csvString = csvRows.join('\n');
            this.downloadFile(csvString, 'requirements.csv', 'text/csv');
            
            showToast('CSV файлът е изтеглен успешно!', 'success');
        } catch (error) {
            console.error('Грешка при експорт в CSV:', error);
            showToast('Грешка при експорт в CSV формат', 'error');
        }
    }

    // Експорт на изисквания в XML формат
    exportToXML(requirements = null) {
        try {
            const data = requirements || window.requirementManager.getAllRequirements();
            
            let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xmlString += '<requirements>\n';
            xmlString += `  <metadata>\n`;
            xmlString += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
            xmlString += `    <totalRequirements>${data.length}</totalRequirements>\n`;
            xmlString += `    <version>1.0</version>\n`;
            xmlString += `  </metadata>\n`;
            
            data.forEach(req => {
                xmlString += '  <requirement>\n';
                xmlString += `    <id>${req.id}</id>\n`;
                xmlString += `    <title><![CDATA[${req.title}]]></title>\n`;
                xmlString += `    <description><![CDATA[${req.description}]]></description>\n`;
                xmlString += `    <type>${req.type}</type>\n`;
                xmlString += `    <priority>${req.priority}</priority>\n`;
                xmlString += `    <complexity>${req.complexity}</complexity>\n`;
                xmlString += `    <component><![CDATA[${req.component || ''}]]></component>\n`;
                xmlString += `    <assignee><![CDATA[${req.assignee || ''}]]></assignee>\n`;
                xmlString += `    <tags>\n`;
                req.tags.forEach(tag => {
                    xmlString += `      <tag><![CDATA[${tag}]]></tag>\n`;
                });
                xmlString += `    </tags>\n`;
                xmlString += `    <indicators>\n`;
                req.indicators.forEach(ind => {
                    xmlString += `      <indicator>\n`;
                    xmlString += `        <name><![CDATA[${ind.name}]]></name>\n`;
                    xmlString += `        <description><![CDATA[${ind.description}]]></description>\n`;
                    xmlString += `        <unit><![CDATA[${ind.unit || ''}]]></unit>\n`;
                    xmlString += `        <value><![CDATA[${ind.value || ''}]]></value>\n`;
                    xmlString += `      </indicator>\n`;
                });
                xmlString += `    </indicators>\n`;
                xmlString += `    <createdAt>${req.createdAt}</createdAt>\n`;
                xmlString += `    <updatedAt>${req.updatedAt}</updatedAt>\n`;
                xmlString += '  </requirement>\n';
            });
            
            xmlString += '</requirements>';

            this.downloadFile(xmlString, 'requirements.xml', 'application/xml');
            
            showToast('XML файлът е изтеглен успешно!', 'success');
        } catch (error) {
            console.error('Грешка при експорт в XML:', error);
            showToast('Грешка при експорт в XML формат', 'error');
        }
    }

    async importProjectFromFile(file) {
        try {
            if (!currentProjectId) {
                showToast('Моля, изберете проект за импорт', 'error');
                return;
            }

            const result = await api.importProjectFromJson(file, currentProjectId);
            if (result.status === 'ok') {
                showToast('Изискванията са импортирани успешно!', 'success');
                // Refresh the requirements list
                await loadProjectData(currentProjectId);
        // Update dashboard with fresh data
        loadDashboard(currentProjectId, currentRequirements);
            } else {
                showToast('Грешка при импорт: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Грешка при импорт на проект:', error);
            showToast('Грешка при импорт на проекта: ' + error.message, 'error');
        }
    }

    // Импорт на файл
    async importFile() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            showToast('Моля изберете файл за импорт', 'error');
            return;
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(fileExtension)) {
            showToast('Неподдържан формат на файл. Поддържани формати: JSON, CSV, XML', 'error');
            return;
        }

        try {
            showLoading(true);
            const content = await this.readFile(file);
            
            let importedRequirements = [];
            
            switch (fileExtension) {
                case 'json':
                    importedRequirements = await this.parseJSON(content);
                    break;
                case 'csv':
                    importedRequirements = await this.parseCSV(content);
                    break;
                case 'xml':
                    importedRequirements = await this.parseXML(content);
                    break;
            }

            if (importedRequirements.length > 0) {
                await this.saveImportedRequirements(importedRequirements);
                showToast(`Успешно импортирани ${importedRequirements.length} изисквания`, 'success');
                
                // Презареждане на данните в интерфейса
                await window.requirementManager.loadRequirements();
                updateDashboard();
                applyFilters();
            } else {
                showToast('Не са намерени валидни изисквания в файла', 'warning');
            }

        } catch (error) {
            console.error('Грешка при импорт:', error);
            showToast('Грешка при импорт на файла: ' + error.message, 'error');
        } finally {
            showLoading(false);
            fileInput.value = '';
        }
    }

    // Четене на файл
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Грешка при четене на файла'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    // Парсване на JSON
    async parseJSON(content) {
        try {
            const data = JSON.parse(content);
            
            // Проверка дали е валиден формат
            if (data.requirements && Array.isArray(data.requirements)) {
                return data.requirements.map(req => this.validateRequirement(req));
            } else if (Array.isArray(data)) {
                return data.map(req => this.validateRequirement(req));
            } else {
                throw new Error('Невалиден JSON формат');
            }
        } catch (error) {
            throw new Error('Грешка при парсване на JSON: ' + error.message);
        }
    }

    // Парсване на CSV
    async parseCSV(content) {
        try {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                throw new Error('CSV файлът трябва да има поне заглавен ред и един ред с данни');
            }

            const headers = this.parseCSVLine(lines[0]);
            const requirements = [];

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const req = this.csvRowToRequirement(headers, values);
                    if (req) {
                        requirements.push(req);
                    }
                }
            }

            return requirements;
        } catch (error) {
            throw new Error('Грешка при парсване на CSV: ' + error.message);
        }
    }

    // Парсване на XML
    async parseXML(content) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error('Невалиден XML формат');
            }

            const requirementNodes = xmlDoc.getElementsByTagName('requirement');
            const requirements = [];

            for (let i = 0; i < requirementNodes.length; i++) {
                const req = this.xmlNodeToRequirement(requirementNodes[i]);
                if (req) {
                    requirements.push(req);
                }
            }

            return requirements;
        } catch (error) {
            throw new Error('Грешка при парсване на XML: ' + error.message);
        }
    }

    // Валидиране на изискване
    validateRequirement(req) {
        if (!req.title || !req.description) {
            return null;
        }

        return {
            id: req.id || this.generateId(),
            title: String(req.title).trim(),
            description: String(req.description).trim(),
            type: ['functional', 'non-functional'].includes(req.type) ? req.type : 'functional',
            priority: ['high', 'medium', 'low'].includes(req.priority) ? req.priority : 'medium',
            complexity: Math.max(1, Math.min(5, parseInt(req.complexity) || 3)),
            component: String(req.component || '').trim(),
            assignee: String(req.assignee || '').trim(),
            tags: Array.isArray(req.tags) ? req.tags : 
                  (req.tags ? String(req.tags).split(/[,;]/).map(t => t.trim()).filter(t => t) : []),
            indicators: Array.isArray(req.indicators) ? req.indicators.filter(ind => ind.name && ind.description) : [],
            createdAt: req.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    // Преобразуване на CSV ред в изискване
    csvRowToRequirement(headers, values) {
        const req = {};
        
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i].toLowerCase();
            const value = values[i] || '';

            switch (header) {
                case 'id':
                    req.id = value;
                    break;
                case 'заглавие':
                case 'title':
                    req.title = value;
                    break;
                case 'описание':
                case 'description':
                    req.description = value;
                    break;
                case 'тип':
                case 'type':
                    req.type = value.includes('Функционално') || value === 'functional' ? 'functional' : 'non-functional';
                    break;
                case 'приоритет':
                case 'priority':
                    if (value.includes('Висок') || value === 'high') req.priority = 'high';
                    else if (value.includes('Нисък') || value === 'low') req.priority = 'low';
                    else req.priority = 'medium';
                    break;
                case 'сложност':
                case 'complexity':
                    req.complexity = parseInt(value) || 3;
                    break;
                case 'компонент':
                case 'component':
                    req.component = value;
                    break;
                case 'отговорен':
                case 'assignee':
                    req.assignee = value;
                    break;
                case 'хеш-тагове':
                case 'tags':
                    req.tags = value.split(/[,;]/).map(t => t.trim()).filter(t => t);
                    break;
            }
        }

        return this.validateRequirement(req);
    }

    // Преобразуване на XML възел в изискване
    xmlNodeToRequirement(node) {
        const req = {
            id: this.getXMLNodeText(node, 'id'),
            title: this.getXMLNodeText(node, 'title'),
            description: this.getXMLNodeText(node, 'description'),
            type: this.getXMLNodeText(node, 'type'),
            priority: this.getXMLNodeText(node, 'priority'),
            complexity: parseInt(this.getXMLNodeText(node, 'complexity')) || 3,
            component: this.getXMLNodeText(node, 'component'),
            assignee: this.getXMLNodeText(node, 'assignee'),
            createdAt: this.getXMLNodeText(node, 'createdAt'),
            updatedAt: this.getXMLNodeText(node, 'updatedAt')
        };

        // Парсване на тагове
        const tagsNode = node.getElementsByTagName('tags')[0];
        req.tags = [];
        if (tagsNode) {
            const tagNodes = tagsNode.getElementsByTagName('tag');
            for (let i = 0; i < tagNodes.length; i++) {
                req.tags.push(tagNodes[i].textContent.trim());
            }
        }

        // Парсване на индикатори
        const indicatorsNode = node.getElementsByTagName('indicators')[0];
        req.indicators = [];
        if (indicatorsNode) {
            const indicatorNodes = indicatorsNode.getElementsByTagName('indicator');
            for (let i = 0; i < indicatorNodes.length; i++) {
                const ind = {
                    name: this.getXMLNodeText(indicatorNodes[i], 'name'),
                    description: this.getXMLNodeText(indicatorNodes[i], 'description'),
                    unit: this.getXMLNodeText(indicatorNodes[i], 'unit'),
                    value: this.getXMLNodeText(indicatorNodes[i], 'value')
                };
                if (ind.name && ind.description) {
                    req.indicators.push(ind);
                }
            }
        }

        return this.validateRequirement(req);
    }

    // Помощни функции
    getXMLNodeText(parent, tagName) {
        const node = parent.getElementsByTagName(tagName)[0];
        return node ? node.textContent.trim() : '';
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    async saveImportedRequirements(requirements) {
        for (const req of requirements) {
            await window.apiManager.saveRequirement(req);
        }
    }

    generateId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Помощна функция за изтегляне на файл
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Освобождаване на паметта
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // Escape на полета за CSV
    escapeCsvField(field) {
        if (field === null || field === undefined) return '';
        
        const stringField = String(field);
        
        // Ако полето съдържа запетая, нов ред или кавички, го обгради с кавички
        if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
            return '"' + stringField.replace(/"/g, '""') + '"';
        }
        
        return stringField;
    }

    // Форматиране на индикатори за експорт
    formatIndicators(indicators) {
        if (!indicators || indicators.length === 0) return '';
        
        return indicators.map(ind => {
            let result = `${ind.name}: ${ind.description}`;
            if (ind.unit) result += ` (${ind.unit})`;
            if (ind.value) result += ` = ${ind.value}`;
            return result;
        }).join('; ');
    }

    // Получаване на текст за приоритет
    getPriorityText(priority) {
        const texts = {
            high: 'Висок',
            medium: 'Среден',
            low: 'Нисък'
        };
        return texts[priority] || priority;
    }

    // Форматиране на дата
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('bg-BG') + ' ' + date.toLocaleTimeString('bg-BG');
    }
}

// Глобални функции за експорт/импорт
function exportToJSON() {
    window.exportManager.exportToJSON(currentProjectId);
}

function exportToMarkdown() {
    window.exportManager.exportToMarkdown(currentProjectId);
}

function importProjectFromJson() {
    let input = document.getElementById('importFileInput');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        input.id = 'importFileInput';
        document.body.appendChild(input);
    }
    input.value = ''; // Reset input so same file can be selected again
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            window.exportManager.importProjectFromFile(file);
        }
    };
    input.click();
}

function exportToXML() {
    window.exportManager.exportToXML();
}

function importFile() {
    window.exportManager.importFile();
}