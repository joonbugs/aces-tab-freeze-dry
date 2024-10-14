// Global variables
let autoCloseEnabled = false; // Variable to manage auto close state
let autoCloseTime = { minutes: 120, seconds: 0 }; // Default time
let lazyLoadingEnabled = false; // Variable to manage lazy loading state
let autoSleepEnabled = false; // Variable to manage auto sleep state
let autoSleepTime = { minutes: 60, seconds: 0 }; // Default time
let autoGroupingEnabled = false;
let autoGroups = [];
let GroupingFunctioning = false;
let allowManualGroupAccess = false;

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
    await getVaribales();
    // await loadLazyLoadingSettings(); // Load lazy loading settings first
    await migratePinnedGroups(); // Migrate pinned groups
    tabLooping();
  } catch (error) {
    console.error('Error during startup migration:', error);
  }
});

/* Start Get Global variables state from storage */

const getVaribales = async () => {
  try {
    const result = await chrome.storage.local.get(['autoCloseEnabled', 'autoCloseTime', 'lazyLoadingEnabled', 'autoSleepEnabled', 'autoSleepTime', 'autoGroupingEnabled', 'tabGroups', 'allowManualGroupAccess']);
    autoCloseEnabled = result.autoCloseEnabled || false;
    autoCloseTime = result.autoCloseTime || { minutes: 120, seconds: 0 };
    lazyLoadingEnabled = result.lazyLoadingEnabled || false;
    autoSleepEnabled = result.autoSleepEnabled || false;
    autoSleepTime = result.autoSleepTime || { minutes: 60, seconds: 0 };
    autoGroupingEnabled = result.autoGroupingEnabled || false;
    autoGroups = result.tabGroups || [];
    allowManualGroupAccess = result.allowManualGroupAccess || false;
    console.log('Variables Loaded', autoCloseEnabled, autoCloseTime, lazyLoadingEnabled, autoSleepEnabled, autoSleepTime, autoGroupingEnabled, autoGroups, allowManualGroupAccess);
  } catch (error) {
    console.error('Error getting variables from storage:', error);
  }
}

/* End Get Global variables state from storage */

/* Start of listensers when global variables change in storage */

chrome.storage.onChanged.addListener(async (changes) => {
  console.log(changes)
  if (changes.autoCloseEnabled) {
    autoCloseEnabled = changes.autoCloseEnabled.newValue;
  }
  if (changes.autoCloseTime) {
    autoCloseTime = changes.autoCloseTime.newValue;
  }
  if (changes.lazyLoadingEnabled) {
    lazyLoadingEnabled = changes.lazyLoadingEnabled.newValue;
  }
  if (changes.autoSleepEnabled) {
    autoSleepEnabled = changes.autoSleepEnabled.newValue;
  }
  if (changes.autoSleepTime) {
    autoSleepTime = changes.autoSleepTime.newValue;
  }
  if (changes.autoGroupingEnabled) {
    autoGroupingEnabled = changes.autoGroupingEnabled.newValue;
    if (!autoGroupingEnabled) {
      await ungroupAutoGroups();
    }
  }
  if (changes.tabGroups) {
    autoGroups = changes.tabGroups.newValue;
  }

  if (changes.allowManualGroupAccess) {
    allowManualGroupAccess = changes.allowManualGroupAccess.newValue;
  }

  console.log('Variables Changed', autoCloseEnabled, autoCloseTime, lazyLoadingEnabled, autoSleepEnabled, autoSleepTime, autoGroupingEnabled, autoGroups, allowManualGroupAccess);
});

/* End of listensers when global variables change in storage */

/* Start Pinning Functionality */

/**
 * Migrate pinned groups from storage to active tab groups
 * @returns {Promise<void>}
 */
