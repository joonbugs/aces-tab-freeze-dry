// Add a variable to manage the auto-close state and time
let autoCloseEnabled = false;
let autoCloseTime = { minutes: 120, seconds: 0 }; // Default time
let lazyLoadingEnabled = false; // Variable to manage lazy loading state
let activeGroups = {};
let tabGroupMap = {};

// Listen for when the extension is installed and open a welcome tab 
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: 'https://github.com/MaryEhb/tab-manager-chrome-extension'
    });
  }
});

// On startup, migrate pinned groups from storage to open them
chrome.runtime.onStartup.addListener(async () => {
  try {
    await loadLazyLoadingSettings(); // Load lazy loading settings first
    await migratePinnedGroups(); // Migrate pinned groups
    await loadAutoCloseSettings(); // Load auto-close settings on startup
    createAutoCloseFunctionality(); // Start the auto-close functionality
    await initializeTabGroups();
  } catch (error) {
    console.error('Error during startup migration:', error);
  }
});

/**
 * Migrate pinned groups from storage to active tab groups
 * @returns {Promise<void>}
 */
const migratePinnedGroups = async () => {
  try {
    const result = await chrome.storage.local.get(['pinnedGroups']);
    const pinnedGroups = result.pinnedGroups || {};

    // Create an array of promises for tab group creation
    const creationPromises = Object.keys(pinnedGroups).map((oldGroupId) => {
      const { title, tabs, color } = pinnedGroups[oldGroupId];

      // Validate that tabs is an array
      if (Array.isArray(tabs)) {
        return createTabGroup(title, tabs, color, oldGroupId);
      } else {
        console.warn(`Invalid tabs for groupId ${oldGroupId}:`, tabs);
        return Promise.resolve(); // Skip invalid groups
      }
    });

    // Wait for all tab groups to be created
    await Promise.all(creationPromises);
  } catch (error) {
    console.error('Error migrating pinned groups:', error);
  }
};

/**
 * Create a new tab group and update storage
 * @param {string} title - The title of the tab group
 * @param {Array} tabs - Array of tab info objects
 * @param {string} color - The color of the tab group
 * @param {string} oldGroupId - The ID of the old group to remove from storage
 * @returns {Promise<void>}
 */
const createTabGroup = async (title, tabs, color, oldGroupId) => {
  const createdTabIds = [];
  let positionIndex = 0;

  // Create an array of promises for tab creation
  const tabCreationPromises = tabs.map((tabInfo) => {
    return new Promise((resolve) => {
      chrome.tabs.create({ url: tabInfo.url, active: false }, (createdTab) => {
        if (chrome.runtime.lastError) {
          console.error('Error creating tab:', chrome.runtime.lastError);
          return resolve(); // Resolve even on error to avoid hanging
        }
        
        chrome.tabs.move(createdTab.id, { index: positionIndex }, (movedTab) => {
          if (chrome.runtime.lastError) {
            console.error('Error moving tab:', chrome.runtime.lastError);
            return resolve(); // Resolve even on error
          }
          createdTabIds.push(movedTab.id);
          positionIndex++;
          resolve(); // Resolve the promise when the tab is moved
        });
      });
    });
  });

  // Wait for all tabs to be created and moved
  await Promise.all(tabCreationPromises);

  // Group the created tabs
  const newGroupId = await new Promise((resolve) => {
    chrome.tabs.group({ tabIds: createdTabIds }, (groupId) => {
      if (chrome.runtime.lastError) {
        console.error('Error creating tab group:', chrome.runtime.lastError);
        return resolve(null); // Return null if there's an error
      }
      resolve(groupId);
    });
  });

  // Proceed only if the group was created successfully
  if (newGroupId) {
    await new Promise((resolve) => {
      chrome.tabGroups.update(newGroupId, { title, color }, resolve);
    });

    // Update storage with the new group info
    await updatePinnedGroupsStorage(oldGroupId, newGroupId, { title, tabs, color });
  } else {
    console.warn(`Failed to create tab group for oldGroupId ${oldGroupId}`);
  }
};

/**
 * Update storage by removing old group and adding new group
 * @param {string} oldGroupId - The ID of the old group
 * @param {string} newGroupId - The ID of the new group
 * @param {Object} groupInfo - The information of the new group
 * @returns {Promise<void>}
 */
const updatePinnedGroupsStorage = async (oldGroupId, newGroupId, groupInfo) => {
  try {
    const result = await chrome.storage.local.get(['pinnedGroups']);
    const updatedPinnedGroups = result.pinnedGroups || {};

    // Remove the old group and add the new group
    if (updatedPinnedGroups[oldGroupId]) {
      delete updatedPinnedGroups[oldGroupId];
    }
    
    updatedPinnedGroups[newGroupId] = groupInfo;

    // Save the updated groups back to storage
    await chrome.storage.local.set({ pinnedGroups: updatedPinnedGroups });
  } catch (error) {
    console.error('Error updating pinned groups storage:', error);
  }
};

