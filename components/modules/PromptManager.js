/**
 * PromptManager.js
 * Handles prompt templates, selection, and processing
 */

class PromptManager {
  constructor() {
    this.promptTypes = {
      explain: "Explain this text in simple, clear terms that anyone can understand. Break down complex concepts and provide context where needed. Focus on making the content accessible while preserving the key information.",
      
      eli5: "Explain this text as if to someone with no prior knowledge. Use simple, clear language and relatable examples without relying on overly trivial analogies. The explanation should be engaging, practical, and help build a real understanding of the concepts. Avoid jargon while still conveying the core ideas accurately.",
      
      'key-points': "Extract and list the most important key points from this text in bullet-point format. Focus on the main ideas, critical facts, and essential takeaways. Organize points by importance and ensure none of the crucial information is missed.",
      
      examples: "Provide 3-4 concrete, real-world examples that illustrate this concept clearly. For each example, explain how it demonstrates the main idea. Use diverse, relatable scenarios that help show practical applications.",
      
      'pros-cons': "Present a balanced analysis of both sides of this topic. List 3-4 clear advantages/benefits and 3-4 disadvantages/limitations, each with a brief explanation. Be objective and thorough in covering different perspectives.",
      
      'next-steps': "Suggest 4-5 practical, actionable next steps based on this information. Make recommendations specific, realistic and immediately applicable. Include brief explanations of how each step helps and what outcome to expect.",
      
      related: "Identify the most relevant academic papers, research, and publications related to this topic. For each source, provide the title, authors, publication date, and a 1-2 sentence summary of key findings or contributions.",
      
      summarize: "Create a concise, comprehensive summary of this text that captures all essential information in roughly 25% of the original length. Maintain the core message while eliminating redundancies and secondary details.",
      
      'fact-check': "Thoroughly verify the factual claims in this text and provide evidence for each verification. Identify any potential inaccuracies or misrepresentations. Support your analysis with credible sources where possible.",
      
      technical: "Provide a detailed technical explanation with precise terminology and domain-specific language. Assume an expert audience with background knowledge. Include relevant technical concepts, methodologies, frameworks, and technical implications.",
      
      analogy: "Explain this concept using 3-4 clear, intuitive analogies or metaphors. For each analogy, explain how it maps to the original concept and helps understand it. Choose analogies from different domains to provide multiple perspectives."
    };
  }