const migratePinnedGroups = async () => {

  const createTabGroup = async (title, tabs, color, oldGroupId) => {
    const createdTabIds = [];
    let positionIndex = 0;

    // Check if the pinned group already exists in Chrome's active tab groups
    const existingGroups = await chrome.tabGroups.query({});
    const isGroupAlreadyPinned = existingGroups.some(group => group.id === parseInt(oldGroupId));

    if (isGroupAlreadyPinned) {
      console.log(`Group with ID ${oldGroupId} already exists. Skipping creation.`);
      return; // Skip creating the group
    }
  
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
        console.log( 'Group info:',groupInfo);
        // Update the stored group info if the title or color has changed
        if (groupInfo) {
          const updatedGroupInfo = {
            ...groupInfo,
            title: group.title !== undefined ? group.title : groupInfo.title,
            color: group.color !== undefined ? group.color : groupInfo.color,
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

  } catch (error) {
    console.error('Error migrating pinned groups:', error);
  }
};

// Function to check if a group is pinned
const isPinnedGroup = async (groupId) => {
  const result = await chrome.storage.local.get(['pinnedGroups']);
  const pinnedGroups = result.pinnedGroups || {};
  
  // Return true if the groupId exists in pinnedGroups, false otherwise
  return Boolean(pinnedGroups[groupId]);
};

/* End Pinning Functionality */

/* Start Tab Looping */
const tabAccessTimes = {};
const tabLooping = () => {
  setInterval(async () => {
    const tabs = await new Promise((resolve) => chrome.tabs.query({}, resolve));
    const now = Date.now();

    for (const tab of tabs) {
      
      // auto close functionality 
      if (autoCloseEnabled) {
        // Update lastAccessed if the tab is active
        if (tab.active) {
          tabAccessTimes[tab.id] = now;
        } else if (!tab.pinned) {
          // Check if the tab is not pinned and not in a pinned group
          const inPinnedGroup = tab.groupId != -1 && (await isPinnedGroup(tab.groupId));
          const lastAccessed = tabAccessTimes[tab.id] || tab.lastAccessed; 
          // if not active or pinned or in pinned group, close the tab
          if (!inPinnedGroup && (now - lastAccessed) > (autoCloseTime.minutes * 60 + autoCloseTime.seconds) * 1000) {
            chrome.tabs.remove(tab.id, () => {
              console.log(`Closed tab: ${tab.title}`);
            });
          }
        }
      }

      // auto sleep functionality (suspand tab)
      if (autoSleepEnabled && !tab.discarded) {
        // Update lastAccessed if the tab is active
        if (tab.active) {
          tabAccessTimes[tab.id] = now;
        } else {
          // if not active check last accessed time
          const lastAccessed = tabAccessTimes[tab.id] || tab.lastAccessed; 
          // check if last accessed time is greater than auto sleep time to suspand tab
          if ((now - lastAccessed) > (autoSleepTime.minutes * 60 + autoSleepTime.seconds) * 1000) {
            // suspand tab
            chrome.tabs.discard(tab.id);
            console.log(`Suspended tab: ${tab.title}`);
          }
        }
      }

      // auto group functionality
      if (autoGroupingEnabled && !GroupingFunctioning && autoGroups.length > 0) {
        await handleTabGrouping(tab);
        GroupingFunctioning = false;
      }
    }
  }, 1000);
}

/* End Tab Looping */

const matchesPattern = (url, patterns) => {
  return patterns.some(pattern => {
    // This can be modified based on your pattern matching requirements
    const regex = new RegExp(pattern.replace(/\*/g, '.*')); // Simple wildcard support
    return regex.test(url);
  });
};

let isGrouping = false; // Lock variable

const handleTabGrouping = async (tab) => {
  // Wait until the lock is released
  while (isGrouping) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Polling with a short delay
  }

  isGrouping = true; // Acquire the lock

  try {
    // Check if the tab is in an auto group
    const inAutoGroup =  (autoGroups.some(group => tab.groupId === group.idInChrome));

    // Skip if the tab is already in a group and the allowManualGroupAccess is not enabled
    if (tab.groupId !== -1 && !inAutoGroup && !allowManualGroupAccess) {
      console.log(`Tab ${tab.title} is already in a group, skipping.`);
      return; // Release lock before returning
    }

    // Check if the tab is pinned
    const isTabPinned = tab.pinned || (tab.groupId !== -1 && await isPinnedGroup(tab.groupId));
    if (isTabPinned) {
      console.log(`Tab ${tab.title} is pinned, skipping grouping.`);
      return; // Release lock before returning
    } 

    // Get existing tab groups from storage
    const result = await chrome.storage.local.get(['tabGroups']);
    const groups = result.tabGroups || [];

    let existingGroupId = null;

    // Iterate through defined groups
    for (const group of autoGroups) {
      if (matchesPattern(tab.url, group.patterns)) {
        console.log(`Tab ${tab.title} matches group: ${group.title}, id: ${group.id}, chrome id: ${group.idInChrome}`);

        // Check if the group ID in Chrome is valid
        const existingGroups = await chrome.tabGroups.query({});
        const isValidGroupId = group.idInChrome && existingGroups.some(existingGroup => existingGroup.id === group.idInChrome);

        if (isValidGroupId) {
          // If the group ID is valid, add the tab to that group
          try {
            await chrome.tabs.group({ tabIds: [tab.id], groupId: group.idInChrome });
            console.log(`Added tab ${tab.title} to existing group ${group.title} with chrome id: ${group.idInChrome}`);
          } catch (error) {
            console.error(`Error adding tab ${tab.title} to group ${group.idInChrome}:`, error);
          }
          return; // Release lock before returning
        } else {
          // Save the group ID for later use if no valid group exists
          existingGroupId = group.id;
          break; // Exit the loop once a match is found
        }
      }
    }

    // Create a new tab group if no existing group is found
    if (existingGroupId) {
      try {
        const groupId = await chrome.tabs.group({ tabIds: [tab.id] }); // Create a new group
        await chrome.tabGroups.update(groupId, { title: autoGroups.find(g => g.id === existingGroupId).title, color: autoGroups.find(g => g.id === existingGroupId).color }); // Update the group

        // Update storage with the new group ID
        const updatedGroups = groups.map(existingGroup => {
          if (existingGroup.id === existingGroupId) {
            return { ...existingGroup, idInChrome: groupId }; // Update idInChrome
          }
          return existingGroup; // Return unchanged group
        });

        await chrome.storage.local.set({ tabGroups: updatedGroups });
        console.log(`Updated storage for tab group with id ${groupId}:`, updatedGroups);
      } catch (error) {
        console.error(`Error creating/updating group for tab ${tab.title}:`, error);
      }
    }

  } finally {
    isGrouping = false; // Release the lock
  }
};

/**
 * Ungroup all groups in the autoGroups array
 * @returns {Promise<void>}
 */
const ungroupAutoGroups = async () => {
  try {
    // Iterate through each auto group
    for (const group of autoGroups) {
      if (group.idInChrome === null) {
        continue; // Skip if idInChrome is null
      }
      // Fetch all tabs in the current group
      const tabsInGroup = await chrome.tabs.query({ groupId: group.idInChrome });
      
      // Ungroup each tab in the group
      for (const tab of tabsInGroup) {
        await new Promise((resolve) => {
          chrome.tabs.ungroup(tab.id, resolve); // Ungroup the tab
        });
        console.log(`Ungrouped tab with ID: ${tab.id} from group ID: ${group.idInChrome}`);
      }
    }

    // Update all autoGroups to set idInChrome to null
    autoGroups.forEach(group => {
      group.idInChrome = null; // Set idInChrome to null for each group
    });

    // Save the updated autoGroups back to storage
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ autoGroups }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('Updated idInChrome to null for all groups in storage');
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('Error ungrouping auto groups:', error);
  }
};