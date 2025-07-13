import { app, BrowserWindow, ipcMain, Menu, dialog, shell, screen, globalShortcut } from 'electron'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import Store from 'electron-store'

// Define types for our data structures
interface Note {
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

interface NoteGroup {
  id: string
  name: string
  color: string
  noteIds: string[]
  createdAt: number
}

interface Layout {
  id: string
  name: string
  notes: Note[]
  groups: NoteGroup[]
  createdAt: number
}

interface TrashItem {
  id: string
  data: Note
  deletedAt: number
}

// Initialize electron-store for data persistence
const store = new Store<{
  notes: Note[]
  groups: NoteGroup[]
  layouts: Layout[]
  trash: TrashItem[]
  originalPositions: { [noteId: string]: { x: number; y: number } }
  originalCollapsedStates: { [noteId: string]: boolean }
  settings: {
    defaultBackgroundColor: string
    defaultOpacity: number
    defaultAlwaysOnTop: boolean
  }
}>({
  defaults: {
    notes: [],
    groups: [],
    layouts: [],
    trash: [],
    originalPositions: {},
    originalCollapsedStates: {},
    settings: {
      defaultBackgroundColor: 'rgba(255, 235, 59, 1.0)',
      defaultOpacity: 0.8, // Default to 80% opacity
      defaultAlwaysOnTop: true,
    },
  },
})

// Debug: Log the store path
console.log('Store path:', store.path)
console.log('Current notes in store:', store.get('notes'))

// Keep track of all windows
const noteWindows = new Map<string, BrowserWindow>()
let dashboardWindow: BrowserWindow | null = null

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createDashboardWindow(): void {
  dashboardWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegrationInWorker: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false,
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
    title: 'Markies',
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    show: false,
  })
  dashboardWindow.setWindowButtonVisibility(false)

  const url = isDev
    ? 'http://localhost:5177/dashboard.html'
    : `file://${path.join(__dirname, '../renderer/dashboard.html')}`

  dashboardWindow.loadURL(url)

  if (isDev) {
    dashboardWindow.webContents.openDevTools()
  }

  dashboardWindow.on('closed', () => {
    dashboardWindow = null
  })

  dashboardWindow.setMenuBarVisibility(false)
  
  // Show window after content is loaded to ensure proper rendering
  dashboardWindow.once('ready-to-show', () => {
    if (dashboardWindow) {
      dashboardWindow.show()
    }
  })
}

function createNoteWindow(note: Note): BrowserWindow {
  // Ensure opacity is valid, fix if needed (50% - 100%)
  if (!note.opacity || note.opacity < 0.5 || note.opacity > 1.0) {
    console.log(`Invalid opacity ${note.opacity} for note ${note.id}, setting to 1.0`);
    note.opacity = 1.0;
    // Update in storage
    const notes = store.get('notes');
    const noteIndex = notes.findIndex(n => n.id === note.id);
    if (noteIndex !== -1) {
      notes[noteIndex].opacity = 1.0;
      store.set('notes', notes);
    }
  }

  const noteWindow = new BrowserWindow({
    width: note.size.width,
    height: note.size.height,
    x: note.position.x,
    y: note.position.y,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    roundedCorners: false,
    resizable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    alwaysOnTop: note.alwaysOnTop,
    transparent: true,
    skipTaskbar: true,
    acceptFirstMouse: true,
  })
  noteWindow.setWindowButtonVisibility(false)

  const url = isDev
    ? `http://localhost:5177/note-react.html?id=${note.id}`
    : `file://${path.join(__dirname, '../renderer/note-react.html')}?id=${note.id}`

  noteWindow.loadURL(url)
  noteWindow.setMenuBarVisibility(false)
  if (isDev) {
    noteWindow.webContents.openDevTools()
  }

  // Set initial opacity immediately (before DOM loads for better UX)
  console.log(`Setting initial opacity for note ${note.id}: ${note.opacity}`);
  noteWindow.setOpacity(note.opacity)
  
  // Also set it again after DOM is ready for better compatibility
  noteWindow.webContents.once('dom-ready', () => {
    console.log(`Setting opacity for note ${note.id}: ${note.opacity}`)
    noteWindow.setOpacity(note.opacity)
  })

  // Temporarily disabled click-through functionality
  // if (note.clickThrough) {
  //   noteWindow.setIgnoreMouseEvents(true, { forward: true })
  // }

  // Handle window events
  noteWindow.on('closed', () => {
    noteWindows.delete(note.id)
    // Update note visibility status when window is closed
    const notes = store.get('notes')
    const noteIndex = notes.findIndex(n => n.id === note.id)
    if (noteIndex !== -1) {
      notes[noteIndex].isVisible = false
      notes[noteIndex].updatedAt = Date.now()
      store.set('notes', notes)
    }
  })

  noteWindow.on('moved', () => {
    const [x, y] = noteWindow.getPosition()
    updateNotePosition(note.id, { x, y })
  })

  noteWindow.on('resized', () => {
    const [width, height] = noteWindow.getSize()
    updateNoteSize(note.id, { width, height })
  })

  noteWindows.set(note.id, noteWindow)
  return noteWindow
}

