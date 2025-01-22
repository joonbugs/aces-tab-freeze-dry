/*
    Filename: openTabs.js
    Purpose: This script manages the display and organization of open tabs within the Tab Manager Chrome extension. 
    It retrieves the current tabs from the Chrome browser, categorizes them into pinned, ungrouped, and grouped tabs,
    and dynamically renders them in the extension popup.

    Key Functions:
    - displayTabs: Fetches all tabs in the current window and categorizes them into pinned, ungrouped, and grouped tabs. 
      It then calls the renderTabs function to display each category in the popup.
    - renderTabs: Takes a list of tabs, creates a visual representation for them, and manages user interactions, 
      such as expanding/collapsing groups and closing or pinning tabs. This function also handles the creation of 
      group buttons for managing grouped tabs.

    Dependencies:
    - Uses Chrome API methods (chrome.tabs.query, chrome.storage.local.get, chrome.tabGroups.get, and chrome.tabGroups.update) 
      to interact with the browser's tab and group data.

    Storage Variables:
    - Pinned Groups: Accessed from `chrome.storage.local` to manage pinned tab groups.

    Element IDs:
    - 'openTabsContent': The main container in the popup where all open tabs are rendered.
    - 'pinned-tabs-container': Container for displaying pinned tabs.
    - 'ungrouped-tabs-container': Container for displaying ungrouped tabs.
    - 'grouped-tabs-container': Container for displaying grouped tabs.

    Initialization:
    - The function is invoked within the displayTabs() function, which runs upon loading the popup to show the current state 
      of open tabs.
*/

const groupedTabs = new Map();

// Function to display all open chrome tabs in popup openTabsContent
function displayTabs() {
  const openTabsContentEl = document.getElementById('openTabsContent');
  openTabsContentEl.innerHTML = ''; // Clear existing tabs

  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const pinnedTabs = [];
    const ungroupedTabs = [];
    const groupedTabArr = [];

    chrome.storage.local.get('pinnedGroups', (data) => {
      const pinnedGroups = data.pinnedGroups || {};

      tabs.forEach((tab) => {
        if (tab.pinned) {
          pinnedTabs.push(tab);
        } else if (
          !tab.groupId ||
          tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE
        ) {
          ungroupedTabs.push(tab);
        } else {
          if (!groupedTabs.has(tab.groupId)) {
            groupedTabs.set(tab.groupId, []);
          }
          let tabList = groupedTabs.get(tab.groupId);
          tabList.push(tab);
          // groupedTabs.set(tab.groupId, tab);
        }
      });

      renderTabs(pinnedTabs, 'Pinned Tabs', 'pinned-tabs-container', '#F89B1C');

      groupedTabs.keys().forEach((groupId) => {
        // put move up button here?
        chrome.tabGroups.get(groupId, (group) => {
          console.log('hello');
          const newMap = renderTabs(
            groupedTabs.get(groupId),
            `${group.title}`,
            'grouped-tabs-container',
            group.color || null,
            groupId
          );
        });
      });

      renderTabs(ungroupedTabs, 'Ungrouped Tabs', 'ungrouped-tabs-container');
    });
  });
}

