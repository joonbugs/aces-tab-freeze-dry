document.addEventListener('DOMContentLoaded', () => {
    const popupNavTabs = document.querySelectorAll('.nav-tab');
    const popupContents = document.querySelectorAll('.popup-content');

    // Function to deactivate all tabs and content
    const deactivateAll = () => {
        popupNavTabs.forEach(tab => tab.classList.remove('nav-tab--active'));
        popupContents.forEach(content => content.classList.remove('popup-content--active'));
    };

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
                initAutoGrouping(); // This will be defined in autoGroup.js
            } else if (tab.id === 'sessionsBtn') {
                // Call session management function if needed
                loadSessions(); // This will be defined in sessions.js
            } else if (tab.id === 'optionsBtn') {
                // Call options initialization function if needed
                loadOptions(); // This will be defined in options.js
            }
        });
    });

    // Display tabs initially
    displayTabs();
});