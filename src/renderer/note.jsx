import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Simple markdown parser
const parseMarkdown = (text) => {
    let html = text
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Blockquotes
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        // Lists
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        // Wrap consecutive list items in ul/ol
        .replace(/(<li>.*<\/li>)/g, (match) => {
            return `<ul>${match}</ul>`;
        })
        // Line breaks
        .replace(/\n/g, '<br>')
        // Clean up multiple BRs
        .replace(/(<br>)+/g, '<br>');
    
    return html;
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Helper function to convert rgba to hex
const rgbaToHex = (rgba) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return '#ffeb3b'; // fallback to yellow
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Helper function to convert hex to rgba with opacity
const hexToRgba = (hex, opacity = 1.0) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 'rgba(255, 235, 59, 1.0)'; // fallback
    
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

// Icons Component
const Icons = {
    Close: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    ),
    Minimize: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 19h12" />
        </svg>
    ),
    Settings: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
};

// Note Component
const Note = () => {
    console.log('Note component initialized');
    const [currentNote, setCurrentNote] = useState(null);

    const [showSettings, setShowSettings] = useState(false);
    const [isWindowFocused, setIsWindowFocused] = useState(false);
    const [content, setContent] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('rgba(255, 235, 59, 1.0)');
    const [opacity, setOpacity] = useState(1.0);
    const [alwaysOnTop, setAlwaysOnTop] = useState(true);
    // 暂时移除 clickThrough 状态
    
    const saveTimeoutRef = useRef(null);
    const noteContainerRef = useRef(null);
    const settingsPanelRef = useRef(null);
    
    console.log('Note component state:', { showSettings, currentNote: !!currentNote });

    // Initialize note
    useEffect(() => {
        const initializeNote = async () => {
            try {
                console.log('Initializing note...');
                
                // Get note ID from URL parameters - 直接使用 window.location.search
                const urlParams = new URLSearchParams(window.location.search);
                console.log('URL params:', urlParams);
                
                const noteId = urlParams.get('id');
                console.log('Note ID from URL:', noteId);
                
                if (noteId) {
                    // Try to load existing note
                    console.log('Loading existing note with ID:', noteId);
                    const notes = await window.electronAPI.getNotes();
                    const existingNote = notes.find(note => note.id === noteId);
                    
                    if (existingNote) {
                        console.log('Found existing note:', existingNote);
                        setCurrentNote(existingNote);
                        setContent(existingNote.content);
                        setBackgroundColor(existingNote.backgroundColor);
                        setOpacity(existingNote.opacity);
                        setAlwaysOnTop(existingNote.alwaysOnTop);
                        // 暂时移除 clickThrough 设置
                    } else {
                        console.log('Note not found, creating new note...');
                        // Note not found, create a new one
                        const newNote = await window.electronAPI.createNote({
                            content: '',
                            backgroundColor: 'rgba(255, 235, 59, 1.0)',
                            opacity: 1.0,
                        });
                        setCurrentNote(newNote);
                    }
                } else {
                    // No note ID in URL, create a new note
                    console.log('No note ID in URL, creating new note...');
                    const newNote = await window.electronAPI.createNote({
                        content: '',
                        backgroundColor: 'rgba(255, 235, 59, 1.0)',
                        opacity: 1.0,
                    });
                    setCurrentNote(newNote);
                }
                
                console.log('Note initialization complete');
            } catch (error) {
                console.error('Error initializing note:', error);
            }
        };

        initializeNote();
    }, []);

    // Update background color effect
    useEffect(() => {
        if (noteContainerRef.current) {
            // Extract RGB values from rgba format
            const rgbaMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
            let r, g, b;
            
            if (rgbaMatch) {
                r = parseInt(rgbaMatch[1]);
                g = parseInt(rgbaMatch[2]);
                b = parseInt(rgbaMatch[3]);
            } else {
                // Fallback to hex conversion
                const rgb = hexToRgb(backgroundColor);
                r = rgb ? rgb.r : 255;
                g = rgb ? rgb.g : 235;
                b = rgb ? rgb.b : 59;
            }
            
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const textColor = brightness > 155 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
            
            noteContainerRef.current.style.backgroundColor = backgroundColor;
            noteContainerRef.current.style.color = textColor;
        }
    }, [backgroundColor]);

    // Auto-save functionality
    const saveNote = useCallback(async () => {
        if (!currentNote) {
            console.log('No current note to save');
            return;
        }
        
        try {
            const updates = {
                content: content,
                backgroundColor: backgroundColor,
                opacity: parseFloat(opacity),
                alwaysOnTop: alwaysOnTop,
                // 暂时移除 clickThrough
            };
            
            console.log('Saving note with updates:', updates);
            console.log('Current note ID:', currentNote.id);
            
            const updatedNote = await window.electronAPI.updateNote(currentNote.id, updates);
            console.log('Note saved successfully:', updatedNote);
            
            // Only update currentNote if the content actually changed
            if (updatedNote && updatedNote.content !== currentNote.content) {
                setCurrentNote(updatedNote);
            }
        } catch (error) {
            console.error('Failed to save note:', error);
        }
    }, [content, backgroundColor, opacity, alwaysOnTop]); // 移除 clickThrough 依赖

    // Auto-save when content changes
    useEffect(() => {
        if (!currentNote) return; // 没有 currentNote 不自动保存
        
        // Only save if content actually changed
        if (content === currentNote.content) return;
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            console.log('Auto-saving note...');
            saveNote();
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [content, saveNote, currentNote]);

    // Save immediately when settings change
    useEffect(() => {
        if (!currentNote) return;
        
        // Only save if settings actually changed
        const hasSettingsChanged = 
            backgroundColor !== currentNote.backgroundColor ||
            opacity !== currentNote.opacity ||
            alwaysOnTop !== currentNote.alwaysOnTop;
            // 暂时移除 clickThrough 检查
            
        if (!hasSettingsChanged) return;
        
        console.log('Settings changed, saving immediately...');
        saveNote();
    }, [backgroundColor, opacity, alwaysOnTop, currentNote, saveNote]);

    // Handle content change
    const handleContentChange = (e) => {
        const newContent = e.target.value;
        console.log('Note content changed:', newContent.length, 'characters');
        setContent(newContent);
    };

    // Handle opacity change
    const handleOpacityChange = (e) => {
        const newOpacity = parseFloat(e.target.value);
        console.log('Window opacity slider change:', newOpacity);
        setOpacity(newOpacity);
        
        // Apply native window opacity immediately for real-time feedback
        console.log('Setting native window opacity:', newOpacity);
        window.electronAPI.setWindowOpacity(newOpacity);
        
        // Also save to note data
        if (currentNote) {
            window.electronAPI.updateNote(currentNote.id, { opacity: newOpacity });
        }
    };

    // Handle color change
    const handleColorChange = (e) => {
        const newHexColor = e.target.value;
        console.log('Background color changed to:', newHexColor);
        
        // Convert hex to rgba with full opacity (1.0) for background color
        const newRgbaColor = hexToRgba(newHexColor, 1.0);
        console.log('Converting hex to rgba:', newHexColor, '->', newRgbaColor);
        
        setBackgroundColor(newRgbaColor);
    };

    // Toggle settings
    const toggleSettings = (e) => {
        console.log('Settings button clicked!', e);
        e.stopPropagation();
        e.preventDefault();
        console.log('Current showSettings:', showSettings);
        console.log('Toggling settings to:', !showSettings);
        setShowSettings(!showSettings);
    };

    // Toggle collapse state
    const toggleCollapse = async () => {
        if (currentNote) {
            const newCollapsedState = !currentNote.isCollapsed;
            console.log('Toggling collapse state:', newCollapsedState);
            
            // Call the new IPC method to actually collapse/expand the window
            const success = await window.electronAPI.toggleWindowCollapse(currentNote.id, newCollapsedState);
            
            if (success) {
                // Update local state
                setCurrentNote(prev => prev ? { ...prev, isCollapsed: newCollapsedState } : null);
            } else {
                console.error('Failed to toggle window collapse');
            }
        }
    };

    // Close note
    const closeNote = () => {
        // Save content before closing
        if (currentNote && content !== currentNote.content) {
            console.log('Saving content before closing window...');
            try {
                // Force immediate save without async
                const updates = {
                    content: content,
                    backgroundColor: backgroundColor,
                    opacity: parseFloat(opacity),
                    alwaysOnTop: alwaysOnTop,
                    // 暂时移除 clickThrough
                };
                
                console.log('Force saving note with updates:', updates);
                window.electronAPI.updateNote(currentNote.id, updates);
            } catch (error) {
                console.error('Failed to save content before closing:', error);
            }
        }
        
        if (window.electronAPI && window.electronAPI.closeWindow) {
            window.electronAPI.closeWindow();
        } else {
            window.close();
        }
    };

    // Handle click outside settings
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsPanelRef.current && 
                !settingsPanelRef.current.contains(event.target) &&
                !event.target.classList.contains('settings-btn')) {
                console.log('Clicking outside settings, closing panel');
                setShowSettings(false);
            }
        };

        if (showSettings) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showSettings]);

    // Save content before page unload
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (currentNote && content !== currentNote.content) {
                console.log('Saving content before page unload...');
                // Use synchronous save for beforeunload
                try {
                    // Force immediate save without async
                    const updates = {
                        content: content,
                        backgroundColor: backgroundColor,
                        opacity: parseFloat(opacity),
                        alwaysOnTop: alwaysOnTop,
                        // 暂时移除 clickThrough
                    };
                    
                    console.log('Force saving note with updates:', updates);
                    window.electronAPI.updateNote(currentNote.id, updates);
                } catch (error) {
                    console.error('Failed to save content before unload:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentNote, content, backgroundColor, opacity, alwaysOnTop]);

    // Handle window focus/blur events
    useEffect(() => {
        const handleFocus = () => {
            console.log('Window focused');
            setIsWindowFocused(true);
        };
        
        const handleBlur = () => {
            console.log('Window blurred');
            setIsWindowFocused(false);
        };
        
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Handle collapse state changes from menu
    useEffect(() => {
        const handleCollapseStateChange = (noteId, isCollapsed) => {
            if (currentNote && currentNote.id === noteId) {
                console.log('Received collapse state change:', isCollapsed);
                setCurrentNote(prev => prev ? { ...prev, isCollapsed: isCollapsed } : null);
            }
        };

        // Listen for collapse state changes from menu
        if (window.electronAPI && window.electronAPI.onCollapseStateChange) {
            window.electronAPI.onCollapseStateChange(handleCollapseStateChange);
        }

        return () => {
            // Cleanup if needed
        };
    }, [currentNote]);

    // Get first line of content for collapsed header
    const getFirstLine = (text) => {
        if (!text || text.trim() === '') return 'Untitled Note';
        const firstLine = text.split('\n')[0].trim();
        return firstLine.length > 20 ? firstLine.substring(0, 20) + '...' : firstLine;
    };

    return (
        <div
            className="note-container"
            ref={noteContainerRef}
            style={{
                height: currentNote?.isCollapsed ? '12px' : '100%',
                boxShadow: currentNote?.isCollapsed ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: currentNote?.isCollapsed ? '0' : '0'
            }}
        >
            <div
                className="note-header"
                style={{
                    backgroundColor: (isWindowFocused || currentNote?.isCollapsed)
                        ? 'rgba(0,0,0,0.1)'
                        : 'rgba(0,0,0,0)',
                    transition: 'background-color 0.3s ease',
                    height: '12px',
                    visibility: (isWindowFocused || currentNote?.isCollapsed) ? 'visible' : 'hidden'
                }}
            >
                {currentNote?.isCollapsed && (
                    <div className="note-title">
                        {getFirstLine(content)}
                    </div>
                )}
                <div className="note-controls">
                    <button className="control-btn header-button close-btn" onClick={closeNote}>
                        ×
                    </button>
                    <button className="control-btn header-button collapse-btn" onClick={toggleCollapse}>
                        {currentNote?.isCollapsed ? '▼' : '▲'}
                    </button>
                    <button 
                        className="control-btn header-button settings-btn" 
                        onClick={toggleSettings}
                        onMouseDown={(e) => console.log('Settings button mousedown')}
                        onMouseUp={(e) => console.log('Settings button mouseup')}
                    >
                        ⚙
                    </button>
                </div>
            </div>
            {!currentNote?.isCollapsed && (
                <div className="note-content">
                    <textarea
                        className="note-editor"
                        placeholder="Start typing your note..."
                        spellCheck="false"
                        value={content}
                        onChange={handleContentChange}
                        disabled={!currentNote}
                    />
                    {!currentNote && <div style={{color: '#888', marginTop: 8}}>正在加载...</div>}
                </div>
            )}
            {showSettings && (
                <div className="settings-panel" ref={settingsPanelRef}>
                    <div className="settings-group">
                        <label className="settings-label">Background Color</label>
                        <input 
                            type="color" 
                            className="color-picker" 
                            value={rgbaToHex(backgroundColor)}
                            onChange={handleColorChange}
                        />
                    </div>
                    
                    <div className="settings-group">
                        <label className="settings-label">Window Opacity</label>
                        <input 
                            type="range" 
                            className="settings-slider" 
                            min="0.5" 
                            max="1" 
                            step="0.01" 
                            value={opacity}
                            onChange={handleOpacityChange}
                        />
                        <span className="opacity-value">{Math.round(opacity * 100)}%</span>
                    </div>
                    
                    <div className="settings-group">
                        <div className="settings-row">
                            <input 
                                type="checkbox" 
                                className="settings-checkbox always-on-top" 
                                checked={alwaysOnTop}
                                onChange={(e) => {
                                    const newValue = e.target.checked;
                                    console.log('Always on top changed:', newValue);
                                    setAlwaysOnTop(newValue);
                                    
                                    // Apply immediately for real-time feedback
                                    if (currentNote) {
                                        window.electronAPI.updateNote(currentNote.id, { alwaysOnTop: newValue });
                                    }
                                }}
                            />
                            <label className="settings-label">Always on Top</label>
                        </div>
                    </div>
                    
                    {/* 暂时移除 click-through 设置 */}
                </div>
            )}
        </div>
    );
};

// Styles
const styles = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .note-header {
            height: 12px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 0 10px;
            border-radius: 0;
            position: relative;
            -webkit-app-region: drag;
        }

        .note-title {
            color: rgba(0, 0, 0, 0.8);
            font-size: 10px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
            -webkit-app-region: no-drag;
            position: absolute;
            left: 10px;
            line-height: 12px;
        }

        .note-controls {
            display: flex;
            gap: 5px;
            -webkit-app-region: no-drag;
        }

        .header-button {
            -webkit-app-region: no-drag;
        }

        .control-btn {
            width: 16px;
            height: 16px;
            border-radius: 0;
            border: none;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.2s;
            background: rgba(255, 255, 255, 0.0);
            color: rgba(255, 255, 255, 0.8);
        }

        .control-btn:hover {
            opacity: 0.8;
            background: rgba(255, 255, 255, 0.3);
        }

        .note-content {
            height: 100%;
            padding: 0 15px;
            overflow-y: auto;
            -webkit-app-region: no-drag;
        }

        .note-editor {
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            resize: none;
            background: inherit;
            font-size: 14px;
            line-height: 1.5;
            color: inherit;
            font-family: inherit;
        }

        .settings-panel {
            position: absolute;
            top: 12px;
            right: 10px;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            min-width: 250px;
            z-index: 1000;
            -webkit-app-region: no-drag;
        }

        .settings-group {
            margin-bottom: 15px;
        }

        .settings-group:last-child {
            margin-bottom: 0;
        }

        .settings-label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 5px;
            color: rgba(0, 0, 0, 0.7);
        }

        .settings-input {
            width: 100%;
            padding: 5px 8px;
            border: 1px solid rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            font-size: 12px;
            background: #ffffff;
        }

        .settings-slider {
            width: 100%;
            margin: 5px 0;
        }

        .settings-checkbox {
            margin-right: 5px;
        }

        .settings-row {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .color-picker {
            width: 40px;
            height: 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .opacity-value {
            font-size: 12px;
            color: rgba(0, 0, 0, 0.7);
        }
`;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing React app');
    
    // Add styles to document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    console.log('Styles added to document');
    
    // Render the React app
    const container = document.getElementById('root');
    console.log('Root container found:', !!container);
    if (container) {
        const root = createRoot(container);
        console.log('Creating React root and rendering Note component');
        root.render(<Note />);
    } else {
        console.error('Root container not found!');
    }
}); 