// Listen for when the extension is installed to open a new tab of the given URL
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'https://github.com/MaryEhb/tab-manager-chrome-extension'
    });
  }
});

// When startup check pinned groups to open them 
// FIXME: Breaks when auto grouping groups are enabled
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['pinnedGroups'], (result) => {
    const pinnedGroups = result.pinnedGroups || {};

    Object.keys(pinnedGroups).forEach((oldGroupId) => {
      const groupInfo = pinnedGroups[oldGroupId];
      const { title, tabs, color } = groupInfo;

      // Create an array to store the newly created tab IDs
      const createdTabIds = [];

      // Iterate through the stored tabs and create them
      tabs.forEach((tabInfo, index) => {
        chrome.tabs.create({ url: tabInfo.url, active: index === 0 }, (createdTab) => {
          // Push the created tab ID to the array
          createdTabIds.push(createdTab.id);

          // After all tabs have been created, group them
          if (createdTabIds.length === tabs.length) {
            chrome.tabs.group({ tabIds: createdTabIds }, (newGroupId) => {
              // Set the group title and color
              chrome.tabGroups.update(newGroupId, { title, color });

              // Update storage: remove the old group and add the new one
              chrome.storage.local.get(['pinnedGroups'], (result) => {
                const updatedPinnedGroups = result.pinnedGroups || {};

                // Remove the old group
                delete updatedPinnedGroups[oldGroupId];

                // Add the new group
                updatedPinnedGroups[newGroupId] = { title, tabs, color };

                // Save the updated groups back to storage
                chrome.storage.local.set({ pinnedGroups: updatedPinnedGroups });
              });
            });
          }
        });
      });
    });
  });
});


// Global variables to store active groups and tab group mapping
let activeGroups = {};
let tabGroupMap = {};

// Initialize tab groups from storage on extension startup
chrome.storage.local.get('tabGroups', (result) => {
  const groups = result.tabGroups || [];
  groups.forEach(group => {
    const groupKey = group.name + group.color;
    // Store group information, including patterns, title, and color
    activeGroups[groupKey] = {
      id: null,          // Prepare to store group IDs later
      title: group.name, // Store the group title
      color: group.color, // Store the group color
      patterns: group.patterns || [] // Extract patterns here
    };
  });
});

// Listener for changes in stored tab groups
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tabGroups) {
    const newGroups = changes.tabGroups.newValue || [];

    // Create a map for quick lookup of new groups
    const newGroupMap = {};
    newGroups.forEach(group => {
      const groupKey = group.name + group.color;
      newGroupMap[groupKey] = group;
    });

    // Check for removed or updated groups
    for (const groupKey in activeGroups) {
      const currentGroup = activeGroups[groupKey];

      if (!(groupKey in newGroupMap)) {
        // The group has been removed
        ungroupTabs(currentGroup.id); // Ungroup its tabs based on the group's ID
        delete activeGroups[groupKey]; // Remove from activeGroups
        delete tabGroupMap[groupKey]; // Remove from tabGroupMap
      } else {
        // The group exists in newGroups, check for updates
        const newGroup = newGroupMap[groupKey];

        // Check if the patterns have changed
        if (JSON.stringify(currentGroup.patterns) !== JSON.stringify(newGroup.patterns)) {
          // Patterns have changed, update the current group
          currentGroup.patterns = newGroup.patterns || [];

          // Re-evaluate and update the tabs associated with this group
          chrome.tabs.query({}, (tabs) => {
            const groupedTabs = tabs.filter(tab => tab.groupId === currentGroup.id);
            groupedTabs.forEach(tab => {
              if (!newGroup.patterns.some(pattern => urlMatchesPattern(tab.url, pattern))) {
                // If the tab no longer matches any pattern, ungroup it
                chrome.tabs.ungroup(tab.id);
              }
            });

            // Group any ungrouped tabs that now match the updated patterns
            tabs.forEach(tab => {
              if (tab.groupId !== currentGroup.id && newGroup.patterns.some(pattern => urlMatchesPattern(tab.url, pattern))) {
                groupTab(tab);
              }
            });
          });
        }

        // Preserve the group ID and other attributes if not changed
        currentGroup.title = newGroup.name; // Update title if changed
        currentGroup.color = newGroup.color; // Update color if changed
      }
    }

    // Add new groups
    newGroups.forEach(group => {
      const groupKey = group.name + group.color;
      if (!(groupKey in activeGroups)) {
        // Store new group information
        activeGroups[groupKey] = {
          id: null,          // Prepare to store group IDs later
          title: group.name, // Store the group title
          color: group.color, // Store the group color
          patterns: group.patterns || [] // Extract patterns here
        };

        // Group existing tabs based on new patterns
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (group.patterns.some(pattern => urlMatchesPattern(tab.url, pattern))) {
              groupTab(tab); // Group the tab if it matches the new group's patterns
            }
          });
        });
      }
    });
  }
});

