# Tab Manager Extension
A Chrome extension to efficiently manage your browser tabs.

## Table of Contents
- [Installation](#installation)
- [What is a Chrome Extension?](#what-is-a-chrome-extension)
- [Key Features & Tabs Description](#key-features--tabs-description)
- [File Structure](#file-structure)
- [Demo Video](#demo-video)

## Installation
1. Download the extension files.
2. Go to Chrome Extensions (chrome://extensions/).
3. Enable "Developer mode."
4. Click "Load unpacked" and select the extension folder.

## What is a Chrome Extension?
Chrome extensions are small software programs that customize the browsing experience. They enable users to tailor Chrome's functionality and behavior to their individual needs or preferences. Extensions can modify the user interface, enhance web pages, or add new features.

### Major Parts of a Chrome Extension
- **Content Script**: A JavaScript file that runs in the context of web pages, allowing you to manipulate the DOM of the pages users visit. Content scripts can read and modify the content of web pages. (wasn't needed for our extension so we didn't use it)

- **Popup UI**: The user interface that appears when users click on the extension icon in the toolbar. This interface allows users to interact with the extension's features.

- **Background Script**: A background script that runs in the background and manages tasks such as listening for events, handling data, and maintaining a persistent state for the extension. Background scripts can communicate with other parts of the extension and perform actions without requiring user interaction.

- **Manifest File**: A JSON file that contains metadata about the extension, including its name, version, permissions, and other settings. The manifest file is essential for defining how the extension interacts with the browser.

## Key Features & Tabs Description
The Extension is divided into four main tabs:
- **Open Tabs**: Displays all your open tabs, organized into pinned, ungrouped, and grouped categories. Users can click to access tabs, view the last visited time, and control options like sleep, mute, or close.
- **Auto Group**: Automatically groups tabs based on user-defined URL patterns, making it easier to manage multiple tabs.
- **Sessions**: Manage saved tab sessions (currently in development), allowing users to restore groups of tabs for different tasks or projects.
- **Options**: Configure tab management preferences and features to suit your workflow.

## File Structure
```
TabManagerExtension/
├── popup.html              # Main HTML file for the popup interface
├── popup.js                # Primary JavaScript for popup functionality
│   ├── openTabs.js         # Manages open tabs display and control
│   ├── autoGroup.js        # Handles auto grouping of tabs
│   ├── sessions.js         # Manages saved tab sessions
│   └── options.js          # Handles user preferences and settings
├── background.js           # Background script for event handling
├── manifest.json           # Metadata and configuration details
└── icons/                  # Folder for extension icons
```

## Demo Video
[Link to the demo video here](https://drive.google.com/file/d/1bEkgMOSpTxdjp2_MOajCE4XS1l_BZrmO/view?usp=drive_link)
