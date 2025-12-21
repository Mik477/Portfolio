/**
 * AI Prompt Manager - Frontend Controller
 * 
 * Manages AI prompts organized by subject with markdown editing and rendering.
 * 
 * Features:
 * - Subject CRUD operations (create, rename, delete)
 * - Prompt CRUD operations (create, edit, delete, reorder)
 * - Markdown editing with raw/rendered toggle
 * - Persistent state (last subject/prompt)
 * - Copy to clipboard functionality
 * 
 * @author AI Coding Agent
 * @version 1.0.0
 */

class PromptManager {
    constructor() {
        // State
        this.currentSubject = null;
        this.currentPromptNumber = null;
        this.prompts = [];
        this.viewMode = 'rendered'; // 'raw' or 'rendered'
        this.unsavedChanges = false;
        this.originalContent = '';
        
        // Auto-save and undo
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 1000; // 1 second delay
        this.undoHistory = [];
        this.undoIndex = -1;
        this.maxUndoHistory = 50;
        this.isUndoing = false;
        
        // Modals
        this.newSubjectModal = null;
        this.renameSubjectModal = null;
        this.deleteConfirmModal = null;
        this.deleteCallback = null;
        
        // Initialize
        this.init();
    }
    
    // ==================== Initialization ====================
    
    async init() {
        console.log('[PromptManager] Initializing...');
        
        // Load state from localStorage
        this.loadState();
        
        // Initialize Bootstrap modals
        this.initModals();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load subjects
        await this.loadSubjects();
        
        // Restore last position
        if (this.currentSubject) {
            await this.selectSubject(this.currentSubject);
            if (this.currentPromptNumber) {
                await this.loadPrompt(this.currentSubject, this.currentPromptNumber);
            }
        }
        
        console.log('[PromptManager] Initialized successfully');
    }
    
    initModals() {
        this.newSubjectModal = new bootstrap.Modal(document.getElementById('newSubjectModal'));
        this.renameSubjectModal = new bootstrap.Modal(document.getElementById('renameSubjectModal'));
        this.deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    }
    
    // ==================== State Management ====================
    
    loadState() {
        try {
            this.currentSubject = localStorage.getItem('promptManager_lastSubject');
            const lastPrompt = localStorage.getItem('promptManager_lastPrompt');
            this.currentPromptNumber = lastPrompt ? parseInt(lastPrompt) : null;
            this.viewMode = localStorage.getItem('promptManager_viewMode') || 'rendered';
            
            // Set view mode radio buttons
            document.getElementById(this.viewMode === 'raw' ? 'rawMode' : 'renderedMode').checked = true;
            
            console.log('[PromptManager] State loaded:', { 
                subject: this.currentSubject, 
                prompt: this.currentPromptNumber, 
                viewMode: this.viewMode 
            });
        } catch (e) {
            console.warn('[PromptManager] Failed to load state:', e);
        }
    }
    
    saveState() {
        try {
            if (this.currentSubject) {
                localStorage.setItem('promptManager_lastSubject', this.currentSubject);
            }
            if (this.currentPromptNumber) {
                localStorage.setItem('promptManager_lastPrompt', this.currentPromptNumber.toString());
            }
            localStorage.setItem('promptManager_viewMode', this.viewMode);
        } catch (e) {
            console.warn('[PromptManager] Failed to save state:', e);
        }
    }
    
    // ==================== Event Listeners ====================
    
