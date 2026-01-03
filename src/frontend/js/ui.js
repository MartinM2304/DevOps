// ui.js - UI манипулация

let currentTab = 'projects';

function showTab(tabName) {
    // Скриваме всички табове
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Деактивираме всички бутони в навигацията
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Показваме избрания таб
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        currentTab = tabName;
    }
    
    // Активираме съответния навигационен бутон
    const selectedNavTab = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (selectedNavTab) {
        selectedNavTab.classList.add('active');
    }
    
    // Зареждаме данни за специфичните табове
    switch (tabName) {
        case 'projects':
            loadProjects();
            break;
        case 'dashboard':
            loadDashboard();
            break;
        case 'manage-requirements':
            loadManageRequirements();
            break;
        case 'reports':
            // Отчетите се зареждат при поискване
            break;
    }
}

function loadProjects() {
    fetch('/api/projects.php')
        .then(res => res.json())
        .then(data => {
            if (data.data) {
                renderProjectSelector(data.data);
            }
        });
}

function renderProjectSelector(projects) {
    const container = document.getElementById('dashboard-projects');
    let html = '<label for="project-select"><strong>Избери проект:</strong></label>';
    html += '<select id="project-select"><option value="">-- Избери проект --</option>';
    projects.forEach(proj => {
        html += `<option value="${proj.id}">${proj.name}</option>`;
    });
    html += '</select>';
    container.innerHTML = html;

    document.getElementById('project-select').onchange = function() {
        const projectId = this.value;
        if (projectId) {
            getRequirements(projectId);
        } else {
            // Optionally clear requirements display
            document.getElementById('requirements-list').innerHTML = '';
        }
    };
}

// Зареждане на таблото за избран проект
async function loadDashboard(projectId, requirements = [], diagrams = []) {
    if (!projectId) {
        // Clear dashboard if no project is selected
        updateDashboardStats({});
        displayRecentRequirements([]);
        displayRecentDiagrams([]);
        return;
    }
    try {
        const stats = calculateRequirementStats(requirements);
        updateDashboardStats(stats);
        displayRecentRequirements(requirements);
        displayRecentDiagrams(diagrams)
    } catch (error) {
        showError('Грешка при зареждане на таблото: ' + error.message);
        console.error('Dashboard loading error:', error);
    }
}

function calculateRequirementStats(requirements) {
    const stats = {
        total: 0,
        functional: 0,
        nonFunctional: 0,
        highPriority: 0
    };

    if (!Array.isArray(requirements)) return stats;

    stats.total = requirements.length;
    requirements.forEach(req => {
        if (req.type === 'functional') stats.functional++;
        if (req.type === 'non-functional') stats.nonFunctional++;
        if (req.priority === 'high') stats.highPriority++;
    });

    return stats;
}

// Обновяване на статистиките в таблото
function updateDashboardStats(stats) {
    document.getElementById('total-requirements').textContent = stats.total || 0;
    document.getElementById('functional-count').textContent = stats.functional || 0;
    document.getElementById('non-functional-count').textContent = stats.nonFunctional || 0;
    document.getElementById('high-priority-count').textContent = stats.highPriority || 0;
}

// Показване на последните изисквания
function displayRecentRequirements(requirements) {
    const container = document.getElementById('recent-requirements');
    if (!requirements || requirements.length === 0 || !Array.isArray(requirements)) {
        container.innerHTML = '<p>Няма добавени изисквания</p>';
        return;
    }
    container.innerHTML = requirements.map(req => createRequirementCard(req, true)).join('');
}

//Показва последните диаграми
function displayRecentDiagrams(diagrams) {
    const container = document.getElementById('recent-diagrams');
    if (!container) return;

    if (!diagrams || !Array.isArray(diagrams) || diagrams.length === 0) {
        container.innerHTML = '<p>Няма добавени диаграми за този проект.</p>';
        return;
    }

    container.innerHTML = diagrams.map(diagram => createDiagramCard(diagram)).join('');
}