// IPC handlers
ipcMain.handle('get-notes', () => {
  return store.get('notes')
})

ipcMain.handle('get-groups', () => {
  return store.get('groups')
})

ipcMain.handle('get-trash', () => {
  return store.get('trash')
})

ipcMain.handle('get-layouts', () => {
  return store.get('layouts')
})

ipcMain.handle('get-settings', () => {
  return store.get('settings')
})

ipcMain.handle('create-note', (event, noteData: Partial<Note>) => {
  // Debug: check current settings
  const currentSettings = store.get('settings');
  console.log('Current settings in store:', currentSettings);
  
  // Force defaultOpacity to 0.8 if it's not correct
  if (currentSettings.defaultOpacity !== 0.8) {
    console.log(`Updating defaultOpacity from ${currentSettings.defaultOpacity} to 0.8`);
    store.set('settings.defaultOpacity', 0.8);
  }

  // Force defaultBackgroundColor to rgba format if it's still hex
  if (currentSettings.defaultBackgroundColor === '#ffeb3b') {
    console.log(`Updating defaultBackgroundColor from ${currentSettings.defaultBackgroundColor} to rgba format`);
    store.set('settings.defaultBackgroundColor', 'rgba(255, 235, 59, 1.0)');
  }

  // Calculate position at mouse cursor
  const defaultSize = noteData.size || { width: 300, height: 270 }
  const smartPosition = calculateMousePosition(defaultSize)

  const newNote: Note = {
    id: uuidv4(),
    content: noteData.content || '',
    backgroundColor: noteData.backgroundColor || store.get('settings.defaultBackgroundColor'),
    opacity: noteData.opacity !== undefined ? noteData.opacity : 0.8, // Default to 0.8 for new notes
    clickThrough: false, // Temporarily disabled click-through
    alwaysOnTop: noteData.alwaysOnTop !== undefined ? noteData.alwaysOnTop : store.get('settings.defaultAlwaysOnTop'),
    position: smartPosition,
    size: defaultSize,
    groupId: noteData.groupId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCollapsed: false,
    isVisible: noteData.isVisible !== undefined ? noteData.isVisible : true, // Default to visible
  }
  
  console.log(`Creating new note with opacity: ${newNote.opacity} (80%)`)

  const notes = store.get('notes')
  notes.push(newNote)
  store.set('notes', notes)

  // Don't create window automatically - let the caller decide
  // createNoteWindow(newNote)

  return newNote
})

