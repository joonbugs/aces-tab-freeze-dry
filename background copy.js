// Listen for when the extension is installed to open a new tab of the given URL
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'https://github.com/MaryEhb/tab-manager-chrome-extension'
    });
  }
});

// Global variables to store active groups and tab group mapping
let activeGroups = {};
let tabGroupMap = {};

// Initialize tab groups from storage on extension startup
chrome.storage.local.get('tabGroups', (result) => {
  const groups = result.tabGroups || [];
  groups.forEach(group => {
    const groupKey = group.name + group.color;
    activeGroups[groupKey] = null; // Prepare to store group IDs later
  });
});

// Listener for when a new tab is created
chrome.tabs.onCreated.addListener((tab) => {
  handleTabGrouping(tab); // Handle grouping for the new tab
});

// Listener for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    handleTabGrouping(tab); // Handle grouping for the tab when it's fully loaded
  }
});

// Listener for when a tab is removed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clean up the tabGroupMap for the removed tab
  for (const groupKey in tabGroupMap) {
    tabGroupMap[groupKey] = tabGroupMap[groupKey].filter(id => id !== tabId);
  }
});

// Listener for changes in stored tab groups
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tabGroups) {
    const newGroups = changes.tabGroups.newValue || [];
    activeGroups = {}; // Reset active groups

    newGroups.forEach(group => {
      const groupKey = group.name + group.color;
      activeGroups[groupKey] = null; // Prepare to store group IDs later
    });

    // Re-evaluate existing tabs for grouping based on updated patterns
    chrome.tabs.query({}, (tabs) => {
      const affectedTabs = tabs.filter(tab => {
        // Determine if the tab should be re-evaluated based on your logic
        return newGroups.some(group => group.patterns.some(pattern => urlMatchesPattern(tab.url, pattern)));
      });

      affectedTabs.forEach(tab => {
        handleTabGrouping(tab); // Attempt to regroup affected tabs
      });
    });
  }
});

// Function to handle tab grouping based on saved patterns
function handleTabGrouping(tab) {
  // Check if the tab is pinned
  if (tab.pinned) {
    return; // Skip grouping for pinned tabs
  }

  // Check if auto grouping is enabled
  chrome.storage.local.get('autoGroupingEnabled', (result) => {
    const autoGroupingEnabled = result.autoGroupingEnabled;

    if (autoGroupingEnabled) {
      // Proceed with grouping logic
      groupTab(tab);
    } else {
      // Ungroup the tab from any previous groups
      removeTabFromPreviousGroups(tab.id);
    }
  });
}

// Function to group the tab based on saved patterns
function groupTab(tab) {
  chrome.storage.local.get('tabGroups', (result) => {
    const groups = result.tabGroups || [];

    // Remove the tab from any previous groups
    removeTabFromPreviousGroups(tab.id);

    // Loop through saved groups to find matching patterns
    for (const group of groups) {
      if (group.patterns.some((pattern) => urlMatchesPattern(tab.url, pattern))) {
        const groupKey = group.name + group.color;

        // If the group ID is not cached, find or create it
        if (!activeGroups[groupKey]) {
          chrome.tabGroups.query({}, (existingGroups) => {
            const matchedGroup = existingGroups.find(g => g.title === group.name && g.color === group.color);

            if (matchedGroup) {
              // Cache the groupId and add the tab to the matched group
              activeGroups[groupKey] = matchedGroup.id;
              chrome.tabs.group({ tabIds: [tab.id], groupId: matchedGroup.id });
            } else {
              // Create a new group and cache the groupId
              chrome.tabs.group({ tabIds: [tab.id] }, (newGroupId) => {
                chrome.tabGroups.update(newGroupId, { title: group.name, color: group.color }, () => {
                  activeGroups[groupKey] = newGroupId; // Cache the new group's ID
                });
              });
            }
          });
        } else {
          // The group ID is already cached, add the tab to it
          chrome.tabs.group({ tabIds: [tab.id], groupId: activeGroups[groupKey] });
        }

        break; // Break after grouping the tab into the first matching group
      }
    }
  });
}

// Function to remove the tab from any previous groups
function removeTabFromPreviousGroups(tabId) {
  for (const groupKey in tabGroupMap) {
    tabGroupMap[groupKey] = tabGroupMap[groupKey].filter(id => id !== tabId);
  }
}

// Utility function to check if a URL matches a given pattern
function urlMatchesPattern(url, pattern) {
  const regex = new RegExp(pattern); // Example: using regex for pattern matching
  return regex.test(url);
}
