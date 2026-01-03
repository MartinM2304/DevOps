// requirements.js - Управление на изисквания

class RequirementManager {
    constructor() {
        this.requirements = [];
        this.currentId = 1;
        this.loadFromStorage();
    }

    // Създаване на ново изискване
    createRequirement(data) {
        const requirement = {
            id: this.currentId++,
            title: data.title,
            description: data.description,
            type: data.type, // functional или non-functional
            priority: data.priority, // low, medium, high
            complexity: parseInt(data.complexity),
            component: data.component || '',
            assignee: data.assignee || '',
            tags: this.parseTags(data.tags),
            indicators: data.indicators || [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.requirements.push(requirement);
        this.saveToStorage();
        this.updateStats();
        
        return requirement;
    }

    // Редактиране на изискване
    updateRequirement(id, data) {
        const index = this.requirements.findIndex(req => req.id === parseInt(id));
        if (index === -1) return null;

        const requirement = this.requirements[index];
        Object.assign(requirement, {
            ...data,
            tags: data.tags ? this.parseTags(data.tags) : requirement.tags,
            updatedAt: new Date().toISOString()
        });

        this.saveToStorage();
        this.updateStats();
        return requirement;
    }

    // Изтриване на изискване
    deleteRequirement(id) {
        const index = this.requirements.findIndex(req => req.id === parseInt(id));
        if (index === -1) return false;

        this.requirements.splice(index, 1);
        this.saveToStorage();
        this.updateStats();
        return true;
    }

    // Получаване на изискване по ID
    getRequirement(id) {
        return this.requirements.find(req => req.id === parseInt(id));
    }

    // Получаване на всички изисквания
    getAllRequirements() {
        return [...this.requirements];
    }

    // Получаване на изисквания с филтри
    getFilteredRequirements(filters = {}) {
        let filtered = [...this.requirements];

        // Филтър по текст
        if (filters.searchText) {
            const searchTerm = filters.searchText.toLowerCase();
            filtered = filtered.filter(req => 
                req.title.toLowerCase().includes(searchTerm) ||
                req.description.toLowerCase().includes(searchTerm) ||
                req.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Филтър по тип
        if (filters.type) {
            filtered = filtered.filter(req => req.type === filters.type);
        }

        // Филтър по приоритет
        if (filters.priority) {
            filtered = filtered.filter(req => req.priority === filters.priority);
        }

        // Филтър по компонент
        if (filters.component) {
            filtered = filtered.filter(req => 
                req.component.toLowerCase().includes(filters.component.toLowerCase())
            );
        }

        // Филтър по отговорен
        if (filters.assignee) {
            filtered = filtered.filter(req => 
                req.assignee.toLowerCase().includes(filters.assignee.toLowerCase())
            );
        }

        // Филтър по хеш-тагове
        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter(req => 
                filters.tags.some(tag => req.tags.includes(tag))
            );
        }

        // Филтър по сложност
        if (filters.complexity) {
            filtered = filtered.filter(req => req.complexity === parseInt(filters.complexity));
        }

        return filtered;
    }

    // Сортиране на изисквания
    sortRequirements(requirements, sortBy, order = 'asc') {
        return requirements.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    valueA = priorityOrder[a.priority];
                    valueB = priorityOrder[b.priority];
                    break;
                case 'complexity':
                    valueA = a.complexity;
                    valueB = b.complexity;
                    break;
                case 'title':
                    valueA = a.title.toLowerCase();
                    valueB = b.title.toLowerCase();
                    break;
                case 'createdAt':
                    valueA = new Date(a.createdAt);
                    valueB = new Date(b.createdAt);
                    break;
                case 'type':
                    valueA = a.type;
                    valueB = b.type;
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Добавяне на индикатор към нефункционално изискване
    addIndicator(requirementId, indicator) {
        const requirement = this.getRequirement(requirementId);
        if (!requirement || requirement.type !== 'non-functional') return false;

        const newIndicator = {
            id: Date.now(),
            name: indicator.name,
            unit: indicator.unit || '',
            value: indicator.value || '',
            description: indicator.description,
            createdAt: new Date().toISOString()
        };

        requirement.indicators.push(newIndicator);
        requirement.updatedAt = new Date().toISOString();
        this.saveToStorage();
        return newIndicator;
    }

    // Премахване на индикатор
    removeIndicator(requirementId, indicatorId) {
        const requirement = this.getRequirement(requirementId);
        if (!requirement) return false;

        const index = requirement.indicators.findIndex(ind => ind.id === indicatorId);
        if (index === -1) return false;

        requirement.indicators.splice(index, 1);
        requirement.updatedAt = new Date().toISOString();
        this.saveToStorage();
        return true;
    }

    // Парсване на хеш-тагове
    parseTags(tagsString) {
        if (!tagsString) return [];
        
        return tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => tag.startsWith('#') ? tag : '#' + tag);
    }

    // Получаване на всички уникални хеш-тагове
    getAllTags() {
        const allTags = new Set();
        this.requirements.forEach(req => {
            req.tags.forEach(tag => allTags.add(tag));
        });
        return Array.from(allTags).sort();
    }

    // Получаване на всички уникални компоненти
    getAllComponents() {
        const components = new Set();
        this.requirements.forEach(req => {
            if (req.component) components.add(req.component);
        });
        return Array.from(components).sort();
    }

    // Получаване на всички отговорни лица
    getAllAssignees() {
        const assignees = new Set();
        this.requirements.forEach(req => {
            if (req.assignee) assignees.add(req.assignee);
        });
        return Array.from(assignees).sort();
    }

    // Статистики
    getStats() {
        const stats = {
            total: this.requirements.length,
            functional: this.requirements.filter(req => req.type === 'functional').length,
            nonFunctional: this.requirements.filter(req => req.type === 'non-functional').length,
            highPriority: this.requirements.filter(req => req.priority === 'high').length,
            mediumPriority: this.requirements.filter(req => req.priority === 'medium').length,
            lowPriority: this.requirements.filter(req => req.priority === 'low').length,
            byComplexity: {}
        };

        // Статистики по сложност
        for (let i = 1; i <= 5; i++) {
            stats.byComplexity[i] = this.requirements.filter(req => req.complexity === i).length;
        }

        return stats;
    }

    // Актуализиране на статистиките в UI
    updateStats() {
        const stats = this.getStats();
        
        const totalEl = document.getElementById('total-requirements');
        const functionalEl = document.getElementById('functional-count');
        const nonFunctionalEl = document.getElementById('non-functional-count');
        const highPriorityEl = document.getElementById('high-priority-count');

        if (totalEl) totalEl.textContent = stats.total;
        if (functionalEl) functionalEl.textContent = stats.functional;
        if (nonFunctionalEl) nonFunctionalEl.textContent = stats.nonFunctional;
        if (highPriorityEl) highPriorityEl.textContent = stats.highPriority;
    }

    // Запазване в localStorage
    saveToStorage() {
        try {
            const data = {
                requirements: this.requirements,
                currentId: this.currentId
            };
            localStorage.setItem('requirements_data', JSON.stringify(data));
        } catch (error) {
            console.error('Грешка при запазване на данните:', error);
        }
    }

    // Зареждане от localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem('requirements_data');
            if (data) {
                const parsed = JSON.parse(data);
                this.requirements = parsed.requirements || [];
                this.currentId = parsed.currentId || 1;
            }
        } catch (error) {
            console.error('Грешка при зареждане на данните:', error);
            this.requirements = [];
            this.currentId = 1;
        }
    }

    // Изчистване на всички данни
    clearAllData() {
        this.requirements = [];
        this.currentId = 1;
        localStorage.removeItem('requirements_data');
        this.updateStats();
    }

    // Импорт на данни
    importData(data) {
        try {
            if (Array.isArray(data)) {
                // Ако данните са масив от изисквания
                data.forEach(req => {
                    if (req.title && req.description && req.type) {
                        const newReq = this.createRequirement({
                            title: req.title,
                            description: req.description,
                            type: req.type,
                            priority: req.priority || 'medium',
                            complexity: req.complexity || 3,
                            component: req.component || '',
                            assignee: req.assignee || '',
                            tags: Array.isArray(req.tags) ? req.tags.join(', ') : (req.tags || ''),
                            indicators: req.indicators || []
                        });
                    }
                });
            } else if (data.requirements) {
                // Ако данните са обект с requirements масив
                this.requirements = data.requirements;
                this.currentId = data.currentId || this.requirements.length + 1;
                this.saveToStorage();
            }
            
            this.updateStats();
            return true;
        } catch (error) {
            console.error('Грешка при импорт на данните:', error);
            return false;
        }
    }

    // Експорт на данни
    exportData() {
        return {
            requirements: this.requirements,
            currentId: this.currentId,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }
}

// Глобална инстанция на RequirementManager
window.requirementManager = new RequirementManager();