/**
 * Demo Adapter for Anki Automation Showcase
 * 
 * This script intercepts API calls and returns static data to simulate
 * the application behavior without a backend.
 */

(function() {
    console.log('Initializing Demo Adapter...');

    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch
    window.fetch = async function(url, options) {
        console.log(`[Demo Adapter] Intercepting request to: ${url}`);
        
        // Normalize URL to check endpoint
        // Handles both "/api/..." and "http://.../api/..."
        const urlString = url.toString();
        const endpoint = urlString.startsWith('http') ? new URL(urlString).pathname : urlString;
        
        // Helper to return JSON response
        const jsonResponse = (data) => {
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        // Helper to return 404
        const notFoundResponse = () => {
            return new Response(JSON.stringify({ success: false, error: 'Not found in demo mode' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        // --- API Route Handling ---

        // 1. Validation
        if (endpoint === '/api/validate') {
            return jsonResponse(window.DEMO_DATA.validate);
        }

        // 2. Preview
        if (endpoint === '/api/preview') {
            // Parse body to get card_index
            let body = {};
            if (options && options.body) {
                body = JSON.parse(options.body);
            }
            const index = body.card_index || 0;
            
            const data = window.DEMO_DATA.preview[index.toString()];
            if (data) {
                return jsonResponse(data);
            } else {
                console.error(`Failed to load preview for index ${index}`);
                return notFoundResponse();
            }
        }

        // 3. Parse (used before import)
        if (endpoint === '/api/parse') {
            return jsonResponse(window.DEMO_DATA.parse);
        }

        // 4. Subjects List
        if (endpoint === '/api/prompts/subjects') {
            return jsonResponse(window.DEMO_DATA.subjects);
        }

        // 5. Prompts List OR Single Prompt Content
        // Route: /api/prompts/{subject} OR /api/prompts/{subject}/{number}
        if (endpoint.startsWith('/api/prompts/')) {
            // Remove prefix
            const path = endpoint.replace('/api/prompts/', '');
            const parts = path.split('/');
            
            // Case A: List prompts for subject (e.g. "Economics" or "list?subject=Economics")
            if (parts.length === 1 || (parts.length === 2 && parts[1] === '')) {
                let subject = parts[0];
                
                // Handle query param style if present (legacy/alternative)
                if (subject.startsWith('list')) {
                    const match = urlString.match(/[?&]subject=([^&]+)/);
                    subject = match ? match[1] : null;
                }
                
                if (subject) {
                    const decodedSubject = decodeURIComponent(subject);
                    // We need to find the folder name from the subject name or vice versa
                    // In data.js, keys are folder names. 
                    // Let's try direct lookup first
                    let data = window.DEMO_DATA.prompts[decodedSubject];
                    
                    // If not found, try to find by matching name in subjects list
                    if (!data) {
                        const subjectObj = window.DEMO_DATA.subjects.subjects.find(s => s.name === decodedSubject || s.folder_name === decodedSubject);
                        if (subjectObj) {
                            data = window.DEMO_DATA.prompts[subjectObj.folder_name];
                        }
                    }

                    if (data) {
                        return jsonResponse(data);
                    }
                }
            }
            
            // Case B: Single Prompt Content (e.g. "Economics/1")
            if (parts.length === 2 && parts[1] !== '') {
                const subject = decodeURIComponent(parts[0]);
                const number = parts[1];
                
                // Find folder name
                let folderName = subject;
                const subjectObj = window.DEMO_DATA.subjects.subjects.find(s => s.name === subject || s.folder_name === subject);
                if (subjectObj) {
                    folderName = subjectObj.folder_name;
                }
                
                if (window.DEMO_DATA.prompt_content[folderName] && 
                    window.DEMO_DATA.prompt_content[folderName][number]) {
                    return jsonResponse(window.DEMO_DATA.prompt_content[folderName][number]);
                }
            }
            
            console.error(`Failed to handle prompt request: ${endpoint}`);
            return notFoundResponse();
        }

        // 6. Import (Disable)
        if (endpoint === '/api/import') {
            // Simulate a delay then return error or success mock
            await new Promise(r => setTimeout(r, 1000));
            return jsonResponse({
                success: false,
                error: "Import functionality is disabled in this demo showcase."
            });
        }
        
        // 7. Health Check
        if (endpoint === '/api/health') {
            return jsonResponse({ status: 'healthy', mode: 'demo' });
        }

        // Fallback to original fetch for static assets (css, js, etc.)
        // Ensure we don't loop if originalFetch fails
        try {
            return await originalFetch(url, options);
        } catch (error) {
            console.error(`[Demo Adapter] Original fetch failed for ${url}:`, error);
            throw error;
        }
    };

    // Removed fetchJson helper as it is no longer needed
    
    // --- UI Modifications ---

    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Demo Adapter] Applying UI modifications...');

        // 1. Add Demo Banner
        const banner = document.createElement('div');
        banner.className = 'alert alert-info text-center mb-0 rounded-0';
        banner.innerHTML = '<strong>Demo Mode:</strong> This is a static showcase. Backend functionality (Import, Save, AI Generation) is simulated or disabled.';
        document.body.prepend(banner);

        // 2. Disable Editor (Make Read-Only)
        // We need to wait for CodeMirror to initialize. It's usually attached to the textarea.
        // The editor instance is often global 'editor' variable in this app based on editor.html
        
        const checkEditor = setInterval(() => {
            if (window.editor) {
                clearInterval(checkEditor);
                console.log('[Demo Adapter] Setting editor to read-only');
                window.editor.setOption('readOnly', true);
                
                // Add a visual cue
                const wrapper = window.editor.getWrapperElement();
                wrapper.style.opacity = '0.9';
                wrapper.title = "Editor is read-only in demo mode";
            }
        }, 500);

        // 3. Disable/Modify Buttons
        const disableButton = (id, message) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    // Allow default for some, but maybe show alert?
                    // For import, we let the API mock handle it.
                    // For others like 'Clear', we might want to block it to keep the demo state.
                    if (id === 'clearBtn') {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                        alert('Clearing is disabled in demo mode to preserve the showcase.');
                    }
                }, true); // Capture phase
            }
        };

        disableButton('clearBtn');
        
        // Disable Prompt Manager editing features
        // We can hide the "New Subject" button and "New Prompt" buttons via CSS or JS
        const style = document.createElement('style');
        style.textContent = `
            #newSubjectBtn, #newPromptBtn, .delete-subject-btn, .delete-prompt-btn, .edit-prompt-btn {
                display: none !important;
            }
            .save-prompt-btn {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

    });

})();
