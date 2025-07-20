const fs = require('fs');
const path = require('path');

// Create dist/renderer directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist', 'renderer');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy utils.js
const utilsSource = path.join(__dirname, '..', 'src', 'renderer', 'utils.js');
const utilsDest = path.join(distDir, 'utils.js');
fs.copyFileSync(utilsSource, utilsDest);

// Create standalone note-quill.html
const noteQuillTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MemoPad Note</title>
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            user-select: none;
        }

        #root {
            width: 100%;
            height: 100vh;
        }

        /* Loading spinner */
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Quill editor custom styles */
        .ql-editor {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: inherit;
        }

        .ql-editor p {
            margin-bottom: 0.5em;
        }

        .ql-editor h1, .ql-editor h2, .ql-editor h3 {
            margin-top: 1em;
            margin-bottom: 0.5em;
        }

        .ql-editor ul, .ql-editor ol {
            margin-bottom: 0.5em;
        }

        .ql-editor blockquote {
            border-left: 4px solid rgba(255, 255, 255, 0.3);
            margin: 1em 0;
            padding-left: 1em;
            font-style: italic;
        }

        .ql-editor code {
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .ql-editor pre {
            background: rgba(0, 0, 0, 0.1);
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
            margin: 1em 0;
        }

        .ql-editor pre code {
            background: none;
            padding: 0;
        }

        /* Custom toolbar styles */
        .ql-toolbar {
            /* border: none !important; */
            /* background: rgba(0, 0, 0, 0.1) !important; */
            /* padding: 8px 15px !important; */
        }

        .ql-toolbar button {
            color: inherit !important;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        }

        .ql-toolbar button:hover {
            opacity: 1;
        }

        .ql-toolbar .ql-active {
            opacity: 1;
        }

        .ql-toolbar .ql-stroke {
            stroke: currentColor !important;
        }

        .ql-toolbar .ql-fill {
            fill: currentColor !important;
        }

        .ql-toolbar .ql-picker {
            color: inherit !important;
        }

        .ql-toolbar .ql-picker-options {
            background: rgba(0, 0, 0, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 4px !important;
        }

        .ql-toolbar .ql-picker-item {
            color: white !important;
        }

        .ql-toolbar .ql-picker-item:hover {
            background: rgba(255, 255, 255, 0.1) !important;
        }

        .ql-toolbar .ql-picker-label {
            color: inherit !important;
        }

        .ql-toolbar .ql-picker-label::before {
            color: inherit !important;
        }

        /* Container styles */
        .note-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }

        .note-title-bar {
            height: 25px;
            min-height: 25px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 8px;
            background-color: rgba(0, 0, 0, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            -webkit-app-region: drag;
            cursor: move;
        }

        .note-title {
            font-size: 11px;
            font-weight: 500;
            opacity: 0.8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            margin-right: 8px;
        }

        .note-actions {
            display: flex;
            gap: 8px;
            -webkit-app-region: no-drag;
        }

        .note-btn {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 10px;
            opacity: 0.7;
            transition: opacity 0.2s ease;
            min-width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .note-btn:hover {
            opacity: 1;
        }

        .settings-panel {
            position: absolute;
            top: 30px;
            right: 8px;
            background-color: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 15px;
            z-index: 1000;
            min-width: 200px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .settings-group {
            margin-bottom: 15px;
        }

        .settings-label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: white;
            opacity: 0.8;
        }

        .settings-input {
            width: 100%;
            height: 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .settings-range {
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.3);
            outline: none;
            cursor: pointer;
        }

        .settings-checkbox {
            display: flex;
            align-items: center;
            font-size: 12px;
            color: white;
            opacity: 0.8;
            cursor: pointer;
        }

        .settings-checkbox input {
            margin-right: 8px;
        }

        .editor-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .ql-container {
            flex: 1;
            border: none !important;
            font-size: 14px;
        }

        .ql-editor {
            padding: 15px !important;
            border: none !important;
            outline: none !important;
        }

        .ql-editor:focus {
            outline: none !important;
        }
    </style>
</head>
<body>
    <div id="root">
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: white;">
            <div class="spinner"></div>
            <span style="margin-left: 15px;">Loading note...</span>
        </div>
    </div>
    
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
    <script>
        // Utility function
        function getFirstLine(content) {
            if (!content || typeof content !== 'string') return 'New Note';
            
            // Remove HTML tags and get plain text
            const textContent = content.replace(/<[^>]*>/g, '').trim();
            
            if (!textContent) return 'New Note';
            
            // Get first line (up to first newline or 50 characters)
            const firstLine = textContent.split('\\n')[0];
            return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
        }

        // Simple note component using vanilla JS and Quill
        class SimpleNote {
            constructor() {
                this.currentNote = null;
                this.showSettings = false;
                this.isWindowFocused = false;
                this.backgroundColor = 'rgba(255, 235, 59, 1.0)';
                this.opacity = 1.0;
                this.alwaysOnTop = true;
                this.isCollapsed = false;
                this.quill = null;
                this.saveTimeout = null;
                this.lastContent = ''; // Store content when collapsing
                
                this.init();
            }
            
            async init() {
                try {
                    console.log('Initializing note...');
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    const noteId = urlParams.get('id');
                    console.log('Note ID from URL:', noteId);
                    
                    if (noteId) {
                        console.log('Loading existing note with ID:', noteId);
                        const notes = await window.electronAPI.getNotes();
                        const existingNote = notes.find(note => note.id === noteId);
                        
                        if (existingNote) {
                            console.log('Found existing note:', existingNote);
                            this.currentNote = existingNote;
                            this.backgroundColor = existingNote.backgroundColor;
                            this.opacity = existingNote.opacity;
                            this.alwaysOnTop = existingNote.alwaysOnTop;
                            this.isCollapsed = existingNote.isCollapsed;
                            // Store the content for later restoration
                            this.lastContent = existingNote.content || '';
                            console.log('Stored lastContent:', this.lastContent);
                        }
                    }
                    
                    this.render();
                    
                    // Only setup Quill if not collapsed
                    if (!this.isCollapsed) {
                        this.setupQuill();
                    }
                    
                    this.setupEventListeners();
                    
                    console.log('Note initialization complete');
                } catch (error) {
                    console.error('Error initializing note:', error);
                }
            }
            
            render() {
                const root = document.getElementById('root');
                const noteTitle = this.currentNote ? getFirstLine(this.currentNote.content) : 'New Note';
                
                root.innerHTML = \`
                    <div class="note-container" style="background-color: \${this.backgroundColor}">
                        <div class="note-title-bar" style="\${this.isCollapsed ? 'border-bottom: none;' : ''}">
                            <div class="note-title">\${noteTitle}</div>
                            <div class="note-actions">
                                <button class="note-btn" onclick="note.toggleCollapse()" title="\${this.isCollapsed ? 'Expand' : 'Collapse'}">
                                    \${this.isCollapsed ? '▼' : '▲'}
                                </button>
                                <button class="note-btn" onclick="note.toggleSettings()" title="Settings">⚙</button>
                                <button class="note-btn" onclick="note.closeNote()" title="Close">×</button>
                            </div>
                        </div>
                        
                        \${this.showSettings ? \`
                            <div class="settings-panel">
                                <div class="settings-group">
                                    <label class="settings-label">Background Color</label>
                                    <input type="color" class="settings-input" value="\${this.rgbaToHex(this.backgroundColor)}" 
                                           onchange="note.updateBackgroundColor(this.value)">
                                </div>
                                <div class="settings-group">
                                    <label class="settings-label">Opacity: \${Math.round(this.opacity * 100)}%</label>
                                    <input type="range" class="settings-range" min="0.5" max="1.0" step="0.1" 
                                           value="\${this.opacity}" onchange="note.updateOpacity(this.value)">
                                </div>
                                <div class="settings-group">
                                    <label class="settings-checkbox">
                                        <input type="checkbox" \${this.alwaysOnTop ? 'checked' : ''} 
                                               onchange="note.updateAlwaysOnTop(this.checked)">
                                        Always on Top
                                    </label>
                                </div>
                            </div>
                        \` : ''}
                        
                        <div class="editor-container" style="\${this.isCollapsed ? 'display: none;' : ''}">
                            <div id="editor"></div>
                        </div>
                    </div>
                \`;
            }
            
            setupQuill() {
                if (this.isCollapsed) return;
                
                console.log('Setting up Quill editor...');
                
                // Destroy existing quill instance if it exists
                if (this.quill) {
                    console.log('Destroying existing Quill instance');
                    this.quill = null;
                }
                
                // Clear the editor container
                const editorElement = document.getElementById('editor');
                if (editorElement) {
                    editorElement.innerHTML = '';
                }
                
                this.quill = new Quill('#editor', {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link'],
                            ['clean']
                        ]
                    }
                });
                
                // Restore content - prefer lastContent if available, then currentNote.content
                const contentToRestore = this.lastContent || (this.currentNote && this.currentNote.content) || '';
                console.log('Restoring content:', contentToRestore);
                console.log('lastContent:', this.lastContent);
                console.log('currentNote.content:', this.currentNote ? this.currentNote.content : 'no currentNote');
                
                if (contentToRestore) {
                    console.log('Setting Quill content to:', contentToRestore);
                    this.quill.root.innerHTML = contentToRestore;
                } else {
                    console.log('No content to restore');
                }
                
                this.quill.on('text-change', () => {
                    // Update lastContent when text changes
                    this.lastContent = this.quill.root.innerHTML;
                    this.debouncedSave();
                });
                
                console.log('Quill editor setup complete');
            }
            
            setupEventListeners() {
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.metaKey || e.ctrlKey) {
                        if (e.key === 'w') {
                            e.preventDefault();
                            this.closeNote();
                        } else if (e.key === ',') {
                            e.preventDefault();
                            this.toggleSettings();
                        }
                    }
                });
                
                // Window focus events
                window.addEventListener('focus', () => {
                    this.isWindowFocused = true;
                });
                
                window.addEventListener('blur', () => {
                    this.isWindowFocused = false;
                    this.showSettings = false;
                    this.render();
                    if (!this.isCollapsed) this.setupQuill();
                });
                
                // Collapse state listener
                if (window.electronAPI && window.electronAPI.onCollapseStateChange) {
                    window.electronAPI.onCollapseStateChange((noteId, isCollapsed) => {
                        if (this.currentNote && this.currentNote.id === noteId) {
                            console.log(\`Collapse state change: \${noteId} -> \${isCollapsed}\`);
                            
                            // Save current content before collapsing
                            if (this.quill && !isCollapsed) {
                                console.log('Saving content before collapsing');
                                this.lastContent = this.quill.root.innerHTML;
                            }
                            
                            this.isCollapsed = isCollapsed;
                            this.render();
                            
                            if (!isCollapsed) {
                                console.log('Expanding - setting up Quill editor...');
                                // Force a longer delay to ensure DOM is ready
                                setTimeout(() => {
                                    console.log('Setting up Quill after expansion');
                                    this.setupQuill();
                                }, 200);
                            } else {
                                console.log('Collapsing - clearing quill instance');
                                if (this.quill) {
                                    this.lastContent = this.quill.root.innerHTML;
                                    this.quill = null;
                                }
                            }
                        }
                    });
                }
            }
            
            debouncedSave() {
                if (this.saveTimeout) {
                    clearTimeout(this.saveTimeout);
                }
                this.saveTimeout = setTimeout(() => this.saveNote(), 500);
            }
            
            async saveNote() {
                if (!this.quill || !this.currentNote) return;
                
                const content = this.quill.root.innerHTML;
                console.log('Saving note content:', content);
                
                // Update lastContent
                this.lastContent = content;
                
                try {
                    await window.electronAPI.updateNote(this.currentNote.id, { content });
                    
                    // Update currentNote content
                    this.currentNote.content = content;
                    
                    // Update title
                    const newTitle = getFirstLine(content);
                    const titleElement = document.querySelector('.note-title');
                    if (titleElement) {
                        titleElement.textContent = newTitle;
                    }
                } catch (error) {
                    console.error('Error saving note:', error);
                }
            }
            
            toggleSettings() {
                // Save content before re-rendering
                if (this.quill && !this.isCollapsed) {
                    this.lastContent = this.quill.root.innerHTML;
                }
                
                this.showSettings = !this.showSettings;
                this.render();
                
                if (!this.isCollapsed) {
                    setTimeout(() => this.setupQuill(), 100);
                }
            }
            
            async toggleCollapse() {
                if (!this.currentNote) return;
                
                const newCollapsedState = !this.isCollapsed;
                console.log('Toggling collapse:', newCollapsedState);
                
                try {
                    await window.electronAPI.toggleWindowCollapse(this.currentNote.id, newCollapsedState);
                } catch (error) {
                    console.error('Error toggling collapse:', error);
                }
            }
            
            async updateBackgroundColor(hexColor) {
                const rgbaColor = this.hexToRgba(hexColor, this.opacity);
                this.backgroundColor = rgbaColor;
                
                document.querySelector('.note-container').style.backgroundColor = rgbaColor;
                
                if (this.currentNote) {
                    try {
                        await window.electronAPI.updateNote(this.currentNote.id, { backgroundColor: rgbaColor });
                    } catch (error) {
                        console.error('Error updating background color:', error);
                    }
                }
            }
            
            async updateOpacity(newOpacity) {
                const opacity = parseFloat(newOpacity);
                this.opacity = opacity;
                
                if (window.electronAPI && window.electronAPI.setWindowOpacity) {
                    window.electronAPI.setWindowOpacity(opacity);
                }
                
                if (this.currentNote) {
                    try {
                        await window.electronAPI.updateNote(this.currentNote.id, { opacity });
                    } catch (error) {
                        console.error('Error updating opacity:', error);
                    }
                }
                
                // Update the label
                document.querySelector('.settings-label').textContent = \`Opacity: \${Math.round(opacity * 100)}%\`;
            }
            
            async updateAlwaysOnTop(alwaysOnTop) {
                this.alwaysOnTop = alwaysOnTop;
                
                if (this.currentNote) {
                    try {
                        await window.electronAPI.updateNote(this.currentNote.id, { alwaysOnTop });
                    } catch (error) {
                        console.error('Error updating always on top:', error);
                    }
                }
            }
            
            closeNote() {
                if (window.electronAPI && window.electronAPI.closeWindow) {
                    window.electronAPI.closeWindow();
                }
            }
            
            rgbaToHex(rgba) {
                const match = rgba.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
                if (!match) return '#ffeb3b';
                
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                
                return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            }
            
            hexToRgba(hex, alpha = 1) {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                
                return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
            }
        }
        
        // Initialize the note
        let note;
        document.addEventListener('DOMContentLoaded', () => {
            note = new SimpleNote();
        });
    </script>
</body>
</html>`;

// Write note-quill.html
const noteQuillPath = path.join(distDir, 'note-quill.html');
fs.writeFileSync(noteQuillPath, noteQuillTemplate);

console.log('✅ Built standalone note-quill.html');
console.log('✅ Copied utils.js');
console.log('📦 Standalone note files created successfully!'); 