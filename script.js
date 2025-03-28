// Initialize with default values
let references = [];
let projects = ['General'];
let projectOrder = ['General'];
let projectColors = { 'General': '#c9ffd8' };
let starredReferences = {};

// DOM Elements
const referenceForm = document.getElementById('reference-form');
const projectsContainer = document.getElementById('projects-container');
const projectOptions = document.getElementById('project-options');
const addProjectBtn = document.getElementById('add-project-btn');
const projectModal = document.getElementById('project-modal');
const renameModal = document.getElementById('rename-modal');
const resetModal = document.getElementById('reset-modal');
const newProjectForm = document.getElementById('new-project-form');
const renameProjectForm = document.getElementById('rename-project-form');
const closeModalBtns = document.querySelectorAll('.close-modal');
const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load data from localStorage
    loadDataFromLocalStorage();
    
    // Load projects and render UI
    loadProjects();
    renderReferences();

    // Set up event listeners
    setupEventListeners();
    
    // Show notification about localStorage functionality
    showNotification('Data is now saved to your browser automatically!', 'info');
});

// Load data from localStorage
function loadDataFromLocalStorage() {
    const storedData = localStorage.getItem('track-references-data');
    
    if (storedData) {
        try {
            const data = JSON.parse(storedData);
            
            if (data.references && Array.isArray(data.references)) {
                references = data.references;
            }
            
            if (data.projects && Array.isArray(data.projects)) {
                // Ensure 'General' is always included
                if (!data.projects.includes('General')) {
                    data.projects.unshift('General');
                }
                
                projects = data.projects;
            }
            
            if (data.projectColors && typeof data.projectColors === 'object') {
                projectColors = data.projectColors;
                // Ensure General has a color
                if (!projectColors.General) {
                    projectColors.General = '#c9ffd8';
                }
            }
            
            if (data.projectOrder && Array.isArray(data.projectOrder)) {
                projectOrder = data.projectOrder;
                // Ensure General is in the order
                if (!projectOrder.includes('General')) {
                    projectOrder.unshift('General');
                }
            } else {
                projectOrder = [...projects];
            }
            
            if (data.starredReferences && typeof data.starredReferences === 'object') {
                starredReferences = data.starredReferences;
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Form submission for adding a new reference
    referenceForm.addEventListener('submit', handleAddReference);

    // Add project button
    addProjectBtn.addEventListener('click', () => {
        openModal(projectModal);
    });

    // Close modals with X button (for any remaining modals that still have it)
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });

    // Cancel buttons for modals
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });

    // New project form submission
    newProjectForm.addEventListener('submit', handleAddProject);

    // Rename project form submission
    renameProjectForm.addEventListener('submit', handleRenameProject);

    // Import button
    importBtn.addEventListener('click', handleImport);

    // Export button
    exportBtn.addEventListener('click', handleExport);
    
    // Reset button - show confirmation modal
    resetBtn.addEventListener('click', () => {
        openModal(resetModal);
    });
    
    // Reset confirm button
    const confirmResetBtn = resetModal.querySelector('.reset-confirm-btn');
    confirmResetBtn.addEventListener('click', () => {
        resetApplication();
        closeModal(resetModal);
    });
    
    // Project container event delegation for project actions
    projectsContainer.addEventListener('click', (e) => {
        // Toggle project sections when clicking anywhere on the header except buttons
        if (e.target.closest('.project-header') && 
            !e.target.closest('.color-btn') && 
            !e.target.closest('.move-up-btn') && 
            !e.target.closest('.move-down-btn') && 
            !e.target.closest('.rename-btn') && 
            !e.target.closest('.delete-project-btn')) {
            
            const header = e.target.closest('.project-header');
            const section = header.closest('.project-section');
            const content = section.querySelector('.project-content');
            const icon = header.querySelector('.toggle-btn i');
            
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            icon.className = content.style.display === 'none' ? 'fas fa-chevron-right' : 'fas fa-chevron-down';
        }
        
        // Color picker
        if (e.target.classList.contains('color-btn')) {
            const color = e.target.dataset.color;
            const header = e.target.closest('.project-header');
            const projectName = header.dataset.project;
            
            // Update color
            header.style.backgroundColor = color;
            header.closest('.project-section').dataset.color = color;
            projectColors[projectName] = color;
            saveProjectColors();
        }
        
        // Move project up
        if (e.target.closest('.move-up-btn')) {
            const section = e.target.closest('.project-section');
            const projectName = section.dataset.project;
            moveProject(projectName, 'up');
        }
        
        // Move project down
        if (e.target.closest('.move-down-btn')) {
            const section = e.target.closest('.project-section');
            const projectName = section.dataset.project;
            moveProject(projectName, 'down');
        }
        
        // Rename project
        if (e.target.closest('.rename-btn')) {
            const section = e.target.closest('.project-section');
            const projectName = section.dataset.project;
            
            // Populate rename form
            document.getElementById('new-project-name').value = projectName;
            document.getElementById('current-project-name').value = projectName;
            
            // Open rename modal
            openModal(renameModal);
        }
        
        // Delete project
        if (e.target.closest('.delete-project-btn:not([disabled])')) {
            const section = e.target.closest('.project-section');
            const projectName = section.dataset.project;
            
            if (confirm(`Are you sure you want to delete the project "${projectName}"? All references in this project will be moved to "General".`)) {
                deleteProject(projectName);
            }
        }
    });

    // Import and Export functionality
    importBtn.addEventListener('click', handleImport);
    exportBtn.addEventListener('click', handleExport);
}