// Function to ungroup tabs based on group ID
function ungroupTabs(groupId) {
  // Logic to find and ungroup all tabs that belong to this group
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.groupId === groupId) {
        chrome.tabs.ungroup(tab.id);
      }
    });
  });
}

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
  // Loop through active groups to find matching patterns
  for (const groupKey in activeGroups) {
    const group = activeGroups[groupKey];
    const groupPatterns = group.patterns; // Ensure that patterns are accessible from activeGroups

    if (groupPatterns && groupPatterns.some(pattern => urlMatchesPattern(tab.url, pattern))) {
      // If the group ID is not cached, find or create it
      if (!group.id) {
        chrome.tabGroups.query({}, (existingGroups) => {
          const matchedGroup = existingGroups.find(g => g.title === group.title && g.color === group.color);

          if (matchedGroup) {
            // Cache the groupId and add the tab to the matched group
            group.id = matchedGroup.id;
            chrome.tabs.group({ tabIds: [tab.id], groupId: matchedGroup.id });
            // Update tabGroupMap
            tabGroupMap[tab.id] = groupKey; 
          } else {
            // Create a new group and cache the groupId
            chrome.tabs.group({ tabIds: [tab.id] }, (newGroupId) => {
              chrome.tabGroups.update(newGroupId, { title: group.title, color: group.color }, () => {
                group.id = newGroupId; // Cache the new group's ID
                // Update tabGroupMap
                tabGroupMap[tab.id] = groupKey; 
                // Group other tabs that match the same patterns with the new group ID
                reGroupMatchingTabs(newGroupId, group.patterns);
              });
            });
          }
        });
      } else {
        // The group ID is already cached, add the tab to it
        chrome.tabs.group({ tabIds: [tab.id], groupId: group.id });
        // Update tabGroupMap
        tabGroupMap[tab.id] = groupKey; 
      }

      break; // Break after grouping the tab into the first matching group
    }
  }
}

// Function to re-group other matching tabs with the same group ID
function reGroupMatchingTabs(groupId, patterns) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.groupId !== groupId && patterns.some(pattern => urlMatchesPattern(tab.url, pattern))) {
        chrome.tabs.group({ tabIds: [tab.id], groupId: groupId });
        tabGroupMap[tab.id] = Object.keys(activeGroups).find(key => activeGroups[key].id === groupId); // Update tabGroupMap
      }
    });
  });
}

// Utility function to check if a URL matches a given pattern
function urlMatchesPattern(url, pattern) {
  const regex = new RegExp(pattern); // Example: using regex for pattern matching
  return regex.test(url);
}

// Function to remove a tab from previous groups
function removeTabFromPreviousGroups(tabId) {
  const previousGroupKey = tabGroupMap[tabId];
  if (previousGroupKey) {
    chrome.tabs.ungroup(tabId);
    delete tabGroupMap[tabId]; // Remove from tabGroupMap
  }
}

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
  delete tabGroupMap[tabId];
});
