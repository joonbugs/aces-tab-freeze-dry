// Add a variable to manage the auto-close state and time
let autoCloseEnabled = false;
let autoCloseTime = { minutes: 5, seconds: 0 }; // Default time

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
    await migratePinnedGroups();
    await loadAutoCloseSettings(); // Load auto-close settings on startup
    createAutoCloseFunctionality(); // Start the auto-close functionality
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
  autoCloseTime = result.autoCloseTime || { minutes: 5, seconds: 0 };
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
        const inPinnedGroup = tab.groupId != -1 && !(await isPinnedGroup(tab.groupId));
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
      }
  }
  if (changes.autoCloseTime) {
      autoCloseTime = changes.autoCloseTime.newValue;
  }
});

/* End Auto Close Functionality */