// Content script for handling text selection and highlighting
class WebHighlighter {
  constructor() {
    this.isPopupVisible = false;
    this.currentSelection = null;
    this.highlightCounter = 0;
    this.init();
  }

  init() {
    // Remove any existing event listeners to prevent duplicates
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousedown', this.handleMouseDown);
    
    // Add event listeners
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Load existing highlights
    this.loadExistingHighlights();
  }

  handleMouseDown = (e) => {
    // Hide popup if clicking outside
    if (!e.target.closest('.wh-save-popup')) {
      this.hidePopup();
    }
  };

  handleMouseUp = (e) => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText && selectedText.length > 0) {
        this.currentSelection = {
          text: selectedText,
          range: selection.getRangeAt(0).cloneRange()
        };
        this.showSavePopup(e);
      } else {
        this.hidePopup();
      }
    }, 10);
  };

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      this.hidePopup();
    }
  };

  showSavePopup(event) {
    this.hidePopup(); // Remove any existing popup

    const popup = document.createElement('div');
    popup.className = 'wh-save-popup';
    popup.innerHTML = `
      <div class="wh-popup-content">
        <button class="wh-save-btn" id="whSaveBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Save Highlight
        </button>
        <button class="wh-cancel-btn" id="whCancelBtn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Position popup near the selection
    const rect = this.currentSelection.range.getBoundingClientRect();
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 10}px`;

    document.body.appendChild(popup);
    this.isPopupVisible = true;

    // Add event listeners
    document.getElementById('whSaveBtn').addEventListener('click', this.saveHighlight.bind(this));
    document.getElementById('whCancelBtn').addEventListener('click', this.hidePopup.bind(this));
  }

  hidePopup() {
    const existingPopup = document.querySelector('.wh-save-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    this.isPopupVisible = false;
    
    // Clear selection
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }

  async saveHighlight() {
    if (!this.currentSelection) return;

    const highlight = {
      id: Date.now() + Math.random(),
      text: this.currentSelection.text,
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      domain: window.location.hostname
    };

    try {
      // Save to Chrome storage
      const result = await chrome.storage.local.get(['highlights']);
      const highlights = result.highlights || [];
      highlights.unshift(highlight); // Add to beginning
      await chrome.storage.local.set({ highlights });

      // Create visual highlight on page
      this.createVisualHighlight(this.currentSelection.range, highlight.id);
      
      this.showSuccessMessage();
      this.hidePopup();
    } catch (error) {
      console.error('Error saving highlight:', error);
      this.showErrorMessage();
    }
  }

  createVisualHighlight(range, highlightId) {
    try {
      const span = document.createElement('span');
      span.className = 'wh-highlight';
      span.setAttribute('data-highlight-id', highlightId);
      span.title = 'Saved highlight - Double click to remove';
      
      // Double click to remove highlight
      span.addEventListener('dblclick', () => this.removeHighlight(highlightId));
      
      range.surroundContents(span);
      this.highlightCounter++;
    } catch (error) {
      // Fallback for complex selections
      console.warn('Could not create visual highlight:', error);
    }
  }

  async removeHighlight(highlightId) {
    try {
      // Remove from storage
      const result = await chrome.storage.local.get(['highlights']);
      const highlights = result.highlights || [];
      const updatedHighlights = highlights.filter(h => h.id !== highlightId);
      await chrome.storage.local.set({ highlights: updatedHighlights });

      // Remove visual highlight
      const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
      if (highlightElement) {
        const parent = highlightElement.parentNode;
        parent.replaceChild(document.createTextNode(highlightElement.textContent), highlightElement);
        parent.normalize();
      }
    } catch (error) {
      console.error('Error removing highlight:', error);
    }
  }

  async loadExistingHighlights() {
    try {
      const result = await chrome.storage.local.get(['highlights']);
      const highlights = result.highlights || [];
      const currentUrl = window.location.href;
      
      // Find highlights for current page
      const pageHighlights = highlights.filter(h => h.url === currentUrl);
      
      // This is a simplified version - in practice, you'd need to 
      // implement text matching to recreate highlights on page reload
      console.log(`Found ${pageHighlights.length} highlights for this page`);
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  }

  showSuccessMessage() {
    this.showMessage('Highlight saved successfully!', 'success');
  }

  showErrorMessage() {
    this.showMessage('Error saving highlight', 'error');
  }

  showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `wh-message wh-message-${type}`;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add('wh-message-show');
    }, 10);

    setTimeout(() => {
      message.classList.remove('wh-message-show');
      setTimeout(() => message.remove(), 300);
    }, 2000);
  }
}

// Initialize the highlighter
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WebHighlighter();
  });
} else {
  new WebHighlighter();
}
