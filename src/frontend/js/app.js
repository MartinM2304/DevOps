// app.js - Главен файл на приложението

// Глобални променливи
let currentRequirements = [];
let requirementStatistics = [];
let currentProjectId = null;
let userProjects = [];
let currentDiagrams = [];

const STORAGE_KEY = 'selectedProjectId';

function saveSelectedProject(id) {
    localStorage.setItem(STORAGE_KEY, id);
}

function loadSelectedProject() {
    return localStorage.getItem(STORAGE_KEY);
}

// window.addEventListener('DOMContentLoaded', loadProjects);

async function loadProjects() {
    console.log('Зареждане на проектите...');
    const select = document.getElementById('project-selector');
    if (!select) return;

    // Optional: show loading indicator
    const loading = document.getElementById('project-loading');
    if (loading) loading.style.display = '';

    // Fetch projects from the backend
    try {
        const result = await window.apiManager.getProjects();
        console.log('Проекти заредени:', result);
        select.innerHTML = '<option value="">-- Избери проект --</option>';
        const userId = window.userHelper.getUserId();
        if (userId === '1') {
            document.getElementById('special-user-actions').style.display = 'block';
        }
        if (result.data && Array.isArray(result.data)) {
            result.data.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
            userProjects = result.data;

            // Check if current user is special (ID=1) and show the special button
            const specialBtn = document.getElementById('special-add-all-btn');
            console.log('Special button element:', specialBtn);
            if (specialBtn) {
                console.log('Adding click event listener to special button');
                specialBtn.addEventListener('click', function() {
                    console.log('Special button clicked');
                    openAddAllRequirementsModal();
                });
            }

            function openAddAllRequirementsModal() {
                console.log('Opening add all requirements modal');
                
                // Remove any existing modal first
                const existingModal = document.getElementById('add-all-requirements-modal');
                if (existingModal) {
                    existingModal.remove();
                }

                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.id = 'add-all-requirements-modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close" onclick="closeAddAllRequirementsModal()">&times;</span>
                        <h2>Добави изискване за всички проекти</h2>
                        <form id="add-all-requirements-form">
                            <div class="form-group">
                                <label for="all-req-title">Заглавие на изискване *</label>
                                <input type="text" id="all-req-title" required>
                            </div>

                            <div class="form-group">
                                <label for="all-req-description">Описание *</label>
                                <textarea id="all-req-description" required></textarea>
                            </div>

                            <div class="form-group">
                                <label for="all-req-type">Тип изискване *</label>
                                <select id="all-req-type" required>
                                    <option value="">Избери тип</option>
                                    <option value="functional">Функционално</option>
                                    <option value="non-functional">Нефункционално</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="all-req-priority">Приоритет</label>
                                <select id="all-req-priority">
                                    <option value="low">Нисък</option>
                                    <option value="medium" selected>Среден</option>
                                    <option value="high">Висок</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="all-req-complexity">Сложност (1-5)</label>
                                <select id="all-req-complexity">
                                    <option value="1">1 - Много лесно</option>
                                    <option value="2">2 - Лесно</option>
                                    <option value="3" selected>3 - Средно</option>
                                    <option value="4">4 - Трудно</option>
                                    <option value="5">5 - Много трудно</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="all-req-component">Компонент</label>
                                <input type="text" id="all-req-component" placeholder="Например: Frontend, Backend, Database">
                            </div>

                            <div class="form-group">
                                <label for="all-req-assignee">Отговорен</label>
                                <input type="text" id="all-req-assignee" placeholder="Име на човек или екип">
                            </div>

                            <div class="form-group">
                                <label for="all-req-tags">Хеш-тагове (разделени със запетая)</label>
                                <input type="text" id="all-req-tags" placeholder="#security, #performance, #ui">
                            </div>

                            <button type="submit" class="btn">Добави изискване</button>
                        </form>
                    </div>
                `;

                document.body.appendChild(modal);
                modal.style.display = 'block';  // Make the modal visible

                // Add close functionality
                const closeBtn = document.querySelector('.close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', closeAddAllRequirementsModal);
                }

                // Add submit handler
                const form = document.getElementById('add-all-requirements-form');
                if (form) {
                    form.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        const data = {
                            title: document.getElementById('all-req-title').value,
                            description: document.getElementById('all-req-description').value,
                            type: document.getElementById('all-req-type').value,
                            priority: document.getElementById('all-req-priority').value,
                            complexity: parseInt(document.getElementById('all-req-complexity').value),
                            component: document.getElementById('all-req-component').value,
                            assignee: document.getElementById('all-req-assignee').value,
                            tags: document.getElementById('all-req-tags').value.split(',').map(tag => tag.trim()),
                            layer: 'business',  // Add default layer value
                            project_id: 0
                        };

                        try {
                            const result = await window.apiManager.addRequirementToAll({
                                ...data,
                                project_id: 0,
                                user_id: window.userHelper.getUserId()
                            });
                            if (result.status === 'ok') {
                                showToast('Изискването е добавено успешно към всички проекти', 'success');
                                closeAddAllRequirementsModal();
                                // Refresh the requirements list for the current project
                                if (currentProjectId) {
                                    await loadProjectData(currentProjectId);
                                    // Update dashboard with fresh data
                                    loadDashboard(currentProjectId, currentRequirements,currentDiagrams);
                                    
                                }
                            } else {
                                showToast('Грешка при добавяне на изискването', 'error');
                            }
                        } catch (error) {
                            console.error('Error adding requirement:', error);
                            showToast('Грешка при добавяне на изискването', 'error');
                        }
                    });
                }
            }

        }
    } catch (error) {
        console.error('Грешка при зареждане на проектите:', error); select.innerHTML = '<option value="">Грешка при зареждане</option>';
    } finally {
        if (loading) loading.style.display = 'none';
    }
}
function closeAddAllRequirementsModal() {
    const modal = document.getElementById('add-all-requirements-modal');
    if (modal) {
        modal.style.display = 'none';  // Hide the modal instead of removing it
    }
}

function onProjectSelected() {
    const select = document.getElementById('project-selector');
    const projectId = select.value;

    if (!projectId) {
        alert("Моля, изберете проект");
        return;
    }

    currentProjectId = parseInt(projectId);
    saveSelectedProject(currentProjectId);
    console.log(projectId);

    // document.getElementById('project-selection-screen').style.display = 'none';
    document.getElementById('main-interface').style.display = 'block';

    console.log('vikni loadProjectData pls')
    loadProjectData(projectId);
}

async function showCurrentProjectName(projectId) {
    try {
        const project = userProjects.find(p => String(p.id) === String(projectId));
        const el = document.getElementById('current-project-name');
        if (project) {
            el.textContent = `Избран проект: ${project.name}`;
        } else {
            el.textContent = '';
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadProjectData(projectId) {
    try {
        showLoading(true);
        console.log("getDiagramsByProject load requirments");
        let requirementsResponse = await api.getRequirementsByProject(projectId);
        if (requirementsResponse.status !== 'ok') {
            throw new Error(`Грешка при зареждане на изискванията: ${requirementsResponse.message}`);
        }
        currentRequirements = requirementsResponse.requirements || [];
        requirementStatistics = Array.isArray(currentRequirements) ? [...currentRequirements] : [];

        try {
            console.log("getDiagramsByProject load diagrams");
            const diagramsResponse = await window.apiManager.getDiagramsByProject(projectId);
            if (!diagramsResponse || diagramsResponse.status !== 'ok') {
                throw new Error(`Грешка при зареждане на диаграмите: ${diagramsResponse.message}`);
            }
            else if (diagramsResponse.data && Array.isArray(diagramsResponse.data)) {
                currentDiagrams = diagramsResponse.data;
                currentDiagrams = currentDiagrams.flat();
                console.log(diagramsResponse.status === 'ok' )
            }
            
        } catch (e) {
            console.error('Не може да се заредят диаграмите:', e);
            currentDiagrams = []; // Default to empty on error
        }

        loadProjectMembers(projectId);

        // Показване на текущия проект
        showCurrentProjectName(projectId);
        console.log(currentDiagrams);   
        loadDashboard(projectId, currentRequirements,currentDiagrams,currentDiagrams);
    } catch (error) {
        console.error('Грешка при зареждане на данни за проекта:', error);
        showToast('Грешка при зареждане на данни за проекта', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadProjectMembers(projectId) {
    try {
        const tbody = document.getElementById('members-list');
        const ownerName = document.getElementById('owner-name');
        const ownerEmail = document.getElementById('owner-email');

        tbody.innerHTML = '';
        ownerName.textContent = '';
        ownerEmail.textContent = ''

        const apiResponse = await api.getProjectMembers(projectId);
        let owner = apiResponse.owner || {};
        let members = apiResponse.members || [];

        if (!owner || !owner.username) {
            console.error('Няма собственик на проекта или липсва потребителско име');
            showToast('Няма собственик на проекта', 'error');
            return;
        }

        let ownerLabel = owner.username;
        if (getUsername() === owner.username) {
            ownerLabel += ' (Вие)';
            document.getElementById('add-member-btn').style.display = ''; // Показване на бутона за добавяне на членове
        }
        ownerName.textContent = ownerLabel;
        ownerEmail.textContent = owner.email;

        // Clear the table body before adding new rows
        tbody.innerHTML = '';

        if (!Array.isArray(members) || members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">Няма членове в проекта</td></tr>';
            return;
        }
        members.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${member.username}</td><td>${member.email}</td>`;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Грешка при зареждане на данни за членове на проекта:', error);
        showToast('Грешка при зареждане на данни за членове на проекта', 'error');
    }
}


// function changeProject() {
//     // Изчисти избрания проект
//     localStorage.removeItem(STORAGE_KEY);
//     currentProjectId = null;

//     // Скрий основния интерфейс
//     document.getElementById('main-interface').style.display = 'none';

//     // Покажи екрана за избор на проект
//     document.getElementById('project-selection').style.display = 'none';

//     // Презареди проектите в селектора
//     loadProjects();
// }


// Инициализация на приложението
// document.addEventListener('DOMContentLoaded', async function () {
//     try {
//         // Инициализация на мениджърите
//         window.apiManager = new API();
//         window.requirementManager = new RequirementManager();
//         window.exportManager = new ExportManager();

//         // ADD THIS BLOCK:
//         // Check if user is logged in
//         const userId = window.userHelper.getUserId();
//         const username = window.userHelper.getUsername();
//         console.log(username);

//         if (userId && username) {
//             // User is logged in, load projects and show project selection
//             const projectSelection = document.querySelector('.project-selection');
//             const mainInterface = document.getElementById('main-interface');
//             const loginRegisterBtns = document.getElementById('login-register-btns');

//             if (projectSelection) projectSelection.style.display = 'block';
//             if (mainInterface) mainInterface.style.display = 'none';
//             if (loginRegisterBtns) loginRegisterBtns.style.display = 'block';
//         } else {
//             console.log('kurrr');
//             // User is not logged in, hide project selection
//             const projectSelection = document.querySelector('.project-selection');
//             const mainInterface = document.getElementById('main-interface');
//             const loginRegisterBtns = document.getElementById('login-register-btns');

//             if (projectSelection) projectSelection.style.display = 'none';
//             if (mainInterface) mainInterface.style.display = 'none';
//             if (loginRegisterBtns) loginRegisterBtns.style.display = 'block';
//         }

//         setupEventListeners();
//         console.log('Приложението е инициализирано успешно');

//     } catch (error) {
//         console.error('Грешка при инициализация:', error);
//         showToast('Грешка при стартиране на приложението', 'error');
//     }
// });

document.addEventListener('DOMContentLoaded', async function () {
    try {
        hideLoggedUserDetails();
        // Инициализация на мениджърите
        window.apiManager = new API();
        window.requirementManager = new RequirementManager();
        window.exportManager = new ExportManager();
        window.filterManager = new FilterManager();

        // Check if user is logged in
        const userId = window.userHelper.getUserId();
        const username = window.userHelper.getUsername();
        console.log(username);


        setupEventListeners();
        console.log('Приложението е инициализирано успешно');

    } catch (error) {
        console.error('Грешка при инициализация:', error);
        showToast('Грешка при стартиране на приложението', 'error');
    }
});

// Зареждане на първоначални данни
async function loadInitialData() {
    try {
        showLoading(true);
        currentRequirements = await window.requirementManager.getAllRequirements();
        requirementStatistics = [...currentRequirements];
    } catch (error) {
        console.error('Грешка при зареждане на данни:', error);
        showToast('Грешка при зареждане на изисквания', 'error');
    } finally {
        showLoading(false);
    }
}

// Обновяване на дашборда
function updateDashboard() {
    // Обновяване на статистиките
    const stats = {
        total: requirementStatistics.length,
        functional: requirementStatistics.filter(req => req.type === 'functional').length,
        nonFunctional: requirementStatistics.filter(req => req.type === 'non-functional').length,
        highPriority: requirementStatistics.filter(req => req.priority === 'high').length,
        mediumPriority: requirementStatistics.filter(req => req.priority === 'medium').length,
        lowPriority: requirementStatistics.filter(req => req.priority === 'low').length,
        byComplexity: {}
    };

    // Статистики по сложност
    for (let i = 1; i <= 5; i++) {
        stats.byComplexity[i] = requirementStatistics.filter(req => req.complexity === i).length;
    }

    // Обновяване на UI елементите
    const totalEl = document.getElementById('total-requirements');
    const functionalEl = document.getElementById('functional-count');
    const nonFunctionalEl = document.getElementById('non-functional-count');
    const highPriorityEl = document.getElementById('high-priority-count');

    if (totalEl) totalEl.textContent = stats.total;
    if (functionalEl) functionalEl.textContent = stats.functional;
    if (nonFunctionalEl) nonFunctionalEl.textContent = stats.nonFunctional;
    if (highPriorityEl) highPriorityEl.textContent = stats.highPriority;
}

async function openDiagram(diagramId) {
    if (!diagramId) {
        showToast('Моля, въведете име на диаграма.');
        return;
    }
    try {
        document.getElementById('loading').style.display = 'block';
        console.log(currentDiagrams);
        console.log(diagramId)
        const diagram = currentDiagrams.find(diagram => diagram.id == diagramId);
        console.log(diagram);
        if (!diagram) {
            showToast(`Няма диаграма с ID "${diagramId}".`);
            return;
        }
        const text = diagram.diagram_text;
        if (!text) {
          showToast(`Диаграмата няма текст.`);
          return;
        }
        
        const diagramTextArea = document.getElementById('diagram-text');
        if(diagramTextArea) {
            diagramTextArea.value = text;
        }

        await api.compress(text);
        
        // const result = await api.getPlanUML(`uml/${diagramName}`, text);
        // document.getElementById('diagram-image').src = result.diagramUrl;
        document.getElementById('diagram-modal').style.display = 'block';
        showToast('Диаграма заредена успешно!');
    } catch (error) {
        showToast('Грешка при зареждане на диаграма.');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function closeDiagramModal() {
  document.getElementById('diagram-modal').style.display = 'none';
  document.getElementById('diagram-image').src = '';
}

// Настройка на event listeners
function setupEventListeners() {

    // Diagram form submission
    const diagramForm = document.getElementById('diagram-form');
    if (diagramForm) {
        diagramForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('diagram-name-input').value;
            const text = document.getElementById('diagram-text').value;
            const projectId = getCurrentProjectId();
            
            if (!name || !text || !projectId) {
                alert('Моля, попълнете всички задължителни полета и изберете проект.');
                return;
            }
            
            try {
                const response = await window.apiManager.createDiagram({diagram_name: name, diagram_text: text, project_id: projectId})

                
                if (response.status === 'ok') {
                    // Clear the form
                    document.getElementById('diagram-name-input').value = '';
                    document.getElementById('diagram-text').value = '';
                    
                    // Show success message
                    showToast('Диаграмата е добавена успешно!');
                    
                    // Refresh the dashboard
                    loadDashboard();
                } else {
                    throw new Error(response.message || 'Failed to add diagram');
                }
            } catch (error) {
                showToast('Грешка при добавяне на диаграма: ' + error.message);
            }
        });
    }

    // Вход и регистрация
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Форма за добавяне на изискване
    const requirementForm = document.getElementById('requirement-form');
    if (requirementForm) {
        requirementForm.addEventListener('submit', handleRequirementSubmit);
    }

    // Форма за редактиране на изискване
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }

    // Форма за създаване на проект
    const createProjectForm = document.getElementById('create-project-form');
    if (createProjectForm) {
        createProjectForm.addEventListener('submit', handleCreateProjectSubmit);
    }

    // Форма за добавяне на член
    const addMemberForm = document.getElementById('add-member-form');
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', submitAddMember);
    }

    const projectSelected = document.getElementById('project-selector');
    if (projectSelected) {
        projectSelected.addEventListener('change', onProjectSelected);
    }

    // Търсене в реално време
    const searchInput = document.getElementById('search-text');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }

    // Филтри
    const filterInputs = document.querySelectorAll('#filter-type, #filter-priority');
    filterInputs.forEach(input => {
        input.addEventListener('change', applyFilters);
    });

    // Добавяне на обработчик за бутони за изтриване
    const deleteButtons = document.querySelectorAll('.requirement-actions .btn-danger');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            const requirementId = this.closest('.requirement-card').dataset.id;
            deleteRequirement(requirementId);
            event.preventDefault();
        });
    });

    // Клавишни комбинации
    // document.addEventListener('keydown', handleKeyboardShortcuts);

    // Затваряне на модал при кликване извън него
    window.addEventListener('click', function (event) {
        const editModal = document.getElementById('edit-modal');
        const indicatorsModal = document.getElementById('indicators-modal');

        if (event.target === editModal) {
            closeModal();
        }
        if (event.target === indicatorsModal) {
            closeIndicatorsModal();
        }
    });

    // Добавяне на обработчик за индикатори
    const indicatorsButtons = document.querySelectorAll('.indicators-section button');
    indicatorsButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            const requirementId = this.closest('.requirement-card').dataset.id;
            showIndicatorsModal(requirementId);
            event.preventDefault();
        });
    });
}

