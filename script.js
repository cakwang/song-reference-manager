// Constants
const TAGS = ['Overall Vibe', 'Chords', 'Melody', 'Sound Design', 'Mixing'];
const DEFAULT_PROJECT = 'General';
const DATA_FILE_NAME = 'song_references_data.json';

// State management
let selectedTags = [];
let selectedProject = DEFAULT_PROJECT;
let projects = [DEFAULT_PROJECT];
let collapsedProjects = {}; // Track collapsed state of project sections

// Data structure to store references by project and tag
const projectReferences = {
    [DEFAULT_PROJECT]: {
        'Overall Vibe': [],
        Chords: [],
        Melody: [],
        'Sound Design': [],
        Mixing: []
    }
};

// DOM Elements
const form = document.getElementById('referenceForm');
const titleInput = document.getElementById('title');
const urlInput = document.getElementById('url');
const notesInput = document.getElementById('notes');
const tagContainer = document.getElementById('tagContainer');
const projectContainer = document.getElementById('projectContainer');
const addProjectBtn = document.getElementById('addProjectBtn');
const projectsContainer = document.getElementById('projectsContainer');

// Initialize the application
function init() {
    // Load saved data from localStorage
    loadData();
    
    createTagButtons();
    createProjectButtons();
    createProjectSections();
    setupEventListeners();
}

// Create tag selection buttons
function createTagButtons() {
    TAGS.forEach(tag => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tag-button';
        button.textContent = tag;
        button.addEventListener('click', () => toggleTag(tag, button));
        tagContainer.appendChild(button);
    });
}

// Create project selection buttons
function createProjectButtons() {
    projectContainer.innerHTML = '';
    
    projects.forEach(project => {
        const button = document.createElement('button');
        button.className = `project-button ${project === selectedProject ? 'selected' : ''}`;
        button.textContent = project;
        button.addEventListener('click', () => selectProject(project, button));
        projectContainer.appendChild(button);
    });
}

// Create collapsible sections for each project
function createProjectSections() {
    // Store current scroll position
    const scrollPosition = window.scrollY;
    
    // Clear existing sections
    projectsContainer.innerHTML = '';
    
    // Create a section for each project
    projects.forEach(project => {
        // Skip if this is not a valid project
        if (!project) return;
        
        // Create project section
        const projectSection = document.createElement('div');
        projectSection.className = 'project-section';
        projectSection.id = `project-${project}`;
        
        // Apply collapsed state if previously collapsed
        if (collapsedProjects[project]) {
            projectSection.classList.add('collapsed');
        }
        
        // Create project header
        const projectHeader = document.createElement('div');
        projectHeader.className = 'project-header';
        
        // Create chevron icon
        const chevronIcon = document.createElement('svg');
        chevronIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        chevronIcon.setAttribute('class', 'h-6 w-6 chevron-icon');
        chevronIcon.setAttribute('fill', 'none');
        chevronIcon.setAttribute('viewBox', '0 0 24 24');
        chevronIcon.setAttribute('stroke', 'currentColor');
        chevronIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />';
        
        // Create header title
        const headerTitle = document.createElement('h2');
        headerTitle.textContent = project;
        
        // Create actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'project-actions';
        
        // Only add rename and delete options for non-default projects
        if (project !== DEFAULT_PROJECT) {
            // Create rename option
            const renameOption = document.createElement('span');
            renameOption.className = 'project-action project-rename';
            renameOption.textContent = 'Rename';
            renameOption.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent toggling the collapse
                renameProject(project);
            });
            actionsContainer.appendChild(renameOption);
            
            // Create delete option
            const deleteOption = document.createElement('span');
            deleteOption.className = 'project-action project-delete';
            deleteOption.textContent = 'Delete';
            deleteOption.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent toggling the collapse
                deleteProject(project);
            });
            actionsContainer.appendChild(deleteOption);
        }
        
        // Add elements to header
        projectHeader.appendChild(chevronIcon);
        projectHeader.appendChild(headerTitle);
        projectHeader.appendChild(actionsContainer);
        
        // Add click event to toggle collapse
        projectHeader.addEventListener('click', () => toggleProjectCollapse(project));
        
        // Create project content
        const projectContent = document.createElement('div');
        projectContent.className = 'project-content';
        projectContent.id = `${project}-content`;
        
        // Apply display style based on collapsed state
        if (collapsedProjects[project]) {
            projectContent.style.display = 'none';
        } else {
            projectContent.style.display = 'grid';
        }
        
        // Create tag sections within the project
        TAGS.forEach(tag => {
            const tagSection = document.createElement('div');
            tagSection.className = 'tag-section bg-white rounded-lg shadow-sm overflow-hidden';
            tagSection.innerHTML = `
                <h3 class="text-lg font-semibold bg-gray-100 p-3 border-b">${tag}</h3>
                <div class="divide-y" id="${project}-${tag}-references"></div>
            `;
            projectContent.appendChild(tagSection);
        });
        
        // Assemble project section
        projectSection.appendChild(projectHeader);
        projectSection.appendChild(projectContent);
        
        // Add to container
        projectsContainer.appendChild(projectSection);
        
        // Update references for this project
        updateAllReferencesForProject(project);
    });
    
    // Restore scroll position
    window.scrollTo(0, scrollPosition);
}

