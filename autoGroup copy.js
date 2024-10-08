let activeGroups = {}; // Cache active group IDs
let tabGroupMap = {}; // Temporary map to track tabs to be grouped together

function initAutoGrouping() {
    createAutoGroupUI();
    loadSavedGroups();

    // Group existing tabs on initialization
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.pinned && tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
                groupTab(tab); // Only group ungrouped, non-pinned tabs
            }
        });
    });

    // Listen for new tabs being created
    chrome.tabs.onCreated.addListener((tab) => {
        if (!tab.pinned && tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            groupTab(tab);
        }
    });

    // Listen for tab URL updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url && !tab.pinned && tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            groupTab(tab); // Regroup tab if the URL has been updated
        }
    });
}

// Function to group the tab based on saved patterns
function groupTab(tab) {
    chrome.storage.local.get('tabGroups', (result) => {
        const groups = result.tabGroups || [];

        // Loop through saved groups to find matching patterns
        for (const group of groups) {
            if (group.patterns.some((pattern) => urlMatchesPattern(tab.url, pattern))) {
                const groupKey = group.name + group.color;

                if (!tabGroupMap[groupKey]) {
                    tabGroupMap[groupKey] = []; // Initialize array for this groupKey if it doesn't exist
                }
                tabGroupMap[groupKey].push(tab.id); // Add the tab ID to the group map

                // Set a timeout to group tabs after a short delay
                setTimeout(() => {
                    // Check if we already cached the group ID for this group
                    if (activeGroups[groupKey]) {
                        // Add the tabs to the cached group
                        chrome.tabs.group({ tabIds: tabGroupMap[groupKey], groupId: activeGroups[groupKey] });
                    } else {
                        // Query all existing groups to find a matching name and color
                        chrome.tabGroups.query({}, (existingGroups) => {
                            const matchedGroup = existingGroups.find(g => g.title === group.name && g.color === group.color);

                            if (matchedGroup) {
                                // Cache the groupId and add the tabs to the matched group
                                activeGroups[groupKey] = matchedGroup.id;
                                chrome.tabs.group({ tabIds: tabGroupMap[groupKey], groupId: matchedGroup.id });
                            } else {
                                // Create a new group and cache the groupId
                                chrome.tabs.group({ tabIds: tabGroupMap[groupKey] }, (newGroupId) => {
                                    // Update the new group with title and color
                                    chrome.tabGroups.update(newGroupId, { title: group.name, color: group.color }, () => {
                                        // Cache the new group's ID
                                        activeGroups[groupKey] = newGroupId;
                                    });
                                });
                            }
                        });
                    }
                }, 100); // Delay of 100 milliseconds (can be adjusted)

                break; // Break after grouping the tab into the first matching group
            }
        }
    });
}

// Function to check if a URL matches a pattern
function urlMatchesPattern(url, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*')); // Convert wildcard patterns to regex
    return regex.test(url);
}

function createAutoGroupUI() {
    const container = document.getElementById('autoGroupContent');
    container.innerHTML = ''; // Clear any existing content

    // Group Name Input
    const groupNameLabel = document.createElement('label');
    groupNameLabel.innerText = 'Group Name:';
    container.appendChild(groupNameLabel);

    const groupNameInput = document.createElement('input');
    groupNameInput.type = 'text';
    groupNameInput.id = 'groupName';
    container.appendChild(groupNameInput);

    // Group Color Selection
    const groupColorLabel = document.createElement('label');
    groupColorLabel.innerText = 'Group Color:';
    container.appendChild(groupColorLabel);

    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.id = 'colorPicker';
    colorPickerContainer.style.display = 'flex';
    container.appendChild(colorPickerContainer);

    // Allowed colors for Chrome tab groups
    const allowedColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    let selectedColor = 'blue'; // Default color

    allowedColors.forEach((color) => {
        const colorCircle = document.createElement('div');
        colorCircle.style.width = '30px';
        colorCircle.style.height = '30px';
        colorCircle.style.borderRadius = '50%';
        colorCircle.style.backgroundColor = color;
        colorCircle.style.margin = '5px';
        colorCircle.style.cursor = 'pointer';
        colorCircle.style.border = color === selectedColor ? '2px solid black' : '2px solid transparent';

        // Select the color when clicked
        colorCircle.addEventListener('click', () => {
            selectedColor = color;
            document.querySelectorAll('#colorPicker div').forEach(circle => circle.style.border = '2px solid transparent');
            colorCircle.style.border = '2px solid black'; // Highlight selected color
        });

        colorPickerContainer.appendChild(colorCircle);
    });

    // Pattern Input and Add Button
    const patternLabel = document.createElement('label');
    patternLabel.innerText = 'Pattern:';
    container.appendChild(patternLabel);

    const patternInput = document.createElement('input');
    patternInput.type = 'text';
    patternInput.id = 'groupPattern';
    container.appendChild(patternInput);

    const addPatternBtn = document.createElement('button');
    addPatternBtn.id = 'addPatternBtn';
    addPatternBtn.innerText = 'Add Pattern';
    addPatternBtn.addEventListener('click', addPatternToGroup);
    container.appendChild(addPatternBtn);

    // Pattern List
    const patternList = document.createElement('ul');
    patternList.id = 'patternList';
    container.appendChild(patternList);

    // Save Group Button
    const saveGroupBtn = document.createElement('button');
    saveGroupBtn.id = 'saveGroupBtn';
    saveGroupBtn.innerText = 'Save Group';
    saveGroupBtn.addEventListener('click', () => saveGroupSettings(selectedColor));
    container.appendChild(saveGroupBtn);

    // Saved Groups Section
    const savedGroupsLabel = document.createElement('h3');
    savedGroupsLabel.innerText = 'Saved Groups';
    container.appendChild(savedGroupsLabel);

    const savedGroupsList = document.createElement('ul');
    savedGroupsList.id = 'savedGroupsList';
    container.appendChild(savedGroupsList);
}

