// When config.js is loaded, store keys in Chrome storage
if (window.BOBBY_CONFIG) {
  chrome.storage.local.set({
    OPENAI_API_KEY: window.BOBBY_CONFIG.OPENAI_API_KEY,
    EXA_API_KEY: window.BOBBY_CONFIG.EXA_API_KEY,
    PPLX_API_KEY: window.BOBBY_CONFIG.PPLX_API_KEY
  });
} 

// Add Perplexity API key field to the options form
document.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  
  const pplxKeyInput = document.getElementById('pplx-key');
  
  // Load saved settings
  chrome.storage.sync.get({
    openaiKey: '',
    exaKey: '',
    pplxKey: '',  // Add this line
    theme: 'auto'
  }, (items) => {
    openaiKeyInput.value = items.openaiKey;
    exaKeyInput.value = items.exaKey;
    pplxKeyInput.value = items.pplxKey;  // Add this line
    themeSelect.value = items.theme;
  });

  // Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    chrome.storage.sync.set({
      openaiKey: openaiKeyInput.value.trim(),
      exaKey: exaKeyInput.value.trim(),
      pplxKey: pplxKeyInput.value.trim(),  // Add this line
      theme: themeSelect.value
    }, () => {
      // Show success message
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
}); 

// Save options to chrome.storage
function saveOptions() {
  const openai = document.getElementById('openai').value.trim();
  const exa = document.getElementById('exa').value.trim();
  const pplx = document.getElementById('pplx').value.trim();

  chrome.storage.sync.set({
    OPENAI_API_KEY: openai,
    EXA_API_KEY: exa,
    PPLX_API_KEY: pplx
  }, function() {
    // Update status to let user know options were saved
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

// Restore options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    OPENAI_API_KEY: '',
    EXA_API_KEY: '',
    PPLX_API_KEY: ''
  }, function(items) {
    document.getElementById('openai').value = items.OPENAI_API_KEY || '';
    document.getElementById('exa').value = items.EXA_API_KEY || '';
    document.getElementById('pplx').value = items.PPLX_API_KEY || '';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions); 