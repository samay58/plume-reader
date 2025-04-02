/**
 * ModuleInitializer.js
 * Loads module functionality in a non-ESM way to maintain compatibility
 */

// This is a standard JavaScript file (not an ES module)
// It provides a bridge between the old code and new modular structure

(function() {
  // Store original functions to maintain compatibility
  const originalPromptTypes = window.promptTypes || {};
  const originalPrettyNameFor = window.prettyNameFor;
  const originalSendToOpenAI = window.sendToOpenAI;
  const originalConvertButtonsToIconOnly = window.convertButtonsToIconOnly;
  
  // Create module containers
  window.Bobby = window.Bobby || {};
  window.Bobby.modules = {};
  
  // PromptManager functionality
  window.Bobby.modules.promptManager = {
    promptTypes: {
      explain: "Explain this text in simple, clear terms that anyone can understand. Break down complex concepts and provide context where needed. Focus on making the content accessible while preserving the key information.",
      
      eli5: "Explain this text as if talking to a 5-year-old child. Use extremely simple language, short sentences, and child-friendly examples. Avoid complex terminology completely. Make it engaging and easy to understand for someone with no background knowledge.",
      
      'key-points': "Extract and list the most important key points from this text in bullet-point format. Focus on the main ideas, critical facts, and essential takeaways. Organize points by importance and ensure none of the crucial information is missed.",
      
      examples: "Provide 3-4 concrete, real-world examples that illustrate this concept clearly. For each example, explain how it demonstrates the main idea. Use diverse, relatable scenarios that help show practical applications.",
      
      'pros-cons': "Present a balanced analysis of both sides of this topic. List 3-4 clear advantages/benefits and 3-4 disadvantages/limitations, each with a brief explanation. Be objective and thorough in covering different perspectives.",
      
      'next-steps': "Suggest 4-5 practical, actionable next steps based on this information. Make recommendations specific, realistic and immediately applicable. Include brief explanations of how each step helps and what outcome to expect.",
      
      related: "Identify the most relevant academic papers, research, and publications related to this topic. For each source, provide the title, authors, publication date, and a 1-2 sentence summary of key findings or contributions.",
      
      summarize: "Create a concise, comprehensive summary of this text that captures all essential information in roughly 25% of the original length. Maintain the core message while eliminating redundancies and secondary details.",
      
      'fact-check': "Thoroughly verify the factual claims in this text and provide evidence for each verification. Identify any potential inaccuracies or misrepresentations. Support your analysis with credible sources where possible.",
      
      technical: "Provide a detailed technical explanation with precise terminology and domain-specific language. Assume an expert audience with background knowledge. Include relevant technical concepts, methodologies, frameworks, and technical implications.",
      
      analogy: "Explain this concept using 3-4 clear, intuitive analogies or metaphors. For each analogy, explain how it maps to the original concept and helps understand it. Choose analogies from different domains to provide multiple perspectives."
    },
    
    prettyNameFor(promptId) {
      switch(promptId) {
        case 'explain': return 'Explain';
        case 'eli5': return 'Simple Terms';
        case 'key-points': return 'Key Points';
        case 'summarize': return 'Summarize';
        case 'pros-cons': return 'Pros & Cons';
        case 'examples': return 'Examples';
        case 'technical': return 'Technical';
        case 'fact-check': return 'Fact Check';
        case 'analogy': return 'Analogies';
        case 'next-steps': return 'Next Steps';
        case 'related': return 'Related Reading';
        default: return promptId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    },

    createPromptButton(promptId, isActive = false, clickHandler) {
      const btn = document.createElement('button');
      btn.className = 'prompt-toggle';
      btn.setAttribute('data-value', promptId);
      btn.setAttribute('title', this.prettyNameFor(promptId));
      
      // Add appropriate icon based on prompt type
      let iconChar = '';
      switch(promptId) {
        case 'explain': iconChar = '💡'; break;
        case 'eli5': iconChar = '🧩'; break;
        case 'key-points': iconChar = '📌'; break;
        case 'summarize': iconChar = '📝'; break;
        case 'pros-cons': iconChar = '⚖️'; break;
        case 'examples': iconChar = '🔍'; break;
        case 'technical': iconChar = '⚙️'; break;
        case 'fact-check': iconChar = '✓'; break;
        case 'analogy': iconChar = '🔄'; break;
        case 'next-steps': iconChar = '⏭️'; break;
        case 'related': iconChar = '🔗'; break;
        default: iconChar = '•';
      }
      
      // Create the button content with icon and text
      btn.innerHTML = `<span class="prompt-icon">${iconChar}</span><span class="prompt-text">${this.prettyNameFor(promptId)}</span>`;
      
      // Mark as active if needed
      if (isActive) {
        btn.classList.add('active');
      }
      
      // Add click handler if provided
      if (clickHandler) {
        btn.addEventListener('click', clickHandler);
      }
      
      return btn;
    }
  };
  
  // ButtonManager functionality
  window.Bobby.modules.buttonManager = {
    observer: null,
    
    convertButtonsToIconOnly(buttons) {
      if (!buttons) {
        buttons = document.querySelectorAll('.prompt-toggle');
      }
      
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
    },
    
    setupButtonObserver(selector) {
      // Disconnect existing observer if any
      if (this.observer) {
        this.observer.disconnect();
      }
      
      const self = this;
      
      // Create a new mutation observer
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            // Check if any added node matches our selector
            setTimeout(() => {
              const addedButtons = document.querySelectorAll(selector);
              if (addedButtons.length) {
                self.convertButtonsToIconOnly(addedButtons);
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
  };
  
  // APIClient functionality
  window.Bobby.modules.apiClient = {
    cache: new Map(),
    
    async sendToOpenAI(text, promptType) {
      try {
        // Check if config is loaded
        if (!window.BOBBY_CONFIG?.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not set. Please set it in the extension options.');
        }
        
        // Use default prompt type if none provided
        promptType = promptType || 'explain';
        
        // Get the prompt template
        const promptTemplate = window.Bobby.modules.promptManager.promptTypes[promptType] || 
                              window.Bobby.modules.promptManager.promptTypes['explain'];
        
        // Create cache key
        const cacheKey = `openai:${promptType}:${text}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey);
        }
        
        // Combine template with text
        const combinedPrompt = `${promptTemplate}\n\nText: "${text}"`;
        
        console.log('Sending to OpenAI with prompt type:', promptType);
        
        // Send request to OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.BOBBY_CONFIG.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that provides clear, accurate explanations."
              },
              {
                role: "user",
                content: combinedPrompt
              }
            ]
          })
        });
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Cache the result
        this.cache.set(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Error in sendToOpenAI:', error);
        throw error;
      }
    },
    
    clearCache() {
      this.cache.clear();
    }
  };
  
  // UIComponents functionality
  window.Bobby.modules.uiComponents = {
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
  };
  
  // Make global exports backward compatible
  window.promptTypes = window.Bobby.modules.promptManager.promptTypes;
  window.prettyNameFor = function(promptId) {
    return window.Bobby.modules.promptManager.prettyNameFor(promptId);
  };
  window.createPromptButton = function(promptId, isActive, clickHandler) {
    return window.Bobby.modules.promptManager.createPromptButton(promptId, isActive, clickHandler);
  };
  window.convertButtonsToIconOnly = function(buttons) {
    window.Bobby.modules.buttonManager.convertButtonsToIconOnly(buttons);
  };
  window.sendToOpenAI = function(text, promptType) {
    return window.Bobby.modules.apiClient.sendToOpenAI(text, promptType);
  };
  
  console.log('Bobby modules initialized via ModuleInitializer');
})();