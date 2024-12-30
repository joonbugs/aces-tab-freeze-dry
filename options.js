/*
    Filename: options.js
    Purpose: This script is responsible for loading and managing user settings within the Options page of the Tab Manager Chrome extension. 
    It interacts with the Chrome storage API to retrieve and save options related to auto-close, auto-sleep, lazy loading, 
    and manual group access settings. 

    Key Functions:
    - loadOptions: Initializes the options page by loading user preferences from Chrome storage and updating the UI accordingly.
    - handleCheckboxChange: Toggles the auto-close feature and saves its state to storage, resetting time settings if disabled.
    - toggleTimeSettings: Shows or hides the time settings input fields based on the state of the auto-close checkbox.
    - toggleEdit: Manages the visibility of edit and submit buttons for time settings, enabling or disabling inputs accordingly.
    - setInputsDisabled: Disables or enables time input fields based on the editing state.
    - saveTimeSettings: Validates and saves the auto-close time settings to storage, ensuring values are greater than zero.
    - handleSleepCheckboxChange: Toggles the auto-sleep feature and saves its state to storage, showing or hiding sleep time settings.
    - toggleSleepTimeSettings: Manages the display of sleep time settings based on the auto-sleep checkbox state.
    - toggleSleepEdit: Similar to toggleEdit, but for sleep time settings, managing button visibility and input states.
    - setSleepInputsDisabled: Disables or enables sleep time input fields based on the editing state.
    - saveSleepTimeSettings: Validates and saves the auto-sleep time settings to storage, ensuring values are greater than zero.
    - handleLazyLoadChange: Saves the lazy loading preference to storage when the checkbox state changes.
    - handleManualGroupAccessChange: Saves the preference for manual group access to storage and logs the change.

    Dependencies:
    - Utilizes Chrome storage API methods (chrome.storage.local.get and chrome.storage.local.set) for persisting user settings.
    - Assumes the existence of specific HTML elements with IDs that correspond to the settings being manipulated (e.g., 'autoCloseCheckbox', 'autoCloseMinutes').

    Storage Variables:
    - autoCloseEnabled
    - autoCloseTime
    - autoSleepEnabled
    - autoSleepTime
    - lazyLoadingEnabled
    - allowManualGroupAccess

    HTML Element IDs:
    - autoCloseCheckbox
    - autoCloseMinutes
    - autoCloseSeconds
    - autoSleepCheckbox
    - autoSleepMinutes
    - autoSleepSeconds
    - lazyLoadingCheckbox
    - allowManualGroupAccessCheckbox

    Initialization:
    - The loadOptions function is called when the options tab is loaded, setting up the UI based on saved preferences and adding event listeners for user interactions.
*/

function loadOptions() {
    console.log('Options Loaded');

    // Load initial settings from storage
    chrome.storage.local.get([
        'autoCloseEnabled',
        'autoCloseTime',
        'autoSleepEnabled',
        'autoSleepTime', 
        'lazyLoadingEnabled',
        'allowManualGroupAccess',
    ], (result) => {
        const { 
            autoCloseEnabled = false, 
            autoCloseTime = { minutes: 120, seconds: 0 }, 
            autoSleepEnabled = false, 
            autoSleepTime = { minutes: 60, seconds: 0 }, 
            lazyLoadingEnabled = false,
            allowManualGroupAccess = false
        } = result;

        // Set the checkbox states
        document.getElementById('autoCloseCheckbox').checked = autoCloseEnabled;
        document.getElementById('autoSleepCheckbox').checked = autoSleepEnabled;
        document.getElementById('lazyLoadingCheckbox').checked = lazyLoadingEnabled;
        document.getElementById('allowManualGroupAccessCheckbox').checked = allowManualGroupAccess;

        // Set the time inputs
        document.getElementById('autoCloseMinutes').value = autoCloseTime.minutes;
        document.getElementById('autoCloseSeconds').value = autoCloseTime.seconds;
        document.getElementById('autoSleepMinutes').value = autoSleepTime.minutes;
        document.getElementById('autoSleepSeconds').value = autoSleepTime.seconds;

        // Show or hide time settings based on checkbox state
        toggleTimeSettings(autoCloseEnabled);
        toggleSleepTimeSettings(autoSleepEnabled);
        setInputsDisabled(true); // Initially disable inputs
        setSleepInputsDisabled(true); // Initially disable sleep inputs
    });

    // Add event listeners
    document.getElementById('autoCloseCheckbox').addEventListener('change', handleCheckboxChange);
    document.getElementById('editTimeBtn').addEventListener('click', toggleEdit);
    document.getElementById('submitTimeBtn').addEventListener('click', saveTimeSettings);
    document.getElementById('autoSleepCheckbox').addEventListener('change', handleSleepCheckboxChange);
    document.getElementById('editSleepTimeBtn').addEventListener('click', toggleSleepEdit);
    document.getElementById('submitSleepTimeBtn').addEventListener('click', saveSleepTimeSettings);
    document.getElementById('lazyLoadingCheckbox').addEventListener('change', handleLazyLoadChange);
    document.getElementById('allowManualGroupAccessCheckbox').addEventListener('change', handleManualGroupAccessChange);
}

