// Draggable functionality for the popup
function initDraggable(element, handle) {
  let isDragging = false;
  let startX, startY;
  let elementX, elementY;
  
  // Detect if we're in a PDF viewer
  // This extensive check covers various PDF viewers:
  // - Chrome's native PDF viewer
  // - PDF.js (Mozilla's JavaScript PDF renderer)
  // - Embedded PDFs in iframes
  // - Custom PDF renderers with standard classes
  const isPDFViewer = () => {
    // Check URL patterns first (most reliable for direct PDF views)
    const urlIsPDF = (
      window.location.pathname.endsWith('.pdf') ||
      /chrome-extension:\/\/.*pdfviewer/.test(window.location.href) ||
      /file:\/\/.*\.pdf/i.test(window.location.href) ||
      /pdf\.js/i.test(window.location.href)
    );
    
    if (urlIsPDF) return true;
    
    // Check for Chrome's built-in PDF viewer elements
    const hasChromeViewerElements = (
      document.querySelector('#viewer.pdfViewer') !== null ||
      document.querySelector('.textLayer') !== null ||
      document.body.classList.contains('loadingInProgress')
    );
    
    if (hasChromeViewerElements) return true;
    
    // Check for embedded PDF objects/embeds
    const hasEmbeddedPDF = (
      document.querySelector('embed[type="application/pdf"]') !== null ||
      document.querySelector('object[type="application/pdf"]') !== null ||
      document.querySelector('iframe[src*=".pdf"]') !== null
    );
    
    if (hasEmbeddedPDF) return true;
    
    // Check for PDF.js specific elements
    const hasPDFJSElements = (
      document.querySelector('.pdfViewer') !== null ||
      document.querySelector('#viewerContainer') !== null ||
      document.querySelector('#pageContainer') !== null ||
      document.querySelector('.page[data-page-number]') !== null ||
      document.querySelector('#pdf-js-viewer') !== null
    );
    
    if (hasPDFJSElements) return true;
    
    // Check for common PDF viewer libraries
    const hasPDFViewerLibrary = (
      typeof window.PDFViewerApplication !== 'undefined' ||
      typeof window.PDFJS !== 'undefined' ||
      typeof window.pdfjsLib !== 'undefined'
    );
    
    return hasPDFViewerLibrary;
  };

  // Add PDF-specific class if needed
  if (isPDFViewer()) {
    element.classList.add('pdf-viewer-popup');
  }

  // Add drag handle to header
  const dragHandle = document.createElement('div');
  dragHandle.className = 'drag-handle';
  dragHandle.innerHTML = '⋮⋮';
  dragHandle.style.pointerEvents = 'auto'; // Ensure it captures mouse events
  handle.insertBefore(dragHandle, handle.firstChild);

  // Allow dragging from the entire header, not just the drag handle
  dragHandle.addEventListener('mousedown', startDrag);
  handle.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    window.isDragging = true;

    // Get current element position
    const rect = element.getBoundingClientRect();
    elementX = rect.left;
    elementY = rect.top;

    // Get mouse position
    startX = e.clientX;
    startY = e.clientY;

    // Reset any fixed positioning
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.left = `${elementX}px`;
    element.style.top = `${elementY}px`;

    // Add dragging class
    element.classList.add('dragging');
    dragHandle.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    // Calculate new position
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementRect = element.getBoundingClientRect();

    // Calculate new position with bounds checking
    let newX = elementX + dx;
    let newY = elementY + dy;

    // Keep element within viewport
    newX = Math.max(0, Math.min(newX, viewportWidth - elementRect.width));
    newY = Math.max(0, Math.min(newY, viewportHeight - elementRect.height));

    // Update element position
    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
    
    // Ensure the element remains visible during drag
    element.style.display = 'flex';
    element.style.opacity = '1';
  }

  function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    window.isDragging = false;
    
    // Remove dragging class
    element.classList.remove('dragging');
    dragHandle.style.cursor = 'grab';
    
    // Ensure the element remains visible after the drag
    element.style.display = 'flex';
    element.style.opacity = '1';
    
    // Double-check visibility after a slight delay (handles edge cases)
    setTimeout(() => {
      if (element && document.body.contains(element)) {
        element.style.display = 'flex';
        element.style.opacity = '1';
      }
    }, 50);
  }
}

// Export for use in content.js
window.initDraggable = initDraggable; 