// Toggle tag selection
function toggleTag(tag, button) {
    if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
        button.classList.remove('selected');
    } else {
        selectedTags.push(tag);
        button.classList.add('selected');
    }
}

// Select project
function selectProject(project, button) {
    // Update selected project
    selectedProject = project;
    
    // Update button styles
    Array.from(projectContainer.children).forEach(btn => {
        btn.classList.remove('selected');
    });
    button.classList.add('selected');
}

// Toggle project section collapse
function toggleProjectCollapse(project) {
    const projectSection = document.getElementById(`project-${project}`);
    const projectContent = document.getElementById(`${project}-content`);
    
    if (projectSection.classList.contains('collapsed')) {
        projectSection.classList.remove('collapsed');
        projectContent.style.display = 'grid';
        collapsedProjects[project] = false;
    } else {
        projectSection.classList.add('collapsed');
        projectContent.style.display = 'none';
        collapsedProjects[project] = true;
    }
    
    // Save collapsed state to localStorage
    saveData();
}

// Rename a project
function renameProject(oldProjectName) {
    const newProjectName = prompt(`Enter new name for project "${oldProjectName}":`, oldProjectName);
    
    if (newProjectName && newProjectName.trim() !== '' && 
        newProjectName !== oldProjectName && 
        !projects.includes(newProjectName)) {
        
        // Update projects array
        const projectIndex = projects.indexOf(oldProjectName);
        if (projectIndex !== -1) {
            projects[projectIndex] = newProjectName;
        }
        
        // Update references object
        projectReferences[newProjectName] = projectReferences[oldProjectName];
        delete projectReferences[oldProjectName];
        
        // Update collapsed state
        collapsedProjects[newProjectName] = collapsedProjects[oldProjectName];
        delete collapsedProjects[oldProjectName];
        
        // Update selected project if needed
        if (selectedProject === oldProjectName) {
            selectedProject = newProjectName;
        }
        
        // Update UI
        createProjectButtons();
        createProjectSections();
    } else if (newProjectName && projects.includes(newProjectName)) {
        alert('A project with this name already exists. Please choose a different name.');
    }
}

// Add a new project
function addNewProject() {
    const projectName = prompt('Enter new project name:');
    
    if (projectName && projectName.trim() !== '' && !projects.includes(projectName)) {
        // Add to projects list
        projects.push(projectName);
        
        // Initialize references for this project
        projectReferences[projectName] = {
            'Overall Vibe': [],
            Chords: [],
            Melody: [],
            'Sound Design': [],
            Mixing: []
        };
        
        // Set new project to be expanded by default
        collapsedProjects[projectName] = false;
        
        // Update UI
        createProjectButtons();
        createProjectSections();
        
        // Select the new project
        const newButton = Array.from(projectContainer.children).find(btn => btn.textContent === projectName);
        if (newButton) {
            selectProject(projectName, newButton);
        }
        
        // Scroll to the new project section
        const newProjectSection = document.getElementById(`project-${projectName}`);
        if (newProjectSection) {
            newProjectSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Save data to localStorage
        saveData();
    }
}

// Delete a project
function deleteProject(projectName) {
    // Confirm deletion
    if (confirm(`Are you sure you want to delete the project "${projectName}" and all its references? This action cannot be undone.`)) {
        // Remove from projects array
        projects = projects.filter(p => p !== projectName);
        
        // Remove from references object
        delete projectReferences[projectName];
        
        // If the deleted project was selected, select the default project
        if (selectedProject === projectName) {
            selectedProject = DEFAULT_PROJECT;
        }
        
        // Update UI
        createProjectButtons();
        createProjectSections();
        
        // Save data to localStorage
        saveData();
    }
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!titleInput.value || !urlInput.value || selectedTags.length === 0) {
        alert('Please fill in all required fields and select at least one tag.');
        return;
    }
    
    // Create reference object
    const newReference = {
        id: crypto.randomUUID(),
        title: titleInput.value,
        url: urlInput.value,
        notes: notesInput.value || ''
    };
    
    // Add reference to each selected tag
    selectedTags.forEach(tag => {
        projectReferences[selectedProject][tag].push(newReference);
        updateReferenceList(selectedProject, tag);
    });
    
    // Reset form
    form.reset();
    selectedTags = [];
    Array.from(tagContainer.children).forEach(button => {
        button.classList.remove('selected');
    });
    
    // Save data to localStorage
    saveData();
}

