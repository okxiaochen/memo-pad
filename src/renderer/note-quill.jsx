import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { getFirstLine } from './utils.js';

// Add custom CSS for compact toolbar
const customStyles = `
    .ql-container {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
    }
    
    .ql-editor {
        flex: 1 !important;
        order: 1 !important;
        border: none !important;
    }
    
    .ql-toolbar.ql-snow {
        border: none !important;
        backdrop-filter: blur(10px) !important;
        transition: opacity 0.3s ease, display 0.3s ease !important;
        order: 2 !important;
        padding: 0 !important;
    }
    
    .ql-toolbar.ql-snow .ql-formats {
        margin-right: 8px !important;
        transition: opacity 0.3s ease, display 0.3s ease !important;
    }
    
    /* Hide advanced tools by default */
    .ql-toolbar.ql-snow .ql-formats:nth-child(n+5) {
        display: none !important;
        opacity: 0 !important;
    }
    
    /* Show advanced tools when needed */
    .ql-toolbar.ql-snow.show-advanced .ql-formats:nth-child(n+5) {
        display: inline-block !important;
        opacity: 1 !important;
    }
    
    .ql-toolbar.ql-snow button {
        width: 28px !important;
        height: 28px !important;
        border-radius: 4px !important;
        transition: all 0.2s ease !important;
    }
    
    .ql-toolbar.ql-snow button:hover {
        background-color: rgba(255, 255, 255, 0.2) !important;
        color: inherit !important;
    }
    
    .ql-toolbar.ql-snow .ql-picker {
        border-radius: 4px !important;
    }
    
    .ql-toolbar.ql-snow .ql-picker-options {
        border-radius: 4px !important;
        background: rgba(0, 0, 0, 0.9) !important;
        backdrop-filter: blur(10px) !important;
    }
    
    .ql-editor {
        padding: 16px !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
    }
    
    .ql-editor.ql-blank::before {
        color: rgba(255, 255, 255, 0.5) !important;
        font-style: italic !important;
    }
`;

// Inject custom styles
const styleSheet = document.createElement('style');
styleSheet.textContent = customStyles;
document.head.appendChild(styleSheet);

// Utility functions
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const hexToRgba = (hex, opacity = 1.0) => {
    const rgb = hexToRgb(hex);
    if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
    return hex;
};