// Function to render a group of tabs inside a group container
function renderTabs(
  tabList,
  groupTitle,
  containerClass,
  groupColor = null,
  groupId = null,
  groupMap = null
) {
  const openTabsContentEl = document.getElementById('openTabsContent');
  const groupContainer = document.createElement('div');
  groupContainer.classList.add('group-container');

  // Create group title element
  const titleEl = document.createElement('div');
  titleEl.classList.add('group-title');

  // Create collapse/expand arrow button (before group title)
  let isExpanded = true; //TODO: initially be expanded but if collapsed by user store its state in storage so that when popup is opened the popup again the state is not lost

  const arrowBtn = document.createElement('img');
  arrowBtn.src = '/icons/arrow.svg'; // Default icon for expand (down arrow)
  arrowBtn.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'; // Down arrow (expanded)
  arrowBtn.title = isExpanded ? 'Collapse Group' : 'Expand Group';
  arrowBtn.alt = isExpanded ? 'Collapse Group' : 'Expand Group';
  arrowBtn.classList.add('collapse-expand-arrow');

  // Add click event to toggle expand/collapse
  arrowBtn.addEventListener('click', () => {
    isExpanded = !isExpanded; // Toggle state
    tabsContainer.style.display = isExpanded ? 'block' : 'none'; // Show/Hide tabs

    // Update arrow
    arrowBtn.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'; // Rotate arrow
    arrowBtn.title = isExpanded ? 'Collapse Group' : 'Expand Group';
    arrowBtn.alt = isExpanded ? 'Collapse Group' : 'Expand Group';
  });

  // Add the arrow button to the title element
  titleEl.appendChild(arrowBtn);

  // Add group title text
  const titleText = document.createElement('h3');
  titleText.textContent = groupTitle;
  titleEl.appendChild(titleText);

  // Add collapse/expand button if it's a grouped tab (not pinned or ungrouped)
  if (groupId !== null) {
    const collapseBtn = document.createElement('img');
    collapseBtn.src = '/icons/collapse.svg'; // Set default icon to collapse
    collapseBtn.alt = 'Collapse Group';
    collapseBtn.title = 'Collapse Group';
    collapseBtn.classList.add('collapse-expand-button');

    // Fetch the current state of the group (collapsed or not)
    chrome.tabGroups.get(parseInt(groupId), (group) => {
      let isCollapsed = group.collapsed;

      // Set the button based on the current group state
      collapseBtn.src = isCollapsed
        ? '/icons/expand.svg'
        : '/icons/collapse.svg';
      collapseBtn.alt = isCollapsed ? 'Expand Group' : 'Collapse Group';
      collapseBtn.title = isCollapsed ? 'Expand Group' : 'Collapse Group';

      // Toggle group collapse/expand when the button is clicked
      collapseBtn.addEventListener('click', () => {
        isCollapsed = !isCollapsed; // Toggle the state

        // Update the tab group collapse state
        chrome.tabGroups.update(
          parseInt(groupId),
          { collapsed: isCollapsed },
          (updatedGroup) => {
            collapseBtn.src = updatedGroup.collapsed
              ? '/icons/expand.svg'
              : '/icons/collapse.svg';
            collapseBtn.alt = updatedGroup.collapsed
              ? 'Expand Group'
              : 'Collapse Group';
            collapseBtn.title = updatedGroup.collapsed
              ? 'Expand Group'
              : 'Collapse Group';
          }
        );
      });
    });

    titleEl.appendChild(collapseBtn); // Add collapse/expand button to the title

    //Create move up and move down buttons
    // const moveUpButton = document.createElement('img'); // create separate function for button creation
    // moveUpButton.src = '/icons/move-up.png';
    // moveUpButton.alt = 'Move Up';
    // moveUpButton.title = 'Move Up';
    // moveUpButton.classList.add('move-up-button');

    // // Move group up on click
    // moveUpButton.addEventListener('click', () => {
    //     outputMap = new Map();

    //     // Extract keys (groupIds) into an array
    //     const keys = Array.from(groupMap.keys());

    //     //Find indices of the keys to swap
    //     const curr = keys.indexOf(groupId);
    //     const prev = curr - 1;

    //     // Swap the keys in the array
    //     [keys[prev], keys[curr]] = [keys[curr], keys[prev]];

    //     // Fill the old map with swapped keys
    //     groupMap.clear();
    //     for (const key of keys) {
    //         groupMap.set(key, groupMap.get(key));
    //     };

    //     console.log(groupMap);

    // });

    const moveDownButton = document.createElement('img');
    moveDownButton.src = '/icons/move-down.png';
    moveDownButton.alt = 'Move Down';
    moveDownButton.title = 'Move Down';
    moveDownButton.classList.add('move-down-button');

    // Append move up and move down button
    const moveUpButton = createUpButton(groupId);
    titleEl.appendChild(moveUpButton);
  }

  // Style the title background with group color if available
  if (groupColor) {
    titleEl.style.backgroundColor = groupColor;
  }

  groupContainer.appendChild(titleEl);

  // Add close button for groups (except pinned)
  if (groupId !== null) {
    groupContainer.classList.add('chrome-group'); // Add a class for styling
  }

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

  // Add ungroup button and close button for groups
  if (groupId !== null) {
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container'); // Container for group buttons

    const pinGroupButton = createPinGroupButton(
      groupId,
      groupTitle,
      groupColor,
      tabList
    );
    buttonContainer.appendChild(pinGroupButton);

    const ungroupButton = createUngroupButton(groupId, groupContainer, tabList);
    buttonContainer.appendChild(ungroupButton); // Place ungroup button in the container

    const closeButton = createCloseGroupButton(groupId, groupContainer);
    buttonContainer.appendChild(closeButton); // Place close button in the container

    tabsContainer.appendChild(buttonContainer); // Add the button container to tabs container
  }

  // Add no tabs message
  if (tabList.length === 0) {
    const noTabsEl = document.createElement('p');
    noTabsEl.textContent = 'No tabs available';
    noTabsEl.classList.add('no-tabs');
    tabsContainer.appendChild(noTabsEl);
  }

  groupContainer.appendChild(tabsContainer);
  openTabsContentEl.appendChild(groupContainer);

  return groupMap;
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
  faviconEl.src = tab.favIconUrl || '/icons/global.png'; // Set the favicon URL
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
        const ungroupedContainer = document.querySelector(
          '.ungrouped-tabs-container'
        );
        ungroupedContainer.appendChild(tabElement);
      } else {
        // Move to pinned section
        const pinnedContainer = document.querySelector(
          '.pinned-tabs-container'
        );
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
  muteButton.src = tab.mutedInfo.muted
    ? '/icons/no-sound.png'
    : '/icons/sound.png';
  muteButton.alt = tab.mutedInfo.muted ? 'Unmute' : 'Mute';
  muteButton.title = tab.mutedInfo.muted ? 'Unmute' : 'Mute';
  muteButton.classList.add('mute-button');
  muteButton.style.cursor = 'pointer';

  muteButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent tab click
    chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted }, () => {
      tab.mutedInfo.muted = !tab.mutedInfo.muted; // Update the local tab object
      muteButton.src = tab.mutedInfo.muted
        ? '/icons/no-sound.png'
        : '/icons/sound.png'; // Update image source
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

// Function to create a close button for groups// Function to create a close button for groups
function createCloseGroupButton(groupId, groupContainer) {
  const closeButton = document.createElement('button');
  closeButton.innerText = 'Close';
  closeButton.alt = 'Close Group';
  closeButton.title = 'Close Group';
  closeButton.classList.add('close-group-button');

  closeButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent tab click

    // Ensure the groupId is being passed and is valid
    if (!groupId) {
      console.error('Group ID is missing or invalid');
      return;
    }

    chrome.tabs.query({ groupId: parseInt(groupId) }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('Error querying group tabs: ', chrome.runtime.lastError);
        return;
      }

      if (!tabs || tabs.length === 0) {
        console.error('No tabs found for the group with ID: ', groupId);
        return;
      }

      const tabIds = tabs.map((tab) => tab.id);
      chrome.tabs.remove(tabIds, () => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error removing group tabs: ',
            chrome.runtime.lastError
          );
          return;
        }
        groupContainer.remove(); // Remove group from the popup after closing all its tabs
      });
    });
  });

  return closeButton;
}

