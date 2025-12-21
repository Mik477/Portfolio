/**
 * Import Progress Modal Component
 * Provides real-time visual feedback during card import process
 */

class ImportProgressModal {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.totalCards = 0;
        this.processedCards = 0;
        this.stats = {
            added: 0,
            updated: 0,
            failed: 0,
            skipped: 0
        };
        this.segments = [];
        
        this.init();
    }
    
    init() {
        // Create modal HTML
        const modalHTML = `
            <div class="import-progress-overlay" id="importProgressOverlay">
                <div class="import-progress-modal" id="importProgressModal">
                    <div class="import-progress-header">
                        <div class="import-progress-icon">
                            <i class="bi bi-upload"></i>
                        </div>
                        <div>
                            <h5 id="importProgressTitle">Importing Cards to Anki</h5>
                            <p id="importProgressSubtitle">Processing your cards...</p>
                        </div>
                    </div>
                    
                    <div class="import-progress-stats">
                        <div class="import-stat">
                            <div class="import-stat-value added" id="statAdded">0</div>
                            <div class="import-stat-label">Added</div>
                        </div>
                        <div class="import-stat">
                            <div class="import-stat-value updated" id="statUpdated">0</div>
                            <div class="import-stat-label">Updated</div>
                        </div>
                        <div class="import-stat">
                            <div class="import-stat-value failed" id="statFailed">0</div>
                            <div class="import-stat-label">Failed</div>
                        </div>
                    </div>
                    
                    <div class="import-current-card" id="currentCardInfo" style="display: none;">
                        <div class="import-current-card-label">Currently Processing</div>
                        <div class="import-current-card-text" id="currentCardText">-</div>
                    </div>
                    
                    <div class="import-progress-bar-container">
                        <div class="import-progress-label">
                            <span class="import-progress-label-text">Progress</span>
                            <span class="import-progress-label-count" id="progressCount">0 / 0</span>
                        </div>
                        <div class="import-progress-bar" id="importProgressBar">
                            <!-- Segments will be dynamically added here -->
                        </div>
                    </div>
                    
                    <button class="import-progress-close" id="importProgressCloseBtn" disabled>
                        <i class="bi bi-x-circle"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get references
        this.overlay = document.getElementById('importProgressOverlay');
        this.modal = document.getElementById('importProgressModal');
        
        // Attach close button listener
        document.getElementById('importProgressCloseBtn').addEventListener('click', () => {
            this.hide();
        });
    }
    
    show(totalCards) {
        this.totalCards = totalCards;
        this.processedCards = 0;
        this.stats = { added: 0, updated: 0, failed: 0, skipped: 0 };
        
        // Reset modal state
        this.modal.classList.remove('completed', 'error');
        document.getElementById('importProgressTitle').textContent = 'Importing Cards to Anki';
        document.getElementById('importProgressSubtitle').textContent = 'Processing your cards...';
        document.getElementById('importProgressCloseBtn').disabled = true;
        
        // Reset stats
        document.getElementById('statAdded').textContent = '0';
        document.getElementById('statUpdated').textContent = '0';
        document.getElementById('statFailed').textContent = '0';
        
        // Create segments
        this.createSegments(totalCards);
        
        // Update progress count
        document.getElementById('progressCount').textContent = `0 / ${totalCards}`;
        
        // Show overlay
        this.overlay.classList.add('show');
    }
    
    hide() {
        this.overlay.classList.remove('show');
    }
    
    createSegments(count) {
        const progressBar = document.getElementById('importProgressBar');
        progressBar.innerHTML = '';
        this.segments = [];
        
        for (let i = 0; i < count; i++) {
            const segment = document.createElement('div');
            segment.className = 'import-progress-segment pending';
            segment.dataset.index = i;
            progressBar.appendChild(segment);
            this.segments.push(segment);
        }
    }
    
    updateCard(index, status, cardPreview = '') {
        // Update segment
        if (index < this.segments.length) {
            const segment = this.segments[index];
            segment.classList.remove('pending');
            segment.classList.add(status); // 'added', 'updated', 'failed', or 'skipped'
        }
        
        // Update stats
        if (status === 'added') {
            this.stats.added++;
            document.getElementById('statAdded').textContent = this.stats.added;
        } else if (status === 'updated') {
            this.stats.updated++;
            document.getElementById('statUpdated').textContent = this.stats.updated;
        } else if (status === 'failed') {
            this.stats.failed++;
            document.getElementById('statFailed').textContent = this.stats.failed;
        } else if (status === 'skipped') {
            this.stats.skipped++;
            // Skipped counts as updated for display purposes
            this.stats.updated++;
            document.getElementById('statUpdated').textContent = this.stats.updated;
        }
        
        // Update processed count
        this.processedCards++;
        document.getElementById('progressCount').textContent = `${this.processedCards} / ${this.totalCards}`;
        
        // Show current card preview if provided
        if (cardPreview) {
            const currentCardInfo = document.getElementById('currentCardInfo');
            const currentCardText = document.getElementById('currentCardText');
            currentCardInfo.style.display = 'block';
            currentCardText.textContent = cardPreview;
        }
    }
    
    complete(success = true, message = '') {
        // Hide current card info
        document.getElementById('currentCardInfo').style.display = 'none';
        
        // Update modal state
        if (success) {
            this.modal.classList.add('completed');
            document.getElementById('importProgressTitle').textContent = 'Import Complete!';
            document.getElementById('importProgressSubtitle').textContent = 
                message || `Successfully processed ${this.processedCards} cards`;
        } else {
            this.modal.classList.add('error');
            document.getElementById('importProgressTitle').textContent = 'Import Failed';
            document.getElementById('importProgressSubtitle').textContent = 
                message || 'An error occurred during import';
        }
        
        // Enable close button
        document.getElementById('importProgressCloseBtn').disabled = false;
        document.getElementById('importProgressCloseBtn').textContent = 'Close';
    }
    
    error(message) {
        this.complete(false, message);
    }
}

// Export for use in editor.html
window.ImportProgressModal = ImportProgressModal;
