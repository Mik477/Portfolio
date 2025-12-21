/**
 * History Dropdown Component
 * Manages import history display and interaction
 */

class HistoryDropdown {
    constructor(containerId, editor) {
        this.container = document.getElementById(containerId);
        this.editor = editor;
        this.isOpen = false;
        this.currentSort = 'date'; // 'date' or 'deck'
        this.currentOrder = 'desc'; // 'asc' or 'desc'
        this.historyData = [];
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
        this.loadHistory();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="history-dropdown-container">
                <button class="history-toggle-btn" id="historyToggleBtn">
                    <i class="bi bi-clock-history"></i>
                    <span>History</span>
                    <i class="bi bi-chevron-down chevron"></i>
                </button>
                
                <div class="history-dropdown" id="historyDropdown">
                    <div class="history-dropdown-header">
                        <h6>
                            <i class="bi bi-archive"></i>
                            Import History
                        </h6>
                        <div class="history-controls">
                            <button class="history-filter-btn" id="filterByDeck" data-filter="deck">
                                <i class="bi bi-folder"></i>
                                Deck
                            </button>
                            <button class="history-filter-btn active" id="filterByDate" data-filter="date">
                                <i class="bi bi-calendar"></i>
                                Date
                            </button>
                            <button class="history-sort-btn" id="sortOrderBtn" title="Toggle sort order">
                                <i class="bi bi-sort-down"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="history-list-container" id="historyListContainer">
                        <ul class="history-list" id="historyList">
                            <li class="history-empty">
                                <i class="bi bi-inbox"></i>
                                <p>No import history yet</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        const toggleBtn = document.getElementById('historyToggleBtn');
        const dropdown = document.getElementById('historyDropdown');
        const filterByDeck = document.getElementById('filterByDeck');
        const filterByDate = document.getElementById('filterByDate');
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        
        // Toggle dropdown
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });
        
        // Filter buttons
        filterByDeck.addEventListener('click', () => {
            this.setFilter('deck');
        });
        
        filterByDate.addEventListener('click', () => {
            this.setFilter('date');
        });
        
        // Sort order toggle
        sortOrderBtn.addEventListener('click', () => {
            this.toggleSortOrder();
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        const dropdown = document.getElementById('historyDropdown');
        const toggleBtn = document.getElementById('historyToggleBtn');
        
        dropdown.classList.add('show');
        toggleBtn.classList.add('active');
        this.isOpen = true;
        
        // Refresh data when opening
        this.loadHistory();
    }
    
    close() {
        const dropdown = document.getElementById('historyDropdown');
        const toggleBtn = document.getElementById('historyToggleBtn');
        
        dropdown.classList.remove('show');
        toggleBtn.classList.remove('active');
        this.isOpen = false;
    }
    
    setFilter(filter) {
        this.currentSort = filter;
        
        // Update button states
        const deckBtn = document.getElementById('filterByDeck');
        const dateBtn = document.getElementById('filterByDate');
        
        if (filter === 'deck') {
            deckBtn.classList.add('active');
            dateBtn.classList.remove('active');
        } else {
            dateBtn.classList.add('active');
            deckBtn.classList.remove('active');
        }
        
        // Reload with new sort
        this.loadHistory();
    }
    
    toggleSortOrder() {
        this.currentOrder = this.currentOrder === 'desc' ? 'asc' : 'desc';
        
        // Update icon
        const sortBtn = document.getElementById('sortOrderBtn');
        const icon = sortBtn.querySelector('i');
        
        if (this.currentOrder === 'asc') {
            icon.className = 'bi bi-sort-up';
        } else {
            icon.className = 'bi bi-sort-down';
        }
        
        // Reload with new order
        this.loadHistory();
    }
    
    async loadHistory() {
        try {
            const response = await fetch(`/api/history?sort_by=${this.currentSort}&order=${this.currentOrder}`);
            
            if (!response.ok) {
                throw new Error('Failed to load history');
            }
            
            this.historyData = await response.json();
            this.renderHistoryList();
            
        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Failed to load history');
        }
    }
    
    renderHistoryList() {
        const listContainer = document.getElementById('historyList');
        
        if (!this.historyData || this.historyData.length === 0) {
            listContainer.innerHTML = `
                <li class="history-empty">
                    <i class="bi bi-inbox"></i>
                    <p>No import history yet</p>
                </li>
            `;
            return;
        }
        
        listContainer.innerHTML = this.historyData.map(item => `
            <li class="history-item" data-filename="${item.filename}">
                <span class="history-item-name" title="${item.deck_name}">
                    <i class="bi bi-folder"></i> ${item.deck_name}
                </span>
                <span class="history-item-date">
                    <i class="bi bi-clock"></i> ${item.date_display}
                </span>
            </li>
        `).join('');
        
        // Attach click handlers
        listContainer.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.dataset.filename;
                this.loadHistoryFile(filename);
            });
        });
    }
    
    async loadHistoryFile(filename) {
        try {
            const response = await fetch(`/api/history/${filename}`);
            
            if (!response.ok) {
                throw new Error('Failed to load history file');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Load content into editor
                this.editor.setValue(result.content);
                
                // Show success notification
                this.showNotification(`Loaded: ${filename}`, 'success');
                
                // Close dropdown
                this.close();
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Error loading history file:', error);
            this.showNotification('Failed to load history file', 'danger');
        }
    }
    
    showNotification(message, type = 'info') {
        // Use the existing showStatus function if available
        if (typeof showStatus === 'function') {
            showStatus(message, type, 3000);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    showError(message) {
        const listContainer = document.getElementById('historyList');
        listContainer.innerHTML = `
            <li class="history-empty">
                <i class="bi bi-exclamation-triangle"></i>
                <p>${message}</p>
            </li>
        `;
    }
}

// Export for use in editor.html
window.HistoryDropdown = HistoryDropdown;
