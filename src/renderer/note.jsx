import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Rich text editor with enhanced features
class RichTextEditor {
    constructor(element, onContentChange) {
        this.element = element;
        this.onContentChange = onContentChange;
        this.isTyping = false;
        this.init();
    }

    init() {
        this.element.contentEditable = true;
        this.element.addEventListener('paste', this.handlePaste.bind(this));
        this.element.addEventListener('keydown', this.handleKeydown.bind(this));
        this.element.addEventListener('input', this.handleInput.bind(this));
        this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Add typing detection
        this.element.addEventListener('keydown', () => {
            this.isTyping = true;
        });
        
        this.element.addEventListener('keyup', () => {
            setTimeout(() => {
                this.isTyping = false;
            }, 100);
        });
    }

    handlePaste(e) {
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        
        // Handle image paste
        if (clipboardData.items) {
            for (let i = 0; i < clipboardData.items.length; i++) {
                const item = clipboardData.items[i];
                if (item.type.indexOf('image') !== -1) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        this.insertNode(img);
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }

        // Handle text paste
        const text = clipboardData.getData('text/plain');
        this.insertText(text);
    }

    handleKeydown(e) {
        // List creation
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const currentNode = range.startContainer;
            
            // Check if we're in a list item
            const listItem = currentNode.nodeType === Node.TEXT_NODE 
                ? currentNode.parentElement 
                : currentNode;
            
            if (listItem.tagName === 'LI') {
                e.preventDefault();
                this.createNewListItem(listItem);
                return;
            }

            // Check for list creation
            const lineText = this.getLineText(range);
            if (lineText.match(/^[\s]*[-*+]\s/)) {
                e.preventDefault();
                this.createUnorderedList(lineText);
                return;
            }
            if (lineText.match(/^[\s]*\d+\.\s/)) {
                e.preventDefault();
                this.createOrderedList(lineText);
                return;
            }
            if (lineText.match(/^[\s]*\[[\sxX]?\]\s/)) {
                e.preventDefault();
                this.createTodoList(lineText);
                return;
            }
        }

        // Todo toggle with space
        if (e.key === ' ' && this.isInTodoItem()) {
            e.preventDefault();
            this.toggleTodoItem();
            return;
        }

        // Strikethrough with Ctrl+S
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.toggleStrikethrough();
            return;
        }
    }

    handleInput() {
        // Only update content if not currently typing
        if (!this.isTyping) {
            this.onContentChange(this.element.innerHTML);
        } else {
            // Use a debounced approach for typing
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                this.onContentChange(this.element.innerHTML);
            }, 100);
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        // Use client coordinates which are relative to the window
        this.showContextMenu(e.clientX, e.clientY);
    }

    insertNode(node) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        this.onContentChange(this.element.innerHTML);
    }

    insertText(text) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        this.onContentChange(this.element.innerHTML);
    }

    getLineText(range) {
        const container = range.startContainer;
        const text = container.textContent || '';
        const offset = range.startOffset;
        const beforeCursor = text.substring(0, offset);
        const lines = beforeCursor.split('\n');
        return lines[lines.length - 1];
    }

    createUnorderedList(lineText) {
        const match = lineText.match(/^([\s]*)[-*+]\s(.+)/);
        if (match) {
            const [, spaces, content] = match;
            const listItem = document.createElement('li');
            listItem.textContent = content;
            
            const list = document.createElement('ul');
            list.appendChild(listItem);
            
            this.replaceCurrentLine(list);
        }
    }

    createOrderedList(lineText) {
        const match = lineText.match(/^([\s]*)\d+\.\s(.+)/);
        if (match) {
            const [, spaces, content] = match;
            const listItem = document.createElement('li');
            listItem.textContent = content;
            
            const list = document.createElement('ol');
            list.appendChild(listItem);
            
            this.replaceCurrentLine(list);
        }
    }

    createTodoList(lineText) {
        const match = lineText.match(/^([\s]*)\[([\sxX]?)\]\s(.+)/);
        if (match) {
            const [, spaces, checked, content] = match;
            const listItem = document.createElement('li');
            listItem.className = 'todo-item';
            listItem.innerHTML = `
                <input type="checkbox" ${checked.toLowerCase() === 'x' ? 'checked' : ''}>
                <span>${content}</span>
            `;
            
            const list = document.createElement('ul');
            list.className = 'todo-list';
            list.appendChild(listItem);
            
            this.replaceCurrentLine(list);
        }
    }

    createNewListItem(currentItem) {
        const newItem = document.createElement('li');
        newItem.innerHTML = '<br>';
        currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
        
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(newItem, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    isInTodoItem() {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        
        while (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
        
        return node && node.classList && node.classList.contains('todo-item');
    }

    toggleTodoItem() {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        
        while (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
        
        if (node && node.classList && node.classList.contains('todo-item')) {
            const checkbox = node.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                this.onContentChange(this.element.innerHTML);
            }
        }
    }

    toggleStrikethrough() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;
        
        // Check if the selection is already strikethrough
        let targetElement = null;
        
        // Get the common ancestor
        let commonAncestor = range.commonAncestorContainer;
        if (commonAncestor.nodeType === Node.TEXT_NODE) {
            commonAncestor = commonAncestor.parentElement;
        }
        
        // Look for a span with strikethrough that contains the entire selection
        let currentElement = commonAncestor;
        while (currentElement && currentElement !== this.element) {
            if (currentElement.tagName.toLowerCase() === 'span' && 
                currentElement.style.textDecoration === 'line-through') {
                // Check if this element contains the entire selection
                const elementRange = document.createRange();
                elementRange.selectNodeContents(currentElement);
                
                if (range.compareBoundaryPoints(Range.START_TO_START, elementRange) >= 0 &&
                    range.compareBoundaryPoints(Range.END_TO_END, elementRange) <= 0) {
                    targetElement = currentElement;
                    break;
                }
            }
            currentElement = currentElement.parentElement;
        }
        
        if (targetElement) {
            // Remove strikethrough - unwrap the content
            console.log('Removing strikethrough formatting');
            
            // Create a fragment with all the content
            const fragment = document.createDocumentFragment();
            while (targetElement.firstChild) {
                fragment.appendChild(targetElement.firstChild);
            }
            
            // Replace the target element with its content
            targetElement.parentNode.replaceChild(fragment, targetElement);
            
            // Restore selection to the unwrapped content
            const newRange = document.createRange();
            newRange.setStart(fragment.firstChild || fragment, 0);
            newRange.setEnd(fragment.lastChild || fragment, 
                fragment.lastChild ? fragment.lastChild.length : 0);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            // Add strikethrough - wrap the content
            const span = document.createElement('span');
            span.style.textDecoration = 'line-through';
            
            try {
                range.surroundContents(span);
                console.log('Applied strikethrough formatting');
            } catch (e) {
                console.log('surroundContents failed for strikethrough, trying alternative approach');
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
            }
            
            // Restore selection
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        this.onContentChange(this.element.innerHTML);
    }

    replaceCurrentLine(newElement) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        
        // Find the current line
        let lineNode = container;
        while (lineNode && lineNode.nodeType === Node.TEXT_NODE) {
            lineNode = lineNode.parentElement;
        }
        
        if (lineNode) {
            lineNode.parentNode.replaceChild(newElement, lineNode);
            const newRange = document.createRange();
            newRange.setStart(newElement, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            this.onContentChange(this.element.innerHTML);
        }
    }

    showContextMenu(x, y) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        // Calculate menu position to ensure it fits within the window
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const menuWidth = 150; // Approximate menu width
        const menuHeight = 300; // Approximate menu height
        
        let menuX = x;
        let menuY = y;
        
        // Adjust horizontal position if menu would go off-screen
        if (menuX + menuWidth > windowWidth) {
            menuX = windowWidth - menuWidth - 10;
        }
        
        // Adjust vertical position if menu would go off-screen
        if (menuY + menuHeight > windowHeight) {
            menuY = windowHeight - menuHeight - 10;
        }
        
        // Ensure menu doesn't go above or left of the window
        if (menuX < 10) menuX = 10;
        if (menuY < 10) menuY = 10;
        
        menu.style.cssText = `
            position: absolute;
            top: ${menuY}px;
            left: ${menuX}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 150px;
            max-width: 200px;
        `;

        const menuItems = [
            { label: 'Bold', action: () => this.execCommand('bold') },
            { label: 'Italic', action: () => this.execCommand('italic') },
            { label: 'Strikethrough', action: () => this.toggleStrikethrough() },
            { separator: true },
            { label: 'Bullet List', action: () => this.execCommand('insertUnorderedList') },
            { label: 'Numbered List', action: () => this.execCommand('insertOrderedList') },
            { label: 'Todo List', action: () => this.insertTodoItem() },
            { separator: true },
            { label: 'Font Size...', action: () => this.showFontSizeDialog() },
            { label: 'Font Family...', action: () => this.showFontFamilyDialog() },
            { separator: true },
            { label: 'Cut', action: () => this.execCommand('cut') },
            { label: 'Copy', action: () => this.execCommand('copy') },
            { label: 'Paste', action: () => this.execCommand('paste') }
        ];

        menuItems.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('hr');
                separator.style.cssText = 'margin: 4px 0; border: none; border-top: 1px solid #eee;';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.label;
                menuItem.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 14px;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    user-select: none;
                    -webkit-user-select: none;
                `;
                
                // Add hover effects
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = '#f0f0f0';
                });
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.backgroundColor = 'transparent';
                });
                
                // Fix click handling
                menuItem.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                
                menuItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Menu item clicked:', item.label);
                    try {
                        item.action();
                    } catch (error) {
                        console.error('Error executing menu action:', error);
                    }
                    menu.remove();
                });
                
                menu.appendChild(menuItem);
            }
        });

        // Append to the note container instead of document body
        this.element.parentElement.appendChild(menu);

        // Close menu when clicking outside or pressing Escape
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        // Add event listeners with a small delay to avoid immediate closure
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
            document.addEventListener('keydown', escapeHandler);
        }, 100);
    }

    execCommand(command, value = null) {
        // Modern approach using Selection API instead of execCommand
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        
        switch (command) {
            case 'bold':
                this.toggleFormat('strong');
                break;
            case 'italic':
                this.toggleFormat('em');
                break;
            case 'insertUnorderedList':
                this.insertList('ul');
                break;
            case 'insertOrderedList':
                this.insertList('ol');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'fontSize':
                this.setFontSize(value);
                break;
            case 'fontName':
                this.setFontFamily(value);
                break;
        }
        
        this.onContentChange(this.element.innerHTML);
    }

    toggleFormat(tagName) {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            console.log('No selection for formatting');
            return;
        }
        
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
            console.log('Selection is collapsed, cannot format');
            return;
        }
        
        // Check if the selection is already wrapped in the target tag
        let targetElement = null;
        
        // Check if the entire selection is within a single element of the target type
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        
        // Get the common ancestor
        let commonAncestor = range.commonAncestorContainer;
        if (commonAncestor.nodeType === Node.TEXT_NODE) {
            commonAncestor = commonAncestor.parentElement;
        }
        
        // Look for the target element that contains the entire selection
        let currentElement = commonAncestor;
        while (currentElement && currentElement !== this.element) {
            if (currentElement.tagName.toLowerCase() === tagName.toLowerCase()) {
                // Check if this element contains the entire selection
                const elementRange = document.createRange();
                elementRange.selectNodeContents(currentElement);
                
                if (range.compareBoundaryPoints(Range.START_TO_START, elementRange) >= 0 &&
                    range.compareBoundaryPoints(Range.END_TO_END, elementRange) <= 0) {
                    targetElement = currentElement;
                    break;
                }
            }
            currentElement = currentElement.parentElement;
        }
        
        if (targetElement) {
            // Remove formatting - unwrap the content
            console.log(`Removing ${tagName} formatting`);
            
            // Create a fragment with all the content
            const fragment = document.createDocumentFragment();
            while (targetElement.firstChild) {
                fragment.appendChild(targetElement.firstChild);
            }
            
            // Replace the target element with its content
            targetElement.parentNode.replaceChild(fragment, targetElement);
            
            // Restore selection to the unwrapped content
            const newRange = document.createRange();
            newRange.setStart(fragment.firstChild || fragment, 0);
            newRange.setEnd(fragment.lastChild || fragment, 
                fragment.lastChild ? fragment.lastChild.length : 0);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            // Add formatting - wrap the content
            const element = document.createElement(tagName);
            
            try {
                range.surroundContents(element);
                console.log(`Applied ${tagName} formatting`);
            } catch (e) {
                console.log('surroundContents failed, trying alternative approach');
                // If surroundContents fails, try a different approach
                const fragment = range.extractContents();
                element.appendChild(fragment);
                range.insertNode(element);
            }
            
            // Restore selection
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    insertList(listType) {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            console.log('No selection for list insertion');
            return;
        }
        
        const range = selection.getRangeAt(0);
        const list = document.createElement(listType);
        const listItem = document.createElement('li');
        
        // Get the text content and create list item
        const textContent = range.toString() || 'New list item';
        listItem.textContent = textContent;
        list.appendChild(listItem);
        
        console.log(`Creating ${listType} with text: "${textContent}"`);
        
        // Replace the selection with the list
        range.deleteContents();
        range.insertNode(list);
        
        // Place cursor in the list item
        const newRange = document.createRange();
        newRange.setStart(listItem, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        console.log(`List inserted successfully`);
    }

    setFontSize(size) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;
        
        // Check if the selection already has font size applied
        const parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer;
        
        // Check if we're already inside a span with font size
        let targetElement = null;
        let currentElement = parentElement;
        
        while (currentElement && currentElement !== this.element) {
            if (currentElement.tagName.toLowerCase() === 'span' && 
                currentElement.style.fontSize) {
                targetElement = currentElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }
        
        if (targetElement) {
            // Remove font size - unwrap the content
            console.log('Removing font size formatting');
            const fragment = document.createDocumentFragment();
            while (targetElement.firstChild) {
                fragment.appendChild(targetElement.firstChild);
            }
            targetElement.parentNode.replaceChild(fragment, targetElement);
        } else {
            // Add font size - wrap the content
            const span = document.createElement('span');
            span.style.fontSize = size + 'px';
            
            try {
                range.surroundContents(span);
                console.log(`Applied font size: ${size}px`);
            } catch (e) {
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
            }
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
    }

    setFontFamily(font) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;
        
        // Check if the selection already has font family applied
        const parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer;
        
        // Check if we're already inside a span with font family
        let targetElement = null;
        let currentElement = parentElement;
        
        while (currentElement && currentElement !== this.element) {
            if (currentElement.tagName.toLowerCase() === 'span' && 
                currentElement.style.fontFamily) {
                targetElement = currentElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }
        
        if (targetElement) {
            // Remove font family - unwrap the content
            console.log('Removing font family formatting');
            const fragment = document.createDocumentFragment();
            while (targetElement.firstChild) {
                fragment.appendChild(targetElement.firstChild);
            }
            targetElement.parentNode.replaceChild(fragment, targetElement);
        } else {
            // Add font family - wrap the content
            const span = document.createElement('span');
            span.style.fontFamily = font;
            
            try {
                range.surroundContents(span);
                console.log(`Applied font family: ${font}`);
            } catch (e) {
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
            }
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
    }

    insertTodoItem() {
        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        todoItem.innerHTML = '<input type="checkbox"><span>New todo item</span>';
        this.insertNode(todoItem);
    }

    showFontSizeDialog() {
        const size = prompt('Enter font size (px):', '14');
        if (size && !isNaN(size)) {
            this.execCommand('fontSize', size);
        }
    }

    showFontFamilyDialog() {
        const font = prompt('Enter font family:', 'Arial');
        if (font) {
            this.execCommand('fontName', font);
        }
    }
}

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
    // Temporarily removed clickThrough state
    
    const saveTimeoutRef = useRef(null);
    const noteContainerRef = useRef(null);
    const settingsPanelRef = useRef(null);
    const richEditorRef = useRef(null);
    
    console.log('Note component state:', { showSettings, currentNote: !!currentNote });

    // Initialize note
    useEffect(() => {
        const initializeNote = async () => {
            try {
                console.log('Initializing note...');
                
                // Get note ID from URL parameters - directly use window.location.search
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
                        // Temporarily removed clickThrough setting
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
                // Temporarily removed clickThrough
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
    }, [content, backgroundColor, opacity, alwaysOnTop]); // Removed clickThrough dependency

    // Initialize rich text editor
    useEffect(() => {
        if (richEditorRef.current && currentNote) {
            // Only initialize once
            if (!richEditorRef.current.richEditor) {
                richEditorRef.current.innerHTML = content;
                richEditorRef.current.richEditor = new RichTextEditor(richEditorRef.current, handleContentChange);
            }
        }
    }, [currentNote]);

    // Auto-save when content changes
    useEffect(() => {
        if (!currentNote) return; // No currentNote, don't auto-save
        
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
            // Temporarily removed clickThrough check
            
        if (!hasSettingsChanged) return;
        
        console.log('Settings changed, saving immediately...');
        saveNote();
    }, [backgroundColor, opacity, alwaysOnTop, currentNote, saveNote]);

    // Handle content change
    const handleContentChange = (newContent) => {
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
                    // Temporarily removed clickThrough
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
                        // Temporarily removed clickThrough
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
                    <div
                        ref={richEditorRef}
                        className="note-editor"
                        contentEditable={true}
                        spellCheck="false"
                        data-placeholder="Start typing your note..."
                        style={{
                            minHeight: '100px',
                            outline: 'none',
                            wordWrap: 'break-word'
                        }}
                    />
                    {!currentNote && <div style={{color: '#888', marginTop: 8}}>Loading...</div>}
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
                    
                    {/* Temporarily removed click-through setting */}
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
            padding: 10px 0;
        }

        .note-editor:empty:before {
            content: attr(data-placeholder);
            color: rgba(0, 0, 0, 0.3);
            pointer-events: none;
        }

        .todo-list {
            list-style: none;
            padding-left: 0;
            margin: 8px 0;
        }

        .todo-item {
            display: flex;
            align-items: flex-start;
            margin: 4px 0;
            padding: 2px 0;
        }

        .todo-item input[type="checkbox"] {
            margin-right: 8px;
            margin-top: 2px;
            flex-shrink: 0;
        }

        .todo-item span {
            flex: 1;
            line-height: 1.4;
        }

        .todo-item input[type="checkbox"]:checked + span {
            text-decoration: line-through;
            opacity: 0.6;
        }

        ul, ol {
            margin: 8px 0;
            padding-left: 20px;
        }

        li {
            margin: 2px 0;
        }

        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 8px 0;
        }

        .context-menu {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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