const NoteQuill = () => {
    console.log('NoteQuill component initialized');
    const [currentNote, setCurrentNote] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isWindowFocused, setIsWindowFocused] = useState(false);
    const [backgroundColor, setBackgroundColor] = useState('rgba(255, 235, 59, 1.0)');
    const [opacity, setOpacity] = useState(1.0);
    const [alwaysOnTop, setAlwaysOnTop] = useState(true);
    const [showAdvancedTools, setShowAdvancedTools] = useState(false);
    
    const saveTimeoutRef = useRef(null);
    const noteContainerRef = useRef(null);
    const settingsPanelRef = useRef(null);
    const quillRef = useRef(null);
    const editorRef = useRef(null);
    
    console.log('NoteQuill component state:', { showSettings, currentNote: !!currentNote });

    // Initialize note
    useEffect(() => {
        const initializeNote = async () => {
            try {
                console.log('Initializing note...');
                
                const urlParams = new URLSearchParams(window.location.search);
                console.log('URL params:', urlParams);
                
                const noteId = urlParams.get('id');
                console.log('Note ID from URL:', noteId);
                
                if (noteId) {
                    console.log('Loading existing note with ID:', noteId);
                    const notes = await window.electronAPI.getNotes();
                    const existingNote = notes.find(note => note.id === noteId);
                    
                    if (existingNote) {
                        console.log('Found existing note:', existingNote);
                        setCurrentNote(existingNote);
                        setBackgroundColor(existingNote.backgroundColor);
                        setOpacity(existingNote.opacity);
                        setAlwaysOnTop(existingNote.alwaysOnTop);
                    } else {
                        console.log('Note not found, creating new note...');
                        const newNote = await window.electronAPI.createNote({
                            content: '',
                            backgroundColor: 'rgba(255, 235, 59, 1.0)',
                            opacity: 1.0,
                        });
                        setCurrentNote(newNote);
                    }
                } else {
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

    // Initialize Quill editor
    useEffect(() => {
        if (editorRef.current && currentNote && !quillRef.current) {
            console.log('Initializing Quill editor...');
            
            // Set initial window focus state
            setIsWindowFocused(document.hasFocus());
            
            // Quill configuration with all tools
            const toolbarOptions = [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }],
                ['link'],
                ['strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],
                ['clean'],
                ['image', 'video']
            ];

            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: {
                        container: toolbarOptions
                    },
                    clipboard: {
                        matchVisual: false
                    }
                },
                placeholder: '',
                readOnly: false
            });

            // Set content
            if (currentNote.content) {
                quill.root.innerHTML = currentNote.content;
            }

            quillRef.current = quill;
            console.log('Quill editor initialized successfully');
            
            // Move toolbar to bottom and set initial state after Quill is ready
            setTimeout(() => {
                const toolbar = editorRef.current.querySelector('.ql-toolbar');
                const editor = editorRef.current.querySelector('.ql-editor');
                const container = editorRef.current.querySelector('.ql-container');
                
                if (toolbar && container && editor) {
                    console.log('Moving toolbar to bottom');
                    
                    // Remove toolbar from its current position
                    toolbar.remove();
                    
                    // Append toolbar after the editor inside the container
                    container.appendChild(toolbar);
                    
                    // Update styles for bottom positioning
                    toolbar.style.order = '2';
                    editor.style.order = '1';
                    container.style.display = 'flex';
                    container.style.flexDirection = 'column';
                    
                    console.log('Setting initial toolbar state');
                    if (showAdvancedTools) {
                        toolbar.classList.add('show-advanced');
                    } else {
                        toolbar.classList.remove('show-advanced');
                    }
                }
            }, 200);
        }
    }, [currentNote]);

    // Handle toolbar toggle and window focus
    useEffect(() => {
        // Wait a bit for Quill to be fully initialized
        const timeoutId = setTimeout(() => {
            if (quillRef.current && currentNote) {
                console.log('Toolbar effect triggered - showAdvancedTools:', showAdvancedTools, 'isWindowFocused:', isWindowFocused);
                
                const toolbar = editorRef.current.querySelector('.ql-toolbar') || document.querySelector('.ql-toolbar');
                if (toolbar) {
                    console.log('Found toolbar, applying changes...');
                    
                    // Hide entire toolbar when window is not focused
                    if (!isWindowFocused) {
                        console.log('Window not focused, hiding toolbar');
                        toolbar.style.opacity = '0';
                        setTimeout(() => {
                            if (!isWindowFocused) {
                                toolbar.style.display = 'none';
                            }
                        }, 300);
                        return;
                    }
                    
                    // Show toolbar when window is focused
                    console.log('Window focused, showing toolbar');
                    toolbar.style.display = 'block';
                    toolbar.style.opacity = '1';
                    
                    // Handle advanced tools toggle via CSS class
                    if (showAdvancedTools) {
                        console.log('Adding show-advanced class');
                        toolbar.classList.add('show-advanced');
                    } else {
                        console.log('Removing show-advanced class');
                        toolbar.classList.remove('show-advanced');
                    }
                } else {
                    console.log('Toolbar not found, retrying...');
                    // Retry after a short delay
                    setTimeout(() => {
                        const retryToolbar = editorRef.current.querySelector('.ql-toolbar') || document.querySelector('.ql-toolbar');
                        if (retryToolbar) {
                            console.log('Found toolbar on retry, applying changes...');
                            if (showAdvancedTools) {
                                retryToolbar.classList.add('show-advanced');
                            } else {
                                retryToolbar.classList.remove('show-advanced');
                            }
                        }
                    }, 100);
                }
            } else {
                console.log('Quill not ready or no current note');
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [showAdvancedTools, currentNote, isWindowFocused]);

    // Update background color effect
    useEffect(() => {
        if (noteContainerRef.current) {
            const rgbaMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
            let r, g, b;
            
            if (rgbaMatch) {
                r = parseInt(rgbaMatch[1]);
                g = parseInt(rgbaMatch[2]);
                b = parseInt(rgbaMatch[3]);
            } else {
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
            const content = quillRef.current ? quillRef.current.root.innerHTML : '';
            const updates = {
                content: content,
                backgroundColor: backgroundColor,
                opacity: parseFloat(opacity),
                alwaysOnTop: alwaysOnTop,
            };
            
            console.log('Saving note with updates:', updates);
            console.log('Current note ID:', currentNote.id);
            
            const updatedNote = await window.electronAPI.updateNote(currentNote.id, updates);
            console.log('Note saved successfully:', updatedNote);
            
            if (updatedNote) {
                setCurrentNote(updatedNote);
            }
        } catch (error) {
            console.error('Failed to save note:', error);
        }
    }, [backgroundColor, opacity, alwaysOnTop, currentNote]);

    // Auto-save when content changes
    useEffect(() => {
        if (!currentNote || !quillRef.current) return;
        
        const handleTextChange = () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                console.log('Auto-saving note...');
                saveNote();
            }, 1000);
        };

        // Listen to Quill text changes
        quillRef.current.on('text-change', handleTextChange);

        return () => {
            if (quillRef.current) {
                quillRef.current.off('text-change', handleTextChange);
            }
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [currentNote, saveNote]);

    // Save immediately when settings change
    useEffect(() => {
        if (!currentNote) return;
        
        const hasSettingsChanged = 
            backgroundColor !== currentNote.backgroundColor ||
            opacity !== currentNote.opacity ||
            alwaysOnTop !== currentNote.alwaysOnTop;
            
        if (!hasSettingsChanged) return;
        
        console.log('Settings changed, saving immediately...');
        saveNote();
    }, [backgroundColor, opacity, alwaysOnTop, currentNote, saveNote]);

    // Handle content change
    const handleContentChange = (newContent) => {
        console.log('Note content changed:', newContent.length, 'characters');
        // Content is handled by Quill's text-change event
    };

    // Handle opacity change
    const handleOpacityChange = (e) => {
        const newOpacity = parseFloat(e.target.value);
        console.log('Window opacity slider change:', newOpacity);
        setOpacity(newOpacity);
        
        console.log('Setting native window opacity:', newOpacity);
        window.electronAPI.setWindowOpacity(newOpacity);
        
        if (currentNote) {
            window.electronAPI.updateNote(currentNote.id, { opacity: newOpacity });
        }
    };

    // Handle color change
    const handleColorChange = (e) => {
        const newHexColor = e.target.value;
        console.log('Background color changed to:', newHexColor);
        
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
            
            const success = await window.electronAPI.toggleWindowCollapse(currentNote.id, newCollapsedState);
            
            if (success) {
                setCurrentNote(prev => prev ? { ...prev, isCollapsed: newCollapsedState } : null);
            }
        }
    };

    // Close note
    const closeNote = () => {
        console.log('Closing note window');
        window.electronAPI.closeWindow();
    };

    // Event listeners
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target)) {
                setShowSettings(false);
            }
        };

        const handleBeforeUnload = (event) => {
            console.log('Window closing, saving note...');
            saveNote();
        };

        const handleFocus = () => {
            console.log('Window focused');
            setIsWindowFocused(true);
        };

        const handleBlur = () => {
            console.log('Window blurred');
            setIsWindowFocused(false);
        };

        const handleCollapseStateChange = (noteId, isCollapsed) => {
            if (currentNote && currentNote.id === noteId) {
                console.log(`Received collapse state change for note ${noteId}: ${isCollapsed}`);
                setCurrentNote(prev => prev ? { ...prev, isCollapsed } : null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        window.electronAPI.onCollapseStateChange(handleCollapseStateChange);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            // Note: IPC listeners are automatically cleaned up when the window is closed
        };
    }, [currentNote, saveNote]);



    if (!currentNote) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: backgroundColor,
                color: 'white'
            }}>
                <div className="spinner"></div>
                Loading note...
            </div>
        );
    }

    return (
        <div 
            ref={noteContainerRef}
            className="note-container"
            style={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: backgroundColor,
                transition: 'background-color 0.3s ease'
            }}
        >
            {/* Title Bar - Always show, but hide title text when not collapsed */}
            <div 
                className="note-title-bar"
                style={{
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    WebkitAppRegion: 'drag',
                    cursor: 'move'
                }}
            >
                {/* Title text - Only show when collapsed */}
                {currentNote.isCollapsed && (
                    <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: 'inherit',
                        opacity: 0.8
                    }}>
                        {getFirstLine(currentNote.content).length > 50 
                            ? getFirstLine(currentNote.content).substring(0, 50) + '...' 
                            : getFirstLine(currentNote.content)}
                    </div>
                )}
                
                {/* Spacer when title is hidden */}
                {!currentNote.isCollapsed && <div />}
                
                <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    WebkitAppRegion: 'no-drag'
                }}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Toggle button clicked, current state:', showAdvancedTools);
                            setShowAdvancedTools(!showAdvancedTools);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            opacity: 0.7,
                            transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                        title={showAdvancedTools ? 'Hide Advanced Tools' : 'Show Advanced Tools'}
                    >
                        {showAdvancedTools ? '🔽' : '🔼'}
                    </button>
                    
                    <button
                        onClick={toggleCollapse}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            opacity: 0.7,
                            transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                        {currentNote.isCollapsed ? '⬇' : '⬆'}
                    </button>
                    
                    <button
                        onClick={toggleSettings}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            opacity: 0.7,
                            transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                        ⚙️
                    </button>
                    
                    <button
                        onClick={closeNote}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            opacity: 0.7,
                            transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div
                    ref={settingsPanelRef}
                    style={{
                        position: 'absolute',
                        top: '45px',
                        right: '15px',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderRadius: '8px',
                        padding: '15px',
                        zIndex: 1000,
                        minWidth: '200px',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '5px', 
                            fontSize: '12px',
                            color: 'white',
                            opacity: 0.8
                        }}>
                            Background Color
                        </label>
                        <input
                            type="color"
                            value={backgroundColor.startsWith('#') ? backgroundColor : '#ffeb3b'}
                            onChange={handleColorChange}
                            style={{
                                width: '100%',
                                height: '30px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '5px', 
                            fontSize: '12px',
                            color: 'white',
                            opacity: 0.8
                        }}>
                            Opacity: {Math.round(opacity * 100)}%
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="1.0"
                            step="0.05"
                            value={opacity}
                            onChange={handleOpacityChange}
                            style={{
                                width: '100%',
                                height: '4px',
                                borderRadius: '2px',
                                background: 'rgba(255, 255, 255, 0.3)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            fontSize: '12px',
                            color: 'white',
                            opacity: 0.8,
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={alwaysOnTop}
                                onChange={(e) => {
                                    setAlwaysOnTop(e.target.checked);
                                    if (currentNote) {
                                        window.electronAPI.updateNote(currentNote.id, { alwaysOnTop: e.target.checked });
                                    }
                                }}
                                style={{ marginRight: '8px' }}
                            />
                            Always on Top
                        </label>
                    </div>
                </div>
            )}

            {/* Editor Container */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div 
                    ref={editorRef}
                    style={{
                        flex: 1,
                        fontSize: '14px',
                        lineHeight: '1.6',
                        WebkitAppRegion: 'no-drag'
                    }}
                />
            </div>
        </div>
    );
};

// Initialize the app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<NoteQuill />);
}

export default NoteQuill; 