// Listen for tab group removal (ungroup or close)
chrome.tabGroups.onRemoved.addListener((group) => {
  chrome.storage.local.get(['pinnedGroups'], (result) => {
    const updatedPinnedGroups = result.pinnedGroups || {};

    // Log the current pinned groups for debugging
    console.log('Current pinned groups:', updatedPinnedGroups);
    console.log(group.id);

    // If the group exists in storage, remove it (unpin it)
    if (updatedPinnedGroups[group.id]) {
      console.log(`Unpinning group with ID: ${group.id}`); // Log for debugging
      delete updatedPinnedGroups[group.id]; // Remove the group from storage
      chrome.storage.local.set({ pinnedGroups: updatedPinnedGroups }, () => {
        console.log(`Updated storage: ${JSON.stringify(updatedPinnedGroups)}`); // Confirm storage update
      });
    } else {
      console.log(`Group ID ${group.id} not found in pinned groups.`); // Log if group was not found
    }
  });
});

// Listen for tab group updates (title or color change)
chrome.tabGroups.onUpdated.addListener((group, changeInfo) => {
  chrome.storage.local.get(['pinnedGroups'], (result) => {
    const updatedPinnedGroups = result.pinnedGroups || {};

    // Log the current pinned groups and the group being updated for debugging
    console.log('Current pinned groups:', updatedPinnedGroups);
    console.log('Updating group ID:', group.id);

    // Use the correct group ID to check for existing entries
    const groupInfo = updatedPinnedGroups[group.id];

    // Update the stored group info if the title or color has changed
    if (groupInfo) {
      const updatedGroupInfo = {
        ...groupInfo,
        title: changeInfo.title !== undefined ? changeInfo.title : groupInfo.title,
        color: changeInfo.color !== undefined ? changeInfo.color : groupInfo.color,
      };

      // Check if the updated info is different before saving
      if (JSON.stringify(updatedGroupInfo) !== JSON.stringify(groupInfo)) {
        updatedPinnedGroups[group.id] = updatedGroupInfo;
        chrome.storage.local.set({ pinnedGroups: updatedPinnedGroups }, () => {
          console.log(`Updated storage for group ID ${group.id}:`, updatedGroupInfo);
        });
      }
    } else {
      console.log(`Group ID ${group.id} not found in pinned groups.`); // Log if group was not found
    }
  });
});

/* Start Auto Close Functionality */

// Load auto-close settings from storage
const loadAutoCloseSettings = async () => {
  const result = await chrome.storage.local.get(['autoCloseEnabled', 'autoCloseTime']);
  autoCloseEnabled = result.autoCloseEnabled || false;
  autoCloseTime = result.autoCloseTime || { minutes: 120, seconds: 0 };
};

// Create a function to check if a group is pinned
const isPinnedGroup = async (groupId) => {
  const result = await chrome.storage.local.get(['pinnedGroups']);
  const pinnedGroups = result.pinnedGroups || {};
  
  // Return true if the groupId exists in pinnedGroups, false otherwise
  return Boolean(pinnedGroups[groupId]);
};

// Create the auto-close functionality
const tabAccessTimes = {};
const createAutoCloseFunctionality = () => {
  setInterval(async () => {
    if (!autoCloseEnabled) return;

    const closeAfterMillis = (autoCloseTime.minutes * 60 + autoCloseTime.seconds) * 1000;

    const tabs = await new Promise((resolve) => chrome.tabs.query({}, resolve));
    const now = Date.now();

    for (const tab of tabs) {
      console.log(`Checking tab: ${tab.title}`);
      // Update lastAccessed if the tab is active
      if (tab.active) {
        tabAccessTimes[tab.id] = now; // Update last accessed time
      }

      // Check if the tab is not pinned and not in a pinned group
      if (!tab.active && !tab.pinned) {
        const inPinnedGroup = tab.groupId != -1 && (await isPinnedGroup(tab.groupId));
        const lastAccessed = tabAccessTimes[tab.id] || tab.lastAccessed; 
        if (!inPinnedGroup && (now - lastAccessed) > closeAfterMillis) {
          chrome.tabs.remove(tab.id, () => {
            console.log(`Closed tab: ${tab.title}`);
          });
        }
      }
    }
  }, 1000); // Check every 1 seconds
};

chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoCloseEnabled) {
      autoCloseEnabled = changes.autoCloseEnabled.newValue;
      if (autoCloseEnabled) {
          createAutoCloseFunctionality();
      } else {
        chrome.storage.local.set({ autoCloseTime: { minutes: 120, seconds: 0 } });
        autoCloseTime = { minutes: 120, seconds: 0 };          
      }
  }
  if (changes.autoCloseTime) {
      autoCloseTime = changes.autoCloseTime.newValue;
  }
});

/* End Auto Close Functionality */

/* Start Lazy Loading Functionality */

const loadLazyLoadingSettings = async () => {
  const result = await chrome.storage.local.get(['lazyLoadingEnabled']);
  lazyLoadingEnabled = result.lazyLoadingEnabled || false;
};

/* End Lazy Loading Functionality */

/* Start Auto Grouping Functionality */

/**
 * Initialize tab groups from storage and group existing tabs
 * @returns {Promise<void>}
 */
const initializeTabGroups = async () => {
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
      // Check if the tab is already in a group
      if (tab.groupId !== -1) {
        // Check if the existing group is in activeGroups (auto-created group)
        const existingGroupKey = Object.keys(activeGroups).find(key => activeGroups[key].id === tab.groupId);
        
        // If it's an auto-created group, proceed with grouping logic
        if (existingGroupKey) {
          groupTab(tab);
        }
      } else {
        // Proceed with grouping logic since the tab is not in a group
        groupTab(tab);
      }
    } else {
      // Ungroup the tab from any previous groups if auto grouping is disabled
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
};

/* End Auto Grouping Functionality */