  /**
   * Returns a user-friendly name for a prompt type
   * @param {string} promptId - The prompt identifier
   * @returns {string} The formatted display name
   */
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
  }

  /**
   * Analyzes text to suggest appropriate prompts
   * @param {string} text - The text to analyze
   * @returns {Promise<string[]>} Array of suggested prompt IDs
   */
  async analyzeTextForPromptSuggestions(text) {
    // Count words and determine text characteristics
    const wordCount = text.trim().split(/\s+/).length;
    const hasNumbers = /\d+/.test(text);
    const hasQuestions = /\?/.test(text);
    const hasBulletPoints = /•|-|\*|[0-9]+\./.test(text);
    const hasComplex = /([A-Za-z]{12,})|([A-Za-z]+ology)|([A-Za-z]+ization)/.test(text);
    
    // Determine potential prompt types based on text characteristics
    const suggestions = [];
    
    // Text length-based suggestions
    if (wordCount > 100) {
      suggestions.push('summarize');
    } else {
      suggestions.push('explain');
    }
    
    // Content-based suggestions
    if (hasComplex) {
      suggestions.push('eli5');
    }
    
    if (hasQuestions) {
      suggestions.push('key-points');
    }
    
    if (wordCount > 50 && !hasBulletPoints) {
      suggestions.push('key-points');
    }
    
    // For medium-length texts, suggest pro/cons analysis
    if (wordCount > 75 && wordCount < 500) {
      suggestions.push('pros-cons');
    }
    
    // For technical content, suggest examples and analogies
    if (hasComplex || hasNumbers) {
      suggestions.push('examples');
      suggestions.push('analogy');
    }
    
    // Add technical option for longer, complex content
    if ((hasComplex && wordCount > 100) || (hasNumbers && hasComplex)) {
      suggestions.push('technical');
    }
    
    // Always include fact-check for any substantial content
    if (wordCount > 30) {
      suggestions.push('fact-check');
    }
    
    return suggestions;
  }

  /**
   * Determines the most relevant prompts for a given text
   * @param {string} text - The text to analyze
   * @returns {Promise<string[]>} Array of relevant prompt IDs
   */
  async determineRelevantPrompts(text) {
    // Get suggested prompts based on text analysis
    const suggestions = await this.analyzeTextForPromptSuggestions(text);
    
    // Always include these core options
    const corePrompts = ['explain', 'key-points', 'summarize'];
    
    // Combine suggestions with core prompts, removing duplicates
    const allPrompts = [...new Set([...suggestions, ...corePrompts])];
    
    // Cap at a reasonable number of prompts (8 max)
    return allPrompts.slice(0, 8);
  }

  /**
   * Handles changing to a new prompt type
   * @param {string} promptId - The prompt ID to change to
   * @param {string} text - The text to analyze
   * @returns {Promise<string>} Formatted content
   */
  async handlePromptChange(promptId, text, sendToOpenAIFn, formatContentFn, addToHistoryFn) {
    try {
      // We delegate these functions to avoid circular dependencies
      const response = await sendToOpenAIFn(text, promptId);
      let responseContent = response.choices[0].message.content;
      
      // Clean up partial citation patterns
      responseContent = this.cleanPartialCitations(responseContent);
      
      const formattedContent = await formatContentFn(promptId, responseContent, text);
      
      // Add to history if a function was provided
      if (addToHistoryFn) {
        await addToHistoryFn(text, formattedContent, promptId);
      }
      
      return formattedContent;
    } catch (error) {
      console.error('Error handling prompt change:', error);
      throw error;
    }
  }
  
  /**
   * Cleans up partial citation patterns from the response text
   * @param {string} text - The text to clean
   * @returns {string} Cleaned text
   */
  cleanPartialCitations(text) {
    if (!text) return text;
    
    return text
      // Remove partial "([XYZ](" patterns - like ([CDC](
      .replace(/\(\[[^\]]+\]\([^)]*\)/g, '')
      // Remove single leftover "([XYZ]" patterns - like ([Wikipedia]
      .replace(/\(\[[^\]]+\]/g, '')
      // Remove any leftover bracketed citations
      .replace(/\(\[[^\]]*\]?\)/g, '')
      // Trim extra whitespace
      .trim();
  }

  /**
   * Creates a UI button for a specific prompt type
   * @param {string} promptId - The prompt identifier
   * @param {boolean} isActive - Whether the button should be active
   * @param {Function} clickHandler - Click event handler
   * @returns {HTMLElement} The button element
   */
  createPromptButton(promptId, isActive = false, clickHandler) {
    const btn = document.createElement('button');
    btn.className = 'prompt-toggle';
    btn.setAttribute('data-value', promptId);
    btn.setAttribute('title', this.prettyNameFor(promptId));
    
    // Use consistent minimal icon for all prompt types
    const iconChar = '●'; // Simple dot icon for minimalistic design
    
    // Create the button content with both icon and text
    btn.innerHTML = `<span class="prompt-icon">${iconChar}</span><span class="prompt-text">${this.prettyNameFor(promptId)}</span>`;
    // Title attribute already set above for tooltip
    
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

  /**
   * Gets a prompt template
   * @param {string} promptType - The prompt type to retrieve
   * @returns {string} The prompt template
   */
  getPromptTemplate(promptType) {
    return this.promptTypes[promptType] || this.promptTypes['explain'];
  }
}

// Export as both a class and an instance
export const promptManager = new PromptManager();
export default promptManager;