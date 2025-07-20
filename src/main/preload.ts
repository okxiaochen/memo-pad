import { contextBridge, ipcRenderer } from 'electron'

// Declare window object for TypeScript
declare const window: {
  location: {
    search: string;
  };
};

export interface Note {
  id: string
  content: string
  backgroundColor: string
  opacity: number
  clickThrough: boolean
  alwaysOnTop: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  groupId?: string
  createdAt: number
  updatedAt: number
  isCollapsed: boolean
  isVisible: boolean
}

export interface NoteGroup {
  id: string
  name: string
  color: string
  noteIds: string[]
  createdAt: number
}

export interface Layout {
  id: string
  name: string
  notes: Note[]
  groups: NoteGroup[]
  createdAt: number
}

export interface TrashItem {
  id: string
  data: Note
  deletedAt: number
}

export interface Settings {
  defaultBackgroundColor: string
  defaultOpacity: number
  defaultAlwaysOnTop: boolean
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Note operations
  getNotes: (): Promise<Note[]> => ipcRenderer.invoke('get-notes'),
  createNote: (noteData: Partial<Note>): Promise<Note> => ipcRenderer.invoke('create-note', noteData),
  updateNote: (noteId: string, updates: Partial<Note>): Promise<Note | null> => ipcRenderer.invoke('update-note', noteId, updates),
  deleteNote: (noteId: string): Promise<boolean> => ipcRenderer.invoke('delete-note', noteId),
  openNoteWindow: (noteId: string): Promise<boolean> => ipcRenderer.invoke('open-note-window', noteId),

  // Group operations
  getGroups: (): Promise<NoteGroup[]> => ipcRenderer.invoke('get-groups'),
  createGroup: (groupData: Partial<NoteGroup>): Promise<NoteGroup> => ipcRenderer.invoke('create-group', groupData),
  updateGroup: (groupId: string, updates: Partial<NoteGroup>): Promise<NoteGroup | null> => ipcRenderer.invoke('update-group', groupId, updates),
  deleteGroup: (groupId: string): Promise<boolean> => ipcRenderer.invoke('delete-group', groupId),
  deleteAllNotesInGroup: (groupId: string): Promise<boolean> => ipcRenderer.invoke('delete-all-notes-in-group', groupId),

  // Trash operations
  getTrash: (): Promise<TrashItem[]> => ipcRenderer.invoke('get-trash'),
  restoreNote: (trashId: string): Promise<boolean> => ipcRenderer.invoke('restore-note', trashId),
  permanentlyDeleteNote: (trashId: string): Promise<boolean> => ipcRenderer.invoke('permanently-delete-note', trashId),
  emptyTrash: (): Promise<boolean> => ipcRenderer.invoke('empty-trash'),

  // Layout operations
  getLayouts: (): Promise<Layout[]> => ipcRenderer.invoke('get-layouts'),
  saveLayout: (layoutName: string): Promise<Layout> => ipcRenderer.invoke('save-layout', layoutName),
  restoreLayout: (layoutId: string): Promise<boolean> => ipcRenderer.invoke('restore-layout', layoutId),

  // Window management
  expandAllNotes: (): Promise<void> => ipcRenderer.invoke('expand-all-notes'),
  collapseAllNotes: (): Promise<void> => ipcRenderer.invoke('collapse-all-notes'),
  showDashboard: (): Promise<void> => ipcRenderer.invoke('show-dashboard'),
  closeDashboard: (): Promise<void> => ipcRenderer.invoke('close-dashboard'),
  resetAllOpacity: (): Promise<boolean> => ipcRenderer.invoke('reset-all-opacity'),
  toggleWindowCollapse: (noteId: string, isCollapsed: boolean): Promise<boolean> => ipcRenderer.invoke('toggle-window-collapse', noteId, isCollapsed),

  // Settings
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  updateSettings: (key: string, value: string | number | boolean): Promise<Settings> => ipcRenderer.invoke('update-settings', key, value),

  // Window opacity control
  setWindowOpacity: (opacity: number): void => ipcRenderer.send('set-window-opacity', opacity),

  // Window management
  closeWindow: (): void => ipcRenderer.send('close-window'),
  minimizeWindow: (): void => ipcRenderer.send('minimize-window'),
  getWindowBounds: (): Promise<{ x: number; y: number }> => ipcRenderer.invoke('get-window-bounds'),

  // Collapse state change listener
  onCollapseStateChange: (callback: (noteId: string, isCollapsed: boolean) => void): (() => void) => {
    const handler = (event: any, noteId: string, isCollapsed: boolean) => {
      callback(noteId, isCollapsed);
    };
    ipcRenderer.on('note-collapse-state-changed', handler);
    return () => {
      ipcRenderer.removeListener('note-collapse-state-changed', handler);
    };
  },

  // Utility functions
  getUrlParams: (): URLSearchParams => {
    try {
      console.log('getUrlParams called, window.location.search:', window.location.search);
      const params = new URLSearchParams(window.location.search);
      console.log('getUrlParams result:', params);
      return params;
    } catch (error) {
      console.error('Error in getUrlParams:', error);
      return new URLSearchParams();
    }
  },
}) 