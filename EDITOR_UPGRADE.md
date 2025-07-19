# Markies Editor Upgrade Guide

## Overview

To solve the issues with the original note editor, we have integrated mature third-party editor plugins to provide a better editing experience.

## New Editor Options

### 1. Quill.js Editor (Recommended)
- **Files**: `src/renderer/note-quill.jsx` and `src/renderer/note-quill.html`
- **Features**:
  - Powerful rich text editor
  - Supports bold, italic, underline, strikethrough
  - Supports headers, lists, quotes, code blocks
  - Supports colors, fonts, alignment
  - Supports links, images, video insertion
  - Supports undo/redo
  - Auto-save functionality
  - Responsive design

### 2. Simple Text Editor (Backup)
- **Files**: `src/renderer/note-simple.jsx` and `src/renderer/note-simple.html`
- **Features**:
  - Lightweight text editor
  - Based on textarea implementation
  - Fast response
  - Good compatibility
  - Auto-save functionality

## How to Switch Editors

In the `src/main/main.ts` file, find the following code:

```typescript
const useQuillEditor = true; // Set to false to use simple editor
```

- Set to `true` to use Quill.js editor
- Set to `false` to use simple text editor

## Installed Dependencies

```bash
npm install quill
```

## Editor Feature Comparison

| Feature | Quill.js | Simple Editor |
|---------|----------|---------------|
| Rich Text Editing | ✅ | ❌ |
| Formatting Toolbar | ✅ | ❌ |
| Image Insertion | ✅ | ❌ |
| Link Insertion | ✅ | ❌ |
| List Support | ✅ | ❌ |
| Code Blocks | ✅ | ❌ |
| Color Selection | ✅ | ❌ |
| Font Selection | ✅ | ❌ |
| Performance | Medium | High |
| File Size | Large | Small |
| Compatibility | Good | Very Good |

## Usage Recommendations

1. **Recommended to use Quill.js editor**:
   - More features
   - Better user experience
   - Supports more formatting options

2. **If you encounter issues, you can switch to the simple editor**:
   - Change `useQuillEditor` to `false` in `src/main/main.ts`
   - Restart the application

## Troubleshooting

### Quill.js Editor Issues
1. If the editor doesn't display, check console errors
2. Ensure Quill.js dependency is properly installed
3. Check network connection (CDN resources need to be loaded in development mode)

### Simple Editor Issues
1. If text doesn't save, check IPC communication
2. Ensure file permissions are correct

## Future Plans

1. Add more editor options (such as TinyMCE, ProseMirror)
2. Support Markdown editing
3. Add code syntax highlighting
4. Support table editing
5. Add more theme options

## Technical Details

### Quill.js Configuration
```javascript
const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean'],
    ['link', 'image', 'video']
];
```

### Auto-save Mechanism
- Auto-save 1 second after content changes
- Settings changes save immediately
- Auto-save before window closes

### HTML Content Handling
- Quill.js saves content as HTML
- HTML tags are stripped for display in titles and previews
- Clean text is shown in dashboard and note titles
- Rich formatting is preserved in the editor

### Style Adaptation
- Editor styles automatically adjust based on background color
- Supports dark/light themes
- Responsive design adapts to different window sizes 