// Function to create an ungroup button for groups
function createUngroupButton(groupId, groupContainer, tabList) {
  const ungroupButton = document.createElement('button');
  ungroupButton.textContent = 'Ungroup';
  ungroupButton.classList.add('ungroup-button');

  ungroupButton.addEventListener('click', () => {
    chrome.tabs.ungroup(
      tabList.map((tab) => tab.id),
      () => {
        // Move tabs to ungrouped section
        const ungroupedContainer = document.querySelector(
          '.ungrouped-tabs-container'
        );
        tabList.forEach((tab) => {
          const tabElement = document.getElementById(`tab-${tab.id}`);
          ungroupedContainer.appendChild(tabElement);
        });

        groupContainer.remove(); // Remove group from the popup
      }
    );
  });

  return ungroupButton;
}

function createUpButton(groupId) {
  const moveUpButton = document.createElement('img'); // create separate function for button creation
  moveUpButton.src = '/icons/move-up.png';
  moveUpButton.alt = 'Move Up';
  moveUpButton.title = 'Move Up';
  moveUpButton.classList.add('move-up-button');

  // Move group up on click
  moveUpButton.addEventListener('click', () => {
    console.log('OLD MAP');
    console.log(groupedTabs);

    // Extract keys (groupIds) into an array
    const keys = Array.from(groupedTabs.keys()); //FLAG
    console.log('OLD ARRAY');
    console.log(keys);

    //Find indices of the keys to swap
    const curr = keys.indexOf(groupId);
    const prev = curr - 1;

    // Swap the keys in the array
    // [keys[prev], keys[curr]] = [keys[curr], keys[prev]]; // flag\
    const temp = keys[prev];
    keys[prev] = keys[curr];
    keys[curr] = temp;
    console.log('NEW ARRAY');
    console.log(keys);

    outputMap = new Map();
    // Fill the old map with swapped keys
    for (const key of keys) {
      outputMap.set(key, groupedTabs.get(key));
    }

    groupedTabs.clear();
    for (const key of keys) {
      groupedTabs.set(key, outputMap.get(key));
    }

    // console.log(groupMap);
    console.log('NEW MAP');
    console.log(groupedTabs);
    displayTabs();
  });

  return moveUpButton;
}