function saveGroupSettings(selectedColor) {
    const groupName = document.getElementById('groupName').value;
    const patterns = Array.from(document.getElementById('patternList').children).map(li => li.firstChild.textContent);

    if (groupName && patterns.length) {
        const newGroup = { name: groupName, color: selectedColor, patterns: patterns };
        saveGroupToStorage(newGroup);

        // Group existing tabs based on new patterns
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                if (!tab.pinned && tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
                    groupTab(tab); // Group ungrouped, non-pinned tabs
                }
            });
        });
    } else {
        alert('Group name and at least one pattern are required.');
    }
}

function addPatternToGroup() {
    const patternInput = document.getElementById('groupPattern');
    const patternList = document.getElementById('patternList');
    const pattern = patternInput.value.trim();

    if (pattern) {
        const listItem = document.createElement('li');
        listItem.textContent = pattern;

        const editBtn = document.createElement('button');
        editBtn.innerText = 'Edit';
        editBtn.addEventListener('click', () => editPattern(listItem));

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete';
        deleteBtn.addEventListener('click', () => patternList.removeChild(listItem));

        listItem.appendChild(editBtn);
        listItem.appendChild(deleteBtn);
        patternList.appendChild(listItem);

        patternInput.value = ''; // Clear input after adding
    }
}

function editPattern(listItem) {
    const newPattern = prompt('Edit Pattern:', listItem.firstChild.textContent);
    if (newPattern) {
        listItem.firstChild.textContent = newPattern;
    }
}

function saveGroupToStorage(group) {
    chrome.storage.local.get('tabGroups', (result) => {
        const groups = result.tabGroups || [];
        const existingGroupIndex = groups.findIndex(g => g.name === group.name);

        if (existingGroupIndex > -1) {
            groups[existingGroupIndex] = group; // Update existing group
        } else {
            groups.push(group); // Add new group
        }

        chrome.storage.local.set({ tabGroups: groups }, () => {
            console.log('Group saved:', group);
            loadSavedGroups(); // Refresh the UI
        });
    });
}

function loadSavedGroups() {
    chrome.storage.local.get('tabGroups', (result) => {
        const savedGroupsList = document.getElementById('savedGroupsList');
        savedGroupsList.innerHTML = ''; // Clear existing list

        const groups = result.tabGroups || [];
        groups.forEach((group, index) => {
            const groupItem = document.createElement('li');
            groupItem.textContent = `${group.name} (Color: ${group.color})`;

            const editBtn = document.createElement('button');
            editBtn.innerText = 'Edit';
            editBtn.addEventListener('click', () => editGroup(group));

            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = 'Delete';
            deleteBtn.addEventListener('click', () => deleteGroup(index));

            groupItem.appendChild(editBtn);
            groupItem.appendChild(deleteBtn);
            savedGroupsList.appendChild(groupItem);
        });
    });
}

function deleteGroup(index) {
    chrome.storage.local.get('tabGroups', (result) => {
        const groups = result.tabGroups || [];
        groups.splice(index, 1); // Remove the group at the specified index

        chrome.storage.local.set({ tabGroups: groups }, () => {
            console.log('Group deleted');
            loadSavedGroups(); // Refresh the UI
        });
    });
}

function editGroup(group) {
    // Logic for editing a saved group can be implemented here
}