function createDiagramCard(diagram) {
    if (!diagram) {
        return '';
    }

    return `
        <div class="diagram-card" data-id="${diagram.id || diagram.diagram_name}">
            <div class="diagram-header">
                <h4>${escapeHtml(diagram.diagram_name)}</h4>
            </div>
            
            <div class="diagram-body">
                <p>Кликнете "Отвори", за да видите диаграмата.</p> 
            </div>
            
            <div class="diagram-footer">

                
                <div class="diagram-actions">
                    <button onclick="openDiagram('${diagram.id}')" class="btn btn-small">Отвори</button>
                </div>
            </div>
        </div>
    `;
}

// Създаване на карта за изискване
function createRequirementCard(requirement, isCompact = false) {
    // Check if requirement exists
    if (!requirement) {
        return '';
    }
    
    // Ensure tags is always an array
    let tags = requirement.tags;
    if (tags === undefined || tags === null) {
        tags = [];
    } else if (!Array.isArray(tags)) {
        // Convert single tag string to array
        if (typeof tags === 'string') {
            tags = tags.split(',').map(tag => tag.trim());
        } else {
            tags = [];
        }
    }
    
    // Now we can safely process the tags
        const tagsHtml =tags? tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('') : '';
    
    
    const priorityClass = `priority-${requirement.priority}`;
    const typeClass = `type-${requirement.type}`;
    const compactClass = isCompact ? 'compact' : '';
    
    return `
        <div class="requirement-card ${priorityClass} ${typeClass} ${compactClass}" data-id="${requirement.id}">
            <div class="requirement-header">
                <h4>${escapeHtml(requirement.title)}</h4>
                <div class="requirement-meta">
                    <span class="priority">${getPriorityText(requirement.priority)}</span>
                    <span class="type">${getTypeText(requirement.type)}</span>
                </div>
            </div>
            
            <div class="requirement-body">
                <p>${escapeHtml(isCompact ? 
                    truncateText(requirement.description, 150) : 
                    requirement.description)}</p>
                
                ${requirement.component ? 
                    `<div class="component">Компонент: ${escapeHtml(requirement.component)}</div>` : ''}
                
                ${requirement.assignee ? 
                    `<div class="assignee">Отговорен: ${escapeHtml(requirement.assignee)}</div>` : ''}
                
                ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ''}
                
                ${requirement.complexity ? 
                    `<div class="complexity">Сложност: ${getComplexityText(requirement.complexity)}</div>` : ''}
            </div>
            
            <div class="requirement-footer">
                <div class="requirement-dates">
                    <small>Създадено: ${formatDate(requirement.created_at)}</small>
                    ${requirement.updated_at !== requirement.created_at ? 
                        `<small>Обновено: ${formatDate(requirement.updated_at)}</small>` : ''}
                </div>
                
                <div class="requirement-actions">
                    <button onclick="openEditModal('${requirement.id}')" class="btn btn-small">Редактирай</button>
                    <button onclick="deleteRequirement('${requirement.id}')" class="btn btn-small btn-danger">Изтрий</button>
                    ${requirement.type === 'non-functional' ? 
                        `<button onclick="showIndicatorsModal('${requirement.id}')" class="btn btn-small btn-secondary">Индикатори</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Показване/скриване на секцията с индикатори
function toggleIndicators() {
    const type = document.getElementById('req-type').value;
    const indicatorsSection = document.getElementById('indicators-section');
    
    if (type === 'non-functional') {
        indicatorsSection.style.display = 'block';
    } else {
        indicatorsSection.style.display = 'none';
        // Изчистваме индикаторите
        document.getElementById('indicators-container').innerHTML = '';
    }
}

// Добавяне на индикатор
function addIndicator() {
    const container = document.getElementById('indicators-container');
    const indicatorId = generateId();
    
    const indicatorHtml = `
        <div class="indicator-item" data-id="${indicatorId}">
            <div class="indicator-header">
                <h4>Индикатор ${container.children.length + 1}</h4>
                <button type="button" onclick="removeIndicator('${indicatorId}')" class="btn btn-small btn-danger">Премахни</button>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Име на индикатор *</label>
                    <input type="text" name="indicator_name[]" required>
                </div>
                <div class="form-group">
                    <label>Мерна единица</label>
                    <input type="text" name="indicator_unit[]" placeholder="сек, %, брой, MB/s">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Целева стойност</label>
                    <input type="text" name="indicator_value[]" placeholder="< 2, > 95%, точно 100">
                </div>
            </div>
            
            <div class="form-group">
                <label>Описание *</label>
                <textarea name="indicator_description[]" required placeholder="Как се мери този индикатор"></textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', indicatorHtml);
}

// Премахване на индикатор
function removeIndicator(indicatorId) {
    const indicator = document.querySelector(`[data-id="${indicatorId}"]`);
    if (indicator) {
        indicator.remove();
        
        // Преномерираме останалите индикатори
        const indicators = document.querySelectorAll('.indicator-item');
        indicators.forEach((item, index) => {
            const header = item.querySelector('.indicator-header h4');
            if (header) {
                header.textContent = `Индикатор ${index + 1}`;
            }
        });
    }
}

// Отваряне на модал за редактиране
async function openEditModal(requirementId) {
    const modal = document.getElementById('edit-modal');
    const data = await api.getRequirement(requirementId);
    const requirement = data.requirement;
    // Попълваме формата с данните
    document.getElementById('edit-id').value = requirement.id;
    document.getElementById('edit-title').value = requirement.title;
    document.getElementById('edit-description').value = requirement.description;
    document.getElementById('edit-priority').value = requirement.priority;
    
    modal.style.display = 'block';
}

// Затваряне на модал
function closeModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'none';
}

// Затваряне на модал при клик извън него
window.addEventListener('click', (event) => {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Създаване на опции за select елемент
function createSelectOptions(data, valueField = 'value', textField = 'text', selectedValue = '') {
    return data.map(item => {
        const value = typeof item === 'string' ? item : item[valueField];
        const text = typeof item === 'string' ? item : item[textField];
        const selected = value === selectedValue ? 'selected' : '';
        
        return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(text)}</option>`;
    }).join('');
}

