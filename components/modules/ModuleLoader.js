/**
 * ModuleLoader.js
 * Loads and initializes modules while maintaining backward compatibility
 */

import promptManager from './PromptManager.js';
import uiComponents from './UIComponents.js';
import buttonManager from './ButtonManager.js';
import apiClient from './APIClient.js';

class ModuleLoader {
  constructor() {
    this.modules = {
      promptManager,
      uiComponents,
      buttonManager,
      apiClient
    };
    
    // Create global references for backward compatibility
    this.setupBackwardCompatibility();
  }
  
  /**
   * Setup backward compatibility by exposing key functions
   * as global functions that match the original implementation
   */
  setupBackwardCompatibility() {
    // Expose promptTypes globally
    window.promptTypes = promptManager.promptTypes;
    
    // Expose key functions as global functions
    window.prettyNameFor = (promptId) => promptManager.prettyNameFor(promptId);
    window.analyzeTextForPromptSuggestions = (text) => promptManager.analyzeTextForPromptSuggestions(text);
    window.determineRelevantPrompts = (text) => promptManager.determineRelevantPrompts(text);
    
    // Make sendToOpenAI use our new module
    window.sendToOpenAI = async (text, promptType) => {
      const response = await apiClient.sendToOpenAI(text, promptType, promptManager.promptTypes);
      return response;
    };
    
    // Expose button management functions
    window.convertButtonsToIconOnly = (buttons) => {
      // If no buttons are provided, find them
      if (!buttons) {
        buttons = document.querySelectorAll('.prompt-toggle');
      }
      buttonManager.convertButtonsToIconOnly(buttons);
    };
    
    // Set up the button observer
    window.setupButtonObserver = () => {
      buttonManager.setupButtonObserver('.prompt-toggle');
    };
    
    // Make createPromptButton use our new module
    window.createPromptButton = (promptId, isActive, clickHandler) => {
      return promptManager.createPromptButton(promptId, isActive, clickHandler);
    };
    
    console.log('Module loader initialized with backward compatibility');
  }
  
  /**
   * Get a module by name
   * @param {string} name - Module name
   * @returns {Object} The requested module
   */
  getModule(name) {
    return this.modules[name];
  }
}

// Create and export a singleton instance
export const moduleLoader = new ModuleLoader();
export default moduleLoader;