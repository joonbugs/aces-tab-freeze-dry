///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////                   IMPORTS AND EXPORTS                   ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { autoCloseEnabled, autoCloseTime, autoSleepEnabled, autoSleepTime, tabAccessTimes } from './config.js';
import { isPinnedGroup } from './groupManager.js';

export const tabLooping = () => {
    setInterval(async () => {
        const tabs = await new Promise((resolve) => chrome.tabs.query({}, resolve));
        const now = Date.now();

        for (const tab of tabs) {
            if (autoCloseEnabled) {
                handleAutoClose(tab, now);
            }
            if (autoSleepEnabled && !tab.discarded) {
                handleAutoSleep(tab, now);
            }
        }
    }, 20000);
};



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////                        FUNCTIONS                        ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const handleAutoClose = async (tab, now) => {
    if (tab.active) {
        tabAccessTimes[tab.id] = now;
    } else if (!tab.pinned) {
        const inPinnedGroup = tab.groupId != -1 && (await isPinnedGroup(tab.groupId));
        const lastAccessed = tabAccessTimes[tab.id] || tab.lastAccessed;
        if (!inPinnedGroup && now - lastAccessed > (autoCloseTime.minutes * 60 + autoCloseTime.seconds) * 1000) {
            chrome.tabs.remove(tab.id, () => {
                console.log(`Closed tab: ${tab.title}`);
            });
        }
    }
};

const handleAutoSleep = (tab, now) => {
    if (tab.active) {
        tabAccessTimes[tab.id] = now;
    } else {
        const lastAccessed = tabAccessTimes[tab.id] || tab.lastAccessed;
        if (now - lastAccessed > (autoSleepTime.minutes * 60 + autoSleepTime.seconds) * 1000) {
            chrome.tabs.discard(tab.id);
            console.log(`Suspended tab: ${tab.title}`);
        }
    }
};