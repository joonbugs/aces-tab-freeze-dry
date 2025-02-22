///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////                   IMPORTS AND EXPORTS                   ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { handleTabGrouping } from './groupManager.js';
import { tabLooping } from './tabManager.js';

export const setupEventListeners = () => {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url) {
            handleTabGrouping(tab);
        }
    });

    chrome.tabGroups.onRemoved.addListener((group) => {
        // Handle group removal...
    });

    chrome.tabGroups.onUpdated.addListener((group, changeInfo) => {
        // Handle group updates...
    });

    chrome.tabGroups.onCreated.addListener((group) => {
        // Handle group creation...
    });

    tabLooping();
};