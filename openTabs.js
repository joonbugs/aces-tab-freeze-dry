
// Function to display all open chrome tabs in popup openTabsContent
function displayTabs() {
    const openTabsContentEl = document.getElementById('openTabsContent');
    openTabsContentEl.innerHTML = ''; // Clear existing tabs

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const pinnedTabs = [];
        const ungroupedTabs = [];
        const groupedTabs = {};

        // Organize tabs
        tabs.forEach((tab) => {
            if (tab.pinned) {
                pinnedTabs.push(tab);
            } else if (!tab.groupId || tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
                ungroupedTabs.push(tab);
            } else {
                if (!groupedTabs[tab.groupId]) {
                    groupedTabs[tab.groupId] = [];
                }
                groupedTabs[tab.groupId].push(tab);
            }
        });

        // Render tabs
        renderTabs(pinnedTabs, 'Pinned Tabs', 'pinned-tabs-container', '#F89B1C');

        // Render grouped tabs
        const groupIds = Object.keys(groupedTabs);
        groupIds.forEach((groupId) => {
            chrome.tabGroups.get(parseInt(groupId), (group) => {
                renderTabs(groupedTabs[groupId], `Group: ${group.title}`, 'grouped-tabs-container', group.color || null);
                renderTabs(ungroupedTabs, 'Ungrouped Tabs', 'ungrouped-tabs-container');
            });
        });
    });
}

// Function to render a group of tabs inside a group container
function renderTabs(tabList, groupTitle, containerClass, groupColor = null) {
    const openTabsContentEl = document.getElementById('openTabsContent');
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('group-container');

    const titleEl = document.createElement('h3');
    titleEl.textContent = groupTitle;
    groupContainer.appendChild(titleEl);

    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('tabs-container');
    tabsContainer.classList.add(containerClass);

    if (groupColor) {
        titleEl.style.backgroundColor = groupColor;
        tabsContainer.style.border = `2px solid ${groupColor}`;
    }

    tabList.forEach((tab) => {
        const tabEl = createTabElement(tab);
        tabsContainer.appendChild(tabEl);
    });

    groupContainer.appendChild(tabsContainer);
    openTabsContentEl.appendChild(groupContainer);
}

// Function to create a tab element
function createTabElement(tab) {
    const tabEl = document.createElement('div');
    tabEl.classList.add('tab');
    tabEl.id = `tab-${tab.id}`; // Unique ID for the tab

    // Add active class if the tab is currently active
    if (tab.active) {
        tabEl.classList.add('active-tab');
    }

    // Create a container for the favicon and title
    const titleContainer = document.createElement('div');
    titleContainer.classList.add('title-container'); // Add a class for styling

    // Create the favicon element
    const faviconEl = document.createElement('img');
    faviconEl.src = tab.favIconUrl; // Set the favicon URL
    faviconEl.alt = 'Tab Icon';
    faviconEl.classList.add('tab-favicon'); // Add a class for styling
    faviconEl.style.width = '16px'; // Set width
    faviconEl.style.height = '16px'; // Set height
    faviconEl.style.marginRight = '8px'; // Add some spacing

    // Create the title text element
    const titleText = document.createElement('p');
    titleText.textContent = tab.title;
    titleText.classList.add('tab-title');

    // Append the favicon and title to the title container
    titleContainer.appendChild(faviconEl);
    titleContainer.appendChild(titleText);

    // Create the time text element
    const timeText = document.createElement('p');
    timeText.textContent = `Last Visited: ${formatDate(tab.lastAccessed)}`;
    timeText.classList.add('tab-time');

    // Create a container for buttons
    const btnsContainer = document.createElement('div');
    btnsContainer.classList.add('btns-container');

    // Create action buttons
    const pinButton = createPinButton(tab);
    const closeButton = createCloseButton(tab);
    const muteButton = createMuteButton(tab);
    const sleepButton = createSleepButton(tab);

    // Append buttons to the buttons container
    btnsContainer.appendChild(sleepButton);
    btnsContainer.appendChild(muteButton);
    btnsContainer.appendChild(pinButton);
    btnsContainer.appendChild(closeButton);

    // Append title and time text to the tab element
    tabEl.appendChild(titleContainer);
    tabEl.appendChild(timeText);
    tabEl.appendChild(btnsContainer); // Append buttons container to tab element
    tabEl.style.cursor = 'pointer';

    tabEl.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { active: true });
    });

    return tabEl;
}

