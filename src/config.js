// Define Global and Environmental Variables
export const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
export const ollamaUrl = 'http://localhost:11434/api/chat';
export const groqapikey = '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';
export const openAIapikey = '';
export const model = 2; // 0 = Ollama, 1 = openAI, 2 = groq
export let autoCloseEnabled = false;
export let autoCloseTime = { minutes: 120, seconds: 0 };
export let lazyLoadingEnabled = false;
export let autoSleepEnabled = false;
export let autoSleepTime = { minutes: 60, seconds: 0 };
export let autoGroupingEnabled = false;
export let autoGroups = [];
export let allowManualGroupAccess = false;
export const tabAccessTimes = {};

export const config = {
    get url() { return url; },
    get ollamaUrl() { return ollamaUrl; },
    get groqapikey() { return groqapikey; },
    get openAIapikey() { return openAIapikey; },
    get model() { return model; },
    get autoCloseEnabled() { return autoCloseEnabled; },
    get autoCloseTime() { return autoCloseTime; },
    get lazyLoadingEnabled() { return lazyLoadingEnabled; },
    get autoSleepEnabled() { return autoSleepEnabled; },
    get autoSleepTime() { return autoSleepTime; },
    get autoGroupingEnabled() { return autoGroupingEnabled; },
    get autoGroups() { return autoGroups; },
    get allowManualGroupAccess() { return allowManualGroupAccess; },
    get tabAccessTimes() { return tabAccessTimes; },
    initializeExtension,
    getVariables
};

export const initializeExtension = async () => {
    console.error('NOT AN ERROR config.js: initializatExtension called');
    
    try {
        await getVariables();
        //await migratePinnedGroups();
        //chrome.storage.local.set({ tabGroups: {} });
        //await syncChromeAutoGroups();
        //tablooping();
    } catch (error) {
        console.error('config.js: Error during startup migration:', error);
    }
    
}



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
        console.error(
            'NOT AN ERROR Variables Loaded',
            autoCloseEnabled,
            JSON.stringify(autoCloseTime),
            lazyLoadingEnabled,
            autoSleepEnabled,
            autoSleepTime,
            autoGroupingEnabled,
            autoGroups,
            allowManualGroupAccess
        );
    } catch (error) {
        console.error('Error getting variables from storage:', error);
    }
};
