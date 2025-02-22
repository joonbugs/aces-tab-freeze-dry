///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////                   IMPORTS AND EXPORTS                   ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { autoCloseEnabled, autoCloseTime, lazyLoadingEnabled, autoSleepEnabled, autoSleepTime, autoGroupingEnabled, autoGroups, allowManualGroupAccess } from './config.js';

export const getVariables = async () => {
    try {
        const result = await chrome.storage.local.get([
            'autoCloseEnabled',
            'autoCloseTime',
            'lazyLoadingEnabled',
            'autoSleepEnabled',
            'autoSleepTime',
            'autoGroupingEnabled',
            'tabGroups',
            'allowManualGroupAccess',
        ]);
        autoCloseEnabled = result.autoCloseEnabled || false;
        autoCloseTime = result.autoCloseTime || { minutes: 120, seconds: 0 };
        lazyLoadingEnabled = result.lazyLoadingEnabled || false;
        autoSleepEnabled = result.autoSleepEnabled || false;
        autoSleepTime = result.autoSleepTime || { minutes: 60, seconds: 0 };
        autoGroupingEnabled = result.autoGroupingEnabled || false;
        autoGroups = result.tabGroups || [];
        allowManualGroupAccess = result.allowManualGroupAccess || false;
    } catch (error) {
        console.error('Error getting variables from storage:', error);
    }
};

// Define other storage-related functions here...