// Function to create the pin button
function createPinButton(tab) {
    const pinButton = document.createElement('img');
    pinButton.src = tab.pinned ? '/icons/pin.png' : '/icons/unpin.png';
    pinButton.alt = tab.pinned ? 'Unpin' : 'Pin';
    pinButton.title = tab.pinned ? 'Unpin' : 'Pin';
    pinButton.classList.add('pin-button');
    pinButton.style.cursor = 'pointer';

    pinButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent tab click
        const isCurrentlyPinned = tab.pinned; // Store current state
        chrome.tabs.update(tab.id, { pinned: !isCurrentlyPinned }, () => {
            // Update the tab's pinned state and the button image
            tab.pinned = !isCurrentlyPinned; // Update the local tab object
            pinButton.src = tab.pinned ? '/icons/pin.png' : '/icons/unpin.png'; // Update image source
            pinButton.alt = tab.pinned ? 'Unpin' : 'Pin'; // Update alt text

            // Move the tab element in the DOM
            const tabElement = document.getElementById(`tab-${tab.id}`);
            if (isCurrentlyPinned) {
                // Move to ungrouped section
                const ungroupedContainer = document.querySelector('.ungrouped-tabs-container');
                ungroupedContainer.appendChild(tabElement);
            } else {
                // Move to pinned section
                const pinnedContainer = document.querySelector('.pinned-tabs-container');
                pinnedContainer.appendChild(tabElement);
            }
        });
    });

    // Add mouseover and mouseout events for hover effect
    pinButton.addEventListener('mouseover', () => {
        pinButton.src = tab.pinned ? '/icons/unpin.png' : '/icons/pin.png';
    });

    pinButton.addEventListener('mouseout', () => {
        pinButton.src = tab.pinned ? '/icons/pin.png' : '/icons/unpin.png';
    });

    return pinButton;
}


// Function to create the close button
function createCloseButton(tab) {
    const closeButton = document.createElement('img');
    closeButton.src = '/icons/close.png';
    closeButton.alt = 'Close';
    closeButton.title = 'Close';
    closeButton.classList.add('close-button');
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent tab click
        chrome.tabs.remove(tab.id, () => {
            const tabElement = event.target.closest('.tab');
            if (tabElement) {
                tabElement.parentNode.removeChild(tabElement);
            }
        });
    });

    return closeButton;
}

// Function to create the mute button
// TODO: when right clicking on tab in tab bar it doesnt show the real state of tab muting and also it cant be unmuted from there if it was muted from the extension (it will be only unmuted from the extension)
function createMuteButton(tab) {
    const muteButton = document.createElement('img');
    muteButton.src = tab.mutedInfo.muted ? '/icons/no-sound.png' : '/icons/sound.png';
    muteButton.alt = tab.mutedInfo.muted ? 'Unmute' : 'Mute';
    muteButton.title = tab.mutedInfo.muted ? 'Unmute' : 'Mute';
    muteButton.classList.add('mute-button');
    muteButton.style.cursor = 'pointer';

    muteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent tab click
        chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted }, () => {
            tab.mutedInfo.muted = !tab.mutedInfo.muted; // Update the local tab object
            muteButton.src = tab.mutedInfo.muted ? '/icons/no-sound.png' : '/icons/sound.png'; // Update image source
            muteButton.alt = tab.mutedInfo.muted ? 'Unmute' : 'Mute'; // Update alt text
            muteButton.title = tab.mutedInfo.muted ? 'Unmute' : 'Mute'; // Update title text
        });
    });

    return muteButton;
}

// Function to create the sleep button
// TODO: The waking doesnt reload the tab properly. It is only reloaded when the tab is visited
function createSleepButton(tab) {
    const sleepButton = document.createElement('img');
    sleepButton.src = tab.discarded ? '/icons/sleeping.png' : '/icons/awake.png';
    sleepButton.alt = tab.discarded ? 'Wake Up' : 'Sleep';
    sleepButton.title = tab.discarded ? 'Wake Up' : 'Sleep';
    sleepButton.classList.add('sleep-button');
    sleepButton.style.cursor = 'pointer';

    sleepButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent tab click
        if (!tab.discarded) {
            chrome.tabs.discard(tab.id, () => {
                tab.discarded = true; // Update the local tab object to reflect the sleep state
                sleepButton.src = '/icons/sleeping.png'; // Update image source to indicate the tab is asleep
                sleepButton.alt = 'Wake Up'; // Update alt text
                sleepButton.title = 'Wake Up'; // Update title text
            });
        } else {
            // If the tab is already discarded, activate and reload it
            chrome.tabs.update(tab.id, { active: true }, () => {
                // Reload the tab after activating it
                chrome.tabs.reload(tab.id, { bypassCache: true }, () => {
                    tab.discarded = false; // Update the local tab object to reflect the awake state
                    sleepButton.src = '/icons/awake.png'; // Update image source to indicate the tab is awake
                    sleepButton.alt = 'Sleep'; // Update alt text
                    sleepButton.title = 'Sleep'; // Update title text
                });
            });
        }
    });

    return sleepButton;
}

// Function to format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Customize date format as needed
}