// Обновяване на select елемент с данни
async function updateSelectOptions(selectId, dataSource, valueField = 'value', textField = 'text') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    try {
        let data = [];
        
        switch (dataSource) {
            case 'components':
                data = await api.getComponents();
                break;
            case 'assignees':
                data = await api.getAssignees();
                break;
            case 'tags':
                data = await api.getTags();
                break;
        }
        
        const currentValue = select.value;
        const defaultOption = select.querySelector('option[value=""]');
        const defaultHtml = defaultOption ? defaultOption.outerHTML : '';
        
        select.innerHTML = defaultHtml + createSelectOptions(data, valueField, textField, currentValue);
    } catch (error) {
        debugLog(`Error updating select options for ${selectId}:`, error);
    }
}

// Показване на индикатори за изискване
async function showIndicators(requirementId) {
    try {
        const indicators = await api.getIndicators(requirementId);
        
        if (indicators.length === 0) {
            showError('Няма дефинирани индикатори за това изискване');
            return;
        }
        
        // Създаваме модал за показване на индикаторите
        const modalHtml = `
            <div class="modal" id="indicators-modal">
                <div class="modal-content">
                    <span class="close" onclick="closeIndicatorsModal()">&times;</span>
                    <h2>Индикатори за измерване</h2>
                    <div class="indicators-list">
                        ${indicators.map(indicator => `
                            <div class="indicator-display">
                                <h4>${escapeHtml(indicator.name)}</h4>
                                ${indicator.unit ? `<p><strong>Мерна единица:</strong> ${escapeHtml(indicator.unit)}</p>` : ''}
                                ${indicator.target_value ? `<p><strong>Целева стойност:</strong> ${escapeHtml(indicator.target_value)}</p>` : ''}
                                <p><strong>Описание:</strong> ${escapeHtml(indicator.description)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Добавяме модала към страницата
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('indicators-modal').style.display = 'block';
        
    } catch (error) {
        showError('Грешка при зареждане на индикаторите: ' + error.message);
    }
}

function showAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'flex';
    document.getElementById('add-member-error').style.display = 'none';
    document.getElementById('add-member-form').reset();
  }
  
  function closeAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'none';
  }