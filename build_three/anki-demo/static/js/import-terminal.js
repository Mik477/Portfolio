/**
 * Import Terminal Component
 * Terminal-style log viewer with real-time streaming support
 */

class ImportTerminal {
    constructor() {
        this.overlay = null;
        this.terminal = null;
        this.body = null;
        this.isProcessing = false;
        this.eventSource = null;
        this.stats = {
            added: 0,
            updated: 0,
            failed: 0,
            skipped: 0
        };
        
        this.init();
    }
    
    init() {
        // Check if terminal already exists (prevent duplicates)
        const existingOverlay = document.getElementById('importTerminalOverlay');
        if (existingOverlay) {
            console.log('[ImportTerminal] Terminal already exists, removing old one');
            existingOverlay.remove();
        }
        
        // Create terminal HTML
        const terminalHTML = `
            <div class="import-terminal-overlay" id="importTerminalOverlay">
                <div class="import-terminal" id="importTerminal">
                    <div class="import-terminal-header">
                        <div class="import-terminal-title">
                            <i class="bi bi-terminal"></i>
                            Import Log
                        </div>
                        <div class="import-terminal-buttons">
                            <button class="terminal-btn terminal-btn-close" id="terminalCloseBtn" title="Close"></button>
                        </div>
                    </div>
                    
                    <div class="import-terminal-body" id="importTerminalBody">
                        <!-- Log entries will be added here -->
                    </div>
                    
                    <div class="import-terminal-footer">
                        <div class="import-terminal-stats">
                            <div class="terminal-stat">
                                <span class="terminal-stat-label">Added:</span>
                                <span class="terminal-stat-value added" id="termStatAdded">0</span>
                            </div>
                            <div class="terminal-stat">
                                <span class="terminal-stat-label">Updated:</span>
                                <span class="terminal-stat-value updated" id="termStatUpdated">0</span>
                            </div>
                            <div class="terminal-stat">
                                <span class="terminal-stat-label">Failed:</span>
                                <span class="terminal-stat-value failed" id="termStatFailed">0</span>
                            </div>
                            <div class="terminal-stat">
                                <span class="terminal-stat-label">Skipped:</span>
                                <span class="terminal-stat-value skipped" id="termStatSkipped">0</span>
                            </div>
                        </div>
                        <div class="import-terminal-status">
                            <div class="status-indicator processing" id="terminalStatusIndicator"></div>
                            <span id="terminalStatusText">Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Append to body
        document.body.insertAdjacentHTML('beforeend', terminalHTML);
        
        // Get references
        this.overlay = document.getElementById('importTerminalOverlay');
        this.terminal = document.getElementById('importTerminal');
        this.body = document.getElementById('importTerminalBody');
        
        // Attach event listeners
        document.getElementById('terminalCloseBtn').addEventListener('click', () => {
            if (!this.isProcessing) {
                this.hide();
            }
        });
        
        // Close on overlay click (only if not processing)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && !this.isProcessing) {
                this.hide();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('show') && !this.isProcessing) {
                this.hide();
            }
        });
    }
    
    show() {
        console.log('[ImportTerminal] show() called');
        
        // Remove any duplicate terminal overlays that might exist
        const allOverlays = document.querySelectorAll('.import-terminal-overlay');
        console.log('[ImportTerminal] Found', allOverlays.length, 'terminal overlay(s)');
        if (allOverlays.length > 1) {
            // Keep only the last one (ours), remove others
            for (let i = 0; i < allOverlays.length - 1; i++) {
                console.log('[ImportTerminal] Removing duplicate overlay', i);
                allOverlays[i].remove();
            }
        }
        
        // Re-fetch references in case DOM changed
        this.overlay = document.getElementById('importTerminalOverlay');
        this.body = document.getElementById('importTerminalBody');
        
        console.log('[ImportTerminal] Body element before clear:', this.body);
        console.log('[ImportTerminal] Body innerHTML length before clear:', this.body ? this.body.innerHTML.length : 'N/A');
        console.log('[ImportTerminal] Body innerHTML CONTENT:', this.body ? this.body.innerHTML.substring(0, 500) : 'N/A');
        console.log('[ImportTerminal] Body childNodes count:', this.body ? this.body.childNodes.length : 'N/A');
        
        // Log each child node type
        if (this.body) {
            Array.from(this.body.childNodes).forEach((node, i) => {
                console.log(`[ImportTerminal] ChildNode[${i}]: type=${node.nodeType}, name=${node.nodeName}`);
            });
        }
        
        // Clear ALL previous content completely before showing
        this.clearTerminal();
        
        console.log('[ImportTerminal] Body innerHTML length after clear:', this.body ? this.body.innerHTML.length : 'N/A');
        
        // Reset status
        this.setStatus('processing', 'Initializing...');
        this.isProcessing = true;
        
        // Show overlay
        this.overlay.classList.add('show');
        console.log('[ImportTerminal] Terminal shown');
    }
    
    hide() {
        console.log('[ImportTerminal] hide() called');
        this.overlay.classList.remove('show');
        
        // Close EventSource if open
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        
        // Clear terminal content when hiding to ensure fresh state next time
        this.clearTerminal();
        console.log('[ImportTerminal] Terminal hidden and cleared');
    }
    
    /**
     * Completely clear the terminal content and reset all state
     */
    clearTerminal() {
        console.log('[ImportTerminal] clearTerminal() called');
        
        // Re-fetch the body element to ensure we have the current reference
        const terminalBody = document.getElementById('importTerminalBody');
        console.log('[ImportTerminal] Found terminalBody element:', terminalBody);
        console.log('[ImportTerminal] terminalBody children count:', terminalBody ? terminalBody.children.length : 'N/A');
        
        if (terminalBody) {
            // Remove all child elements
            const childCount = terminalBody.children.length;
            while (terminalBody.firstChild) {
                terminalBody.removeChild(terminalBody.firstChild);
            }
            console.log('[ImportTerminal] Removed', childCount, 'children');
            
            // Also set innerHTML to empty as backup
            terminalBody.innerHTML = '';
            console.log('[ImportTerminal] Set innerHTML to empty');
            
            // Update the reference
            this.body = terminalBody;
            // Scroll to top
            this.body.scrollTop = 0;
        } else {
            console.error('[ImportTerminal] ERROR: Could not find importTerminalBody element!');
        }
        
        // Reset stats
        this.stats = { added: 0, updated: 0, failed: 0, skipped: 0 };
        this.updateStats();
        console.log('[ImportTerminal] Stats reset');
    }
    
    setStatus(status, text) {
        const indicator = document.getElementById('terminalStatusIndicator');
        const statusText = document.getElementById('terminalStatusText');
        
        indicator.className = 'status-indicator ' + status;
        statusText.textContent = text;
    }
    
    updateStats() {
        document.getElementById('termStatAdded').textContent = this.stats.added;
        document.getElementById('termStatUpdated').textContent = this.stats.updated;
        document.getElementById('termStatFailed').textContent = this.stats.failed;
        document.getElementById('termStatSkipped').textContent = this.stats.skipped;
    }
    
    addLogEntry(entry) {
        const div = document.createElement('div');
        div.className = `log-entry ${entry.level}`;
        
        if (entry.indent > 0) {
            div.classList.add(`indent-${Math.min(entry.indent, 4)}`);
        }
        
        div.textContent = entry.message;
        
        this.body.appendChild(div);
        
        // Auto-scroll to bottom
        this.body.scrollTop = this.body.scrollHeight;
    }
    
    addRawLine(text, level = 'info') {
        this.addLogEntry({
            level: level,
            message: text,
            indent: 0
        });
    }
    
    /**
     * Start streaming import with real-time log output
     * @param {string} yamlContent - The YAML content to import
     * @param {string|null} deckName - Optional deck name override
     * @returns {Promise<object>} - Import result
     */
    async startImport(yamlContent, deckName = null) {
        this.show();
        
        try {
            // Start the streaming import
            const response = await fetch('/api/import/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    yaml_content: yamlContent,
                    deck_name: deckName
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let result = null;
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete SSE messages
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ''; // Keep incomplete message in buffer
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        try {
                            const data = JSON.parse(jsonStr);
                            
                            if (data.type === 'log') {
                                this.addLogEntry(data.entry);
                                
                                // Update stats based on log content
                                this.parseLogForStats(data.entry);
                            } else if (data.type === 'result') {
                                result = data.result;
                                this.stats = {
                                    added: result.added || 0,
                                    updated: result.updated || 0,
                                    failed: result.failed || 0,
                                    skipped: result.skipped || 0
                                };
                                this.updateStats();
                            } else if (data.type === 'complete') {
                                // Import complete
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
            
            // Mark as complete
            this.isProcessing = false;
            
            // Check for errors - both failed count and errors array
            const hasErrors = result && (
                result.failed > 0 || 
                (result.errors && result.errors.length > 0) ||
                (result.successful === 0 && result.added === 0 && result.updated === 0)
            );
            
            if (result && !hasErrors && (result.added > 0 || result.updated > 0)) {
                this.setStatus('complete', 'Import completed successfully');
            } else if (hasErrors) {
                const errorCount = result.failed || (result.errors ? result.errors.length : 0);
                this.setStatus('error', `Import failed with ${errorCount} error(s)`);
            } else if (result && result.skipped > 0 && result.added === 0) {
                this.setStatus('complete', `All ${result.skipped} cards already exist (skipped)`);
            } else {
                this.setStatus('error', 'Import failed');
            }
            
            return result;
            
        } catch (error) {
            this.isProcessing = false;
            this.setStatus('error', 'Import failed');
            this.addRawLine(`Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Parse log entries to update stats in real-time
     */
    parseLogForStats(entry) {
        const msg = entry.message;
        
        // Check for real-time updates from individual card processing
        if (msg.includes('✓') && msg.includes('Added (ID:')) {
            this.stats.added++;
            this.updateStats();
        } else if (msg.includes('→ Updating existing note')) {
            this.stats.updated++;
            this.updateStats();
        } else if (msg.includes('→ Skipped')) {
            this.stats.skipped++;
            this.updateStats();
        } else if (msg.includes('✗') && (msg.includes('Failed') || msg.includes('Error') || msg.includes('Duplicate'))) {
            this.stats.failed++;
            this.updateStats();
        }
    }
}

// Create global instance
const importTerminal = new ImportTerminal();

// Export for use in other scripts
window.importTerminal = importTerminal;
