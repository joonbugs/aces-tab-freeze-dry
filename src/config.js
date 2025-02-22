
// Environmental Variables
export const url = 'https://api.groq.com/openai/v1/chat/completions';
export const ollamaUrl = 'http://localhost:11434/api/chat';
export const groqapikey = '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';
export const openAIapikey = '';
export const model = 0; // 0 = groq, 1 = openAI, 2 = Ollama


// Global Variables
export let autoCloseEnabled = false;
export let autoCloseTime = { minutes: 120, seconds: 0 };
export let lazyLoadingEnabled = false;
export let autoSleepEnabled = false;
export let autoSleepTime = { minutes: 60, seconds: 0 };
export let autoGroupingEnabled = false;
export let autoGroups = [];
export let allowManualGroupAccess = false;
export const tabAccessTimes = {};

export const initializeExtension = async () => {
    console.error('initializatExtension called');
    /*
    try {
        await getVariables();
        await migratePinnedGroups();
        chrome.storage.local.set({ tabGroups: {} });
        await syncChromeAutoGroups();
        tablooping();
    } catch (error) {
        console.error('Error during startup migration:', error);
    }
    */
}



export const getVariables = async () => {
    // TODO implement getVariables function to return all variables
// const result = await chrome.storage.local.get([

    //])
}