ipcMain.handle('update-note', (event, noteId: string, updates: Partial<Note>) => {
  console.log(`Updating note ${noteId} with updates:`, updates);
  
  const notes = store.get('notes')
  const noteIndex = notes.findIndex(n => n.id === noteId)
  
  if (noteIndex === -1) {
    console.log(`Note ${noteId} not found in store`);
    return null
  }

  const originalNote = notes[noteIndex];
  console.log(`Original note content: "${originalNote.content}"`);
  
  const updatedNote = { ...originalNote, ...updates, updatedAt: Date.now() }
  notes[noteIndex] = updatedNote
  store.set('notes', notes)
  
  console.log(`Updated note content: "${updatedNote.content}"`);

  // Update window properties if it exists
  const window = noteWindows.get(noteId)
  if (window) {
    if (updates.alwaysOnTop !== undefined) {
      console.log(`Setting alwaysOnTop for note ${noteId}: ${updates.alwaysOnTop}`)
      window.setAlwaysOnTop(updates.alwaysOnTop)
    }
    if (updates.opacity !== undefined) {
      // Note: Window opacity is now handled by 'set-window-opacity' IPC call
      // This just updates the stored opacity value
      console.log(`Updating stored opacity for note ${noteId}: ${updates.opacity}`)
    }
    // Temporarily disabled click-through functionality
    // if (updates.clickThrough !== undefined) {
    //   console.log(`Setting clickThrough for note ${noteId}: ${updates.clickThrough}`)
    //   window.setIgnoreMouseEvents(updates.clickThrough, { forward: true })
    // }
    if (updates.position) {
      window.setPosition(updates.position.x, updates.position.y)
    }
    if (updates.size) {
      window.setSize(updates.size.width, updates.size.height)
    }
  } else {
    console.log(`Window not found for note ${noteId}`);
  }

  return updatedNote
})

ipcMain.handle('delete-note', (event, noteId: string) => {
  const notes = store.get('notes')
  const noteIndex = notes.findIndex(n => n.id === noteId)
  
  if (noteIndex === -1) return false

  const note = notes[noteIndex]
  
  // Move to trash
  const trash = store.get('trash')
  trash.push({
    id: uuidv4(),
    data: note,
    deletedAt: Date.now(),
  })
  store.set('trash', trash)

  // Remove from notes
  notes.splice(noteIndex, 1)
  store.set('notes', notes)

  // Close window
  const window = noteWindows.get(noteId)
  if (window) {
    window.close()
  }

  return true
})

ipcMain.handle('restore-note', (event, trashId: string) => {
  const trash = store.get('trash')
  const trashIndex = trash.findIndex(t => t.id === trashId)
  
  if (trashIndex === -1) return false

  const trashItem = trash[trashIndex]
  const note = { ...trashItem.data, updatedAt: Date.now() }

  // Add back to notes
  const notes = store.get('notes')
  notes.push(note)
  store.set('notes', notes)

  // Remove from trash
  trash.splice(trashIndex, 1)
  store.set('trash', trash)

  // Create window for the restored note
  createNoteWindow(note)

  return true
})

ipcMain.handle('permanently-delete-note', (event, trashId: string) => {
  const trash = store.get('trash')
  const trashIndex = trash.findIndex(t => t.id === trashId)
  
  if (trashIndex === -1) return false

  trash.splice(trashIndex, 1)
  store.set('trash', trash)

  return true
})

ipcMain.handle('empty-trash', () => {
  store.set('trash', [])
  return true
})

ipcMain.handle('create-group', (event, groupData: Partial<NoteGroup>) => {
  const newGroup: NoteGroup = {
    id: uuidv4(),
    name: groupData.name || 'New Group',
    color: groupData.color || '#2196f3',
    noteIds: groupData.noteIds || [],
    createdAt: Date.now(),
  }

  const groups = store.get('groups')
  groups.push(newGroup)
  store.set('groups', groups)

  return newGroup
})

ipcMain.handle('update-group', (event, groupId: string, updates: Partial<NoteGroup>) => {
  const groups = store.get('groups')
  const groupIndex = groups.findIndex(g => g.id === groupId)
  
  if (groupIndex === -1) return null

  const updatedGroup = { ...groups[groupIndex], ...updates }
  groups[groupIndex] = updatedGroup
  store.set('groups', groups)

  return updatedGroup
})