// Update reference list for a specific project and tag
function updateReferenceList(project, tag) {
    const container = document.getElementById(`${project}-${tag}-references`);
    if (!container) return;
    
    container.innerHTML = projectReferences[project][tag].map(ref => `
        <div class="reference-item">
            <button class="delete-button" onclick="deleteReference('${project}', '${tag}', '${ref.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div class="reference-content">
                <a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="reference-link">
                    ${ref.title}
                </a>
                ${ref.notes ? `<div class="reference-notes">${ref.notes}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Update all references for a specific project
function updateAllReferencesForProject(project) {
    TAGS.forEach(tag => {
        updateReferenceList(project, tag);
    });
}

// Delete a reference
function deleteReference(project, tag, id) {
    projectReferences[project][tag] = projectReferences[project][tag].filter(ref => ref.id !== id);
    updateReferenceList(project, tag);
    
    // Save data after deletion
    saveData();
}

// Setup event listeners
function setupEventListeners() {
    form.addEventListener('submit', handleSubmit);
    addProjectBtn.addEventListener('click', addNewProject);
    
    // Add event listeners for export/import buttons
    document.getElementById('exportButton').addEventListener('click', exportData);
    document.getElementById('importButton').addEventListener('click', importData);
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('songReferences', JSON.stringify(projectReferences));
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('collapsedProjects', JSON.stringify(collapsedProjects));
        console.log('Data saved to localStorage successfully');
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

// Load data from localStorage
function loadData() {
    try {
        const savedReferences = localStorage.getItem('songReferences');
        const savedProjects = localStorage.getItem('projects');
        const savedCollapsedState = localStorage.getItem('collapsedProjects');
        
        if (savedReferences) {
            // Merge saved references with the default structure
            Object.assign(projectReferences, JSON.parse(savedReferences));
        }
        
        if (savedProjects) {
            projects = JSON.parse(savedProjects);
            
            // Ensure DEFAULT_PROJECT is always present
            if (!projects.includes(DEFAULT_PROJECT)) {
                projects.push(DEFAULT_PROJECT);
            }
        }
        
        if (savedCollapsedState) {
            collapsedProjects = JSON.parse(savedCollapsedState);
        }
        
        console.log('Data loaded from localStorage successfully');
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        // If there's an error, ensure we have at least the default project
        if (!projects.includes(DEFAULT_PROJECT)) {
            projects = [DEFAULT_PROJECT];
        }
    }
}

// Export data to a JSON file
function exportData() {
    try {
        const data = {
            projectReferences: projectReferences,
            projects: projects,
            collapsedProjects: collapsedProjects
        };
        
        // Create a Blob with the JSON data
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        // Format current date for filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
        const timestamp = `${dateStr}_${timeStr}`;
        
        // Create filename with timestamp
        const filename = DATA_FILE_NAME.replace('.json', `_${timestamp}.json`);
        
        // Create a download link and trigger it
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(jsonBlob);
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        console.log('Data exported to file successfully');
    } catch (error) {
        console.error('Error exporting data to file:', error);
        alert('Error exporting data. Please try again.');
    }
}

// Import data from a JSON file
function importData() {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Add event listener for file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Update application state with loaded data
                if (data.projectReferences) {
                    Object.assign(projectReferences, data.projectReferences);
                }
                
                if (data.projects) {
                    projects = data.projects;
                    
                    // Ensure DEFAULT_PROJECT is always present
                    if (!projects.includes(DEFAULT_PROJECT)) {
                        projects.push(DEFAULT_PROJECT);
                    }
                }
                
                if (data.collapsedProjects) {
                    collapsedProjects = data.collapsedProjects;
                }
                
                // Refresh UI with loaded data
                createProjectButtons();
                createProjectSections();
                
                // Save imported data to localStorage
                saveData();
                
                console.log('Data imported successfully');
                alert('Data imported successfully!');
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error importing data. The selected file may not be valid.');
            }
        };
        
        reader.readAsText(file);
    });
    
    // Trigger file selection dialog
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);