// Обработка на изпращане на форма за изискване
async function handleRequirementSubmit(event) {
    event.preventDefault();

    try {
        const formData = collectFormData();
        const indicators = formData.indicators;

        if (!validateFormData(formData)) {
            return;
        }

        showLoading(true);

        // Запазване на изискването
        const response = await window.apiManager.createRequirement(formData, currentProjectId);
        if (!response || response.status !== 'ok') {
            throw new Error(response?.message || 'Failed to create requirement');
        }

        const savedRequirement = response.id;

        // Запазване на индикаторите
        if (indicators.length > 0) {
            for (const indicator of indicators) {
                try {
                    await window.apiManager.createIndicator({ ...indicator, requirement_id: savedRequirement });
                } catch (error) {
                    console.error('Error creating indicator:', error);
                    // Continue with other indicators even if one fails
                }
            }
        }

        // Reload project data to get updated list
        await loadProjectData(currentProjectId);
        // Update dashboard with fresh data
        loadDashboard(currentProjectId, currentRequirements,currentDiagrams);

        // Изчистване на формата
        clearForm();

        showToast('Изискването е добавено успешно!', 'success');

        // Преминаване към таб "Управление"
        showTab('manage-requirements');

    } catch (error) {
        console.error('Грешка при запазване:', error);
        showToast('Грешка при запазване на изискването', 'error');
    } finally {
        showLoading(false);
    }
}

