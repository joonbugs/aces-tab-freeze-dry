function loadOptions() {
    console.log('Options Loaded');

    // Load initial settings from storage
    chrome.storage.local.get(['autoCloseEnabled', 'autoCloseTime', 'autoSleepEnabled', 'autoSleepTime', 'lazyLoadingEnabled'], (result) => {
        const { 
            autoCloseEnabled = false, 
            autoCloseTime = { minutes: 120, seconds: 0 }, 
            autoSleepEnabled = false, 
            autoSleepTime = { minutes: 60, seconds: 0 }, 
            lazyLoadingEnabled = false 
        } = result;

        // Set the checkbox states
        document.getElementById('autoCloseCheckbox').checked = autoCloseEnabled;
        document.getElementById('autoSleepCheckbox').checked = autoSleepEnabled;
        document.getElementById('lazyLoadingCheckbox').checked = lazyLoadingEnabled;

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