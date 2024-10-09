function loadOptions() {
    console.log('Options Loaded');

    // Load initial settings from storage
    chrome.storage.local.get(['autoCloseEnabled', 'autoCloseTime'], (result) => {
        const { autoCloseEnabled = false, autoCloseTime = { minutes: 5, seconds: 0 } } = result;

        // Set the checkbox state
        document.getElementById('autoCloseCheckbox').checked = autoCloseEnabled;

        // Set the time inputs
        document.getElementById('autoCloseMinutes').value = autoCloseTime.minutes;
        document.getElementById('autoCloseSeconds').value = autoCloseTime.seconds;

        // Show or hide time settings based on checkbox state
        toggleTimeSettings(autoCloseEnabled);
        setInputsDisabled(true); // Initially disable inputs
    });

    // Add event listeners
    document.getElementById('autoCloseCheckbox').addEventListener('change', handleCheckboxChange);
    document.getElementById('editTimeBtn').addEventListener('click', toggleEdit);
    document.getElementById('submitTimeBtn').addEventListener('click', saveTimeSettings);
}

function handleCheckboxChange(event) {
    const isChecked = event.target.checked;
    toggleTimeSettings(isChecked);

    // Save the new state to storage
    chrome.storage.local.set({ autoCloseEnabled: isChecked });
}

function toggleTimeSettings(isEnabled) {
    const timeSettings = document.querySelector('.time-settings');
    timeSettings.style.display = isEnabled ? 'block' : 'none';
}

function toggleEdit() {
    const editButton = document.getElementById('editTimeBtn');
    const submitButton = document.getElementById('submitTimeBtn');

    // Toggle visibility of buttons
    editButton.style.display = editButton.style.display === 'none' ? 'block' : 'none';
    submitButton.style.display = submitButton.style.display === 'none' ? 'block' : 'none';

    // Enable or disable inputs based on the button state
    const isEditing = submitButton.style.display === 'block';
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