// Обработка на редактиране на изискване
async function handleEditSubmit(event) {
    event.preventDefault();

    try {
        const id = document.getElementById('edit-id').value;
        const title = document.getElementById('edit-title').value.trim();
        const description = document.getElementById('edit-description').value.trim();
        const priority = document.getElementById('edit-priority').value;

        if (!title || !description) {
            showToast('Заглавието и описанието са задължителни', 'error');
            return;
        }

        showLoading(true);

        const updateData = {
            title: title,
            description: description,
            priority: priority,
            type: 'functional', // Default type if not specified
            complexity: 3, // Default complexity if not specified
            layer: 'business', // Default layer if not specified
            component: null, // Default component if not specified
            assignee: null, // Default assignee if not specified
            tags: [] // Default empty tags array
        };


        // Запазване в базата данни
        console.log("KILLAALL");
        await window.apiManager.updateRequirement(id, updateData);
        await loadProjectData(currentProjectId);

        // Update dashboard with fresh data
        loadDashboard(currentProjectId, currentRequirements,currentDiagrams);


        // Обновяване на интерфейса
        const requirement = currentRequirements.find(req => req.id === id);
        if (requirement) {
            Object.assign(requirement, updateData);
            requirement.updatedAt = new Date().toISOString();
        }

        updateDashboard();
        applyFilters();
        closeModal();

        showToast('Изискването е обновено успешно', 'success');
    } catch (error) {
        console.error('Error updating requirement:', error);
        showToast(`Грешка при обновяване: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Обработка на изтриване на изискване
async function deleteRequirement(requirementId) {
    if (!requirementId) {
        showToast('Невалиден ID на изискването', 'error');
        return;
    }

    if (!confirm('Сигурни ли сте, че искате да изтриете това изискване?')) {
        return;
    }

    try {
        showLoading(true);

        // Запазване в базата данни
        await window.apiManager.deleteRequirement(requirementId);

        // Reload project data to get fresh list
        await loadProjectData(currentProjectId);

        // Update dashboard with fresh data
        loadDashboard(currentProjectId, currentRequirements,currentDiagrams);

        showToast('Изискването е изтрито успешно!', 'success');

    } catch (error) {
        console.error('Грешка при изтриване:', error);
        showToast('Грешка при изтриване на изискването', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleCreateProjectSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("project-name").value.trim();
    const description = document.getElementById("project-description").value.trim();

    if (name === "") {
        showToast("Моля, въведи име на проекта.");
        return;
    }
    await window.apiManager.createProject({ name, description })
        .then(() => {
            showToast("Проектът е създаден успешно!", "success");
            closeProjectModal();
            loadProjects(); // Презареждаме проектите
        })
        .catch(err => {
            console.error("Грешка при създаване на проект:", err);
            showToast("Грешка при създаване на проекта: " + err.message, "error");
        });
}

async function submitAddMember(event) {
    event.preventDefault();
    const identifier = document.getElementById('member-identifier').value.trim();
    try {
        await window.apiManager.addMemberToProject(currentProjectId, identifier);
        closeAddMemberModal();
        showToast('Членът е добавен успешно!', 'success');
        // Добавяме малко закъснение преди презареждане на членовете
        setTimeout(() => {
            loadProjectMembers(currentProjectId);
        }, 500);
    } catch (err) {
        document.getElementById('add-member-error').textContent = err.message || 'Грешка при добавяне на член.';
        document.getElementById('add-member-error').style.display = 'block';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const usernameInput = form.querySelector('#login-username');
    const passwordInput = form.querySelector('#login-password');

    if (!usernameInput || !passwordInput) {
        console.error('Не могат да бъдат намерени полетата за логин');
        showToast('Грешка при обработката на формата', 'error');
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showToast('Моля, въведете потребителско име и парола', 'error');
        return;
    }

    try {
        showLoading(true);
        const result = await window.apiManager.loginUser({ username, password });
        console.log('Login result:', result);

        if (result?.status === 'ok') {
            window.userHelper.saveUserSession(result.user_id, username);
            closeLoginModal();

            // Trigger DOMContentLoaded event to reinitialize the app
            // const event = new Event('DOMContentLoaded');
            // document.dispatchEvent(event);

            showToast('Входът е успешен!', 'success');
            displayLoggedUserDetails();
        } else {
            showToast(result?.message || 'Грешка при вход', 'error');
        }
    } catch (error) {
        console.error('Грешка при вход:', error);
        showToast('Грешка при вход: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();

    if (!username || !email || !password) {
        showToast('Моля, попълнете всички полета', 'error');
        return;
    }
    try {
        showLoading(true);
        const result = await window.apiManager.registerUser({ username, email, password });
        if (result.status === 'ok') {
            showToast('Регистрацията е успешна! Моля, влезте в профила си.', 'success');
            closeRegisterModal();
        } else {
            showToast(result.message || 'Грешка при регистрация', 'error');
        }
    } catch (error) {
        console.error('Грешка при регистрация:', error);
        showToast('Грешка при регистрация: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Събиране на данни от формата
function collectFormData() {
    return {
        title: document.getElementById('req-title').value.trim(),
        description: document.getElementById('req-description').value.trim(),
        type: document.getElementById('req-type').value,
        priority: document.getElementById('req-priority').value,
        complexity: parseInt(document.getElementById('req-complexity').value),
        component: document.getElementById('req-component').value.trim(),
        assignee: document.getElementById('req-assignee').value.trim(),
        tags: document.getElementById('req-tags').value.trim(),
        indicators: collectIndicators(),
        project_id: currentProjectId
    };
}

// Събиране на индикатори
function collectIndicators() {
    const indicators = [];
    const indicatorsContainer = document.getElementById('indicators-container');

    if (!indicatorsContainer) {
        return indicators;
    }

    // Get all indicator items
    const indicatorItems = indicatorsContainer.querySelectorAll('.indicator-item');

    indicatorItems.forEach(item => {
        // Get input elements
        ;
        const nameInput = item.querySelector('input[name="indicator_name[]"]');
        const unitInput = item.querySelector('input[name="indicator_unit[]"]');
        const valueInput = item.querySelector('input[name="indicator_value[]"]');
        const descriptionInput = item.querySelector('textarea[name="indicator_description[]"]');

        if (nameInput && descriptionInput) {
            const indicator = {
                name: nameInput.value.trim(),
                unit: unitInput ? unitInput.value.trim() : '',
                value: valueInput ? valueInput.value.trim() : '',
                description: descriptionInput.value.trim()
            };
            console.log(indicator);
            if (indicator.name && indicator.description) {
                indicators.push(indicator);
            }
        }
    });

    return indicators;
}

// Валидиране на данни от формата
function validateFormData(data) {
    if (!data.title) {
        showToast('Заглавието е задължително', 'error');
        return false;
    }

    if (!data.description) {
        showToast('Описанието е задължително', 'error');
        return false;
    }

    if (!data.type) {
        showToast('Типът изискване е задължителен', 'error');
        return false;
    }

    return true;
}

// Създаване на обект изискване
function createRequirementObject(data) {
    const tags = data.tags ? data.tags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag) : [];

    return {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        complexity: data.complexity,
        component: data.component,
        assignee: data.assignee,
        tags: tags,
        indicators: data.indicators || [],
        project_id: currentProjectId
    };
}

// Генериране на ID за изискване
function generateRequirementId() {
    return 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Изчистване на формата
function clearForm() {
    document.getElementById('requirement-form').reset();
    document.getElementById('indicators-container').innerHTML = '';
    document.getElementById('indicators-section').style.display = 'none';
}

// Показване/скриване на таб
function showTab(tabName) {
    // Скриване на всички табове
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });

    // Деактивиране на всички навигационни бутони
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    // Показване на избрания таб
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.display = 'block';
    }

    // Активиране на съответния навигационен бутон
    const activeNavTab = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeNavTab) {
        activeNavTab.classList.add('active');
    }

    currentTab = tabName;
}

// Запазване на диаграма
async function saveDiagram() {
    const name = document.getElementById('diagram-name-input').value;
    const text = document.getElementById('diagram-text').value;
    
    if (!name || !text || !currentProjectId) {
        alert('Моля, попълнете всички задължителни полета и изберете проект.');
        return;
    }
    
    try {
        const response = await window.apiManager.createDiagram({
            diagram_name: name,
            diagram_text: text,
            project_id: currentProjectId
        });
        
        if (response.status === 'ok') {
            // Clear the form
            document.getElementById('diagram-name-input').value = '';
            document.getElementById('diagram-text').value = '';
            
            // Show success message
            showToast('Диаграмата е добавена успешно!');
            
            // Refresh the dashboard
            await loadProjectData(currentProjectId);
           // Update dashboard with fresh data
             loadDashboard(currentProjectId, currentRequirements, currentDiagrams);
        } else {
            throw new Error(response.message || 'Failed to add diagram');
        }
    } catch (error) {
        showToast('Грешка при добавяне на диаграма: ' + error.message);
    }
}

function openCreateProjectModal() {
    document.getElementById("project-modal").style.display = "block";
}

function closeProjectModal() {
    document.getElementById("project-modal").style.display = "none";
}

function showAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'block';
    document.getElementById('member-identifier').value = '';
    document.getElementById('add-member-error').style.display = 'none';
}

function closeAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'none';
    document.getElementById('add-member-form').reset();
}

function openLogin() {
    document.getElementById('login-modal').style.display = 'block';
}
function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('login-form').reset();
}

function openRegister() {
    document.getElementById('register-modal').style.display = 'block';
}
function closeRegisterModal() {
    document.getElementById('register-modal').style.display = 'none';
    document.getElementById('register-form').reset();
}

function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-spinner');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

function displayLoggedUserDetails() {
    const userId = window.userHelper.getUserId();
    const username = window.userHelper.getUsername();
    const projectSelection = document.querySelector('.project-selection');
    const mainInterface = document.getElementById('main-interface');
    const headerLoginRegisterBtns = document.getElementById('login-register-btns');
    const centeredLoginRegisterContainer = document.getElementById('login-register-center-container');
    if (userId && username) {
        loadProjects();

        // User is logged in
        if (projectSelection) projectSelection.style.display = 'block';
        // if (mainInterface) mainInterface.style.display = 'block'; 
        if (headerLoginRegisterBtns) headerLoginRegisterBtns.style.display = 'none';
        if (centeredLoginRegisterContainer) centeredLoginRegisterContainer.style.display = 'none';

        const loggedUserElement = document.getElementById('logged-user');
        if (loggedUserElement) {
            loggedUserElement.textContent = `Здравейте, ${username}!`;
            loggedUserElement.style.display = 'block';
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        if (projectSelection) projectSelection.style.display = 'none';
        if (mainInterface) mainInterface.style.display = 'none';
        if (headerLoginRegisterBtns) headerLoginRegisterBtns.style.display = 'none';
        if (centeredLoginRegisterContainer) centeredLoginRegisterContainer.style.display = 'flex';

        const loggedUserElement = document.getElementById('logged-user');
        if (loggedUserElement) loggedUserElement.style.display = 'none';
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

function hideLoggedUserDetails() {
    document.getElementById('project-selection').style.display = 'none';
    document.getElementById('logged-user').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('login-register-btns').style.display = 'none';
    document.getElementById('centered-login-register-btns').style.display = 'flex';
    document.getElementById('main-interface').style.display = 'none';
}

function logout() {
    // Изчистване на сесията
    window.userHelper.clearUserSession();
    currentRequirements = [];
    requirementStatistics = [];
    currentProjectId = null;
    userProjects = [];

    hideLoggedUserDetails();
    // Презареждане на страницата
    location.reload();
}

// Optional: close modal when clicking outside
window.onclick = function (event) {
    if (event.target === document.getElementById('login-modal')) closeLoginModal();
    if (event.target === document.getElementById('register-modal')) closeRegisterModal();
    if (event.target === document.getElementById('indicators-modal')) closeIndicatorsModal();
    if (event.target === document.getElementById('translation-modal')) closeTranslationModal();
};

// Close modal function
function closeModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        document.getElementById('edit-form').reset();
    }
}

// Close indicators modal
function closeIndicatorsModal() {
    const modal = document.getElementById('indicators-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show indicators modal
async function showIndicatorsModal(requirementId) {
    const modal = document.getElementById('indicators-modal');
    if (!modal) return;

    // Reset modal content
    const indicatorsList = document.getElementById('indicators-list');
    const loadingElement = document.getElementById('indicators-loading');
    if (indicatorsList) indicatorsList.innerHTML = '';
    if (loadingElement) loadingElement.style.display = '';

    try {
        // Get indicators from API
        const response = await api.getIndicators(requirementId);
        if (response.status === 'ok' && response.data) {
            const indicators = response.data;

            // Build indicators list
            const indicatorsHtml = indicators.map(indicator => `
                <div class="indicator-item">
                    <h3>${indicator.name}</h3>
                    <p><strong>Единица:</strong> ${indicator.unit || 'Няма единица'}</p>
                    <p><strong>Стойност:</strong> ${indicator.value || 'Няма стойност'}</p>
                    <p><strong>Описание:</strong> ${indicator.description || 'Няма описание'}</p>
                </div>
            `).join('');

            if (indicatorsList) {
                indicatorsList.innerHTML = indicatorsHtml;
            }
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        } else {
            if (indicatorsList) {
                indicatorsList.innerHTML = '<p>Няма индикатори за това изискване</p>';
            }
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading indicators:', error);
        indicatorsList.innerHTML = '<p>Грешка при зареждане на индикатори</p>';
        loadingElement.style.display = 'none';
    }

    modal.style.display = 'block';
}


// translation methods
let currentTranslationRequirementId = null;

function translateRequirement(requirementId) {
    currentTranslationRequirementId = requirementId;
    document.getElementById('translation-modal').style.display = 'block';
    document.getElementById('translation-result').style.display = 'none';
    document.getElementById('translation-error').style.display = 'none';
    document.getElementById('target-language').value = 'en';
}

function closeTranslationModal() {
    document.getElementById('translation-modal').style.display = 'none';
    currentTranslationRequirementId = null;
    document.getElementById('translation-result').style.display = 'none';
    document.getElementById('translation-error').style.display = 'none';
}

async function performTranslation() {
    if (!currentTranslationRequirementId) {
        showToast('Грешка: Няма избрано изискване', 'error');
        return;
    }
    
    const targetLang = document.getElementById('target-language').value;
    const translateBtn = document.getElementById('translate-btn');
    const loadingDiv = document.getElementById('translation-loading');
    const resultDiv = document.getElementById('translation-result');
    const errorDiv = document.getElementById('translation-error');
    

    translateBtn.disabled = true;
    loadingDiv.style.display = 'block';
    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    
    try {
        const result = await api.translateRequirement(currentTranslationRequirementId, targetLang);
        
        if (result.status === 'ok' && result.requirement) {

            displayTranslatedRequirement(result.requirement);
            loadingDiv.style.display = 'none';
            resultDiv.style.display = 'block';
        } else {
            throw new Error(result.message || 'Грешка при превод');
        }
    } catch (error) {
        console.error('Translation error:', error);
        errorDiv.textContent = 'Грешка при превод: ' + error.message;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
    } finally {
        translateBtn.disabled = false;
    }
}

function displayTranslatedRequirement(translatedReq) {
    const container = document.getElementById('translated-content');
    

    let tags = translatedReq.tags || [];
    if (!Array.isArray(tags) && typeof tags === 'string') {
        try {
            tags = JSON.parse(tags);
        } catch {
            tags = [];
        }
    }
    
    const tagsHtml = tags.length > 0 
        ? tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
        : '';
    
    container.innerHTML = `
        <div class="requirement-card" style="margin: 10px 0;">
            <div class="requirement-header">
                <h4>${escapeHtml(translatedReq.title || '')}</h4>
                <div class="requirement-meta">
                    <span class="priority">${getPriorityText(translatedReq.priority)}</span>
                    <span class="type">${getTypeText(translatedReq.type)}</span>
                </div>
            </div>
            
            <div class="requirement-body">
                <p>${escapeHtml(translatedReq.description || '')}</p>
                
                ${translatedReq.component ? 
                    `<div class="component">Компонент: ${escapeHtml(translatedReq.component)}</div>` : ''}
                
                ${translatedReq.assignee ? 
                    `<div class="assignee">Отговорен: ${escapeHtml(translatedReq.assignee)}</div>` : ''}
                
                ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ''}
                
                ${translatedReq.complexity ? 
                    `<div class="complexity">Сложност: ${getComplexityText(translatedReq.complexity)}</div>` : ''}
            </div>
            
            ${translatedReq.indicators && translatedReq.indicators.length > 0 ? `
                <div class="indicators-section" style="margin-top: 15px;">
                    <h5>Индикатори:</h5>
                    ${translatedReq.indicators.map(ind => `
                        <div style="margin: 5px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                            <strong>${escapeHtml(ind.name || '')}</strong>
                            ${ind.value ? `: ${escapeHtml(ind.value)}` : ''}
                            ${ind.unit ? ` ${escapeHtml(ind.unit)}` : ''}
                            ${ind.description ? `<br><small>${escapeHtml(ind.description)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

window.onbeforeunload = function () {
    logout();
}