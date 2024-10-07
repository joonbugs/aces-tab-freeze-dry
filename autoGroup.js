// Global variable to check if auto grouping is enabled
let autoGroupingEnabled = false;

function initAutoGrouping() {
  createAutoGroupUI();
}

function createAutoGroupUI() {
  const container = document.getElementById('autoGroupContent');
  container.innerHTML = ''; // Clear any existing content

  // Create the checkbox and label
  createAutoGroupingCheckbox(container);

  // Create the main form container to hold everything else
  const formContainer = document.createElement('div');
  formContainer.id = 'formContainer';
  container.appendChild(formContainer);

  // Create the form inside the formContainer
  createGroupForm(formContainer);

  // Load saved groups
  loadSavedGroups();
}

function createAutoGroupingCheckbox(container) {
  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.classList.add('checkboxWrapper');
  const { checkbox, label } = (() => {
    const id = 'activateAutoGroupingCheckbox';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;

    const label = document.createElement('label');
    label.htmlFor = id;
    label.innerText = 'Enable Auto Grouping';

    return { checkbox, label };
  })();

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

  chrome.storage.local.get('autoGroupingEnabled', (result) => {
    autoGroupingEnabled = result.autoGroupingEnabled || false;
    checkbox.checked = autoGroupingEnabled;

    // Target the formContainer for enabling/disabling
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

function toggleDisabledClass(container, isDisabled) {
  if (isDisabled) {
    container.classList.add('disabled');
  } else {
    container.classList.remove('disabled');
  }
}

function createGroupForm(container) {
    const groupNameInput = (() => {
      container.appendChild(createLabel('Group Name:'));
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'groupName';
      container.appendChild(input);
      return input;
    })();
  
    const selectedColor = createColorPicker(container);
    
    const patternInput = (() => {
      container.appendChild(createLabel('Pattern:'));
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'groupPattern';
      container.appendChild(input);
      return input;
    })();
  
    const patternList = document.createElement('ul');
    patternList.id = 'patternList';
    container.appendChild(patternList);
  
    // Create a wrapper div for buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'buttonWrapper'; // Optionally add a class for styling
  
    // Append buttons to the buttonWrapper
    buttonWrapper.appendChild(createButton('Add Pattern', () => addPatternToGroup(patternInput, patternList)));
    buttonWrapper.appendChild(createButton('Save Group', () => saveGroupSettings(groupNameInput, selectedColor, patternList)));
  
    // Create and append the Clear button
    buttonWrapper.appendChild(createButton('Clear', () => clearForm(groupNameInput, patternInput, patternList)));
  
    // Append buttonWrapper to the main container
    container.appendChild(buttonWrapper);
  
    container.appendChild(createLabel('Saved Groups', 'h3'));
    const savedGroupsList = document.createElement('ul');
    savedGroupsList.id = 'savedGroupsList';
    container.appendChild(savedGroupsList);
  }
  
  function clearForm(groupNameInput, patternInput, patternList) {
    // Clear the group name input
    groupNameInput.value = '';
    
    // Clear the pattern input
    patternInput.value = '';
  
    // Clear the patterns list
    patternList.innerHTML = '';
  
    // Reset selected color
    const defaultColor = 'blue'; // Set your default color here
    const colorCircles = document.querySelectorAll('#colorPicker div');
    colorCircles.forEach(circle => {
        circle.style.border = '2px solid transparent';
        if (circle.style.backgroundColor === defaultColor) {
            circle.style.border = '2px solid black';
        }
  });
}  

function createColorPicker(container) {
  container.appendChild(createLabel('Group Color:'));
  const colorPickerContainer = document.createElement('div');
  colorPickerContainer.id = 'colorPicker';
  colorPickerContainer.style.display = 'flex';
  container.appendChild(colorPickerContainer);

  const allowedColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  let selectedColor = 'blue'; // Default color

  allowedColors.forEach((color) => {
    const colorCircle = document.createElement('div');
    colorCircle.style.cssText = `
      width: 30px; height: 30px; border-radius: 50%;
      background-color: ${color}; margin: 5px; cursor: pointer;
      border: 2px solid ${color === selectedColor ? 'black' : 'transparent'}
    `;

    colorCircle.addEventListener('click', () => {
      document.querySelectorAll('#colorPicker div').forEach(circle => circle.style.border = '2px solid transparent');
      colorCircle.style.border = '2px solid black';
      selectedColor = color;
    });

    colorPickerContainer.appendChild(colorCircle);
  });

  return () => selectedColor; // Return a function to get selected color
}

function saveGroupSettings(groupNameInput, getSelectedColor, patternList) {
    const groupName = groupNameInput.value;
    const selectedColor = getSelectedColor(); // Get the selected color
    const patterns = Array.from(patternList.children).map(li => li.firstChild.textContent);

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

        // Clear inputs and patterns after saving
        groupNameInput.value = ''; // Clear group name input
        patternList.innerHTML = ''; // Clear patterns list

        // Reset selected color (you might need to update this part based on your color picker logic)
        const defaultColor = 'blue'; // Set your default color here
        const colorCircles = document.querySelectorAll('#colorPicker div');
        colorCircles.forEach(circle => {
            circle.style.border = '2px solid transparent';
            if (circle.style.backgroundColor === defaultColor) {
                circle.style.border = '2px solid black';
            }
        });
    } else {
        alert('Group name and at least one pattern are required.');
    }
}

function addPatternToGroup(patternInput, patternList) {
  const pattern = patternInput.value.trim();
  if (pattern) {
    const listItem = createPatternListItem(pattern);
    patternList.appendChild(listItem);
    patternInput.value = ''; // Clear input after adding
  }
}

function createPatternListItem(pattern) {
  const listItem = document.createElement('li');
  listItem.textContent = pattern;

  const editBtn = createButton('Edit', () => editPattern(listItem));
  const deleteBtn = createButton('Delete', () => listItem.remove());

  listItem.appendChild(editBtn);
  listItem.appendChild(deleteBtn);

  return listItem;
}

function loadSavedGroups() {
  chrome.storage.local.get('tabGroups', (result) => {
    const savedGroupsList = document.getElementById('savedGroupsList');
    savedGroupsList.innerHTML = ''; // Clear existing list

    const groups = result.tabGroups || [];
    groups.forEach((group, index) => {
      const groupItem = document.createElement('li');

      // Create color circle element
      const colorCircle = document.createElement('div');
      colorCircle.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 10px;
        background-color: ${group.color || 'black'}; /* Default to black if no color */
      `;

      // Append color circle to list item
      groupItem.appendChild(colorCircle);

      // Add group name and color
      const groupText = document.createTextNode(`${group.name} (Color: ${group.color || 'black'})`);
      groupItem.appendChild(groupText);

      // Add Edit and Delete buttons
      const editBtn = createButton('Edit', () => editGroup(group));
      const deleteBtn = createButton('Delete', () => deleteGroup(index));

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

function createButton(text, callback) {
  const button = document.createElement('button');
  button.innerText = text;
  button.addEventListener('click', callback);
  return button;
}

function createLabel(text, tag = 'label') {
  const label = document.createElement(tag);
  label.innerText = text;
  return label;
}

function editGroup(group) {
    const groupNameInput = document.getElementById('groupName');
    const patternList = document.getElementById('patternList');
  
    // Populate the group name and clear the current patterns
    groupNameInput.value = group.name;
    patternList.innerHTML = ''; // Clear existing patterns
  
    // Populate the patterns into the list
    group.patterns.forEach(pattern => {
      const listItem = createPatternListItem(pattern);
      patternList.appendChild(listItem);
    });
  
    // Set selected color
    setSelectedColor(group.color);
  
    // Change the Save Group button to update the existing group
    const saveButton = createButton('Save Group', () => updateGroup(group));
    const formContainer = document.getElementById('formContainer');
    
    // Remove any existing Save Group button and append the new one
    const existingSaveButton = formContainer.querySelector('button:last-child'); // Find last button (the previous Save Group)
    if (existingSaveButton) {
      formContainer.removeChild(existingSaveButton);
    }
    
    formContainer.appendChild(saveButton);
  }
  
  function updateGroup(originalGroup) {
    const groupNameInput = document.getElementById('groupName');
    const selectedColor = getSelectedColor(); // Get the selected color
    const patternList = document.getElementById('patternList');
    const patterns = Array.from(patternList.children).map(li => li.firstChild.textContent);
  
    // Create the updated group object
    const updatedGroup = { name: groupNameInput.value, color: selectedColor, patterns: patterns };
  
    if (updatedGroup.name && patterns.length) {
      saveGroupToStorage(updatedGroup, originalGroup.name); // Pass the original name for updating
    } else {
      alert('Group name and at least one pattern are required.');
    }
  }
  
  // Update saveGroupToStorage to handle updating existing groups
  function saveGroupToStorage(group, originalGroupName) {
      chrome.storage.local.get('tabGroups', (result) => {
          const groups = result.tabGroups || [];
          if (originalGroupName) {
              // Update the group
              const existingGroupIndex = groups.findIndex(g => g.name === originalGroupName);
              if (existingGroupIndex > -1) {
                  groups[existingGroupIndex] = group; // Update existing group
              }
          } else {
              // Add new group if no originalGroupName is provided
              const existingGroupIndex = groups.findIndex(g => g.name === group.name);
              if (existingGroupIndex > -1) {
                  groups[existingGroupIndex] = group; // Update existing group
              } else {
                  groups.push(group); // Add new group
              }
          }
  
          chrome.storage.local.set({ tabGroups: groups }, () => {
              console.log('Group saved:', group);
              loadSavedGroups(); // Refresh the UI
          });
      });
  }
  
  // Helper function to set the selected color in the color picker
  function setSelectedColor(color) {
      const colorCircles = document.querySelectorAll('#colorPicker div');
      colorCircles.forEach(circle => {
          circle.style.border = '2px solid transparent';
          if (circle.style.backgroundColor === color) {
              circle.style.border = '2px solid black';
          }
      });
  }

  function editPattern(listItem) {
    const newPattern = prompt('Edit Pattern:', listItem.firstChild.textContent);
    if (newPattern) {
        listItem.firstChild.textContent = newPattern;
    }
}
