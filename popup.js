/*
    Filename: popup.js
    Purpose: This script handles navigation and UI behavior for the Tab Manager Chrome extension popup. It initializes
    event listeners on navigation tabs, controls active content display based on tab selection, and sets up a basic dark 
    mode detection (styles for dark mode are not created yet)

    Key Functions:
    - deactivateAll: Deactivates all tabs and hides their associated content to ensure only one section is displayed at a time.
    - Dark Mode Check: Detects the user's system dark mode preference and applies a 'dark-mode' class to the body if enabled.
      Note: No dark mode styles are currently implemented, providing flexibility for future contributors to add styling.
    - Tab Navigation Event Listeners: Adds click events to each tab, activating the appropriate content section and 
      triggering specific functions from related scripts (e.g., displayTabs, autoGroup, loadSessions, loadOptions).

    Dependencies:
    - Functions defined in openTabs.js, autoGroup.js, sessions.js, and options.js for handling tab-specific functionality.

    Initialization:
    - The 'Open Tabs' content is displayed by default on load via an initial call to displayTabs().
*/

document.addEventListener('DOMContentLoaded', () => {
    const popupNavTabs = document.querySelectorAll('.nav-tab');
    const popupContents = document.querySelectorAll('.popup-content');

    // Function to deactivate all tabs and content
    const deactivateAll = () => {
        popupNavTabs.forEach(tab => tab.classList.remove('nav-tab--active'));
        popupContents.forEach(content => content.classList.remove('popup-content--active'));
    };

    // Check for dark mode preference
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
        document.body.classList.add('dark-mode'); // Add dark mode class to the body
    }

    // Add click event listeners to each tab
    popupNavTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            deactivateAll();
            tab.classList.add('nav-tab--active');
            const contentId = tab.id.replace('Btn', 'Content');
            document.getElementById(contentId).classList.add('popup-content--active');
            
            // Call the corresponding tab's script function if needed
            if (tab.id === 'openTabsBtn') {
                displayTabs(); // This will be defined in openTabs.js
            } else if (tab.id === 'autoGroupBtn') {
                // Call auto grouping function if needed
                autoGroup(); // This will be defined in autoGroup.js
            } else if (tab.id === 'sessionsBtn') {
                // Call session management function if needed
                loadSessions(); // This will be defined in sessions.js
            } else if (tab.id === 'optionsBtn') {
                // Call options initialization function if needed
                loadOptions(); // This will be defined in options.js
            }
        });
    });

    const getDays = document.getElementById('getDays');
    if (getDays) {
        getDays.addEventListener('click', () => {
            console.log('Get Days button clicked!');

                chrome.runtime.sendMessage({ action: "getDaysAction" }, (response) => {
                    
                });
        });
    }


    // Display tabs initially
    displayTabs();
});