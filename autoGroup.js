// Global variable to check if auto grouping is enabled
let autoGroupingEnabled = false;
let currentEditingGroupIndex = null; // Global variable to store the index of the currently editing group

// Default color variable
const defaultColor = '#ff0000'; // Set your desired default color here

// Function to initialize auto grouping
function autoGroup() {
  loadTabGroups();  // Load existing groups when the popup opens
  initializeAutoGroupingCheckbox();  // Initialize the checkbox functionality
  setDefaultColor(); // Set the default color when initializing

  // Add event listeners for buttons
  document.getElementById('addPatternBtn').addEventListener('click', addPatternToGroup);
  document.getElementById('saveGroupBtn').addEventListener('click', saveGroupSettings);
  document.getElementById('clearFormBtn').addEventListener('click', clearForm);
}

// Set default selected color
function setDefaultColor() {
  const colorCircles = document.querySelectorAll('.color-circle');
  if (colorCircles.length > 0) {
    // Set the default color
    setSelectedColor(defaultColor);
  }
}

// Initialize Auto Grouping Checkbox
function initializeAutoGroupingCheckbox() {
  const checkbox = document.getElementById('activateAutoGroupingCheckbox');

  chrome.storage.local.get('autoGroupingEnabled', (result) => {
    autoGroupingEnabled = result.autoGroupingEnabled || false;
    checkbox.checked = autoGroupingEnabled;

    const formContainer = document.getElementById('formContainer');
    toggleDisabledClass(formContainer, !autoGroupingEnabled);

    checkbox.addEventListener('change', () => {
      autoGroupingEnabled = checkbox.checked;
      chrome.storage.local.set({ autoGroupingEnabled }, () => {
        console.log(`AutoGrouping is ${autoGroupingEnabled}`);
      });

      toggleDisabledClass(formContainer, !autoGroupingEnabled);
    });
  });
}

// Toggle Disabled Class
function toggleDisabledClass(container, isDisabled) {
  if (isDisabled) {
    container.classList.add('disabled');
  } else {
    container.classList.remove('disabled');
  }
}

// Save Group Settings
function saveGroupSettings() {
  const groupNameInput = document.getElementById('groupName').value;
  const selectedColor = getSelectedColor(); // From color picker
  const patterns = Array.from(document.getElementById('patternList').children).map(li => li.textContent);

  if (!selectedColor) {
      alert('Please select a color.');
      return; // Prevent saving if no color is selected
  }

  if (groupNameInput && patterns.length) {
      // Fetch the existing tab groups from storage
      chrome.storage.local.get('tabGroups', (result) => {
          const tabGroups = result.tabGroups || {};
          const index = getCurrentEditingGroupIndex(); // Get the index of the currently editing group
          let groupId;

          // If editing an existing group, use its ID, otherwise generate a new one
          if (index !== null && index in Object.keys(tabGroups)) {
              groupId = Object.keys(tabGroups)[index]; // Get the existing group ID
          } else {
              groupId = Date.now().toString(); // Generate a new group ID
          }

          const newGroup = {
              id: groupId,
              name: groupNameInput,
              color: selectedColor,
              patterns: patterns
          };

          tabGroups[groupId] = newGroup; // Save the group in the object

          // Save the updated tabGroups object back to storage
          chrome.storage.local.set({ tabGroups }, () => {
              // Load updated groups list and clear the form
              loadTabGroups();
              clearForm();

              // Group existing tabs based on new patterns
              chrome.tabs.query({}, (tabs) => {
                  handleGroupTab(tabs, newGroup); // Group tabs with the new group settings
              });
          });
      });
  } else {
      alert('Group name and at least one pattern are required.');
  }
}

// Add Pattern to Group
function addPatternToGroup() {
  const patternInput = document.getElementById('groupPattern');
  const patternValue = patternInput.value.trim();
  const existingPatterns = Array.from(document.getElementById('patternList').children).map(li => li.textContent);

  if (patternValue && !existingPatterns.includes(patternValue)) {
    const patternList = document.getElementById('patternList');
    const li = document.createElement('li');
    li.textContent = patternValue;
    patternList.appendChild(li);
    patternInput.value = ''; // Clear the input
  } else {
    alert('Pattern already exists or is empty.');
  }
}

// Clear Form
function clearForm() {
  document.getElementById('groupName').value = '';
  document.getElementById('groupPattern').value = '';
  document.getElementById('patternList').innerHTML = ''; // Clear the pattern list
}

