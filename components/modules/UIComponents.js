/**
 * UIComponents.js
 * Reusable UI components and interface elements
 */

class UIComponents {
  /**
   * Creates a collapsible content element
   * @param {HTMLElement} contentElement - The element containing content
   * @param {string} headerText - Text to show in the header
   * @param {boolean} startExpanded - Whether to start expanded
   * @returns {HTMLElement} The collapsible container element
   */
  createCollapsible(contentElement, headerText, startExpanded = false) {
    const container = document.createElement('div');
    container.className = 'collapsible-container';
    
    // Create header with toggle button
    const header = document.createElement('div');
    header.className = 'collapsible-header';
    header.textContent = headerText;
    
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'collapsible-toggle';
    toggleIcon.textContent = startExpanded ? '−' : '+';
    header.prepend(toggleIcon);
    
    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'collapsible-content';
    contentWrapper.style.display = startExpanded ? 'block' : 'none';
    contentWrapper.appendChild(contentElement);
    
    // Add event listener to toggle
    header.addEventListener('click', () => {
      const isExpanded = contentWrapper.style.display !== 'none';
      contentWrapper.style.display = isExpanded ? 'none' : 'block';
      toggleIcon.textContent = isExpanded ? '+' : '−';
    });
    
    // Assemble container
    container.appendChild(header);
    container.appendChild(contentWrapper);
    
    return container;
  }
  
  /**
   * Creates a loading indicator
   * @param {string} message - Loading message to display
   * @returns {HTMLElement} The loading indicator element
   */
  createLoadingIndicator(message = 'Loading...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    const messageElem = document.createElement('div');
    messageElem.className = 'loading-message';
    messageElem.textContent = message;
    
    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(messageElem);
    
    return loadingDiv;
  }
  
  /**
   * Creates a button with standardized styling
   * @param {string} text - Button text
   * @param {string} className - Additional CSS class(es)
   * @param {Function} clickHandler - Click event handler
   * @returns {HTMLElement} The button element
   */
  createButton(text, className = '', clickHandler = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `bobby-button ${className}`;
    
    if (clickHandler) {
      button.addEventListener('click', clickHandler);
    }
    
    return button;
  }
  
  /**
   * Creates an icon button with a tooltip
   * @param {string} icon - The icon content (text or HTML)
   * @param {string} tooltip - Tooltip text
   * @param {string} className - Additional CSS class(es)
   * @param {Function} clickHandler - Click event handler
   * @returns {HTMLElement} The button element
   */
  createIconButton(icon, tooltip, className = '', clickHandler = null) {
    const button = document.createElement('button');
    button.innerHTML = icon;
    button.className = `bobby-icon-btn ${className}`;
    button.setAttribute('title', tooltip);
    
    if (clickHandler) {
      button.addEventListener('click', clickHandler);
    }
    
    return button;
  }
  
  /**
   * Creates a toggle button with on/off state
   * @param {string} text - Button text
   * @param {boolean} initialState - Initial toggle state
   * @param {Function} changeHandler - State change handler
   * @returns {HTMLElement} The toggle button element
   */
  createToggle(text, initialState = false, changeHandler = null) {
    const container = document.createElement('div');
    container.className = 'bobby-toggle-container';
    
    const label = document.createElement('label');
    label.className = 'bobby-toggle-label';
    label.textContent = text;
    
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'bobby-toggle';
    toggle.checked = initialState;
    
    const slider = document.createElement('span');
    slider.className = 'bobby-toggle-slider';
    
    if (changeHandler) {
      toggle.addEventListener('change', () => changeHandler(toggle.checked));
    }
    
    label.appendChild(toggle);
    label.appendChild(slider);
    container.appendChild(label);
    
    return container;
  }
  
  /**
   * Creates a tooltip element
   * @param {HTMLElement} targetElement - Element to attach tooltip to
   * @param {string} text - Tooltip text
   * @param {string} position - Tooltip position (top, bottom, left, right)
   */
  addTooltip(targetElement, text, position = 'top') {
    // Set the title attribute for native browser tooltips
    targetElement.setAttribute('title', text);
    
    // Also add data attributes for custom CSS tooltips
    targetElement.setAttribute('data-tooltip', text);
    targetElement.setAttribute('data-tooltip-position', position);
    targetElement.classList.add('has-tooltip');
  }
}

// Export as both a class and an instance
export const uiComponents = new UIComponents();
export default uiComponents;