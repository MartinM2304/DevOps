// utils.js - Помощни функции

// Генериране на уникален ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Форматиране на дата
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Валидация на данни
function validateRequirement(data) {
    const errors = [];
    
    if (!data.title || data.title.trim() === '') {
        errors.push('Заглавието е задължително');
    }
    
    if (!data.description || data.description.trim() === '') {
        errors.push('Описанието е задължително');
    }
    
    if (!data.type || (data.type !== 'functional' && data.type !== 'non-functional')) {
        errors.push('Типът изискване е задължителен');
    }
    
    if (data.complexity && (data.complexity < 1 || data.complexity > 5)) {
        errors.push('Сложността трябва да бъде между 1 и 5');
    }
    
    return errors;
}

// Валидация на индикатор
function validateIndicator(data) {
    const errors = [];
    
    if (!data.name || data.name.trim() === '') {
        errors.push('Името на индикатора е задължително');
    }
    
    if (!data.description || data.description.trim() === '') {
        errors.push('Описанието на индикатора е задължително');
    }
    
    return errors;
}

// Парсиране на хеш-тагове
function parseTags(tagsString) {
    if (!tagsString) return [];
    
    return tagsString.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => tag.startsWith('#') ? tag : '#' + tag);
}

// Форматиране на хеш-тагове за показване
function formatTags(tags) {
    if (!tags || tags.length === 0) return '';
    return tags.join(', ');
}

// Дебъг лог
function debugLog(message, data = null) {
    if (window.DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, data);
    }
}

// Показване на съобщение за грешка
function showError(message) {
    showToast(message, 'error');
}

// Показване на съобщение за успех
function showSuccess(message) {
    showToast(message, 'success');
}

// Показване на toast съобщение
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Показване на loading индикатор
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// Скриване на loading индикатор
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Конвертиране на приоритет за показване
function getPriorityText(priority) {
    const priorities = {
        'low': 'Нисък',
        'medium': 'Среден',
        'high': 'Висок'
    };
    return priorities[priority] || priority;
}

// Конвертиране на тип за показване
function getTypeText(type) {
    const types = {
        'functional': 'Функционално',
        'non-functional': 'Нефункционално'
    };
    return types[type] || type;
}

// Конвертиране на сложност за показване
function getComplexityText(complexity) {
    const complexities = {
        1: '1 - Много лесно',
        2: '2 - Лесно',
        3: '3 - Средно',
        4: '4 - Трудно',
        5: '5 - Много трудно'
    };
    return complexities[complexity] || complexity;
}

// Сортиране на масив от обекти
function sortArray(array, field, direction = 'asc') {
    return array.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Специално третиране за числа
        if (field === 'complexity' || field === 'priority_num') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }
        
        // Специално третиране за дати
        if (field === 'created_at' || field === 'updated_at') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        // Специално третиране за приоритет
        if (field === 'priority') {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            aVal = priorityOrder[aVal] || 0;
            bVal = priorityOrder[bVal] || 0;
        }
        
        if (aVal < bVal) {
            return direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

// Филтриране на масив от изисквания
function filterRequirements(requirements, filters) {
    return requirements.filter(req => {
        // Филтър по текст
        if (filters.searchText) {
            const searchText = filters.searchText.toLowerCase();
            const titleMatch = req.title.toLowerCase().includes(searchText);
            const descMatch = req.description.toLowerCase().includes(searchText);
            const tagsMatch = req.tags && req.tags.some(tag => 
                tag.toLowerCase().includes(searchText)
            );
            
            if (!titleMatch && !descMatch && !tagsMatch) {
                return false;
            }
        }
        
        // Филтър по тип
        if (filters.type && req.type !== filters.type) {
            return false;
        }
        
        // Филтър по приоритет
        if (filters.priority && req.priority !== filters.priority) {
            return false;
        }
        
        // Филтър по компонент
        if (filters.component && req.component !== filters.component) {
            return false;
        }
        
        // Филтър по отговорен
        if (filters.assignee && req.assignee !== filters.assignee) {
            return false;
        }
        
        // Филтър по хеш-таг
        if (filters.tag) {
            if (!req.tags || !req.tags.includes(filters.tag)) {
                return false;
            }
        }
        
        return true;
    });
}

// Escape HTML символи
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Truncate текст
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}