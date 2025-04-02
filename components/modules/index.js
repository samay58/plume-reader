/**
 * Module index
 * Main entry point for modular functionality
 */

import promptManager from './PromptManager.js';
import buttonManager from './ButtonManager.js';
import uiComponents from './UIComponents.js';
import apiClient from './APIClient.js';

// Export individual modules
export {
  promptManager,
  buttonManager,
  uiComponents,
  apiClient
};

// Setup global references for backward compatibility
// This is temporary until content.js is fully modularized
window.BOBBY_MODULES = {
  promptManager,
  buttonManager,
  uiComponents,
  apiClient
};

// Log that modules are ready
console.log('Bobby modules initialized');

// Export default object with all modules
export default {
  promptManager,
  buttonManager,
  uiComponents,
  apiClient
};