// History management for Bobby
class HistoryManager {
  constructor() {
    this.MAX_HISTORY_ITEMS = 50; // Maximum number of items to store
  }

  async addToHistory(query, response, promptType) {
    try {
      const history = await this.getHistory();
      const newItem = {
        timestamp: Date.now(),
        query,
        response,
        promptType
      };

      // Add new item to the beginning
      history.unshift(newItem);

      // Keep only the latest MAX_HISTORY_ITEMS
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history.pop();
      }

      await chrome.storage.local.set({ 'bobby_history': history });
      return true;
    } catch (error) {
      console.error('Failed to add to history:', error);
      return false;
    }
  }

  async getHistory() {
    try {
      const result = await chrome.storage.local.get('bobby_history');
      return result.bobby_history || [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  async clearHistory() {
    try {
      await chrome.storage.local.remove('bobby_history');
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
}

// Export for use in other files
window.HistoryManager = new HistoryManager(); 

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['chatHistory'], function(result) {
        const history = result.chatHistory || [];
        const container = document.getElementById('history-container');
        
        history.reverse().forEach(chat => {
            const chatDiv = document.createElement('div');
            chatDiv.className = 'chat-entry';
            chatDiv.innerHTML = `
                <div class="timestamp">${new Date(chat.timestamp).toLocaleString()}</div>
                <div class="prompt"><strong>You:</strong> ${chat.prompt}</div>
                <div class="response"><strong>AI:</strong> ${chat.response}</div>
            `;
            container.appendChild(chatDiv);
        });
    });
}); 