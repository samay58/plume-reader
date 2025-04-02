document.addEventListener('DOMContentLoaded', async () => {
  const historyDiv = document.getElementById('history');
  const history = await window.HistoryManager.getHistory();

  if (history.length === 0) {
    historyDiv.innerHTML = '<p>No history yet. Start highlighting text to get explanations!</p>';
    return;
  }

  historyDiv.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="timestamp">${window.HistoryManager.formatDate(item.timestamp)}</div>
      <div class="prompt-type">${item.promptType}</div>
      <div class="query">${item.query}</div>
      <div class="response">${item.response}</div>
    </div>
  `).join('');

  document.getElementById('clearHistory').addEventListener('click', async () => {
    await window.HistoryManager.clearHistory();
    historyDiv.innerHTML = '<p>History cleared!</p>';
  });
}); 