// filters.js - Система за филтриране и търсене

class FilterManager {
    constructor() {
        this.currentFilters = {};
        this.sortOptions = {
            field: 'createdAt',
            order: 'desc'
        };
        this.initializeFilters();
    }

    // Инициализиране на филтрите
    initializeFilters() {
        this.setupEventListeners();
        this.populateFilterOptions();
        this.createPresetFilters();
    }

    // Настройка на event listeners
    setupEventListeners() {
        // Търсене в реално време
        const searchInput = document.getElementById('search-text');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.applyFilters();
            }, 300));
        }

        // Филтри за тип и приоритет
        const typeFilter = document.getElementById('filter-type');
        const priorityFilter = document.getElementById('filter-priority');

        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }

        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.applyFilters());
        }

        // Бутони за сортиране
        this.setupSortButtons();
    }

    // Настройка на бутоните за сортиране
    setupSortButtons() {
        const sortContainer = document.createElement('div');
        sortContainer.className = 'sort-container';
        sortContainer.innerHTML = `
            <div class="sort-section">
                <h4>Сортиране</h4>
                <div class="sort-options">
                    <select id="sort-field">
                        <option value="createdAt">Дата на създаване</option>
                        <option value="priority">Приоритет</option>
                        <option value="complexity">Сложност</option>
                        <option value="title">Заглавие</option>
                        <option value="type">Тип</option>
                    </select>
                    <select id="sort-order">
                        <option value="desc">Низходящо</option>
                        <option value="asc">Възходящо</option>
                    </select>
                    <button class="btn btn-secondary" onclick="filterManager.applySorting()">Сортирай</button>
                </div>
            </div>
        `;

        const filterSection = document.querySelector('.filter-section');
        if (filterSection) {
            filterSection.appendChild(sortContainer);
        }
    }

    // Попълване на опциите във филтрите
    populateFilterOptions() {
        this.populateTagsFilter();
        this.populateComponentsFilter();
        this.populateAssigneesFilter();
    }

    // Попълване на филтъра за хеш-тагове
    populateTagsFilter() {
        const tags = window.requirementManager.getAllTags();

        // Създаване на секция за филтриране по тагове
        const tagsFilterHtml = `
            <div class="form-group">
                <label for="filter-tags">Хеш-тагове</label>
                <div class="tags-container" id="tags-filter-container">
                    ${tags.map(tag => `
                        <label class="tag-checkbox">
                            <input type="checkbox" value="${tag}" onchange="filterManager.applyFilters()">
                            <span class="tag">${tag}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        const filterRow = document.querySelector('.filter-row');
        if (filterRow && tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.innerHTML = tagsFilterHtml;
            filterRow.parentNode.insertBefore(tagsDiv, filterRow.nextSibling);
        }
    }

    // Попълване на филтъра за компоненти
    populateComponentsFilter() {
        const components = window.requirementManager.getAllComponents();

        if (components.length > 0) {
            const componentFilterHtml = `
                <div class="form-group advanced-filter">
                    <label for="filter-component">Компонент</label>
                    <select id="filter-component" onchange="filterManager.applyFilters()">
                        <option value="">Всички компоненти</option>
                        ${components.map(comp => `<option value="${comp}">${comp}</option>`).join('')}
                    </select>
                </div>
            `;

            this.addAdvancedFilter(componentFilterHtml);
        }
    }

    // Попълване на филтъра за отговорни лица
    populateAssigneesFilter() {
        const assignees = window.requirementManager.getAllAssignees();

        if (assignees.length > 0) {
            const assigneeFilterHtml = `
                <div class="form-group advanced-filter">
                    <label for="filter-assignee">Отговорен</label>
                    <select id="filter-assignee" onchange="filterManager.applyFilters()">
                        <option value="">Всички отговорни</option>
                        ${assignees.map(assignee => `<option value="${assignee}">${assignee}</option>`).join('')}
                    </select>
                </div>
            `;

            this.addAdvancedFilter(assigneeFilterHtml);
        }
    }

    // Добавяне на разширени филтри
    addAdvancedFilter(html) {
        let advancedSection = document.querySelector('.advanced-filters');

        if (!advancedSection) {
            advancedSection = document.createElement('div');
            advancedSection.className = 'advanced-filters';
            advancedSection.innerHTML = '<h4>Разширени филтри</h4>';

            const filterSection = document.querySelector('.filter-section');
            if (filterSection) {
                filterSection.appendChild(advancedSection);
            }
        }

        const div = document.createElement('div');
        div.innerHTML = html;
        advancedSection.appendChild(div.firstElementChild);
    }

    // Прилагане на всички филтри
    async applyFilters() {
        const allRequirements = currentRequirements;
        this.currentFilters = this.collectFilters();
        const filters = this.currentFilters;
        let filtered = allRequirements.filter(req => {
            const text = (filters.searchText || "").toLowerCase();
            const matchesText =
                !text ||
                req.title.toLowerCase().includes(text) ||
                req.description.toLowerCase().includes(text);

            const matchesType =
                !filters.type || req.type === filters.type;

            const matchesPriority =
                !filters.priority || req.priority === filters.priority;


            // Tags filter (all selected tags must be present)
            const matchesTags =
                !filters.tags || filters.tags.length === 0 ||
                filters.tags.every(tag => req.tags.includes(tag));

            return (
                matchesText &&
                matchesType &&
                matchesPriority &&
                matchesTags
            );
        });

        let sortField = this.sortOptions.field;
        let sortDirection = this.sortOptions.order;
        filtered.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            // Handle case-insensitive string sorting
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        this.displayFilteredResults(filtered);
        this.updateFilterStats(filtered);
    }

    // Събиране на всички филтри
    collectFilters() {
        const filters = {};

        // Текстово търсене
        const searchText = document.getElementById('search-text');
        if (searchText && searchText.value.trim()) {
            filters.searchText = searchText.value.trim();
        }

        // Тип изискване
        const typeFilter = document.getElementById('filter-type');
        if (typeFilter && typeFilter.value) {
            filters.type = typeFilter.value;
        }

        // Приоритет
        const priorityFilter = document.getElementById('filter-priority');
        if (priorityFilter && priorityFilter.value) {
            filters.priority = priorityFilter.value;
        }

        const tagFilter = document.getElementById('filter-tag');
        if (tagFilter && tagFilter.value.trim()) {
            const tags = tagFilter.value
                .split(',')
                .map(tag => tag.trim().replace(/^#/, ''))
                .filter(tag => tag);
            if (tags.length > 0) {
                filters.tags = tags;
            }
        }
        // Отговорен
        const assigneeFilter = document.getElementById('filter-assignee');
        if (assigneeFilter && assigneeFilter.value) {
            filters.assignee = assigneeFilter.value;
        }

        return filters;
    }

    // Показване на филтрираните резултати
    displayFilteredResults(requirements) {
        const container = document.getElementById('filtered-requirements');
        if (!container) return;

        if (requirements.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>Няма намерени изисквания</h3>
                    <p>Опитайте да промените филтрите или да добавите нови изисквания.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = requirements.map(req => createRequirementCard(req)).join('');
    }

    // Създаване на карта за изискване
    myCreateRequirementCard(requirement) {
        const priorityClass = `priority-${requirement.priority}`;
        const typeClass = `type-${requirement.type}`;

        return `
            <div class="requirement-card ${priorityClass} ${typeClass}" data-id="${requirement.id}">
                <div class="requirement-header">
                    <h4>${escapeHtml(requirement.title)}</h4>
                    <div class="requirement-meta">
                        <span class="type-badge ${requirement.type}">${requirement.type === 'functional' ? 'Функционално' : 'Нефункционално'}</span>
                        <span class="priority-badge ${requirement.priority}">${this.getPriorityText(requirement.priority)}</span>
                        <span class="complexity-badge">Сложност: ${requirement.complexity}</span>
                    </div>
                </div>
                
                <div class="requirement-content">
                    <p>${escapeHtml(requirement.description).substring(0, 200)}${requirement.description.length > 200 ? '...' : ''}</p>
                    
                    ${requirement.component ? `<div class="component-info"><strong>Компонент:</strong> ${escapeHtml(requirement.component)}</div>` : ''}
                    ${requirement.assignee ? `<div class="assignee-info"><strong>Отговорен:</strong> ${escapeHtml(requirement.assignee)}</div>` : ''}
                    
                    ${requirement.tags.length > 0 ? `
                        <div class="tags-section">
                            ${requirement.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    ${requirement.type === 'non-functional' && requirement.indicators.length > 0 ? `
                        <div class="indicators-section">
                            <strong>Индикатори:</strong>
                            ${requirement.indicators.map(ind => `
                                <div class="indicator">
                                    <span class="indicator-name">${escapeHtml(ind.name)}</span>
                                    ${ind.unit ? `<span class="indicator-unit">(${escapeHtml(ind.unit)})</span>` : ''}
                                    ${ind.value ? `<span class="indicator-value">: ${escapeHtml(ind.value)}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="requirement-actions">
                    <button class="btn btn-small" onclick="editRequirement(${requirement.id})">Редактирай</button>
                    <button class="btn btn-small btn-danger" onclick="deleteRequirement(${requirement.id})">Изтрий</button>
                    <button class="btn btn-small btn-secondary" onclick="viewRequirement(${requirement.id})">Детайли</button>
                </div>
                
                <div class="requirement-footer">
                    <small>Създадено: ${formatDate(requirement.createdAt)}</small>
                    ${requirement.updatedAt !== requirement.createdAt ? `<small>Обновено: ${formatDate(requirement.updatedAt)}</small>` : ''}
                </div>
            </div>
        `;
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

    // Актуализиране на статистиките за филтрираните резултати
    updateFilterStats(requirements) {
        let statsContainer = document.getElementById('filter-stats');
        if (!statsContainer) {
            // Създаване на контейнер за статистики, ако не съществува
            statsContainer = document.createElement('div');
            statsContainer.id = 'filter-stats';
            statsContainer.className = 'filter-stats';

            const filterSection = document.querySelector('.filter-section');
            if (filterSection) {
                filterSection.appendChild(statsContainer);
            }
        }

        const stats = {
            total: requirements.length,
            functional: requirements.filter(req => req.type === 'functional').length,
            nonFunctional: requirements.filter(req => req.type === 'non-functional').length,
            highPriority: requirements.filter(req => req.priority === 'high').length
        };

        statsContainer.innerHTML = `
            <div class="stats-summary">
                <strong>Резултати от филтрирането:</strong>
                ${stats.total} общо | 
                ${stats.functional} функционални | 
                ${stats.nonFunctional} нефункционални | 
                ${stats.highPriority} с висок приоритет
            </div>
        `;
    }

    // Прилагане на сортиране
    applySorting() {
        const sortField = document.getElementById('sort-field');
        const sortOrder = document.getElementById('sort-order');

        if (sortField && sortOrder) {
            this.sortOptions.field = sortField.value;
            this.sortOptions.order = sortOrder.value;
            this.applyFilters(); // Повторно прилагане на филтрите със новото сортиране
        }
    }

    // Изчистване на всички филтри
    clearFilters() {
        // Изчистване на текстовото търсене
        const searchText = document.getElementById('search-text');
        if (searchText) searchText.value = '';

        // Изчистване на select елементите
        const selects = document.querySelectorAll('.filter-section select');
        selects.forEach(select => {
            select.selectedIndex = 0;
        });

        // Изчистване на checkbox-ите за тагове
        const tagCheckboxes = document.querySelectorAll('#tags-filter-container input[type="checkbox"]');
        tagCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Нулиране на филтрите и показване на всички изисквания
        this.currentFilters = {};
        this.applyFilters();
    }

    // Създаване на предварително зададени филтри
    createPresetFilters() {
        const presets = [
            { name: 'Висок приоритет', filters: { priority: 'high' } },
            { name: 'Функционални', filters: { type: 'functional' } },
            { name: 'Нефункционални', filters: { type: 'non-functional' } },
            { name: 'Много сложни', filters: { complexity: ['4', '5'] } }
        ];

        const presetsHtml = `
            <div class="filter-presets">
                <h4>Бързи филтри</h4>
                <div class="preset-buttons">
                    ${presets.map((preset, index) => `
                        <button class="btn btn-small btn-secondary" onclick="filterManager.applyPreset(${index})">${preset.name}</button>
                    `).join('')}
                </div>
            </div>
        `;

        const filterSection = document.getElementById('quick-filters');
        if (filterSection) {
            filterSection.innerHTML = '';
            const presetsDiv = document.createElement('div');
            presetsDiv.innerHTML = presetsHtml;
            filterSection.appendChild(presetsDiv.firstElementChild);
        }

        // Запазване на presets за използване
        this.presets = presets;
    }

    // Прилагане на предварително зададен филтър
    applyPreset(presetIndex) {
        try {
            const preset = this.presets[presetIndex];
            if (!preset) return;

            const filters = preset.filters;

            // Задаване на стойностите в UI елементите
            Object.keys(filters).forEach(key => {
                const element = document.getElementById(`filter-${key}`);
                if (element && element.tagName === 'SELECT') {
                    element.value = Array.isArray(filters[key]) ? filters[key][0] : filters[key];
                }
            });

            this.applyFilters();
        } catch (error) {
            console.error('Грешка при прилагане на предварително зададен филтър:', error);
        }
    }

    // Експорт на филтрираните резултати
    exportFilteredResults(format = 'json') {
        const filteredRequirements = window.requirementManager.getFilteredRequirements(this.currentFilters);
        const sortedRequirements = window.requirementManager.sortRequirements(
            filteredRequirements,
            this.sortOptions.field,
            this.sortOptions.order
        );

        return window.exportManager.exportRequirements(sortedRequirements, format);
    }

    // Обновяване на филтрите когато се добавят/редактират изисквания
    refreshFilters() {
        this.populateFilterOptions();
        this.applyFilters();
    }

    // Търсене по сложност
    filterByComplexity(minComplexity, maxComplexity) {
        const complexityFilter = {
            minComplexity: minComplexity || 1,
            maxComplexity: maxComplexity || 5
        };

        this.currentFilters.complexity = complexityFilter;
        this.applyFilters();
    }

    // Търсене по дата на създаване
    filterByDateRange(startDate, endDate) {
        const dateFilter = {};

        if (startDate) {
            dateFilter.startDate = new Date(startDate);
        }

        if (endDate) {
            dateFilter.endDate = new Date(endDate);
        }

        if (Object.keys(dateFilter).length > 0) {
            this.currentFilters.dateRange = dateFilter;
            this.applyFilters();
        }
    }

    // Запазване на текущо състояние на филтрите
    saveFilterState() {
        const filterState = {
            filters: this.currentFilters,
            sort: this.sortOptions
        };

        // Запазване в localStorage (ако е налично)
        try {
            localStorage.setItem('requirementFilters', JSON.stringify(filterState));
        } catch (e) {
            console.warn('Не може да се запази състоянието на филтрите');
        }
    }

    // Възстановяване на запазено състояние
    restoreFilterState() {
        try {
            const saved = localStorage.getItem('requirementFilters');
            if (saved) {
                const filterState = JSON.parse(saved);
                this.currentFilters = filterState.filters || {};
                this.sortOptions = filterState.sort || { field: 'createdAt', order: 'desc' };

                // Актуализиране на UI елементите
                this.updateUIFromFilters();
                this.applyFilters();
            }
        } catch (e) {
            console.warn('Не може да се възстанови състоянието на филтрите');
        }
    }

    // Актуализиране на UI елементите от текущите филтри
    updateUIFromFilters() {
        Object.keys(this.currentFilters).forEach(key => {
            const element = document.getElementById(`filter-${key}`);
            if (element) {
                if (element.type === 'text') {
                    element.value = this.currentFilters[key];
                } else if (element.tagName === 'SELECT') {
                    element.value = this.currentFilters[key];
                }
            }
        });
    }
}

// Функция за debounce на търсенето
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Глобални функции за филтриране
function applyFilters() {
    if (window.filterManager) {
        window.filterManager.applyFilters();
    }
}

function clearFilters() {
    if (window.filterManager) {
        window.filterManager.clearFilters();
    }
}