ipcMain.handle('delete-group', (event, groupId: string) => {
  const groups = store.get('groups')
  const groupIndex = groups.findIndex(g => g.id === groupId)
  
  if (groupIndex === -1) return false

  // Remove group reference from notes
  const notes = store.get('notes')
  notes.forEach(note => {
    if (note.groupId === groupId) {
      note.groupId = undefined
    }
  })
  store.set('notes', notes)

  // Remove group
  groups.splice(groupIndex, 1)
  store.set('groups', groups)

  return true
})

ipcMain.handle('delete-all-notes-in-group', (event, groupId: string) => {
  const notes = store.get('notes')
  const groups = store.get('groups')
  const group = groups.find(g => g.id === groupId)
  
  if (!group) return false

  // Find all notes in this group
  const notesInGroup = notes.filter(note => note.groupId === groupId)
  
  if (notesInGroup.length === 0) return true // No notes to delete

  // Move notes to trash
  const trash = store.get('trash')
  notesInGroup.forEach(note => {
    trash.push({
      id: uuidv4(),
      data: note,
      deletedAt: Date.now(),
    })
  })
  store.set('trash', trash)

  // Remove notes from notes array
  const updatedNotes = notes.filter(note => note.groupId !== groupId)
  store.set('notes', updatedNotes)

  // Close windows for deleted notes
  notesInGroup.forEach(note => {
    const window = noteWindows.get(note.id)
    if (window) {
      window.close()
    }
  })

  return true
})

ipcMain.handle('save-layout', (event, layoutName: string) => {
  const newLayout: Layout = {
    id: uuidv4(),
    name: layoutName,
    notes: store.get('notes'),
    groups: store.get('groups'),
    createdAt: Date.now(),
  }

  const layouts = store.get('layouts')
  layouts.push(newLayout)
  store.set('layouts', layouts)

  return newLayout
})

ipcMain.handle('restore-layout', (event, layoutId: string) => {
  const layouts = store.get('layouts')
  const layout = layouts.find(l => l.id === layoutId)
  
  if (!layout) return false

  // Close all existing note windows
  noteWindows.forEach((window) => {
    window.close()
  })
  noteWindows.clear()

  // Restore layout
  store.set('notes', layout.notes)
  store.set('groups', layout.groups)

  // Create windows for all notes
  layout.notes.forEach(note => {
    createNoteWindow(note)
  })

  return true
})

ipcMain.handle('expand-all-notes', () => {
  const notes = store.get('notes')
  notes.forEach(note => {
    note.isCollapsed = false
    note.updatedAt = Date.now()
    const window = noteWindows.get(note.id)
    if (window) {
      window.show()
      window.setSize(note.size.width, note.size.height)
    }
  })
  store.set('notes', notes)
})

ipcMain.handle('collapse-all-notes', () => {
  const notes = store.get('notes')
  notes.forEach(note => {
    note.isCollapsed = true
    note.updatedAt = Date.now()
    const window = noteWindows.get(note.id)
    if (window) {
      window.setSize(note.size.width, 30) // Collapsed height
    }
  })
  store.set('notes', notes)
})

ipcMain.handle('show-dashboard', () => {
  if (dashboardWindow) {
    dashboardWindow.show()
    dashboardWindow.focus()
  } else {
    createDashboardWindow()
  }
})

ipcMain.handle('close-dashboard', () => {
  if (dashboardWindow) {
    dashboardWindow.hide()
  }
})

ipcMain.handle('reset-all-opacity', () => {
  const notes = store.get('notes')
  notes.forEach(note => {
    note.opacity = 1.0
    const window = noteWindows.get(note.id)
    if (window) {
      console.log(`Resetting opacity for note ${note.id} to 1.0`)
      window.setOpacity(1.0)
    }
  })
  store.set('notes', notes)
  console.log('Reset opacity for all notes to 100%')
  return true
})

