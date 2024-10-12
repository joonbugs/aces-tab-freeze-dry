const autoGroup = async () => {
  const autoGroupCheckbox = document.getElementById('activateAutoGroupingCheckbox');
  const formContainer = document.getElementById('formContainer');
  const saveGroupBtn = document.getElementById('saveGroupBtn');
  const addPatternBtn = document.getElementById('addPatternBtn');
  const clearFormBtn = document.getElementById('clearFormBtn');
  const patternInput = document.getElementById('groupPattern');
  const patternList = document.getElementById('patternList');
  const groupNameInput = document.getElementById('groupName');
  const colorPickerCircles = document.querySelectorAll('.color-circle');
  const savedGroupsList = document.getElementById('savedGroupsList');

  let selectedColor = 'grey'; // Default color
  let patterns = []; // Array to hold patterns

  // Load saved settings
  const settings = await chrome.storage.local.get(['autoGroupingEnabled', 'tabGroups']);
  autoGroupCheckbox.checked = settings.autoGroupingEnabled || false;
  let tabGroups = settings.tabGroups || [];

  formContainer.classList.toggle('disabled', !autoGroupCheckbox.checked);
  // Enable or disable form based on checkbox state
  autoGroupCheckbox.addEventListener('change', async () => {
    formContainer.classList.toggle('disabled', !autoGroupCheckbox.checked);
    await chrome.storage.local.set({ autoGroupingEnabled: autoGroupCheckbox.checked });
  });

  // Handle color selection
  colorPickerCircles.forEach(circle => {
    circle.addEventListener('click', () => {
        selectedColor = circle.dataset.color;
        colorPickerCircles.forEach(c => c.classList.remove('selected'));
        circle.classList.add('selected');
    });
  });

  // Add pattern to the list
  addPatternBtn.addEventListener('click', () => {
    const patternValue = patternInput.value.trim();
    if (patternValue && !patterns.includes(patternValue)) {
        patterns.push(patternValue);
        updatePatternList();
        patternInput.value = ''; // Clear input after adding
    }
  });

  // Save group
  saveGroupBtn.addEventListener('click', async () => {
    const groupName = groupNameInput.value.trim();
    if (!groupName || patterns.length === 0) {
        alert('Please provide a group name and at least one pattern.');
        return;
    }

    const newGroup = {
        id: Date.now().toString(),
        idInChrome: null,
        title: groupName,
        color: selectedColor,
        patterns: [...patterns]
    };

    const updatedTabGroups = [newGroup, ...tabGroups];
    await chrome.storage.local.set({ tabGroups: updatedTabGroups });
    clearForm();
    tabGroups = updatedTabGroups;
    loadSavedGroups(tabGroups);
  });

  // Clear form
  clearFormBtn.addEventListener('click', clearForm);

  // Load saved groups into the UI
  function loadSavedGroups(groups) {
    savedGroupsList.innerHTML = ''; // Clear existing items
    groups.forEach(group => {
        const listItem = document.createElement('li');
        
        // Create color circle
        const colorCircle = document.createElement('span');
        colorCircle.classList.add('group-color-circle'); // Apply CSS class for styling
        colorCircle.style.backgroundColor = group.color; // Set the background color to the group's color
        
        // Add the color circle and group title
        listItem.appendChild(colorCircle);
        const titleText = document.createTextNode(group.title);
        listItem.appendChild(titleText);
        
        // Create patterns list
        const patternsList = document.createElement('ul');
        patternsList.classList.add('patterns-list'); // Apply CSS class for styling
        group.patterns.forEach(pattern => {
            const patternItem = document.createElement('li');
            patternItem.textContent = pattern;
            patternsList.appendChild(patternItem);
        });
        
        // Add the patterns list to the list item
        listItem.appendChild(patternsList);
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteGroup(group.id));
        listItem.appendChild(deleteBtn);
        
        // Add listItem to the savedGroupsList
        savedGroupsList.appendChild(listItem);
    });
  }


  // Delete group
  async function deleteGroup(groupId) {
    try {
      // Retrieve the latest tab groups from storage
      const storedData = await chrome.storage.local.get('tabGroups');
      tabGroups = storedData.tabGroups || []; // Update tabGroups with stored data

      // Find the group to delete
      const groupToDelete = tabGroups.find(g => g.id === groupId);

      if (!groupToDelete) {
        console.warn(`Group with ID: ${groupId} not found.`);
        return; // Exit if the group doesn't exist
      }

      const groupIdInChrome = groupToDelete.idInChrome;

      // Fetch all tabs in the current group
      const tabsInGroup = await chrome.tabs.query({ groupId: groupIdInChrome });

      // Ungroup each tab in the group
      for (const tab of tabsInGroup) {
        await new Promise((resolve, reject) => {
          chrome.tabs.ungroup(tab.id, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }); // Ungroup the tab
        });
        console.log(`Ungrouped tab with ID: ${tab.id} from group ID: ${groupIdInChrome}`);
      }

      // Now delete the group from local storage
      const updatedTabGroups = tabGroups.filter(g => g.id !== groupId);
      await chrome.storage.local.set({ tabGroups: updatedTabGroups });
      tabGroups = updatedTabGroups;

      loadSavedGroups(tabGroups);
      console.log(`Deleted group with ID: ${groupId}`);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  }

  // Update pattern list in the UI
  function updatePatternList() {
    patternList.innerHTML = '';
    patterns.forEach(pattern => {
        const listItem = document.createElement('li');
        listItem.textContent = pattern;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            patterns = patterns.filter(p => p !== pattern);
            updatePatternList();
        });
        listItem.appendChild(removeBtn);
        patternList.appendChild(listItem);
    });
  }

  // Clear form inputs
  function clearForm() {
    groupNameInput.value = '';
    patterns = [];
    updatePatternList();
    selectedColor = 'grey';
    colorPickerCircles.forEach(c => c.classList.remove('selected'));

    // Find the gray circle and add 'selected' class to it
    const grayCircle = Array.from(colorPickerCircles).find(c => c.dataset.color === 'grey');
    if (grayCircle) {
        grayCircle.classList.add('selected');
    }
  }

  // Load saved groups initially
  loadSavedGroups(tabGroups);
}