// Save Group to Chrome Storage
function saveGroupToStorage(group, index = null) {
  chrome.storage.local.get('tabGroups', (result) => {
    const tabGroups = result.tabGroups || [];
    
    if (index !== null) {
      // Update existing group
      tabGroups[index] = group; // Update existing group using the index
    } else {
      // Assign a new ID if the group doesn't have one
      if (!group.id) {
        group.id = Date.now().toString(); // Initialize to null when the group is created
      }
      // Add new group
      tabGroups.push(group);
    }

    chrome.storage.local.set({ tabGroups }, () => {
      loadTabGroups(); // Update the displayed list
      clearForm(); // Clear the form after saving
    });
  });
}

// Load Saved Groups
function loadTabGroups() {
  const savedGroupsList = document.getElementById('savedGroupsList');
  savedGroupsList.innerHTML = ''; // Clear existing list

  chrome.storage.local.get('tabGroups', (result) => {
      if (chrome.runtime.lastError) {
          console.error('Error retrieving saved groups:', chrome.runtime.lastError);
          return; // Handle the error as needed
      }

      const tabGroups = result.tabGroups || [];

      if (tabGroups.length === 0) {
          savedGroupsList.innerHTML = '<li>No saved groups available.</li>';
      } else {
          tabGroups.forEach((group) => {
              const li = document.createElement('li');

              // Create a div to hold the group name and the colored circle
              const groupDiv = document.createElement('div');
              groupDiv.style.display = 'flex'; // Use flexbox for alignment
              groupDiv.style.alignItems = 'center'; // Center align items

              // Create the colored circle
              const colorCircle = document.createElement('span');
              colorCircle.style.width = '16px'; // Set width
              colorCircle.style.height = '16px'; // Set height
              colorCircle.style.borderRadius = '50%'; // Make it a circle
              colorCircle.style.backgroundColor = group.color; // Set background color
              colorCircle.style.marginRight = '8px'; // Space between circle and text

              // Set the group name
              const groupName = document.createElement('span');
              groupName.textContent = group.name;

              // Append circle and name to the group div
              groupDiv.appendChild(colorCircle);
              groupDiv.appendChild(groupName);

              // Create a list for patterns
              const patternList = document.createElement('ul');
              group.patterns.forEach(pattern => {
                  const patternItem = document.createElement('li');
                  patternItem.textContent = pattern; // Set the pattern text
                  patternList.appendChild(patternItem);
              });

              // Append the group div and pattern list to the main list item
              li.appendChild(groupDiv);
              li.appendChild(patternList);

              // Edit Button
              const editButton = createButton('Edit', () => editGroup(group, group.id)); // Pass group ID instead of index
              li.appendChild(editButton);

              // Delete Button
              const deleteButton = createButton('Delete', () => deleteGroup(group.id)); // Pass group ID instead of index
              li.appendChild(deleteButton);

              savedGroupsList.appendChild(li);
          });
      }
  });
}

// Edit Group
function editGroup(group, groupId) {
  currentEditingGroupIndex = null; // Reset editing index
  chrome.storage.local.get('tabGroups', (result) => {
      const tabGroups = result.tabGroups || [];
      currentEditingGroupIndex = tabGroups.findIndex(g => g.id === groupId); // Find the index of the group by ID

      // Populate the form with the group's existing values
      document.getElementById('groupName').value = group.name;
      setSelectedColor(group.color);
      const patternList = document.getElementById('patternList');
      patternList.innerHTML = ''; // Clear existing patterns
      group.patterns.forEach(pattern => {
          const li = document.createElement('li');
          li.textContent = pattern;
          patternList.appendChild(li);
      });

      // Change Save button functionality to update instead
      document.getElementById('saveGroupBtn').onclick = () => {
          const updatedGroup = {
              id: groupId,
              name: document.getElementById('groupName').value,
              color: getSelectedColor(),
              patterns: Array.from(patternList.children).map(li => li.textContent)
          };
          saveGroupToStorage(updatedGroup, currentEditingGroupIndex);
      };
  });
}

// Delete Group
function deleteGroup(groupId) {
  // First, ungroup the tabs in the group
  ungroupTabs(groupId); // Call the ungroup function to ungroup the tabs
  
  // Now delete the group from storage
  chrome.storage.local.get('tabGroups', (result) => {
      let tabGroups = result.tabGroups || [];
      tabGroups = tabGroups.filter(group => group.id !== groupId); // Remove the group by ID

      chrome.storage.local.set({ tabGroups }, () => {
          loadTabGroups(); // Refresh the list after deletion
      });
  });
}

