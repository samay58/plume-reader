let isExtensionActive = true;

chrome.runtime.onSuspend.addListener(() => {
  isExtensionActive = false;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!isExtensionActive) {
    sendResponse({ success: false, error: 'Extension context invalidated' });
    return false;
  }

  console.log('Background received message:', {
    action: request.action,
    query: request.query,
    hasExaKey: request.exaKey ? 'yes' : 'no'
  });

  if (request.action === "searchExa") {
    const asyncResponse = async () => {
      try {
        console.log('Making Exa API request for query:', request.query);
        const response = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${request.exaKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: request.query,
            numResults: 5,
            useAutoprompt: true,
            type: "auto",
            contents: {
              text: {
                maxCharacters: 2000,
                includeHtmlTags: false
              },
              highlights: {
                numSentences: 3,
                highlightsPerUrl: 2
              }
            },
            livecrawl: "always"
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('Exa API Error:', error);
        sendResponse({ success: false, error: error.message });
      }
    };

    asyncResponse();
    return true;
  }

  if (request.action === "perplexityQuery") {
    const asyncResponse = async () => {
      try {
        console.log('Making Perplexity API request:', {
          hasKey: !!request.pplxKey,
          keyLength: request.pplxKey?.length,
          messages: request.messages
        });

        // Verify the API key format
        if (!request.pplxKey || !request.pplxKey.startsWith('pplx-')) {
          throw new Error('Invalid API key format. Key should start with "pplx-"');
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${request.pplxKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: request.messages
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Perplexity API error:', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText
          });
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('Perplexity API Error:', error);
        sendResponse({ success: false, error: error.message });
      }
    };

    asyncResponse();
    return true;
  }

  if (request.action === "exaAnswer") {
    const asyncResponse = async () => {
      try {
        console.log('Making Exa Answer API request:', {
          query: request.prompt,
          hasKey: !!request.exaKey
        });

        const response = await fetch('https://api.exa.ai/answer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${request.exaKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: request.prompt,
            model: "exa-pro",
            text: true
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Exa Answer API error:', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText
          });
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data || !data.answer) {
          throw new Error('Invalid response format from Exa API');
        }

        sendResponse({ success: true, data });
      } catch (error) {
        console.error('Exa Answer API Error:', error);
        sendResponse({ success: false, error: error.message });
      }
    };

    asyncResponse();
    return true;
  }

  if (request.action === "verifyExaClaim") {
    verifyExaClaim(request.claim, request.context, request.exaKey)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

// Function to verify claims using Exa API
async function verifyExaClaim(claim, context, apiKey) {
  const response = await fetch('https://api.exa.ai/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      claim: claim,
      context: context
    })
  });

  if (!response.ok) {
    throw new Error(`Exa API error: ${response.status}`);
  }

  return await response.json();
} 