// Handle window opacity changes
ipcMain.on('set-window-opacity', (event, opacity) => {
  console.log('Received set-window-opacity:', opacity)
  
  // Find the window that sent this event
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  
  if (senderWindow) {
    // Ensure opacity is within valid range (50% - 100%)
    const validOpacity = Math.max(0.5, Math.min(1.0, opacity))
    console.log(`Setting native window opacity: ${opacity} -> ${validOpacity}`)
    senderWindow.setOpacity(validOpacity)
  } else {
    console.log('Could not find sender window for opacity change')
  }
})

// Handle window close
ipcMain.on('close-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  if (senderWindow) {
    senderWindow.close()
  }
})

// Handle window minimize
ipcMain.on('minimize-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  if (senderWindow) {
    senderWindow.minimize()
  }
})

// Handle window collapse/expand
ipcMain.handle('toggle-window-collapse', (event, noteId: string, isCollapsed: boolean) => {
  const window = noteWindows.get(noteId)
  if (window) {
    const notes = store.get('notes')
    const note = notes.find(n => n.id === noteId)
    if (note) {
      note.isCollapsed = isCollapsed
      store.set('notes', notes)
      
      if (isCollapsed) {
        // Collapse: set height to 30px (title bar only)
        window.setSize(note.size.width, 30)
      } else {
        // Expand: restore original height
        window.setSize(note.size.width, note.size.height)
      }
      
      console.log(`Window ${noteId} ${isCollapsed ? 'collapsed' : 'expanded'}`)
      return true
    }
  }
  return false
})

ipcMain.handle('open-note-window', (event, noteId: string) => {
  const notes = store.get('notes')
  const note = notes.find(n => n.id === noteId)
  
  if (!note) return false

  // Check if window already exists
  const existingWindow = noteWindows.get(noteId)
  if (existingWindow) {
    existingWindow.show()
    existingWindow.focus()
    return true
  }

  // Create new window and update visibility status
  createNoteWindow(note)
  
  // Update note visibility status
  const noteIndex = notes.findIndex(n => n.id === noteId)
  if (noteIndex !== -1) {
    notes[noteIndex].isVisible = true
    notes[noteIndex].updatedAt = Date.now()
    store.set('notes', notes)
  }
  
  return true
})

// Helper functions
function updateNotePosition(noteId: string, position: { x: number; y: number }) {
  const notes = store.get('notes')
  const note = notes.find(n => n.id === noteId)
  if (note) {
    note.position = position
    note.updatedAt = Date.now()
    store.set('notes', notes)
  }
}

function updateNoteSize(noteId: string, size: { width: number; height: number }) {
  const notes = store.get('notes')
  const note = notes.find(n => n.id === noteId)
  if (note) {
    note.size = size
    note.updatedAt = Date.now()
    store.set('notes', notes)
  }
}

// Smart position calculation to avoid overlapping windows
function calculateMousePosition(windowSize: { width: number; height: number }): { x: number; y: number } {
  const displayBounds = screen.getPrimaryDisplay().bounds
  const defaultWidth = windowSize.width
  const defaultHeight = windowSize.height
  
  // Get current mouse position
  const mousePosition = screen.getCursorScreenPoint()
  let x = mousePosition.x
  let y = mousePosition.y
  
  // Adjust position so window doesn't go off screen
  if (x + defaultWidth > displayBounds.width) {
    x = displayBounds.width - defaultWidth - 20
  }
  if (y + defaultHeight > displayBounds.height) {
    y = displayBounds.height - defaultHeight - 20
  }
  if (x < 0) {
    x = 20
  }
  if (y < 0) {
    y = 20
  }
  
  console.log(`Creating window at mouse position: ${x}, ${y}`)
  return { x, y }
}

