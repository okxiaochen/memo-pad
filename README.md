# MemoPad - Enhanced Sticky Notes for macOS

![MemoPad Logo](https://via.placeholder.com/150x50/667eea/ffffff?text=MemoPad)

MemoPad is a powerful, modern alternative to the built-in macOS Stickies app. It provides floating notes with advanced window management, group organization, and a beautiful dashboard interface.

## ✨ Features

### 🗒️ Enhanced Note Taking
- **Floating Notes**: Each note floats on top of other windows
- **Custom Colors**: Set unique background colors for each note
- **Transparency**: Adjustable opacity (80% default) for each note
- **Auto-save**: Notes save automatically as you type
- **Position Memory**: Notes remember their position and size

### 🎛️ Window Management
- **Always on Top**: Keep notes visible while working
- **Collapse/Expand**: Collapse notes to just the title bar
- **Collapse All/Expand All**: Quickly manage all notes at once
- **Rearrange**: Automatically arrange all visible notes
- **Reposition**: Restore original positions and collapse states

### 📁 Organization
- **Groups**: Organize notes into color-coded groups
- **Drag & Drop**: Easily move notes between groups
- **Ungrouped Notes**: Notes without groups are shown separately
- **Group Management**: Create, edit, and delete groups

### 🗑️ Trash System
- **Soft Delete**: Deleted notes go to trash first
- **Restore**: Bring back accidentally deleted notes
- **Permanent Delete**: Clean up when you're sure
- **Empty Trash**: Clear all deleted notes at once
- **Trash Preview**: See note content and group info in trash

### 🎨 Beautiful Dashboard
- **Simplified Interface**: Clean, focused design
- **Grouped View**: See notes organized by groups
- **Trash Management**: Restore or permanently delete notes
- **Quick Actions**: Create notes and groups easily

## 🚀 Installation

### Prerequisites
- macOS 10.14 or later
- Node.js 18+ and npm

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MemoPad
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run dist
   ```

## 📖 Usage

### Creating Notes
1. Open the dashboard (launches automatically)
2. Click "New Note" button in the dashboard
3. Or use the menu: Note → New Note (⌘+N)
4. Notes open at the mouse cursor position
5. Start typing immediately - notes auto-save

### Note Features
- **Auto-save**: Notes save automatically as you type
- **Settings Panel**: Click the gear icon (⚙) to customize:
  - Background color
  - Window opacity (50% - 100%)
  - Always on top behavior
- **Collapse**: Click the collapse button (▲/▼) to minimize to title bar
- **Close**: Click the × button to close the note

### Dashboard Features
- **New Note**: Create a new note at mouse position
- **New Group**: Create a new group for organizing notes
- **Close**: Hide the dashboard window
- **Group Management**: 
  - Create groups with custom names and colors
  - Delete groups (with confirmation for notes)
  - Delete all notes in a group
- **Trash Management**:
  - Restore individual notes
  - Permanently delete notes
  - Empty entire trash

### Keyboard Shortcuts
- `⌘ + N`: Create new note
- `⌘ + W`: Close current note
- `⌘ + ,`: Open settings (in note window)
- `⌘ + Alt + C`: Collapse all notes
- `⌘ + Alt + E`: Expand all notes
- `⌘ + Alt + F`: Toggle always on top
- `⌘ + Alt + T`: Toggle opacity

### Window Management
- **Rearrange**: Menu → Window → Rearrange Notes
- **Reposition**: Menu → Window → Reposition Notes
- **Collapse All**: Menu → Window → Collapse All Notes
- **Expand All**: Menu → Window → Expand All Notes

## 🔧 Development

### Project Structure
```
MemoPad/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main application logic
│   │   └── preload.ts     # Secure API bridge
│   └── renderer/          # Renderer processes
│       ├── dashboard.html # Dashboard window
│       ├── dashboard.jsx  # Dashboard React app
│       ├── note-react.html # Note window
│       └── note.jsx       # Note window React app
├── assets/                # App icons and assets
├── dist/                  # Built files
├── package.json
└── README.md
```

### Available Scripts
- `npm start`: Start development server
- `npm run dev:renderer`: Start Vite dev server for renderer
- `npm run dev:main`: Compile and run main process
- `npm run build`: Build for production
- `npm run dist`: Build and package for distribution
- `npm run type-check`: Run TypeScript type checking
- `npm run lint`: Run ESLint

### Tech Stack
- **Electron**: Desktop app framework
- **React**: UI library for dashboard and notes
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **electron-store**: Data persistence
- **CSS Grid/Flexbox**: Layout and styling

## 🎯 Recent Updates

### Latest Features
- ✅ Simplified dashboard interface
- ✅ Improved note window positioning
- ✅ Enhanced group management
- ✅ Better trash system with previews
- ✅ Collapse/expand functionality
- ✅ Window management shortcuts
- ✅ Auto-save improvements
- ✅ Default 80% opacity for new notes

### Removed Features
- ❌ Markdown support (simplified for better performance)
- ❌ Click-through mode (temporarily disabled)
- ❌ Layouts system (simplified UI)
- ❌ Complex settings panels

## 🐛 Troubleshooting

### Common Issues

**App won't start:**
- Ensure Node.js 18+ is installed
- Try removing `node_modules` and running `npm install` again
- Check for permission issues

**Notes not saving:**
- Check if the app has write permissions
- Restart the application
- Check console for error messages

**Poor performance:**
- Reduce the number of open notes
- Lower opacity for transparent notes
- Close other resource-intensive applications

### Debug Mode
Run with debug flags:
```bash
DEBUG=* npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by macOS Stickies
- Built with the amazing Electron framework
- Icons from Lucide React
- UI inspiration from modern design systems

## 📧 Support

If you encounter any issues or have feature requests, please:
1. Check the [Issues](https://github.com/youruser/markies/issues) page
2. Create a new issue if needed
3. Provide detailed information about your system and the problem

---

**Made with ❤️ for macOS productivity enthusiasts** 