// Function to format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(); // Customize date format as needed
}

// Function to create the pin/unpin button for groups
function createPinGroupButton(groupId, groupTitle, groupColor, tabList) {
  const pinGroupButton = document.createElement('button');
  pinGroupButton.classList.add('pin-group-button');

  chrome.storage.local.get(['pinnedGroups'], (result) => {
    const pinnedGroups = result.pinnedGroups || {};
    const isPinned = !!pinnedGroups[groupId];

    pinGroupButton.textContent = isPinned ? 'Unpin Group' : 'Pin Group';

    if (isPinned) {
      pinGroupButton.classList.remove('green-button');
      pinGroupButton.classList.add('red-button');
    } else {
      pinGroupButton.classList.add('green-button');
      pinGroupButton.classList.remove('red-button');
    }
  });

  pinGroupButton.addEventListener('click', () => {
    chrome.storage.local.get(['pinnedGroups'], (result) => {
      const pinnedGroups = result.pinnedGroups || {};
      const isPinned = !!pinnedGroups[groupId];

      if (isPinned) {
        // Unpin the group
        delete pinnedGroups[groupId];
        pinGroupButton.textContent = 'Pin Group';
        pinGroupButton.classList.add('green-button');
        pinGroupButton.classList.remove('red-button');
      } else {
        // Pin the group
        const groupTabs = tabList.map((tab) => ({ id: tab.id, url: tab.url }));
        pinnedGroups[groupId] = {
          title: groupTitle,
          tabs: groupTabs,
          color: groupColor,
        };
        pinGroupButton.textContent = 'Unpin Group';
        pinGroupButton.classList.remove('green-button');
        pinGroupButton.classList.add('red-button');
      }

      // Save the updated pinned groups to storage
      chrome.storage.local.set({ pinnedGroups }, () => {
        console.log('Group pinned/unpinned:', pinnedGroups);
      });
    });
  });

  return pinGroupButton;
}
