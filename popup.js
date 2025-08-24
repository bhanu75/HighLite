// Popup script for Web Highlighter Pro extension
class PopupManager {
  constructor() {
    this.highlights = [];
    this.filteredHighlights = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      // Check if chrome APIs are available
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome extension context not available');
      }
      
      if (!chrome.storage) {
        throw new Error('Chrome storage API not available');
      }
      
      await this.loadHighlights();
      this.setupEventListeners();
      this.renderHighlights();
      this.updateStats();
      this.isInitialized = true;
      
      console.log('Popup initialized successfully');
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showError(`Initialization failed: ${error.message}`);
    }
  }

  showError(message) {
    const container = document.getElementById('highlightsList');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc3545;">
          <h3>Error</h3>
          <p>${message}</p>
          <p style="font-size: 12px; opacity: 0.7;">Try refreshing the extension</p>
        </div>
      `;
    }
  }

  async loadHighlights() {
    try {
      // Check if chrome storage is available
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.error('Chrome storage API not available');
        this.highlights = [];
        this.filteredHighlights = [];
        return;
      }

      // Use Promise wrapper for compatibility
      const result = await new Promise((resolve, reject) => {
        chrome.storage.local.get(['highlights'], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });

      this.highlights = result.highlights || [];
      this.filteredHighlights = [...this.highlights];
      console.log('Loaded highlights:', this.highlights.length);
    } catch (error) {
      console.error('Error loading highlights:', error);
      this.highlights = [];
      this.filteredHighlights = [];
    }
  }

  setupEventListeners() {
    try {
      // Search functionality
      const searchInput = document.getElementById('searchInput');
      const clearSearch = document.getElementById('clearSearch');
      
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.trim();
          this.applyFilters();
          this.toggleClearButton();
        });
      }

      if (clearSearch) {
        clearSearch.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            this.applyFilters();
            this.toggleClearButton();
          }
        });
      }

      // Filter tabs
      const filterTabs = document.querySelectorAll('.filter-tab');
      filterTabs.forEach(tab => {
        if (tab) {
          tab.addEventListener('click', (e) => {
            const activeTab = document.querySelector('.filter-tab.active');
            if (activeTab) {
              activeTab.classList.remove('active');
            }
            e.target.classList.add('active');
            this.currentFilter = e.target.dataset.filter;
            this.applyFilters();
          });
        }
      });

      // Action buttons
      const exportBtn = document.getElementById('exportBtn');
      const clearAllBtn = document.getElementById('clearAllBtn');
      
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.exportHighlights();
        });
      }

      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          this.clearAllHighlights();
        });
      }

      // Listen for storage changes with error handling
      try {
        if (chrome && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.highlights) {
              this.highlights = changes.highlights.newValue || [];
              this.applyFilters();
              this.updateStats();
            }
          });
        }
      } catch (error) {
        console.error('Error setting up storage listener:', error);
      }
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  toggleClearButton() {
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
    }
  }

  applyFilters() {
    let filtered = [...this.highlights];

    // Apply time filter
    if (this.currentFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      if (this.currentFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (this.currentFilter === 'week') {
        cutoff.setDate(now.getDate() - 7);
      }

      filtered = filtered.filter(highlight => 
        new Date(highlight.timestamp) >= cutoff
      );
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(highlight =>
        highlight.text.toLowerCase().includes(query) ||
        highlight.title.toLowerCase().includes(query) ||
        highlight.domain.toLowerCase().includes(query)
      );
    }

    this.filteredHighlights = filtered;
    this.renderHighlights();
  }

  renderHighlights() {
    const container = document.getElementById('highlightsList');
    const emptyState = document.getElementById('emptyState');
    
    if (this.filteredHighlights.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      
      if (this.highlights.length > 0 && (this.searchQuery || this.currentFilter !== 'all')) {
        emptyState.querySelector('h3').textContent = 'No matches found';
        emptyState.querySelector('p').textContent = 'Try adjusting your search or filter criteria.';
      } else {
        emptyState.querySelector('h3').textContent = 'No highlights yet';
        emptyState.querySelector('p').textContent = 'Select text on any webpage and click "Save Highlight" to get started!';
      }
      return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = this.filteredHighlights.map(highlight => 
      this.createHighlightHTML(highlight)
    ).join('');

    // Add event listeners to highlight items
    this.setupHighlightEventListeners();
  }

  createHighlightHTML(highlight) {
    const date = new Date(highlight.timestamp);
    const timeAgo = this.getTimeAgo(date);
    const domainInitial = highlight.domain.charAt(0).toUpperCase();
    
    return `
      <div class="highlight-item" data-id="${highlight.id}">
        <div class="highlight-text">${this.escapeHTML(highlight.text)}</div>
        <div class="highlight-meta">
          <div class="highlight-source">
            <div class="domain-icon">${domainInitial}</div>
            <div class="source-info">
              <div class="source-title" title="${this.escapeHTML(highlight.title)}">
                ${this.escapeHTML(highlight.title)}
              </div>
              <div class="source-domain">${highlight.domain}</div>
            </div>
          </div>
          <div class="highlight-actions">
            <div class="action-icon copy" title="Copy text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </div>
            <div class="action-icon visit" title="Visit page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15,3 21,3 21,9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </div>
            <div class="action-icon delete" title="Delete highlight">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
            </div>
          </div>
          <div class="highlight-timestamp">${timeAgo}</div>
        </div>
      </div>
    `;
  }

  setupHighlightEventListeners() {
    // Copy text functionality
    document.querySelectorAll('.action-icon.copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const highlightId = btn.closest('.highlight-item').dataset.id;
        const highlight = this.highlights.find(h => h.id == highlightId);
        if (highlight) {
          navigator.clipboard.writeText(highlight.text).then(() => {
            this.showToast('Text copied to clipboard!');
          });
        }
      });
    });

    // Visit page functionality
    document.querySelectorAll('.action-icon.visit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const highlightId = btn.closest('.highlight-item').dataset.id;
        const highlight = this.highlights.find(h => h.id == highlightId);
        if (highlight) {
          chrome.tabs.create({ url: highlight.url });
        }
      });
    });

    // Delete highlight functionality
    document.querySelectorAll('.action-icon.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const highlightId = btn.closest('.highlight-item').dataset.id;
        this.deleteHighlight(highlightId);
      });
    });

    // Click to copy entire highlight
    document.querySelectorAll('.highlight-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.highlight-actions')) return;
        
        const highlightId = item.dataset.id;
        const highlight = this.highlights.find(h => h.id == highlightId);
        if (highlight) {
          navigator.clipboard.writeText(highlight.text).then(() => {
            this.showToast('Text copied to clipboard!');
          });
        }
      });
    });
  }

  async deleteHighlight(highlightId) {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        throw new Error('Chrome storage not available');
      }

      this.highlights = this.highlights.filter(h => h.id != highlightId);
      
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ highlights: this.highlights }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      this.applyFilters();
      this.updateStats();
      this.showToast('Highlight deleted');
    } catch (error) {
      console.error('Error deleting highlight:', error);
      this.showToast('Error deleting highlight', 'error');
    }
  }

  async clearAllHighlights() {
    if (!confirm('Are you sure you want to delete all highlights? This action cannot be undone.')) {
      return;
    }

    try {
      await chrome.storage.local.set({ highlights: [] });
      this.highlights = [];
      this.applyFilters();
      this.updateStats();
      this.showToast('All highlights cleared');
    } catch (error) {
      console.error('Error clearing highlights:', error);
      this.showToast('Error clearing highlights', 'error');
    }
  }

  exportHighlights() {
    if (this.highlights.length === 0) {
      this.showToast('No highlights to export');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalHighlights: this.highlights.length,
      highlights: this.highlights.map(h => ({
        text: h.text,
        source: h.title,
        url: h.url,
        domain: h.domain,
        savedOn: h.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-highlights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('Highlights exported successfully');
  }

  updateStats() {
    const highlightCount = document.getElementById('highlightCount');
    if (highlightCount) {
      highlightCount.textContent = this.highlights.length;
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: white;
      background: ${type === 'error' ? '#dc3545' : '#28a745'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transform: translateX(100px);
      opacity: 0;
      transition: all 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 10);

    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(100px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// Wait for DOM to be fully loaded before initializing
function initializePopup() {
  try {
    // Double check if DOM is ready
    if (document.readyState === 'loading') {
      // Wait a bit more
      setTimeout(initializePopup, 50);
      return;
    }
    
    // Check if required elements exist
    const requiredElements = ['highlightsList', 'emptyState', 'highlightCount'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      console.error('Missing required elements:', missingElements);
      setTimeout(initializePopup, 100);
      return;
    }
    
    // Initialize the popup manager
    new PopupManager();
  } catch (error) {
    console.error('Error during popup initialization:', error);
    // Retry after a short delay
    setTimeout(initializePopup, 200);
  }
}

// Multiple initialization attempts
document.addEventListener('DOMContentLoaded', initializePopup);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initializePopup, 10);
}

// Fallback initialization
setTimeout(initializePopup, 500);
