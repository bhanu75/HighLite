// Background service worker for Web Highlighter Pro
class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Handle storage changes for badge updates
    chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
    
    // Update badge on startup
    this.updateBadge();
  }

  handleInstall(details) {
    if (details.reason === 'install') {
      // Set up initial storage
      chrome.storage.local.set({
        highlights: [],
        settings: {
          aiSummaryEnabled: false,
          highlightColor: '#ffeaa7',
          autoSave: true
        }
      });

      // Show welcome notification
      this.showNotification(
        'Web Highlighter Pro Installed!',
        'Start highlighting text on any webpage. Click the extension icon to view your saved highlights.'
      );
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'saveHighlight':
          await this.saveHighlight(request.data);
          sendResponse({ success: true });
          break;
          
        case 'getHighlights':
          const highlights = await this.getHighlights();
          sendResponse({ highlights });
          break;
          
        case 'deleteHighlight':
          await this.deleteHighlight(request.highlightId);
          sendResponse({ success: true });
          break;
          
        case 'generateSummary':
          const summary = await this.generateSummary(request.highlights);
          sendResponse({ summary });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleStorageChange(changes, namespace) {
    if (namespace === 'local' && changes.highlights) {
      await this.updateBadge();
    }
  }

  async saveHighlight(highlightData) {
    const result = await chrome.storage.local.get(['highlights']);
    const highlights = result.highlights || [];
    
    // Add timestamp if not present
    if (!highlightData.timestamp) {
      highlightData.timestamp = new Date().toISOString();
    }
    
    // Generate ID if not present
    if (!highlightData.id) {
      highlightData.id = Date.now() + Math.random();
    }
    
    highlights.unshift(highlightData);
    await chrome.storage.local.set({ highlights });
    
    // Update badge
    await this.updateBadge();
    
    // Optional: Show notification for first highlight
    if (highlights.length === 1) {
      this.showNotification(
        'First highlight saved!',
        'Click the extension icon to view and manage your highlights.'
      );
    }
  }

  async getHighlights() {
    const result = await chrome.storage.local.get(['highlights']);
    return result.highlights || [];
  }

  async deleteHighlight(highlightId) {
    const result = await chrome.storage.local.get(['highlights']);
    const highlights = result.highlights || [];
    const updatedHighlights = highlights.filter(h => h.id !== highlightId);
    await chrome.storage.local.set({ highlights: updatedHighlights });
    await this.updateBadge();
  }

  async updateBadge() {
    try {
      const result = await chrome.storage.local.get(['highlights']);
      const highlights = result.highlights || [];
      const count = highlights.length;
      
      if (count > 0) {
        await chrome.action.setBadgeText({
          text: count > 99 ? '99+' : count.toString()
        });
        await chrome.action.setBadgeBackgroundColor({
          color: '#667eea'
        });
      } else {
        await chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  }

  async generateSummary(highlights) {
    // This is a placeholder for AI summary generation
    // In a real implementation, you would integrate with an AI service
    try {
      if (!highlights || highlights.length === 0) {
        return 'No highlights to summarize.';
      }

      // Simple text analysis for demo purposes
      const allText = highlights.map(h => h.text).join(' ');
      const words = allText.split(/\s+/);
      const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
      const avgLength = Math.round(allText.length / highlights.length);

      return `Summary of ${highlights.length} highlights:\n\n` +
             `• Total words: ${words.length}\n` +
             `• Unique terms: ${uniqueWords.length}\n` +
             `• Average highlight length: ${avgLength} characters\n` +
             `• Most recent: ${new Date(highlights[0].timestamp).toLocaleDateString()}\n\n` +
             `Key topics appear to focus on the highlighted content from various sources. ` +
             `Consider reviewing these highlights for deeper insights.`;
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Error generating summary. Please try again.';
    }
  }

  // Utility function to clean up old highlights (optional feature)
  async cleanupOldHighlights(daysToKeep = 90) {
    try {
      const result = await chrome.storage.local.get(['highlights']);
      const highlights = result.highlights || [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const filteredHighlights = highlights.filter(highlight => {
        return new Date(highlight.timestamp) > cutoffDate;
      });

      if (filteredHighlights.length !== highlights.length) {
        await chrome.storage.local.set({ highlights: filteredHighlights });
        console.log(`Cleaned up ${highlights.length - filteredHighlights.length} old highlights`);
      }
    } catch (error) {
      console.error('Error cleaning up highlights:', error);
    }
  }
}

// Initialize background service
new BackgroundService();