// Open modal with animation
function openModal(modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

// Close modal with animation
function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Handle adding a new reference
function handleAddReference(e) {
    e.preventDefault();
    
    // Get form values
    const artist = document.getElementById('artist').value.trim();
    const title = document.getElementById('title').value.trim();
    const sourceUrl = document.getElementById('source-url').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const timestamp = document.getElementById('timestamp').value.trim();
    
    // Get selected tags
    const selectedTags = [];
    document.querySelectorAll('input[name="tags"]:checked').forEach(checkbox => {
        selectedTags.push(checkbox.value);
    });
    
    // Validate at least one tag is selected
    if (selectedTags.length === 0) {
        showNotification('Please select at least one tag.', 'error');
        return;
    }
    
    // Get selected project
    const project = document.querySelector('input[name="project"]:checked').value;
    
    // Create new reference object
    const newReference = {
        id: Date.now().toString(),
        artist,
        title,
        sourceUrl,
        notes,
        timestamp,
        tags: selectedTags,
        project,
        dateAdded: new Date().toISOString()
    };
    
    // Add to references array
    references.push(newReference);
    
    // Call save function
    saveReferences();
    
    // Render the updated references
    renderReferences();
    
    // Reset the form
    referenceForm.reset();
    
    // Show confirmation
    showNotification('Reference added successfully!');
}

// Handle adding a new project
function handleAddProject(e) {
    e.preventDefault();
    
    const projectName = document.getElementById('project-name').value.trim();
    
    // Validate project name
    if (!projectName) {
        showNotification('Please enter a project name.', 'error');
        return;
    }
    
    // Check if project already exists
    if (projects.includes(projectName)) {
        showNotification('Project already exists.', 'error');
        return;
    }
    
    // Add to projects array
    projects.push(projectName);
    
    // Set default color
    projectColors[projectName] = '#c9ffd8';
    
    // Add to project order
    projectOrder.push(projectName);
    
    // Call save functions
    saveProjects();
    saveProjectColors();
    saveProjectOrder();
    
    // Update UI
    const projectRadioId = addProjectToOptions(projectName);
    createProjectSection(projectName);
    
    // Close modal and reset form
    closeModal(projectModal);
    newProjectForm.reset();
    
    // Automatically select the new project
    const newProjectRadio = document.getElementById(projectRadioId);
    if (newProjectRadio) {
        newProjectRadio.checked = true;
    }
    
    // Show confirmation
    showNotification('Project added successfully!');
}

// Handle renaming a project
function handleRenameProject(e) {
    e.preventDefault();
    
    const currentName = document.getElementById('current-project-name').value;
    const newName = document.getElementById('new-project-name').value.trim();
    
    // Validate new name
    if (!newName) {
        showNotification('Please enter a project name.', 'error');
        return;
    }
    
    // Check if new name already exists (except for the current project)
    if (newName !== currentName && projects.includes(newName)) {
        showNotification('Project name already exists.', 'error');
        return;
    }
    
    // Update projects array
    const index = projects.indexOf(currentName);
    if (index !== -1) {
        projects[index] = newName;
    }
    
    // Update project order
    const orderIndex = projectOrder.indexOf(currentName);
    if (orderIndex !== -1) {
        projectOrder[orderIndex] = newName;
    }
    
    // Update project color
    if (projectColors[currentName]) {
        projectColors[newName] = projectColors[currentName];
        delete projectColors[currentName];
    }
    
    // Update references
    references.forEach(ref => {
        if (ref.project === currentName) {
            ref.project = newName;
        }
    });
    
    // Call save functions
    saveProjects();
    saveProjectColors();
    saveProjectOrder();
    saveReferences();
    
    // Update UI
    clearProjectUI();
    loadProjects();
    renderReferences();
    
    // Close modal and reset form
    closeModal(renameModal);
    renameProjectForm.reset();
    
    // Show confirmation
    showNotification('Project renamed successfully!');
}

// Delete a project
function deleteProject(projectName) {
    // Cannot delete General
    if (projectName === 'General') {
        showNotification('Cannot delete the General project.', 'error');
        return;
    }
    
    // Move references to General
    references.forEach(ref => {
        if (ref.project === projectName) {
            ref.project = 'General';
        }
    });
    
    // Remove from projects array
    const index = projects.indexOf(projectName);
    if (index !== -1) {
        projects.splice(index, 1);
    }
    
    // Remove from project order
    const orderIndex = projectOrder.indexOf(projectName);
    if (orderIndex !== -1) {
        projectOrder.splice(orderIndex, 1);
    }
    
    // Remove color
    delete projectColors[projectName];
    
    // Call save functions
    saveProjects();
    saveProjectColors();
    saveProjectOrder();
    saveReferences();
    
    // Update UI
    clearProjectUI();
    loadProjects();
    renderReferences();
    
    // Show confirmation
    showNotification(`Project "${projectName}" deleted successfully. References moved to General.`);
}

// Move project up or down in order
function moveProject(projectName, direction) {
    // Don't allow moving General project
    if (projectName === 'General') return;
    
    const index = projectOrder.indexOf(projectName);
    
    if (index === -1) return;
    
    // Don't allow moving a project above General
    if (direction === 'up' && index > 1) {
        // Swap with previous (but not with General which is at index 0)
        [projectOrder[index], projectOrder[index - 1]] = [projectOrder[index - 1], projectOrder[index]];
    } else if (direction === 'down' && index < projectOrder.length - 1) {
        // Swap with next
        [projectOrder[index], projectOrder[index + 1]] = [projectOrder[index + 1], projectOrder[index]];
    } else {
        return; // Cannot move further
    }
    
    // Call save function
    saveProjectOrder();
    
    // Update UI
    clearProjectUI();
    loadProjects();
    renderReferences();
}

// Clear project UI
function clearProjectUI() {
    // Clear project options (except General)
    const generalOption = document.querySelector('.project-item:first-child');
    const addProjectItem = document.querySelector('.add-project-item');
    projectOptions.innerHTML = '';
    projectOptions.appendChild(generalOption);
    
    // Clear project sections completely
    projectsContainer.innerHTML = '';
}

// Add a project to the radio options
function addProjectToOptions(projectName) {
    const projectId = `project-${projectName.toLowerCase().replace(/\s+/g, '-')}`;
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';
    projectItem.innerHTML = `
        <input type="radio" id="${projectId}" name="project" value="${projectName}">
        <label for="${projectId}">${projectName}</label>
    `;
    
    // Insert before the "Add Project" item
    const addProjectItem = document.querySelector('.add-project-item');
    projectOptions.insertBefore(projectItem, addProjectItem);
    
    return projectId;
}

// Create a new project section in the right frame
function createProjectSection(projectName) {
    const projectSection = document.createElement('div');
    projectSection.className = 'project-section';
    projectSection.dataset.project = projectName;
    
    // Get color for this project
    let color = projectColors[projectName] || '#c9ffd8';
    
    // Force General to have #DDDDDD color
    if (projectName === 'General') {
        color = '#DDDDDD';
        projectColors['General'] = '#DDDDDD';
    }
    
    projectSection.dataset.color = color;
    
    // Create different HTML for General vs other projects
    if (projectName === 'General') {
        projectSection.innerHTML = `
            <div class="project-header" data-project="${projectName}" style="background-color: ${color};">
                <div class="project-title">
                    <button class="toggle-btn"><i class="fas fa-chevron-down"></i></button>
                    <h2>${projectName}</h2>
                </div>
                <div class="project-actions">
                    <!-- No project actions for General -->
                </div>
            </div>
            <div class="project-content">
                <div class="tag-columns">
                    <div class="tag-column" data-tag="Overall Vibe">
                        <h3>Overall Vibe</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Chords">
                        <h3>Chords</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Melody">
                        <h3>Melody</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Rhythm">
                        <h3>Rhythm</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Sound Design">
                        <h3>Sound Design</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Ear Candy">
                        <h3>Ear Candy</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Engineering">
                        <h3>Engineering</h3>
                        <div class="cards-container"></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        projectSection.innerHTML = `
            <div class="project-header" data-project="${projectName}" style="background-color: ${color};">
                <div class="project-title">
                    <button class="toggle-btn"><i class="fas fa-chevron-down"></i></button>
                    <h2>${projectName}</h2>
                </div>
                <div class="project-actions">
                    <div class="color-picker">
                        <button class="color-btn" data-color="#cef2ff" style="background-color: #cef2ff;"></button>
                        <button class="color-btn" data-color="#fffaa9" style="background-color: #fffaa9;"></button>
                        <button class="color-btn" data-color="#ffd3d3" style="background-color: #ffd3d3;"></button>
                        <button class="color-btn" data-color="#c9ffd8" style="background-color: #c9ffd8;"></button>
                        <button class="color-btn" data-color="#e7deff" style="background-color: #e7deff;"></button>
                    </div>
                    <button class="move-up-btn" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                    <button class="move-down-btn" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                    <button class="rename-btn" title="Rename"><i class="fas fa-edit"></i></button>
                    <button class="delete-project-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="project-content">
                <div class="tag-columns">
                    <div class="tag-column" data-tag="Overall Vibe">
                        <h3>Overall Vibe</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Chords">
                        <h3>Chords</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Melody">
                        <h3>Melody</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Rhythm">
                        <h3>Rhythm</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Sound Design">
                        <h3>Sound Design</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Ear Candy">
                        <h3>Ear Candy</h3>
                        <div class="cards-container"></div>
                    </div>
                    <div class="tag-column" data-tag="Engineering">
                        <h3>Engineering</h3>
                        <div class="cards-container"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Append to projects container based on project order
    const index = projectOrder.indexOf(projectName);
    
    if (index === -1 || projectsContainer.children.length === 0) {
        // If not in order or container is empty, just append
        projectsContainer.appendChild(projectSection);
    } else {
        // Insert at the correct position
        const referencePoint = Array.from(projectsContainer.children).find(
            child => {
                const childProject = child.dataset.project;
                const childIndex = projectOrder.indexOf(childProject);
                return childIndex > index;
            }
        );
        
        if (referencePoint) {
            projectsContainer.insertBefore(projectSection, referencePoint);
        } else {
            projectsContainer.appendChild(projectSection);
        }
    }
}

// Load projects from localStorage
function loadProjects() {
    // Ensure General is always first in project order
    if (!projectOrder.includes('General')) {
        projectOrder.unshift('General');
    } else if (projectOrder.indexOf('General') !== 0) {
        // Remove General from current position
        projectOrder.splice(projectOrder.indexOf('General'), 1);
        // Add it to the beginning
        projectOrder.unshift('General');
    }
    
    // Add projects to UI in order
    projectOrder.forEach(project => {
        if (projects.includes(project)) {
            if (project !== 'General') { // General is already in the HTML
                addProjectToOptions(project);
            }
            createProjectSection(project);
        }
    });
    
    // Add any projects that are not in the order
    projects.forEach(project => {
        if (!projectOrder.includes(project)) {
            projectOrder.push(project);
            if (project !== 'General') {
                addProjectToOptions(project);
                createProjectSection(project);
            }
        }
    });
    
    // Make sure the "Add Project" button is always present
    const addProjectItem = document.querySelector('.add-project-item');
    if (!addProjectItem) {
        const newAddProjectItem = document.createElement('div');
        newAddProjectItem.className = 'project-item add-project-item';
        newAddProjectItem.innerHTML = '<span id="add-project-btn">+ Add Project</span>';
        projectOptions.appendChild(newAddProjectItem);
        
        // Re-attach event listener to the new button
        document.getElementById('add-project-btn').addEventListener('click', () => {
            openModal(projectModal);
        });
    }
}

// Render all references in the UI
function renderReferences() {
    // Clear all existing cards
    document.querySelectorAll('.cards-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // Render each reference
    references.forEach(reference => {
        renderReferenceCard(reference);
    });
}

// Render a single reference card
function renderReferenceCard(reference) {
    // Find the project section
    const projectSection = document.querySelector(`.project-section[data-project="${reference.project}"]`);
    
    if (!projectSection) return;
    
    // Create a card for each tag
    reference.tags.forEach(tag => {
        // Find the tag column
        const tagColumn = projectSection.querySelector(`.tag-column[data-tag="${tag}"] .cards-container`);
        
        if (!tagColumn) return;
        
        // Create the card
        const card = document.createElement('div');
        card.className = 'reference-card';
        
        // Generate a unique ID for this specific card instance (combination of reference ID, tag, and project)
        const cardInstanceId = `${reference.id}-${tag}-${reference.project}`;
        card.dataset.id = cardInstanceId;
        card.dataset.referenceId = reference.id;
        card.dataset.tag = tag;
        
        // Create title element - make it a link if source URL exists
        const titleElement = reference.sourceUrl 
            ? `<h4><a href="${reference.sourceUrl}" target="_blank">${reference.artist} - ${reference.title}</a></h4>`
            : `<h4>${reference.artist} - ${reference.title}</h4>`;
        
        // Check if this specific card instance is starred
        const isStarred = starredReferences[cardInstanceId] === true;
        const starClass = isStarred ? 'star-btn starred' : 'star-btn';
        const starIcon = isStarred ? 'fas fa-star' : 'far fa-star';
        
        // Reorder elements to put timestamp above notes and remove "Timestamp:" prefix
        card.innerHTML = `
            ${titleElement}
            ${reference.timestamp ? `<p class="timestamp">${reference.timestamp}</p>` : ''}
            <p>${reference.notes}</p>
            <button class="${starClass}" title="Mark as favorite">
                <i class="${starIcon}"></i>
            </button>
            <div class="card-actions">
                <button class="move-btn" title="Move to another project">
                    <i class="fas fa-exchange-alt"></i>
                </button>
                <button class="delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add star functionality
        const starBtn = card.querySelector('.star-btn');
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Toggle star status for this specific card instance
            const newStarredStatus = !starredReferences[cardInstanceId];
            starredReferences[cardInstanceId] = newStarredStatus;
            
            // Update UI
            if (newStarredStatus) {
                starBtn.classList.add('starred');
                starBtn.querySelector('i').className = 'fas fa-star';
            } else {
                starBtn.classList.remove('starred');
                starBtn.querySelector('i').className = 'far fa-star';
            }
            
            // Call save function
            saveStarredReferences();
            
            // Show notification
            const message = newStarredStatus ? 
                `"${reference.artist} - ${reference.title}" card marked as favorite` : 
                `"${reference.artist} - ${reference.title}" card removed from favorites`;
            showNotification(message);
        });
        
        // Add move functionality
        const moveBtn = card.querySelector('.move-btn');
        moveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close any other open dropdowns
            document.querySelectorAll('.move-dropdown-container').forEach(container => {
                document.body.removeChild(container);
            });
            
            // Create a new dropdown container that will be appended to the body
            const dropdownContainer = document.createElement('div');
            dropdownContainer.className = 'move-dropdown-container';
            
            // Create the dropdown content
            const dropdown = document.createElement('div');
            dropdown.className = 'move-dropdown';
            
            // Position the dropdown relative to the button
            const buttonRect = moveBtn.getBoundingClientRect();
            dropdownContainer.style.position = 'fixed';
            dropdownContainer.style.top = `${buttonRect.bottom}px`;
            dropdownContainer.style.left = `${buttonRect.left}px`;
            dropdownContainer.style.zIndex = '9999';
            
            // Populate dropdown with project options
            projects.forEach(projectName => {
                const projectItem = document.createElement('div');
                projectItem.className = 'move-dropdown-item';
                if (projectName === reference.project) {
                    projectItem.classList.add('current');
                }
                projectItem.textContent = projectName;
                
                projectItem.addEventListener('click', () => {
                    // Only proceed if selecting a different project
                    if (projectName !== reference.project) {
                        // Find the reference in the array
                        const refIndex = references.findIndex(ref => ref.id === reference.id);
                        
                        if (refIndex !== -1) {
                            // Instead of moving the entire reference with all tags,
                            // create a new reference with only this tag in the new project
                            
                            // First, create a copy of the reference for the new project
                            const newReference = {
                                ...references[refIndex],
                                id: generateUniqueId(), // Generate a new ID for the new reference
                                project: projectName,   // Set to the new project
                                tags: [tag]            // Only include the current tag
                            };
                            
                            // Add the new reference to the array
                            references.push(newReference);
                            
                            // Remove the current tag from the original reference
                            references[refIndex].tags = references[refIndex].tags.filter(t => t !== tag);
                            
                            // If the original reference has no tags left, remove it
                            if (references[refIndex].tags.length === 0) {
                                references.splice(refIndex, 1);
                            }
                            
                            // Call save function
                            saveReferences();
                            
                            // Re-render references
                            renderReferences();
                            
                            // Show confirmation
                            showNotification(`Card moved to ${projectName}`);
                        }
                    }
                    
                    // Remove the dropdown container
                    document.body.removeChild(dropdownContainer);
                });
                
                dropdown.appendChild(projectItem);
            });
            
            // Add the dropdown to the container and the container to the body
            dropdownContainer.appendChild(dropdown);
            document.body.appendChild(dropdownContainer);
            
            // Add a click event listener to the document to close the dropdown when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeDropdown(e) {
                    if (!dropdownContainer.contains(e.target) && e.target !== moveBtn) {
                        if (document.body.contains(dropdownContainer)) {
                            document.body.removeChild(dropdownContainer);
                        }
                        document.removeEventListener('click', closeDropdown);
                    }
                });
            }, 0);
        });
        
        // Add delete functionality for this specific card instance
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Ask for confirmation before deleting
            if (confirm(`Are you sure you want to remove "${reference.artist} - ${reference.title}" from the ${tag === 'Overall Vibe' ? 'Overall Vibe' : tag} column?`)) {
                // Find the reference in the array
                const refIndex = references.findIndex(ref => ref.id === reference.id);
                
                if (refIndex !== -1) {
                    // Get the reference
                    const ref = references[refIndex];
                    
                    // If this is the only tag, delete the entire reference
                    if (ref.tags.length === 1) {
                        deleteReference(reference.id);
                    } else {
                        // Otherwise, just remove this tag
                        ref.tags = ref.tags.filter(t => t !== tag);
                        
                        // Call save function
                        saveReferences();
                        
                        // Re-render references
                        renderReferences();
                        
                        // Show notification
                        showNotification(`Removed "${reference.artist} - ${reference.title}" from ${tag === 'Overall Vibe' ? 'Overall Vibe' : tag}`);
                    }
                }
            }
        });
        
        tagColumn.appendChild(card);
    });
}

// Delete a reference
function deleteReference(id) {
    // Filter out the reference to delete
    references = references.filter(ref => ref.id !== id);
    
    // Call save function
    saveReferences();
    
    // Re-render references
    renderReferences();
    
    // Show confirmation
    showNotification('Reference deleted successfully!');
}

// Save references
function saveReferences() {
    const data = {
        references,
        projects,
        projectColors,
        projectOrder,
        starredReferences
    };
    
    localStorage.setItem('track-references-data', JSON.stringify(data));
}

// Save projects
function saveProjects() {
    // Get existing data first
    const storedData = localStorage.getItem('track-references-data');
    let data = storedData ? JSON.parse(storedData) : {};
    
    // Update only the projects property
    data.projects = projects;
    
    localStorage.setItem('track-references-data', JSON.stringify(data));
}

// Save project colors
function saveProjectColors() {
    // Get existing data first
    const storedData = localStorage.getItem('track-references-data');
    let data = storedData ? JSON.parse(storedData) : {};
    
    // Update only the projectColors property
    data.projectColors = projectColors;
    
    localStorage.setItem('track-references-data', JSON.stringify(data));
}

// Save project order
function saveProjectOrder() {
    // Get existing data first
    const storedData = localStorage.getItem('track-references-data');
    let data = storedData ? JSON.parse(storedData) : {};
    
    // Update only the projectOrder property
    data.projectOrder = projectOrder;
    
    localStorage.setItem('track-references-data', JSON.stringify(data));
}

// Save starred references
function saveStarredReferences() {
    // Get existing data first
    const storedData = localStorage.getItem('track-references-data');
    let data = storedData ? JSON.parse(storedData) : {};
    
    // Update only the starredReferences property
    data.starredReferences = starredReferences;
    
    localStorage.setItem('track-references-data', JSON.stringify(data));
}

// Handle import functionality
function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.references && Array.isArray(data.references)) {
                    references = data.references;
                }
                
                if (data.projects && Array.isArray(data.projects)) {
                    // Ensure 'General' is always included
                    if (!data.projects.includes('General')) {
                        data.projects.unshift('General');
                    }
                    
                    projects = data.projects;
                }
                
                if (data.projectColors && typeof data.projectColors === 'object') {
                    projectColors = data.projectColors;
                    // Ensure General has a color
                    if (!projectColors.General) {
                        projectColors.General = '#c9ffd8';
                    }
                }
                
                if (data.projectOrder && Array.isArray(data.projectOrder)) {
                    projectOrder = data.projectOrder;
                    // Ensure General is in the order
                    if (!projectOrder.includes('General')) {
                        projectOrder.unshift('General');
                    }
                } else {
                    projectOrder = [...projects];
                }
                
                if (data.starredReferences && typeof data.starredReferences === 'object') {
                    starredReferences = data.starredReferences;
                }
                
                // Call save functions
                saveReferences();
                saveProjects();
                saveProjectColors();
                saveProjectOrder();
                saveStarredReferences();
                
                // Clear and rebuild UI
                clearProjectUI();
                loadProjects();
                renderReferences();
                
                showNotification('Data imported successfully! Remember to export your work before closing the browser.', 'success');
            } catch (error) {
                showNotification('Error importing data. Please check the file format.', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    });
    
    input.click();
}

// Handle export functionality
function handleExport() {
    const data = {
        references,
        projects,
        projectColors,
        projectOrder,
        starredReferences
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `track_references_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showNotification('Data exported successfully! Your data has been saved to a file.', 'success');
}

// Reset application
function resetApplication() {
    // Clear all data
    references = [];
    projects = ['General'];
    projectOrder = ['General'];
    projectColors = { 'General': '#c9ffd8' };
    starredReferences = {};
    
    // Clear localStorage
    localStorage.removeItem('track-references-data');
    
    // Clear and rebuild UI
    clearProjectUI();
    loadProjects();
    renderReferences();
    
    showNotification('Application reset successfully!');
}

// Show notification
function showNotification(message, type = 'success') {
    // Check if notification container exists
    let notificationContainer = document.querySelector('.notification-container');
    
    // Create container if it doesn't exist
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        ${message}
        <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add close functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// Generate a unique ID for new references
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}