    setupEventListeners() {
        // New Subject Button
        document.getElementById('newSubjectBtn').addEventListener('click', () => {
            this.showNewSubjectModal();
        });
        
        document.getElementById('createSubjectBtn').addEventListener('click', () => {
            this.createSubjectFromModal();
        });
        
        // Enter key in new subject form
        document.getElementById('subjectNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.createSubjectFromModal();
            }
        });
        
        // Rename Subject
        document.getElementById('confirmRenameBtn').addEventListener('click', () => {
            this.renameSubjectFromModal();
        });
        
        // Delete Confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            if (this.deleteCallback) {
                this.deleteCallback();
                this.deleteCallback = null;
            }
            this.deleteConfirmModal.hide();
        });
        
        // View Mode Toggle
        document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleViewMode(e.target.value);
            });
        });
        
        // Prompt Navigation
        document.getElementById('prevPromptBtn').addEventListener('click', () => {
            this.navigatePrompt(-1);
        });
        
        document.getElementById('nextPromptBtn').addEventListener('click', () => {
            this.navigatePrompt(1);
        });
        
        // Prompt Actions
        document.getElementById('copyPromptBtn').addEventListener('click', () => {
            this.copyToClipboard();
        });
        
        document.getElementById('newPromptBtn').addEventListener('click', () => {
            this.createPromptInCurrentSubject();
        });
        
        document.getElementById('deletePromptBtn').addEventListener('click', () => {
            this.deleteCurrentPrompt();
        });
        
        document.getElementById('moveUpBtn').addEventListener('click', () => {
            this.movePrompt(-1);
        });
        
        document.getElementById('moveDownBtn').addEventListener('click', () => {
            this.movePrompt(1);
        });
        
        // Raw editor changes - auto-save with debouncing
        document.getElementById('promptEditorRaw').addEventListener('input', (e) => {
            if (!this.isUndoing) {
                this.handleEditorChange();
            }
        });
        
        // Keyboard shortcuts
        document.getElementById('promptEditorRaw').addEventListener('keydown', (e) => {
            // Ctrl+Z for undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Shift+Z or Ctrl+Y for redo
            else if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
        });
        
        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
    
    // ==================== Subject Operations ====================
    
    async loadSubjects(retryCount = 0) {
        try {
            const response = await fetch('/api/prompts/subjects');
            const data = await response.json();
            
            if (data.success) {
                this.renderSubjectList(data.subjects);
            } else {
                this.showError('Failed to load subjects: ' + data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to load subjects:', error);
            // Retry up to 5 times with increasing delay (for server reload scenarios)
            if (retryCount < 5) {
                const delay = 300 + (retryCount * 200); // 300ms, 500ms, 700ms, 900ms, 1100ms
                console.log(`[PromptManager] Retrying loadSubjects in ${delay}ms (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.loadSubjects(retryCount + 1);
            }
            // Only show error if all retries failed
            if (retryCount >= 5) {
                console.error('[PromptManager] All retry attempts failed for loadSubjects');
            }
        }
    }
    
    renderSubjectList(subjects) {
        const accordion = document.getElementById('subjectAccordion');
        const emptyState = document.getElementById('emptySubjectState');
        
        if (subjects.length === 0) {
            // Remove all accordion items but keep empty state
            const items = accordion.querySelectorAll('.accordion-item');
            items.forEach(item => item.remove());
            emptyState.style.display = 'block';
            return;
        }
        
        // Hide empty state and clear all accordion items
        emptyState.style.display = 'none';
        const items = accordion.querySelectorAll('.accordion-item');
        items.forEach(item => item.remove());
        
        subjects.forEach((subject, index) => {
            const itemId = `subject-${index}`;
            const isExpanded = subject.name === this.currentSubject;
            
            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.innerHTML = `
                <h2 class="accordion-header">
                    <button class="accordion-button ${isExpanded ? '' : 'collapsed'}" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#${itemId}"
                            data-subject-name="${subject.name}">
                        <div class="subject-header-wrapper">
                            <div class="subject-title">
                                <i class="bi bi-folder"></i> ${subject.name} 
                                <span class="badge bg-secondary ms-2">${subject.prompt_count}</span>
                            </div>
                            <div class="subject-actions" onclick="event.stopPropagation();">
                                <button class="btn btn-sm btn-outline-secondary subject-action-btn" 
                                        title="Rename" 
                                        onclick="promptManager.showRenameSubjectModal('${subject.name}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger subject-action-btn" 
                                        title="Delete" 
                                        onclick="promptManager.confirmDeleteSubject('${subject.name}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </button>
                </h2>
                <div id="${itemId}" 
                     class="accordion-collapse collapse ${isExpanded ? 'show' : ''}" 
                     data-bs-parent="#subjectAccordion">
                    <div class="accordion-body p-0">
                        <ul class="prompt-list" id="prompts-${index}">
                            <!-- Prompts will be loaded here -->
                        </ul>
                    </div>
                </div>
            `;
            
            accordion.appendChild(item);
            
            // Add click handler to load prompts when expanded
            const button = item.querySelector('.accordion-button');
            button.addEventListener('click', async () => {
                if (!button.classList.contains('collapsed')) {
                    await this.selectSubject(subject.name);
                }
            });
        });
    }
    
    async selectSubject(subjectName) {
        this.currentSubject = subjectName;
        this.saveState();
        await this.loadPrompts(subjectName);
    }
    
    showNewSubjectModal() {
        document.getElementById('subjectNameInput').value = '';
        this.newSubjectModal.show();
        // Focus on input after modal is shown
        setTimeout(() => {
            document.getElementById('subjectNameInput').focus();
        }, 300);
    }
    
    async createSubjectFromModal() {
        const nameInput = document.getElementById('subjectNameInput');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showError('Subject name cannot be empty');
            return;
        }
        
        try {
            const response = await fetch('/api/prompts/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Subject created - silently load without notification
                this.newSubjectModal.hide();
                await this.loadSubjects();
                await this.selectSubject(name);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to create subject:', error);
            this.showError('Failed to create subject');
        }
    }
    
    showRenameSubjectModal(subjectName) {
        document.getElementById('renameSubjectInput').value = subjectName;
        document.getElementById('renameSubjectOldName').value = subjectName;
        this.renameSubjectModal.show();
        setTimeout(() => {
            document.getElementById('renameSubjectInput').focus();
        }, 300);
    }
    
    async renameSubjectFromModal() {
        const oldName = document.getElementById('renameSubjectOldName').value;
        const newName = document.getElementById('renameSubjectInput').value.trim();
        
        if (!newName) {
            this.showError('Subject name cannot be empty');
            return;
        }
        
        if (oldName === newName) {
            this.renameSubjectModal.hide();
            return;
        }
        
        try {
            const response = await fetch(`/api/prompts/subjects/${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_name: newName })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`Subject renamed to "${newName}"`);
                this.renameSubjectModal.hide();
                
                // Update current subject if it was renamed
                if (this.currentSubject === oldName) {
                    this.currentSubject = newName;
                    this.saveState();
                }
                
                await this.loadSubjects();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to rename subject:', error);
            this.showError('Failed to rename subject');
        }
    }
    
    confirmDeleteSubject(subjectName) {
        document.getElementById('deleteConfirmMessage').textContent = 
            `Are you sure you want to delete the subject "${subjectName}" and all its prompts?`;
        
        this.deleteCallback = async () => {
            await this.deleteSubject(subjectName);
        };
        
        this.deleteConfirmModal.show();
    }
    
    async deleteSubject(subjectName) {
        try {
            const response = await fetch(`/api/prompts/subjects/${encodeURIComponent(subjectName)}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Subject deleted - silently reload without notification
                
                // Clear state if current subject was deleted
                if (this.currentSubject === subjectName) {
                    this.currentSubject = null;
                    this.currentPromptNumber = null;
                    this.saveState();
                    this.clearEditor();
                }
                
                await this.loadSubjects();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to delete subject:', error);
            this.showError('Failed to delete subject');
        }
    }
    
    // ==================== Prompt Operations ====================
    
    async loadPrompts(subjectName, retryCount = 0) {
        try {
            const response = await fetch(`/api/prompts/${encodeURIComponent(subjectName)}`);
            const data = await response.json();
            
            if (data.success) {
                this.prompts = data.prompts;
                this.renderPromptList(subjectName, data.prompts);
            } else {
                this.showError('Failed to load prompts: ' + data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to load prompts:', error);
            // Retry up to 5 times with increasing delay (for server reload scenarios)
            if (retryCount < 5) {
                const delay = 300 + (retryCount * 200); // 300ms, 500ms, 700ms, 900ms, 1100ms
                console.log(`[PromptManager] Retrying loadPrompts in ${delay}ms (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.loadPrompts(subjectName, retryCount + 1);
            }
        }
    }
    
    renderPromptList(subjectName, prompts) {
        const index = Array.from(document.querySelectorAll('.accordion-button'))
            .findIndex(btn => btn.dataset.subjectName === subjectName);
        
        if (index === -1) return;
        
        const promptList = document.getElementById(`prompts-${index}`);
        if (!promptList) return;
        
        promptList.innerHTML = '';
        
        if (prompts.length === 0) {
            promptList.innerHTML = '<li class="text-muted text-center py-2 small">No prompts yet</li>';
            return;
        }
        
        prompts.forEach(prompt => {
            const li = document.createElement('li');
            li.className = 'prompt-list-item';
            if (this.currentPromptNumber === prompt.number && this.currentSubject === subjectName) {
                li.classList.add('active');
            }
            
            li.innerHTML = `
                <span class="prompt-number">${prompt.number}.</span>
                <span class="prompt-preview">${prompt.preview}</span>
            `;
            
            li.addEventListener('click', async () => {
                await this.loadPrompt(subjectName, prompt.number);
            });
            
            promptList.appendChild(li);
        });
    }
    
    async loadPrompt(subjectName, promptNumber, retryCount = 0) {
        // Auto-save current prompt before switching
        if (this.unsavedChanges && this.currentSubject && this.currentPromptNumber) {
            await this.savePrompt(true); // Silent save
        }
        
        try {
            const response = await fetch(`/api/prompts/${encodeURIComponent(subjectName)}/${promptNumber}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentSubject = subjectName;
                this.currentPromptNumber = promptNumber;
                this.originalContent = data.content;
                this.unsavedChanges = false;
                this.saveState();
                
                // Clear undo history when switching prompts
                this.clearUndoHistory();
                this.initializeUndoHistory(data.content);
                
                // Update UI
                this.displayPromptContent(data.content);
                this.updatePromptCounter();
                this.updateButtonStates();
                this.highlightActivePrompt();
            } else {
                this.showError('Failed to load prompt: ' + data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to load prompt:', error);
            // Retry up to 5 times with increasing delay (for server reload scenarios)
            if (retryCount < 5) {
                const delay = 300 + (retryCount * 200); // 300ms, 500ms, 700ms, 900ms, 1100ms
                console.log(`[PromptManager] Retrying loadPrompt in ${delay}ms (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.loadPrompt(subjectName, promptNumber, retryCount + 1);
            }
        }
    }
    
    displayPromptContent(content) {
        const emptyState = document.getElementById('promptEmptyState');
        const rawEditor = document.getElementById('promptEditorRaw');
        const renderedEditor = document.getElementById('promptEditorRendered');
        
        emptyState.style.display = 'none';
        
        if (this.viewMode === 'raw') {
            rawEditor.value = content;
            rawEditor.style.display = 'block';
            renderedEditor.style.display = 'none';
        } else {
            // Also set raw editor value for when user switches to raw mode
            rawEditor.value = content;
            renderedEditor.innerHTML = this.renderMarkdown(content);
            renderedEditor.style.display = 'block';
            rawEditor.style.display = 'none';
        }
    }
    
    renderMarkdown(content) {
        if (typeof marked !== 'undefined') {
            // Use marked.js if available
            return marked.parse(content);
        } else {
            // Fallback: Simple markdown-like rendering
            let html = content
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                .replace(/\n$/gim, '<br />');
            
            return html;
        }
    }
    
    toggleViewMode(mode) {
        this.viewMode = mode;
        this.saveState();
        
        if (this.currentPromptNumber) {
            const rawEditor = document.getElementById('promptEditorRaw');
            const renderedEditor = document.getElementById('promptEditorRendered');
            const content = rawEditor.value;
            
            if (mode === 'raw') {
                rawEditor.style.display = 'block';
                renderedEditor.style.display = 'none';
            } else {
                renderedEditor.innerHTML = this.renderMarkdown(content);
                renderedEditor.style.display = 'block';
                rawEditor.style.display = 'none';
            }
        }
    }
    
    navigatePrompt(direction) {
        const currentIndex = this.prompts.findIndex(p => p.number === this.currentPromptNumber);
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.prompts.length) {
            this.loadPrompt(this.currentSubject, this.prompts[newIndex].number);
        }
    }
    
    updatePromptCounter() {
        const counter = document.getElementById('promptCounter');
        
        if (this.currentPromptNumber && this.prompts.length > 0) {
            const currentIndex = this.prompts.findIndex(p => p.number === this.currentPromptNumber);
            counter.textContent = `Prompt ${currentIndex + 1} of ${this.prompts.length}`;
            counter.className = 'badge bg-primary';
        } else {
            counter.textContent = 'No prompt selected';
            counter.className = 'badge bg-secondary';
        }
    }
    
    updateButtonStates() {
        const hasPrompt = this.currentPromptNumber !== null;
        const currentIndex = this.prompts.findIndex(p => p.number === this.currentPromptNumber);
        
        document.getElementById('copyPromptBtn').disabled = !hasPrompt;
        document.getElementById('deletePromptBtn').disabled = !hasPrompt;
        document.getElementById('moveUpBtn').disabled = !hasPrompt || currentIndex === 0;
        document.getElementById('moveDownBtn').disabled = !hasPrompt || currentIndex === this.prompts.length - 1;
        document.getElementById('prevPromptBtn').disabled = !hasPrompt || currentIndex === 0;
        document.getElementById('nextPromptBtn').disabled = !hasPrompt || currentIndex === this.prompts.length - 1;
        document.getElementById('newPromptBtn').disabled = !this.currentSubject;
    }
    
    highlightActivePrompt() {
        // Remove active class from all
        document.querySelectorAll('.prompt-list-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current
        if (this.currentPromptNumber) {
            const activeItems = Array.from(document.querySelectorAll('.prompt-list-item'))
                .filter(item => {
                    const numberText = item.querySelector('.prompt-number').textContent;
                    return parseInt(numberText) === this.currentPromptNumber;
                });
            
            activeItems.forEach(item => item.classList.add('active'));
        }
    }
    
    async createPromptInSubject(subjectName) {
        await this.createPrompt(subjectName);
    }
    
    async createPromptInCurrentSubject() {
        if (!this.currentSubject) {
            this.showError('Please select a subject first');
            return;
        }
        await this.createPrompt(this.currentSubject);
    }
    
    async createPrompt(subjectName) {
        try {
            const response = await fetch(`/api/prompts/${encodeURIComponent(subjectName)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: '# New Prompt\n\nEdit your prompt here...' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Prompt created - silently load without notification
                await this.loadPrompts(subjectName);
                await this.loadPrompt(subjectName, data.number);
                await this.loadSubjects(); // Refresh subject count
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to create prompt:', error);
            this.showError('Failed to create prompt');
        }
    }
    
    async savePrompt(silent = false) {
        if (!this.currentSubject || !this.currentPromptNumber) {
            if (!silent) {
                this.showError('No prompt selected');
            }
            return;
        }
        
        const content = document.getElementById('promptEditorRaw').value;
        
        // Show spinner
        this.showSavingSpinner();
        
        try {
            const response = await fetch(
                `/api/prompts/${encodeURIComponent(this.currentSubject)}/${this.currentPromptNumber}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                }
            );
            
            const data = await response.json();
            
            if (data.success) {
                if (!silent) {
                    this.showSuccess('Prompt saved successfully');
                }
                this.originalContent = content;
                this.unsavedChanges = false;
                document.getElementById('promptEditorContainer').classList.remove('has-changes');
                
                // Reload prompts to update preview (silent)
                await this.loadPrompts(this.currentSubject);
            } else {
                if (!silent) {
                    this.showError(data.error);
                }
            }
        } catch (error) {
            console.error('[PromptManager] Failed to save prompt:', error);
            if (!silent) {
                this.showError('Failed to save prompt');
            }
        } finally {
            // Hide spinner after a short delay for visual feedback
            setTimeout(() => {
                this.hideSavingSpinner();
            }, 300);
        }
    }
    
    confirmDeletePrompt() {
        document.getElementById('deleteConfirmMessage').textContent = 
            `Are you sure you want to delete Prompt ${this.currentPromptNumber}?`;
        
        this.deleteCallback = async () => {
            await this.deletePrompt();
        };
        
        this.deleteConfirmModal.show();
    }
    
    async deleteCurrentPrompt() {
        if (!this.currentSubject || !this.currentPromptNumber) {
            return;
        }
        
        this.confirmDeletePrompt();
    }
    
    async deletePrompt() {
        try {
            const response = await fetch(
                `/api/prompts/${encodeURIComponent(this.currentSubject)}/${this.currentPromptNumber}`,
                { method: 'DELETE' }
            );
            
            const data = await response.json();
            
            if (data.success) {
                // Prompt deleted - silently reload without notification
                
                // Load previous prompt or clear editor
                const prevNumber = this.currentPromptNumber - 1;
                this.currentPromptNumber = null;
                
                await this.loadPrompts(this.currentSubject);
                await this.loadSubjects(); // Refresh subject count
                
                if (this.prompts.length > 0) {
                    const nextPrompt = this.prompts.find(p => p.number === prevNumber) || this.prompts[0];
                    await this.loadPrompt(this.currentSubject, nextPrompt.number);
                } else {
                    this.clearEditor();
                }
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to delete prompt:', error);
            this.showError('Failed to delete prompt');
        }
    }
    
    async movePrompt(direction) {
        if (!this.currentSubject || !this.currentPromptNumber) {
            return;
        }
        
        const currentIndex = this.prompts.findIndex(p => p.number === this.currentPromptNumber);
        const newPosition = currentIndex + 1 + direction; // API uses 1-based indexing
        
        if (newPosition < 1 || newPosition > this.prompts.length) {
            return;
        }
        
        try {
            const response = await fetch(
                `/api/prompts/${encodeURIComponent(this.currentSubject)}/reorder`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        old_position: currentIndex + 1,
                        new_position: newPosition
                    })
                }
            );
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Prompt reordered');
                await this.loadPrompts(this.currentSubject);
                // Current prompt number stays the same but is now at new position
                this.highlightActivePrompt();
                this.updateButtonStates();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('[PromptManager] Failed to reorder prompt:', error);
            this.showError('Failed to reorder prompt');
        }
    }
    
    // ==================== Utility Methods ====================
    
    async copyToClipboard() {
        const content = this.viewMode === 'raw'
            ? document.getElementById('promptEditorRaw').value
            : this.originalContent;
        
        try {
            await navigator.clipboard.writeText(content);
            
            // Visual feedback only (no browser notification)
            const btn = document.getElementById('copyPromptBtn');
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.classList.remove('copied');
            }, 2000);
        } catch (error) {
            console.error('[PromptManager] Failed to copy to clipboard:', error);
            this.showError('Failed to copy to clipboard');
        }
    }
    
    // ==================== Auto-Save & Undo/Redo ====================
    
    handleEditorChange() {
        const content = document.getElementById('promptEditorRaw').value;
        
        // Add to undo history
        this.addToUndoHistory(content);
        
        // Mark as unsaved
        this.markAsUnsaved();
        
        // Schedule auto-save
        this.scheduleAutoSave();
    }
    
    scheduleAutoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Schedule new auto-save
        this.autoSaveTimeout = setTimeout(async () => {
            if (this.unsavedChanges) {
                console.log('[PromptManager] Auto-saving...');
                await this.savePrompt(true); // Silent save
            }
        }, this.autoSaveDelay);
    }
    
    initializeUndoHistory(content) {
        this.undoHistory = [content];
        this.undoIndex = 0;
    }
    
    clearUndoHistory() {
        this.undoHistory = [];
        this.undoIndex = -1;
    }
    
    addToUndoHistory(content) {
        // Don't add if content hasn't changed
        if (this.undoHistory.length > 0 && this.undoHistory[this.undoIndex] === content) {
            return;
        }
        
        // Remove any redo history
        this.undoHistory = this.undoHistory.slice(0, this.undoIndex + 1);
        
        // Add new state
        this.undoHistory.push(content);
        this.undoIndex++;
        
        // Limit history size
        if (this.undoHistory.length > this.maxUndoHistory) {
            this.undoHistory.shift();
            this.undoIndex--;
        }
    }
    
    undo() {
        if (this.undoIndex > 0) {
            this.isUndoing = true;
            this.undoIndex--;
            const content = this.undoHistory[this.undoIndex];
            document.getElementById('promptEditorRaw').value = content;
            
            // Update rendered view if active
            if (this.viewMode === 'rendered') {
                document.getElementById('promptEditorRendered').innerHTML = this.renderMarkdown(content);
            }
            
            // Mark as unsaved and schedule auto-save
            this.markAsUnsaved();
            this.scheduleAutoSave();
            
            this.isUndoing = false;
            console.log(`[PromptManager] Undo: ${this.undoIndex + 1}/${this.undoHistory.length}`);
        }
    }
    
    redo() {
        if (this.undoIndex < this.undoHistory.length - 1) {
            this.isUndoing = true;
            this.undoIndex++;
            const content = this.undoHistory[this.undoIndex];
            document.getElementById('promptEditorRaw').value = content;
            
            // Update rendered view if active
            if (this.viewMode === 'rendered') {
                document.getElementById('promptEditorRendered').innerHTML = this.renderMarkdown(content);
            }
            
            // Mark as unsaved and schedule auto-save
            this.markAsUnsaved();
            this.scheduleAutoSave();
            
            this.isUndoing = false;
            console.log(`[PromptManager] Redo: ${this.undoIndex + 1}/${this.undoHistory.length}`);
        }
    }
    
    // ==================== Helper Methods ====================
    
    showSavingSpinner() {
        const spinner = document.getElementById('autoSaveSpinner');
        spinner.style.display = 'inline-block';
        // Force reflow before adding class for transition
        void spinner.offsetWidth;
        spinner.classList.add('saving');
    }
    
    hideSavingSpinner() {
        const spinner = document.getElementById('autoSaveSpinner');
        spinner.classList.remove('saving');
        // Hide after fade out transition completes
        setTimeout(() => {
            spinner.style.display = 'none';
        }, 300);
    }
    
    markAsUnsaved() {
        this.unsavedChanges = true;
        document.getElementById('promptEditorContainer').classList.add('has-changes');
    }
    
    clearEditor() {
        document.getElementById('promptEmptyState').style.display = 'flex';
        document.getElementById('promptEditorRaw').style.display = 'none';
        document.getElementById('promptEditorRendered').style.display = 'none';
        this.updatePromptCounter();
        this.updateButtonStates();
    }
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    showError(message) {
        this.showToast(message, 'danger');
    }
    
    showToast(message, type = 'info') {
        // Reuse existing toast system if available
        if (typeof showStatusMessage === 'function') {
            showStatusMessage(message, type);
        } else {
            console.log(`[PromptManager] ${type.toUpperCase()}: ${message}`);
            alert(message);
        }
    }
}

// Initialize on page load
let promptManager;
document.addEventListener('DOMContentLoaded', () => {
    promptManager = new PromptManager();
});
