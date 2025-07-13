# Markies - Enhanced Sticky Notes for macOS

![Markies Logo](https://via.placeholder.com/150x50/667eea/ffffff?text=Markies)

Markies is a powerful, modern alternative to the built-in macOS Stickies app. It provides floating notes with markdown support, advanced window management, and a beautiful dashboard interface.

## ✨ Features

### 🗒️ Enhanced Note Taking
- **Floating Notes**: Each note floats on top of other windows (customizable)
- **Markdown Support**: Write in Markdown with live preview
- **Custom Colors**: Set unique background colors for each note
- **Transparency**: Adjustable opacity for each note
- **Click-Through**: Optional click-through functionality

### 🎛️ Window Management
- **Always on Top**: Keep notes visible while working
- **Expand/Collapse All**: Quickly manage all notes at once
- **Position Memory**: Notes remember their position and size
- **Responsive Design**: Beautiful UI that adapts to different screen sizes

### 📁 Organization
- **Groups**: Organize notes into color-coded groups
- **Drag & Drop**: Easily move notes between groups
- **Search**: Find notes quickly (coming soon)
- **Layouts**: Save and restore different note arrangements

### 🗑️ Trash System
- **Soft Delete**: Deleted notes go to trash first
- **Restore**: Bring back accidentally deleted notes
- **Permanent Delete**: Clean up when you're sure

### 🎨 Beautiful Dashboard
- **Grid View**: See all your notes at a glance
- **Group Management**: Create and manage note groups
- **Trash Management**: Restore or permanently delete notes
- **Layout Management**: Save and restore different arrangements

## 🚀 Installation

### Prerequisites
- macOS 10.14 or later
- Node.js 18+ and npm

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Markies
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
   npm run build:electron
   ```

## 📖 Usage

### Creating Notes
1. Open the dashboard (launches automatically)
2. Click "New Note" button
3. Fill in the title, content, and customize colors
4. Optionally assign to a group
5. Click "Create Note"

### Note Features
- **Edit/Preview Toggle**: Switch between editing and preview modes
- **Settings Panel**: Click the gear icon to customize:
  - Background color
  - Opacity (10% - 100%)
  - Always on top behavior
  - Click-through mode
- **Auto-save**: Notes save automatically as you type

### Keyboard Shortcuts
- `⌘ + N`: Create new note
- `⌘ + W`: Close current note
- `⌘ + ,`: Open settings
- `⌘ + Delete`: Delete current note

### Markdown Support
Markies supports standard Markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
`Inline code`

- List item 1
- List item 2

1. Numbered list
2. Second item

[Link text](https://example.com)

> Blockquote

\`\`\`
Code block
\`\`\`
```

### Groups
- Create groups from the dashboard
- Assign notes to groups when creating or editing
- Color-code groups for easy identification
- Drag notes between groups (coming soon)

### Layouts
- Save current arrangement of notes as a layout
- Restore previously saved layouts
- Great for different work contexts or projects

## 🔧 Development

### Project Structure
```
Markies/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main application logic
│   │   └── preload.ts     # Secure API bridge
│   └── renderer/          # Renderer processes
│       ├── dashboard.html # Dashboard window
│       ├── dashboard.jsx  # Dashboard React app
│       ├── note.html      # Note window
│       └── note.js        # Note window logic
├── dist/                  # Built files
├── package.json
└── README.md
```

### Available Scripts
- `npm start`: Start development server
- `npm run dev:renderer`: Start Vite dev server for renderer
- `npm run dev:main`: Compile and run main process
- `npm run build`: Build for production
- `npm run build:electron`: Build and package for distribution
- `npm run type-check`: Run TypeScript type checking
- `npm run lint`: Run ESLint

### Tech Stack
- **Electron**: Desktop app framework
- **React**: UI library for dashboard
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **electron-store**: Data persistence
- **CSS Grid/Flexbox**: Layout and styling

## 🎯 Roadmap

### Short Term
- [ ] Drag and drop between groups
- [ ] Search functionality
- [ ] Export notes (PDF, HTML, Markdown)
- [ ] Import from other apps

### Medium Term
- [ ] Real-time collaboration
- [ ] Cloud sync
- [ ] Plugins system
- [ ] Custom themes

### Long Term
- [ ] iOS/Android companion apps
- [ ] Web version
- [ ] AI-powered features
- [ ] Voice notes

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