function handleCheckboxChange(event) {
    const isChecked = event.target.checked;
    toggleTimeSettings(isChecked);

    if (!isChecked) {
        // Reset to default values when auto close is disabled
        const defaultTime = { minutes: 120, seconds: 0 };
        document.getElementById('autoCloseMinutes').value = defaultTime.minutes;
        document.getElementById('autoCloseSeconds').value = defaultTime.seconds;

        // Save the default time values to storage
        chrome.storage.local.set({ autoCloseTime: defaultTime });
    }

    // Save the new state to storage
    chrome.storage.local.set({ autoCloseEnabled: isChecked });
}

function toggleTimeSettings(isEnabled) {
    const timeSettings = document.querySelector('.time-settings');
    timeSettings.style.display = isEnabled ? 'flex' : 'none';
}

function toggleEdit() {
    const editButton = document.getElementById('editTimeBtn');
    const submitButton = document.getElementById('submitTimeBtn');

    // Toggle visibility of buttons
    editButton.style.display = editButton.style.display === 'none' ? 'inline-block' : 'none';
    submitButton.style.display = submitButton.style.display === 'none' ? 'inline-block' : 'none';

    // Enable or disable inputs based on the button state
    const isEditing = submitButton.style.display === 'inline-block';
    setInputsDisabled(!isEditing);
}

function setInputsDisabled(isDisabled) {
    document.getElementById('autoCloseMinutes').disabled = isDisabled;
    document.getElementById('autoCloseSeconds').disabled = isDisabled;
}

function saveTimeSettings() {
    const minutes = parseInt(document.getElementById('autoCloseMinutes').value);
    const seconds = parseInt(document.getElementById('autoCloseSeconds').value);

    // Validate input
    if (isNaN(minutes) || isNaN(seconds) || (minutes === 0 && seconds === 0)) {
        alert('Please enter a valid time greater than 0.');
        return;
    }

    // Save the time settings to storage
    chrome.storage.local.set({ autoCloseTime: { minutes, seconds } });

    // Switch back to edit mode
    toggleEdit();
}

function handleSleepCheckboxChange(event) {
    const isChecked = event.target.checked;
    toggleSleepTimeSettings(isChecked);
    
    // Save the new state to storage
    chrome.storage.local.set({ autoSleepEnabled: isChecked });
}

function toggleSleepTimeSettings(isEnabled) {
    const sleepTimeSettings = document.querySelector('#autoSleepOption .time-settings');
    sleepTimeSettings.style.display = isEnabled ? 'flex' : 'none';
}

function toggleSleepEdit() {
    const editButton = document.getElementById('editSleepTimeBtn');
    const submitButton = document.getElementById('submitSleepTimeBtn');

    // Toggle visibility of buttons
    editButton.style.display = editButton.style.display === 'none' ? 'inline-block' : 'none';
    submitButton.style.display = submitButton.style.display === 'none' ? 'inline-block' : 'none';

    // Enable or disable inputs based on the button state
    const isEditing = submitButton.style.display === 'inline-block';
    setSleepInputsDisabled(!isEditing);
}

function setSleepInputsDisabled(isDisabled) {
    document.getElementById('autoSleepMinutes').disabled = isDisabled;
    document.getElementById('autoSleepSeconds').disabled = isDisabled;
}

function saveSleepTimeSettings() {
    const minutes = parseInt(document.getElementById('autoSleepMinutes').value);
    const seconds = parseInt(document.getElementById('autoSleepSeconds').value);

    // Validate input
    if (isNaN(minutes) || isNaN(seconds) || (minutes === 0 && seconds === 0)) {
        alert('Please enter a valid time greater than 0.');
        return;
    }

    // Save the time settings to storage
    chrome.storage.local.set({ autoSleepTime: { minutes, seconds } });

    // Switch back to edit mode
    toggleSleepEdit();
}

function handleLazyLoadChange(event) {
    const isChecked = event.target.checked;
    // Save the new state to storage
    chrome.storage.local.set({ lazyLoadingEnabled: isChecked });
}

function handleManualGroupAccessChange(event) {
    const isChecked = event.target.checked;

    // Save the new state to storage
    chrome.storage.local.set({ allowManualGroupAccess: isChecked }, () => {
        console.log('Allow Manual Group Access option updated:', isChecked);
    });
}