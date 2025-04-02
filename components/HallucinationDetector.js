window.HallucinationDetector = class HallucinationDetector {
  constructor(openaiKey, exaKey) {
    this.openaiKey = openaiKey;
    this.exaKey = exaKey;
  }

  async extractClaims(text) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a helpful assistant that extracts factual claims from text. Return ONLY a JSON array of objects with "claim" and "original_text" properties. Each object should contain a single factual claim from the text.'
          }, {
            role: 'user',
            content: text
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      // Try to parse as JSON, but handle errors gracefully
      try {
        const content = data.choices[0].message.content.trim();
        console.log("Raw AI response:", content);
        
        // Check if the response starts with an error message or doesn't look like JSON
        if (content.startsWith("I'm sorry") || 
            content.startsWith("Sorry") || 
            (!content.includes('{') && !content.includes('[')) ||
            content.includes("As an AI language model")) {
          console.log("AI returned a non-JSON response");
          // Create a default claim about the text
          return [{
            claim: "No specific claims could be extracted",
            original_text: text
          }];
        }
        
        // Try to extract JSON if it's wrapped in text
        let jsonStr = content;
        // Look for JSON array pattern - more robust pattern matching
        const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
          console.log("Extracted JSON array from response:", jsonStr);
        } else {
          // Try to find any JSON structure
          const fullJsonMatch = content.match(/(\[|\{).*(\]|\})/s);
          if (fullJsonMatch) {
            jsonStr = fullJsonMatch[0];
            console.log("Extracted possible JSON structure:", jsonStr);
          }
        }
        
        // Additional sanity check before parsing
        if (!jsonStr.startsWith('[') && !jsonStr.startsWith('{')) {
          console.log("Response doesn't start with valid JSON characters");
          throw new Error('Invalid JSON format');
        }
        
        const claims = JSON.parse(jsonStr);
        if (!Array.isArray(claims)) {
          console.log("Parsed result is not an array:", claims);
          
          // If we got an object instead of an array, try to convert it
          if (typeof claims === 'object' && claims !== null) {
            console.log("Converting object to array");
            // If it's an object with numbered keys, try to convert to array
            const possibleArray = Object.values(claims);
            if (possibleArray.length > 0) {
              return possibleArray;
            }
            // If it has a 'claims' property that's an array, use that
            if (Array.isArray(claims.claims)) {
              return claims.claims;
            }
          }
          
          throw new Error('Expected array of claims from OpenAI');
        }
        
        return claims;
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        // Return a fallback claim if parsing fails
        return [{
          claim: text.length > 100 ? text.substring(0, 100) + "..." : text,
          original_text: text
        }];
      }
    } catch (error) {
      console.error('Failed to extract claims:', error);
      throw error;
    }
  }

  async verifyClaim(claim, originalText) {
    try {
      // First, search for relevant sources
      const sources = await this.searchSources(claim);
      
      if (!sources || !sources.results || sources.results.length === 0) {
        return {
          claim,
          assessment: "Insufficient Information",
          confidence: 0,
          summary: "No reliable sources found to verify this claim.",
          sources: []
        };
      }

      // Then evaluate the claim against the sources
      const evaluation = await this.evaluateClaim(claim, originalText, sources.results);
      
      return {
        claim,
        assessment: evaluation.assessment,
        confidence: evaluation.confidence,
        summary: evaluation.summary,
        fixed_text: evaluation.fixed_text,
        sources: sources.results.map(s => s.url)
      };
    } catch (error) {
      console.error('Failed to verify claim:', error);
      throw error;
    }
  }

  async searchSources(claim) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: "searchExa",
        query: claim,
        exaKey: this.exaKey
      }, response => {
        if (!response) {
          reject(new Error('No response from background script'));
          return;
        }
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(`Exa API Error: ${response.error}`));
        }
      });
    });
  }

  async evaluateClaim(claim, originalText, sources) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: "You are a fact-checking assistant. Evaluate the claim against the provided sources and determine if it's true, false, or if there's insufficient information."
          }, {
            role: "user",
            content: `Evaluate this claim against the sources and return a JSON object with exactly these keys:
              {
                "assessment": "True" or "False" or "Insufficient Information",
                "confidence": (number between 0-100),
                "summary": "brief explanation",
                "fixed_text": "corrected version if false, otherwise same as original"
              }

              Claim: ${claim}
              Original context: ${originalText}
              Sources: ${JSON.stringify(sources.map(s => ({
                url: s.url,
                title: s.title,
                content: s.text
              })))}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Get raw content
      const rawContent = data.choices[0].message.content.trim();
      console.log("Raw evaluateClaim response:", rawContent);
      
      // Process the content to extract JSON
      let jsonContent = rawContent;
      
      try {
        // If content contains markdown code blocks, extract the content inside
        if (jsonContent.includes("```")) {
          const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonContent = codeBlockMatch[1].trim();
            console.log("Extracted JSON from code block:", jsonContent);
          }
        }
        
        // Find and extract JSON object pattern if embedded in other text
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log("Extracted JSON object pattern:", jsonContent);
        }
        
        const result = JSON.parse(jsonContent);
        
        if (!result.assessment || !result.confidence || !result.summary || !result.fixed_text) {
          console.log("Missing required fields in result:", result);
          throw new Error('Invalid response format from OpenAI');
        }
        
        return result;
      } catch (error) {
        console.error('JSON parsing error in evaluateClaim:', error);
        // Return a fallback result instead of throwing
        return {
          assessment: "Insufficient Information",
          confidence: 0,
          summary: "Could not properly evaluate the claim due to a technical error in parsing the response.",
          fixed_text: originalText
        };
      }
    } catch (error) {
      console.error('Error in evaluateClaim:', error);
      throw error;
    }
  }
} 