import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { stripHtml, getFirstLine, getTextPreview } from './utils.js';
import ColorPicker from 'react-best-gradient-color-picker';

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
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'rgba(255, 235, 59, 1.0)'; // fallback
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Simple icons component
const Icons = {
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Expand: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  Collapse: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  ),
  Trash2: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
      <path d="M8 11v6M16 11v6" />
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />
    </svg>
  ),
  Restore: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  FolderPlus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  ),
  Layout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M9 3v18M9 9h12" />
    </svg>
  ),
  RotateCcw: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};



// Note Card Component
const NoteCard = ({ note, onEdit, onDelete, onOpen, groups, onDragStart }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const group = groups.find(g => g.id === note.groupId);
  
  // Strip HTML tags from content for display
  const displayTitle = getFirstLine(note.content);
  const displayContent = getTextPreview(note.content, 200);
  
  // Truncate title if it's too long for display
  const truncatedTitle = displayTitle.length > 50 ? displayTitle.substring(0, 50) + '...' : displayTitle;

  return (
    <div 
      className="note-card"
      style={{ backgroundColor: note.backgroundColor + '20' }}
      onClick={() => onOpen(note.id)}
      draggable
      onDragStart={(e) => onDragStart(e, note)}
    >
      <div className="note-card-header">
        <div className="note-title">
          {truncatedTitle}
        </div>
        <div className="note-actions">
          <button 
            className="note-btn edit" 
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            title="Edit note"
          >
            <Icons.Edit />
          </button>
          <button 
            className="note-btn delete" 
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            title="Delete note"
          >
            <Icons.Delete />
          </button>
        </div>
      </div>
      <div className="note-content">
        {displayContent}
      </div>
      <div className="note-meta">
        {group && (
          <div style={{ color: group.color, marginBottom: '5px' }}>
            📁 {group.name}
          </div>
        )}
        {formatDate(note.updatedAt)}
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Create Note Modal
const CreateNoteModal = ({ isOpen, onClose, onSave, groups, settings }) => {
  const [noteData, setNoteData] = useState({
    title: '',
    content: '',
    backgroundColor: settings?.defaultBackgroundColor || 'rgba(255, 235, 59, 1.0)',
    opacity: settings?.defaultOpacity || 0.8,
    groupId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(noteData);
    setNoteData({ 
      title: '', 
      content: '', 
      backgroundColor: settings?.defaultBackgroundColor || 'rgba(255, 235, 59, 1.0)', 
      opacity: settings?.defaultOpacity || 0.8, 
      groupId: '' 
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Note">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-input"
            value={noteData.title}
            onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
            placeholder="Enter note title"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea
            className="form-textarea"
            value={noteData.content}
            onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
            placeholder="Enter note content (supports Markdown)"
            rows="4"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Background Color</label>
          <input
            type="color"
            className="form-input"
            value={rgbaToHex(noteData.backgroundColor)}
            onChange={(e) => {
              const newHexColor = e.target.value;
              const newRgbaColor = hexToRgba(newHexColor, 1.0);
              setNoteData({ ...noteData, backgroundColor: newRgbaColor });
            }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Window Opacity: {Math.round(noteData.opacity * 100)}%</label>
                      <input
              type="range"
              className="form-input"
              min="0.5"
              max="1"
              step="0.01"
              value={noteData.opacity}
            onChange={(e) => {
              const newOpacity = parseFloat(e.target.value);
              setNoteData({ ...noteData, opacity: newOpacity });
            }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Group</label>
          <select
            className="form-input"
            value={noteData.groupId}
            onChange={(e) => setNoteData({ ...noteData, groupId: e.target.value })}
          >
            <option value="">No group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-success">
            Create Note
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Create Group Modal
const CreateGroupModal = ({ isOpen, onClose, onSave }) => {
  const [groupData, setGroupData] = useState({
    name: '',
    color: '#2196f3'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(groupData);
    setGroupData({ name: '', color: '#2196f3' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Group Name</label>
          <input
            type="text"
            className="form-input"
            value={groupData.name}
            onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
            placeholder="Enter group name"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input
            type="color"
            className="form-input"
            value={groupData.color}
            onChange={(e) => setGroupData({ ...groupData, color: e.target.value })}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-success">
            Create Group
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Settings Modal
const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [settingsData, setSettingsData] = useState({
    defaultBackgroundColor: settings?.defaultBackgroundColor || 'rgba(255, 235, 59, 1.0)',
    defaultOpacity: settings?.defaultOpacity || 0.8,
    defaultAlwaysOnTop: settings?.defaultAlwaysOnTop || true
  });

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen && settings) {
      setSettingsData({
        defaultBackgroundColor: settings.defaultBackgroundColor || 'rgba(255, 235, 59, 1.0)',
        defaultOpacity: settings.defaultOpacity || 0.8,
        defaultAlwaysOnTop: settings.defaultAlwaysOnTop || true
      });
    }
  }, [isOpen, settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(settingsData);
    onClose();
  };

  const handleColorChange = (newColor) => {
    // The color picker returns a string in RGBA format directly
    setSettingsData({ ...settingsData, defaultBackgroundColor: newColor });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Default Settings for New Notes">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Default Background Color</label>
          <ColorPicker
            value={settingsData.defaultBackgroundColor}
            onChange={handleColorChange}
            width={450}
            height={200}
            hideInputs={false}
            hideEyeDrop={false}
            hideAdvancedSliders={false}
            hideColorGuide={true}
            hideInputType={false}
            hideGradientType={true}
            hideGradientAngle={true}
            hideGradientStop={true}
            hideGradientControls={true}
            hideColorTypeBtns={true}
            presets={[
              'rgba(255, 235, 59, 1.0)',
              'rgba(255, 193, 7, 1.0)',
              'rgba(255, 152, 0, 1.0)',
              'rgba(255, 87, 34, 1.0)',
              'rgba(244, 67, 54, 1.0)',
              'rgba(233, 30, 99, 1.0)',
              'rgba(156, 39, 176, 1.0)',
              'rgba(103, 58, 183, 1.0)',
              'rgba(63, 81, 181, 1.0)',
              'rgba(33, 150, 243, 1.0)',
              'rgba(3, 169, 244, 1.0)',
              'rgba(0, 188, 212, 1.0)',
              'rgba(0, 150, 136, 1.0)',
              'rgba(76, 175, 80, 1.0)',
              'rgba(139, 195, 74, 1.0)',
              'rgba(205, 220, 57, 1.0)',
              'rgba(158, 158, 158, 1.0)',
              'rgba(96, 125, 139, 1.0)'
            ]}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            This color will be used for all new notes by default. Use the eyedropper 👁️ to pick colors from your screen!
          </small>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Default Opacity: {Math.round(settingsData.defaultOpacity * 100)}%
          </label>
          <input
            type="range"
            className="form-input"
            min="0.5"
            max="1"
            step="0.01"
            value={settingsData.defaultOpacity}
            onChange={(e) => {
              const newOpacity = parseFloat(e.target.value);
              setSettingsData({ ...settingsData, defaultOpacity: newOpacity });
            }}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#ddd',
              outline: 'none'
            }}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            This opacity will be applied to all new notes by default
          </small>
        </div>

        <div className="form-group">
          <div className="settings-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="defaultAlwaysOnTop"
              className="form-input"
              checked={settingsData.defaultAlwaysOnTop}
              onChange={(e) => setSettingsData({ ...settingsData, defaultAlwaysOnTop: e.target.checked })}
              style={{ width: 'auto' }}
            />
            <label htmlFor="defaultAlwaysOnTop" className="form-label" style={{ margin: 0 }}>
              Always on Top by Default
            </label>
          </div>
          <small style={{ color: '#666', fontSize: '12px' }}>
            New notes will stay on top of other windows by default
          </small>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-success">
            Save Settings
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [trash, setTrash] = useState([]);
  const [settings, setSettings] = useState({
    defaultBackgroundColor: 'rgba(255, 235, 59, 1.0)',
    defaultOpacity: 0.8,
    defaultAlwaysOnTop: true
  });

  const [loading, setLoading] = useState(true);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
    loadSettings(); // Load settings only once on mount
    
    // Add window focus listener to refresh data when dashboard comes back into focus
    const handleFocus = () => {
      console.log('Dashboard window focused, refreshing data...');
      loadData(); // Only reload notes/groups/trash, not settings
    };
    
    // Set up periodic refresh every 3 seconds to catch updates from note windows
    const refreshInterval = setInterval(() => {
      loadData(); // Only reload notes/groups/trash, not settings
    }, 3000);
    
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading dashboard data...');
      const [notesData, groupsData, trashData] = await Promise.all([
        window.electronAPI.getNotes(),
        window.electronAPI.getGroups(),
        window.electronAPI.getTrash()
      ]);

      setNotes(notesData);
      setGroups(groupsData);
      setTrash(trashData);
      setLoading(false);
      console.log('Dashboard data loaded:', { notes: notesData.length, groups: groupsData.length });
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      console.log('Loading settings...');
      const settingsData = await window.electronAPI.getSettings();
      setSettings(settingsData);
      console.log('Settings loaded:', settingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleCreateNote = async (noteData = null) => {
    try {
      // Use default settings if no noteData provided
      const defaultNoteData = {
        content: '',
        backgroundColor: settings.defaultBackgroundColor,
        opacity: settings.defaultOpacity,
        alwaysOnTop: settings.defaultAlwaysOnTop,
        clickThrough: false,
      };
      
      const newNote = await window.electronAPI.createNote(noteData || defaultNoteData);
      
      // Create the note window after creating the note
      await window.electronAPI.openNoteWindow(newNote.id);
      
      loadData();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleCreateNoteWithModal = async (noteData) => {
    try {
      await window.electronAPI.createNote(noteData);
      loadData();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await window.electronAPI.deleteNote(noteId);
      loadData();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleOpenNote = async (noteId) => {
    try {
      await window.electronAPI.openNoteWindow(noteId);
    } catch (error) {
      console.error('Failed to open note:', error);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      await window.electronAPI.createGroup(groupData);
      loadData();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      // Update each setting individually
      await window.electronAPI.updateSettings('defaultBackgroundColor', newSettings.defaultBackgroundColor);
      await window.electronAPI.updateSettings('defaultOpacity', newSettings.defaultOpacity);
      await window.electronAPI.updateSettings('defaultAlwaysOnTop', newSettings.defaultAlwaysOnTop);
      
      // Reload settings from storage to ensure consistency
      await loadSettings();
      console.log('Settings saved:', newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      const group = groups.find(g => g.id === groupId);
      const groupNotes = notes.filter(note => note.groupId === groupId);
      
      if (groupNotes.length > 0) {
        const confirmMessage = `Group "${group.name}" contains ${groupNotes.length} note(s).\n\nDo you want to delete the group and all its notes?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
      
      await window.electronAPI.deleteGroup(groupId);
      loadData();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleDeleteAllNotesInGroup = async (groupId) => {
    try {
      let groupName = 'Ungrouped Notes';
      let groupNotes;
      
      if (groupId === 'ungrouped') {
        // Handle ungrouped notes
        groupNotes = notes.filter(note => !note.groupId);
      } else {
        // Handle grouped notes
        const group = groups.find(g => g.id === groupId);
        if (!group) {
          console.error('Group not found:', groupId);
          return;
        }
        groupName = group.name;
        groupNotes = notes.filter(note => note.groupId === groupId);
      }
      
      if (groupNotes.length === 0) {
        alert('This group has no notes to delete.');
        return;
      }
      
      const confirmMessage = `Are you sure you want to delete all ${groupNotes.length} note(s) in ${groupId === 'ungrouped' ? 'ungrouped notes' : `group "${groupName}"`}?\n\nThis action cannot be undone.`;
      if (!confirm(confirmMessage)) {
        return;
      }
      
      // For ungrouped notes, we need to handle them differently since there's no real group
      if (groupId === 'ungrouped') {
        // Delete each ungrouped note individually
        for (const note of groupNotes) {
          await window.electronAPI.deleteNote(note.id);
        }
      } else {
        await window.electronAPI.deleteAllNotesInGroup(groupId);
      }
      
      loadData();
    } catch (error) {
      console.error('Failed to delete all notes in group:', error);
    }
  };

  const handleRestoreNote = async (trashId) => {
    try {
      await window.electronAPI.restoreNote(trashId);
      loadData();
    } catch (error) {
      console.error('Failed to restore note:', error);
    }
  };

  const handlePermanentlyDeleteNote = async (trashId) => {
    try {
      await window.electronAPI.permanentlyDeleteNote(trashId);
      loadData();
    } catch (error) {
      console.error('Failed to permanently delete note:', error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      if (confirm('Are you sure you want to empty the trash? This action cannot be undone.')) {
        await window.electronAPI.emptyTrash();
        loadData();
      }
    } catch (error) {
      console.error('Failed to empty trash:', error);
    }
  };

  const handleCloseDashboard = async () => {
    try {
      await window.electronAPI.closeDashboard();
    } catch (error) {
      console.error('Failed to close dashboard:', error);
    }
  };



  const [allNotesCollapsed, setAllNotesCollapsed] = useState(false);

  const handleToggleAllNotes = async () => {
    try {
      if (allNotesCollapsed) {
        await window.electronAPI.expandAllNotes();
        setAllNotesCollapsed(false);
      } else {
        await window.electronAPI.collapseAllNotes();
        setAllNotesCollapsed(true);
      }
    } catch (error) {
      console.error('Failed to toggle all notes:', error);
    }
  };

  const handleResetAllOpacity = async () => {
    try {
      console.log('Resetting opacity for all notes...');
      await window.electronAPI.resetAllOpacity();
      loadData(); // Refresh to show updated notes
      console.log('All note opacity reset to 100%');
    } catch (error) {
      console.error('Failed to reset opacity:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, groupId) => {
    e.preventDefault();
    setDragOverGroup(groupId);
  };

  const handleDragLeave = () => {
    setDragOverGroup(null);
  };

  const handleDrop = async (e, targetGroupId) => {
    e.preventDefault();
    if (draggedNote && draggedNote.groupId !== targetGroupId) {
      try {
        const newGroupId = targetGroupId === 'ungrouped' ? null : targetGroupId;
        await window.electronAPI.updateNote(draggedNote.id, { groupId: newGroupId });
        loadData();
      } catch (error) {
        console.error('Failed to move note to group:', error);
      }
    }
    setDraggedNote(null);
    setDragOverGroup(null);
  };

  const getGroupedNotes = () => {
    const grouped = {};
    
    // Add ungrouped notes
    const ungroupedNotes = notes.filter(note => !note.groupId);
    grouped['ungrouped'] = {
      id: 'ungrouped',
      name: 'Ungrouped Notes',
      color: '#666',
      notes: ungroupedNotes
    };

    // Add all groups, even if they have no notes
    groups.forEach(group => {
      const groupNotes = notes.filter(note => note.groupId === group.id);
      grouped[group.id] = {
        ...group,
        notes: groupNotes
      };
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
                  <h1 className="dashboard-title">MemoPad</h1>
        <div className="dashboard-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => handleCreateNote()}
          >
            <Icons.Plus />
            New Note
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowCreateGroupModal(true)}
          >
            <Icons.FolderPlus />
            New Group
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowSettingsModal(true)}
            title="Configure default settings"
          >
            <Icons.Settings />
            Settings
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleCloseDashboard}
            title="Close dashboard"
          >
            <Icons.X />
            Close
          </button>
        </div>
      </div>

      <div className="dashboard-content">

        {/* Notes Section */}
          <div>
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', padding: '50px' }}>
                <p>No notes yet. Create your first note!</p>
              </div>
            ) : (
              <div>
                {Object.entries(getGroupedNotes()).map(([groupId, group]) => (
                  <div 
                    key={groupId} 
                    className={`group-section ${dragOverGroup === groupId ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, groupId)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, groupId)}
                  >
                    <div className="group-header">
                      <div 
                        className="group-name"
                        style={{ color: group.color }}
                      >
                        📁 {group.name} ({group.notes.length})
                      </div>
                      <div className="group-actions">
                        {group.notes.length > 0 && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteAllNotesInGroup(groupId)}
                            style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                            title="Delete all notes in group"
                          >
                            <Icons.Trash2 />
                          </button>
                        )}
                        {groupId !== 'ungrouped' && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDeleteGroup(groupId)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            title="Delete group"
                          >
                            <Icons.Delete />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notes-grid">
                      {group.notes.length > 0 ? (
                        group.notes.map(note => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={(note) => handleOpenNote(note.id)}
                            onDelete={handleDeleteNote}
                            onOpen={handleOpenNote}
                            groups={groups}
                            onDragStart={handleDragStart}
                          />
                        ))
                      ) : (
                        <div className="empty-group-message">
                          <p>No notes in this group yet.</p>
                          <p>Drag notes here or create new ones to add to this group.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* Trash Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
              <Icons.Trash />
              Trash ({trash.length})
            </h2>
            {trash.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={handleEmptyTrash}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <Icons.Trash2 />
                Empty Trash
              </button>
            )}
          </div>
          
          {trash.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', padding: '50px' }}>
              <p>Trash is empty.</p>
            </div>
          ) : (
            <div className="notes-grid">
              {trash.map(item => {
                const group = groups.find(g => g.id === item.data.groupId);
                return (
                  <div key={item.id} className="note-card trash-note">
                    <div className="note-card-header">
                      <div className="note-title">
                        {item.data.content 
                          ? (item.data.content.split('\n')[0].substring(0, 50) + (item.data.content.split('\n')[0].length > 50 ? '...' : ''))
                          : 'Empty note...'}
                      </div>
                      <div className="note-actions">
                        <button
                          className="note-btn edit"
                          onClick={() => handleRestoreNote(item.id)}
                          title="Restore note"
                        >
                          <Icons.Restore />
                        </button>
                        <button
                          className="note-btn delete"
                          onClick={() => handlePermanentlyDeleteNote(item.id)}
                          title="Delete forever"
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    </div>
                    <div className="note-content">
                      {item.data.content ? item.data.content.substring(0, 200) + (item.data.content.length > 200 ? '...' : '') : 'Click to start typing...'}
                    </div>
                    <div className="note-meta">
                      {group && (
                        <div style={{ color: group.color, marginBottom: '5px' }}>
                          📁 {group.name}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', opacity: '0.8' }}>
                        Deleted: {new Date(item.deletedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateNoteModal
        isOpen={showCreateNoteModal}
        onClose={() => setShowCreateNoteModal(false)}
        onSave={handleCreateNoteWithModal}
        groups={groups}
        settings={settings}
      />
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSave={handleCreateGroup}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

    </div>
  );
};

// Initialize the app
const root = createRoot(document.getElementById('root'));
root.render(<Dashboard />); 