/**
 * APIClient.js
 * Handles API calls to various services (OpenAI, Perplexity, etc.)
 */

class APIClient {
  /**
   * Initialize the API client
   */
  constructor() {
    // Cache for responses
    this.cache = new Map();
  }

  /**
   * Send prompt to OpenAI for processing
   * @param {string} text - Text to analyze
   * @param {string} promptType - Type of prompt to use
   * @param {Object} promptTypes - Object containing prompt templates
   * @returns {Promise<Object>} API response
   */
  async sendToOpenAI(text, promptType, promptTypes) {
    try {
      // Check if config is loaded
      if (!window.BOBBY_CONFIG?.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not set. Please set it in the extension options.');
      }
      
      // Use default prompt type if none provided
      promptType = promptType || 'explain';
      
      // Get the prompt template
      const promptTemplate = promptTypes[promptType] || promptTypes['explain'];
      
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
  }

  /**
   * Send a follow-up question using the selected API
   * @param {string} question - Follow-up question
   * @param {string} originalText - Original text context
   * @param {string} apiType - API to use ('openai' or 'perplexity')
   * @returns {Promise<string>} Response text
   */
  async sendFollowUpQuestion(question, originalText, apiType = 'openai') {
    try {
      let rawResponse;
      
      if (apiType === 'perplexity' && window.BOBBY_CONFIG?.PERPLEXITY_API_KEY) {
        rawResponse = await this.sendToPerplexity(question, originalText);
      } else {
        // Default to OpenAI
        const prompt = `Context: "${originalText}"\n\nQuestion: ${question}\n\nPlease answer the question based on the context provided. If the context doesn't contain enough information to answer, say so clearly.`;
        
        const response = await this.sendToOpenAI(
          prompt, 
          'custom',
          { custom: prompt }
        );
        
        rawResponse = response.choices[0].message.content;
      }
      
      // Clean up citation text
      const cleanedResponse = this.cleanPartialCitations(rawResponse);
      
      // Format the response - if it's long, wrap it in a collapsible container
      if (cleanedResponse.length > 500) {
        return `
          <div class="collapsible-container">
            <div class="collapsible-content collapsed">
              ${cleanedResponse}
            </div>
            <button class="expand-collapse-btn">Show More</button>
          </div>
        `;
      } else {
        // For shorter answers, return as is
        return cleanedResponse;
      }
    } catch (error) {
      console.error('Error sending follow-up question:', error);
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
   * Send query to Perplexity API
   * @param {string} question - Question to ask
   * @param {string} context - Context information
   * @returns {Promise<string>} Response text
   */
  async sendToPerplexity(question, context) {
    try {
      if (!window.BOBBY_CONFIG?.PERPLEXITY_API_KEY) {
        throw new Error('Perplexity API key not set. Please set it in the extension options.');
      }
      
      const cacheKey = `perplexity:${question}:${context}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.BOBBY_CONFIG.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: "sonar-medium-online",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions based on the provided context."
            },
            {
              role: "user",
              content: `Context: "${context}"\n\nQuestion: ${question}\n\nPlease answer the question based on the context provided.`
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const result = await response.json();
      const answerText = result.choices[0].message.content;
      
      // Cache the result
      this.cache.set(cacheKey, answerText);
      
      return answerText;
    } catch (error) {
      console.error('Error in sendToPerplexity:', error);
      throw error;
    }
  }

  /**
   * Check facts using the Exa API or fallback to OpenAI
   * @param {string} text - Text to fact check
   * @returns {Promise<Object>} Fact check results
   */
  async factCheck(text) {
    try {
      // Implement fact checking logic
      // This would typically involve searching for sources and verifying claims
      
      // For now, we'll use a simple OpenAI-based approach
      const response = await this.sendToOpenAI(
        text,
        'fact-check',
        { 'fact-check': "Thoroughly verify the factual claims in this text and provide evidence for each verification. Identify any potential inaccuracies or misrepresentations. Support your analysis with credible sources where possible." }
      );
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in factCheck:', error);
      throw error;
    }
  }

  /**
   * Clear the response cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export as both a class and an instance
export const apiClient = new APIClient();
export default apiClient;