// App event handlers
app.whenReady().then(() => {
  // Register application shortcuts (not global)
  // These will only work when the app is focused

  // Create dashboard window
  createDashboardWindow()

  // Create windows for existing notes that should be visible
  const existingNotes = store.get('notes')
  console.log('Creating windows for existing notes...')
  existingNotes.forEach(note => {
    console.log(`Note ${note.id}: isVisible = ${note.isVisible}, will create window: ${note.isVisible === true}`)
    if (note.isVisible === true) { // Only create windows for notes explicitly marked as visible
      console.log(`Creating window for note ${note.id}`)
      createNoteWindow(note)
    }
  })

  // Create application menu
  const template = [
    {
      label: 'Markies',
      submenu: [
        { label: 'About Markies', role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services' },
        { type: 'separator' },
        { label: 'Hide Markies', accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Alt+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', role: 'quit' },
      ],
    },
    {
      label: 'Note',
      submenu: [
        { 
          label: 'New Note', 
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            console.log('Menu shortcut: Create New Note');
            
            // Calculate position at mouse cursor
            const defaultSize = { width: 300, height: 270 };
            const smartPosition = calculateMousePosition(defaultSize);

            const currentSettings = store.get('settings');
            const newNote: Note = {
              id: uuidv4(),
              content: '',
              backgroundColor: currentSettings.defaultBackgroundColor,
              opacity: 0.8, // Default to 80% opacity
              clickThrough: false,
              alwaysOnTop: currentSettings.defaultAlwaysOnTop,
              position: smartPosition,
              size: defaultSize,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isCollapsed: false,
              isVisible: true,
            };
            
            const notes = store.get('notes');
            notes.push(newNote);
            store.set('notes', notes);
            
            // Create window for the new note
            createNoteWindow(newNote);
          }
        },
        { type: 'separator' },
        { 
          label: 'Toggle Always on Top', 
          accelerator: 'CmdOrCtrl+Alt+F',
          click: () => {
            console.log('Menu shortcut: Toggle Always on Top');
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && noteWindows.has(focusedWindow.webContents.getURL().split('id=')[1]?.split('&')[0])) {
              const noteId = focusedWindow.webContents.getURL().split('id=')[1]?.split('&')[0];
              const notes = store.get('notes');
              const note = notes.find(n => n.id === noteId);
              if (note) {
                const newAlwaysOnTop = !note.alwaysOnTop;
                focusedWindow.setAlwaysOnTop(newAlwaysOnTop);
                // Update in store
                note.alwaysOnTop = newAlwaysOnTop;
                note.updatedAt = Date.now();
                store.set('notes', notes);
              }
            }
          }
        },
        { 
          label: 'Toggle Opacity', 
          accelerator: 'CmdOrCtrl+Alt+T',
          click: () => {
            console.log('Menu shortcut: Toggle Opacity');
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && noteWindows.has(focusedWindow.webContents.getURL().split('id=')[1]?.split('&')[0])) {
              const noteId = focusedWindow.webContents.getURL().split('id=')[1]?.split('&')[0];
              const notes = store.get('notes');
              const note = notes.find(n => n.id === noteId);
              if (note) {
                const newOpacity = note.opacity === 1.0 ? 0.8 : 1.0;
                focusedWindow.setOpacity(newOpacity);
                // Update in store
                note.opacity = newOpacity;
                note.updatedAt = Date.now();
                store.set('notes', notes);
              }
            }
          }
        },

      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'Ctrl+Command+F', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' },
        { type: 'separator' },
        { 
          label: 'Collapse All Notes', 
          accelerator: 'CmdOrCtrl+Alt+C',
          click: () => {
            console.log('Menu shortcut: Collapse All Notes');
            const notes = store.get('notes');
            notes.forEach(note => {
              // Use the same logic as individual note collapse
              note.isCollapsed = true;
              note.updatedAt = Date.now();
              const window = noteWindows.get(note.id);
              if (window) {
                window.setSize(note.size.width, 30); // Collapsed height
                // Send IPC message to trigger React re-render
                window.webContents.send('note-collapse-state-changed', note.id, true);
              }
            });
            store.set('notes', notes);
          }
        },
        { 
          label: 'Expand All Notes', 
          accelerator: 'CmdOrCtrl+Alt+E',
          click: () => {
            console.log('Menu shortcut: Expand All Notes');
            const notes = store.get('notes');
            notes.forEach(note => {
              // Use the same logic as individual note expand
              note.isCollapsed = false;
              note.updatedAt = Date.now();
              const window = noteWindows.get(note.id);
              if (window) {
                window.show();
                window.setSize(note.size.width, note.size.height);
                // Send IPC message to trigger React re-render
                window.webContents.send('note-collapse-state-changed', note.id, false);
              }
            });
            store.set('notes', notes);
          }
        },
        { type: 'separator' },
        { 
          label: 'Rearrange Notes', 
          accelerator: 'CmdOrCtrl+Alt+R',
          click: () => {
            console.log('Menu shortcut: Rearrange Notes');
            const notes = store.get('notes');
            const originalPositions = store.get('originalPositions');
            const originalCollapsedStates = store.get('originalCollapsedStates') || {};
            const displayBounds = screen.getPrimaryDisplay().bounds;
            
            // Save current positions and collapsed states as original
            notes.forEach(note => {
              if (note.isVisible === true) { // Only visible notes
                originalPositions[note.id] = { x: note.position.x, y: note.position.y };
                originalCollapsedStates[note.id] = note.isCollapsed;
              }
            });
            store.set('originalPositions', originalPositions);
            store.set('originalCollapsedStates', originalCollapsedStates);
            
            // Get only visible notes for rearrangement
            const visibleNotes = notes.filter(note => note.isVisible === true);
            console.log(`Rearranging ${visibleNotes.length} visible notes`);
            
            // Collapse all notes and arrange them vertically in top-left corner
            const startX = 20;
            const startY = 20;
            const spacing = 40; // Space between collapsed windows
            
            visibleNotes.forEach((note, index) => {
              // Collapse the note
              note.isCollapsed = true;
              note.updatedAt = Date.now();
              
              // Position in vertical stack
              const newY = startY + (index * spacing);
              note.position = { x: startX, y: newY };
              
              const window = noteWindows.get(note.id);
              if (window) {
                window.setSize(note.size.width, 30); // Collapsed height
                window.setPosition(startX, newY);
                // Send IPC message to trigger React re-render
                window.webContents.send('note-collapse-state-changed', note.id, true);
              }
            });
            
            store.set('notes', notes);
          }
        },
        { 
          label: 'Reposition Notes', 
          accelerator: 'CmdOrCtrl+Alt+P',
          click: () => {
            console.log('Menu shortcut: Reposition Notes');
            const notes = store.get('notes');
            const originalPositions = store.get('originalPositions');
            const originalCollapsedStates = store.get('originalCollapsedStates') || {};
            
            notes.forEach(note => {
              if (note.isVisible === true && originalPositions[note.id]) {
                // Restore original position
                note.position = originalPositions[note.id];
                note.updatedAt = Date.now();
                
                // Restore original collapsed state
                const wasCollapsed = originalCollapsedStates[note.id];
                note.isCollapsed = wasCollapsed;
                
                const window = noteWindows.get(note.id);
                if (window) {
                  window.setPosition(note.position.x, note.position.y);
                  
                  // Restore window size based on collapsed state
                  if (wasCollapsed) {
                    window.setSize(note.size.width, 30); // Collapsed height
                  } else {
                    window.setSize(note.size.width, note.size.height);
                  }
                  
                  // Send IPC message to trigger React re-render
                  window.webContents.send('note-collapse-state-changed', note.id, wasCollapsed);
                }
              }
            });
            
            store.set('notes', notes);
          }
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDashboardWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Clean up any resources before quitting
  globalShortcut.unregisterAll()
  noteWindows.clear()
}) 