// Ungroup Tabs by Group ID
function ungroupTabs(groupId) {
  // Query for tabs in the specified group
  chrome.tabs.query({}, (tabs) => {
      // Filter tabs that belong to the specific group
      const tabIdsToUngroup = tabs
          .filter(tab => tab.groupId === parseInt(groupId)) // Only ungroup tabs in the specific group
          .map(tab => tab.id); // Collect IDs of those tabs

      if (tabIdsToUngroup.length > 0) {
          chrome.tabs.ungroup(tabIdsToUngroup); // Ungroup only those tabs
      }
  });
}

// Check if a URL matches any of the group patterns
function urlMatchesGroup(url, patterns) {
  return patterns.some((pattern) => urlMatchesPattern(url, pattern));
}

// Get Selected Color from Color Picker
function getSelectedColor() {
  const colorCircles = document.querySelectorAll('.color-circle');
  for (const circle of colorCircles) {
    if (circle.classList.contains('selected')) {
      return circle.dataset.color; // Return the color of the selected circle
    }
  }
  return ''; // Return empty if none is selected
}

// Event listener for color selection
document.querySelectorAll('.color-circle').forEach(circle => {
  circle.addEventListener('click', function () {
    document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected')); // Remove selection from all
    this.classList.add('selected'); // Mark this circle as selected
  });
});

// Create Button Helper
function createButton(text, callback) {
  const button = document.createElement('button');
  button.innerText = text;
  button.classList.add('action-button'); // Add a class for styling
  button.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default action if within a form
    callback();
  });
  return button;
}

function setSelectedColor(color) {
  const colorCircles = document.querySelectorAll('.color-circle');
  colorCircles.forEach(circle => {
    circle.classList.remove('selected'); // Clear previous selection
    if (circle.dataset.color === color) {
      circle.classList.add('selected'); // Select the matching color
    }
  });
}

// Handle grouping tabs based on the group patterns
function handleGroupTab(tabs, group) {
  const tabIdsToGroup = []; // Array to store the IDs of tabs to group

  // Load existing groups from storage
  chrome.storage.local.get('tabGroups', (result) => {
    const storedGroups = result.tabGroups || [];
    
    // Create a map of stored groups for easy access
    const tabGroupsMap = {};
    storedGroups.forEach((storedGroup) => {
      tabGroupsMap[storedGroup.id] = storedGroup;
    });

    // Only group tabs that match the criteria
    tabs.forEach((tab) => {
      const currentGroupId = tab.groupId;
      const currentGroup = tabGroupsMap[currentGroupId]; // Get the current group from storage

      // Check if the tab is ungrouped (no group ID)
      if (currentGroupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        // Check if the tab URL matches any of the patterns in the new group
        if (group.patterns.some((pattern) => urlMatchesPattern(tab.url, pattern))) {
          tabIdsToGroup.push(tab.id); // Add matching tab IDs to the array
        }
      } 
      // If the tab is already grouped, check if it matches an existing group's patterns
      else if (currentGroup && group.patterns.some((pattern) => urlMatchesPattern(tab.url, pattern))) {
        // If it matches, we can consider it for regrouping
        tabIdsToGroup.push(tab.id); // Regroup this tab
      }
    });

    // Only attempt to group if there are tab IDs to group
    if (tabIdsToGroup.length > 0) {
      chrome.tabs.group({ tabIds: tabIdsToGroup }, (newGroupId) => {
        // Check if newGroupId is valid before proceeding
        if (newGroupId) {
          chrome.tabGroups.update(newGroupId, { title: group.name, color: group.color });
          group.id = newGroupId; // Set the group ID when the tabs are grouped
          saveGroupToStorage(group); // Save updated group with new ID
        } else {
          console.error("Failed to create a new tab group.");
        }
      });
    } else {
      // If no matching tabs are found, save the group with a null ID
      group.id = null;
      saveGroupToStorage(group); // Save the group even though no tabs matched
    }
  });
}

// Function to group the tab based on saved patterns
function groupTab(tab, group) {
  if (group.patterns.some((pattern) => urlMatchesPattern(tab.url, pattern))) {
    chrome.tabs.group({ tabIds: [tab.id] }, (newGroupId) => {
      chrome.tabGroups.update(newGroupId, { title: group.name, color: group.color });
      group.id = newGroupId; // Set the group ID when the tab is grouped
      saveGroupToStorage(group); // Save updated group
    });
  }
}

// Function to check if a URL matches a pattern
function urlMatchesPattern(url, pattern) {
  // const regex = new RegExp(pattern.replace(/\*/g, '.*')); // Convert wildcard patterns to regex
  const regex = new RegExp(pattern); 
  return regex.test(url);
}

function getCurrentEditingGroupIndex() {
  return currentEditingGroupIndex; // Return the stored index
}