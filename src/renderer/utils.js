/**
 * Utility functions for Markies
 */

/**
 * Strip HTML tags from text content
 * @param {string} html - HTML string to strip tags from
 * @returns {string} Clean text without HTML tags
 */
export const stripHtml = (html) => {
  if (!html) return '';
  
  // Create a temporary div element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get text content (strips all HTML tags)
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Get the first line of text from HTML content
 * @param {string} html - HTML string
 * @returns {string} First line of clean text
 */
export const getFirstLine = (html) => {
  if (!html) return 'Untitled Note';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get all paragraph elements
  const paragraphs = tempDiv.querySelectorAll('p');
  
  // Find the first paragraph with actual text content
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const text = paragraph.textContent.trim();
    if (text && text !== '\u200B') { // \u200B is zero-width space
      return text;
    }
  }
  
  // If no paragraphs with text, try getting any text content
  const fullText = tempDiv.textContent.trim();
  if (fullText && fullText !== '\u200B') {
    return fullText;
  }
  
  return 'Untitled Note';
};

/**
 * Get a preview of text content from HTML
 * @param {string} html - HTML string
 * @param {number} maxLength - Maximum length for preview
 * @returns {string} Preview text
 */
export const getTextPreview = (html, maxLength = 200) => {
  if (!html) return 'Click to start typing...';
  
  const cleanText = stripHtml(html);
  return cleanText.length > maxLength 
    ? cleanText.substring(0, maxLength) + '...' 
    : cleanText;
};

/**
 * Convert HTML content to plain text for display
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export const htmlToText = (html) => {
  return stripHtml(html);
}; 