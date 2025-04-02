/**
 * ButtonManager.js
 * Manages button creation, styling, and event handling
 */

class ButtonManager {
  /**
   * Initialize the button manager
   */
  constructor() {
    // Observer to monitor DOM for dynamically added buttons
    this.observer = null;
  }

  /**
   * Setup mutation observer to convert buttons to icon-only
   * @param {string} selector - CSS selector for buttons to convert
   */
  setupButtonObserver(selector) {
    // Disconnect existing observer if any
    if (this.observer) {
      this.observer.disconnect();
    }

    // Create a new mutation observer
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          // Check if any added node matches our selector
          setTimeout(() => {
            const addedButtons = document.querySelectorAll(selector);
            if (addedButtons.length) {
              this.convertButtonsToIconOnly(addedButtons);
            }
          }, 50); // Short delay to ensure DOM is stable
        }
      }
    });

    // Start observing the document
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Convert text buttons to icon-only buttons with tooltips
   * @param {NodeList|Array} buttons - Buttons to convert
   */
  convertButtonsToIconOnly(buttons) {
    buttons.forEach(button => {
      // Skip if already processed
      if (button.classList.contains('icon-only-processed')) return;
      
      // Mark as processed to avoid double-processing
      button.classList.add('icon-only-processed');
      
      // Extract text content if available or use data value
      const buttonText = button.querySelector('.prompt-text')?.textContent || 
                         button.getAttribute('data-value') || 
                         button.textContent;
      
      // Set tooltip
      button.setAttribute('title', buttonText);
      
      // Add icon-only class
      button.classList.add('icon-only');
    });
  }

  /**
   * Create a copy button
   * @param {Function} clickHandler - Handler for copy action
   * @returns {HTMLElement} Copy button element
   */
  createCopyButton(clickHandler) {
    const copyButton = document.createElement('button');
    copyButton.className = 'bobby-copy-button';
    copyButton.innerHTML = '📋';
    copyButton.setAttribute('title', 'Copy to clipboard');
    
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (clickHandler) {
        clickHandler();
      }
      
      // Visual feedback
      const originalText = copyButton.innerHTML;
      copyButton.innerHTML = '✓';
      copyButton.classList.add('copied');
      
      setTimeout(() => {
        copyButton.innerHTML = originalText;
        copyButton.classList.remove('copied');
      }, 1500);
    });
    
    return copyButton;
  }

  /**
   * Create a close button
   * @param {Function} clickHandler - Handler for close action
   * @returns {HTMLElement} Close button element
   */
  createCloseButton(clickHandler) {
    const closeButton = document.createElement('button');
    closeButton.className = 'bobby-close-button';
    closeButton.innerHTML = '✕';
    closeButton.setAttribute('title', 'Close');
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (clickHandler) {
        clickHandler();
      }
    });
    
    return closeButton;
  }

  /**
   * Creates buttons for contextual actions
   * @param {Array} actions - Array of action objects
   * @param {Function} clickHandler - Handler for button clicks
   * @returns {HTMLElement} Container with buttons
   */
  createActionButtons(actions, clickHandler) {
    const container = document.createElement('div');
    container.className = 'action-buttons-container';
    
    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = 'action-button';
      button.setAttribute('data-action', action.id);
      button.setAttribute('title', action.description || action.label);
      button.textContent = action.label;
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        if (clickHandler) {
          clickHandler(action.id);
        }
      });
      
      container.appendChild(button);
    });
    
    return container;
  }
}

// Export as both a class and an instance
export const buttonManager = new ButtonManager();
export default buttonManager;