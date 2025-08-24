# Web Highlighter Pro - Chrome Extension

A powerful Chrome extension that allows users to highlight text on any webpage and save it locally for later reference, with optional AI-powered summaries.

## 🚀 Features

- **Universal Text Highlighting**: Highlight text on any webpage with a simple selection
- **Contextual Save Popup**: Intuitive "Save Highlight" popup appears near selected text
- **Local Storage**: All highlights are stored locally on your device
- **Smart Organization**: Filter highlights by time (All, Today, This Week)
- **Search Functionality**: Quickly find specific highlights
- **Export Capabilities**: Export your highlights as JSON
- **Visual Feedback**: Highlighted text remains visible on the page
- **Clean Interface**: Modern, responsive design
- **Badge Counter**: Extension badge shows total highlight count

## 📁 Project Structure

```
web-highlighter-pro/
├── manifest.json          # Extension configuration
├── content.js             # Content script for text selection
├── content.css           # Styles for content script UI
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## 🛠 Installation

### Method 1: Developer Mode (Recommended for Testing)

1. **Download/Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

### Method 2: Chrome Web Store (When Published)
- Install directly from the Chrome Web Store (coming soon)

## 🎯 How to Use

### Highlighting Text
1. **Select any text** on any webpage
2. **Click "Save Highlight"** in the popup that appears
3. **Success!** The text is now highlighted and saved

### Managing Highlights
1. **Click the extension icon** in your toolbar
2. **View all highlights** in the popup interface
3. **Search or filter** highlights as needed
4. **Click any highlight** to copy it to clipboard
5. **Use action buttons** to visit source page or delete

### Advanced Features
- **Export**: Download all highlights as JSON
- **Clear All**: Remove all highlights (with confirmation)
- **Auto-sync**: Changes sync instantly across all tabs

## 🔧 Development

### Prerequisites
- Chrome browser
- Basic knowledge of JavaScript, HTML, CSS
- Text editor (VS Code recommended)

### Local Development
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on your extension
4. Test changes on any webpage

### File Descriptions

**manifest.json**: Defines extension permissions, scripts, and metadata
**content.js**: Handles text selection, highlighting, and popup display
**content.css**: Styles for the selection popup and highlights
**popup.html**: Main extension interface structure
**popup.css**: Styling for the extension popup
**popup.js**: Popup functionality and highlight management
**background.js**: Service worker for storage management and notifications

## 🎨 Customization

### Changing Highlight Color
Edit the gradient in `content.css`:
```css
.wh-highlight {
  background: linear-gradient(120deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Modifying UI Theme
Update colors in `popup.css`:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

## 🔒 Privacy & Security

- **Local Storage Only**: All data stays on your device
- **No External Servers**: No data is sent to external services
- **Minimal Permissions**: Only requests necessary permissions
- **Open Source**: Code is transparent and auditable

## 🐛 Troubleshooting

### Common Issues

**Highlights not saving?**
- Check if the extension has proper permissions
- Refresh the extension and try again

**Popup not appearing?**
- Make sure you're selecting actual text (not images/buttons)
- Check if the page allows content scripts

**Badge not updating?**
- The badge shows total highlight count
- Try refreshing the extension

### Debug Mode
1. Right-click the extension icon → "Inspect popup"
2. Check console for errors
3. Report issues with console output

## 🚀 Advanced Features (Coming Soon)

- **AI Summaries**: Generate intelligent summaries of your highlights
- **Tag System**: Organize highlights with custom tags
- **Sync Across Devices**: Cloud synchronization option
- **Export Formats**: PDF, HTML, and Markdown export
- **Highlight Collections**: Group related highlights

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icons provided by Lucide React
- Inspired by modern web annotation tools
- Built with Chrome Extension Manifest V3 best practices

## 📞 Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review Chrome extension documentation

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Basic text highlighting and saving
- Local storage implementation
- Search and filter functionality
- Export capabilities
- Modern UI with responsive design

---

**Happy Highlighting! 📝✨**
