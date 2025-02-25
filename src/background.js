///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////                   IMPORTS AND EXPORTS                   ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { config } from './config.js';
import { cleanString } from './utils.js';
//import { setupEventListeners } from './eventListeners.js';

//console.error('Service worker started');

chrome.runtime.onInstalled.addListener(() => {
    console.error('NOT AN ERROR background.js: Extension installed');

    console.error('NOT AN ERROR stored groqapikey is', config.groqapikey); // for debugging purposes

    cleanString('Lorem ipsum dolor sit amet');
});

chrome.runtime.onStartup.addListener(() => {
    console.error('NOT AN ERROR background.js: Extension started');
    //    initializeExtension();
});

//setupEventListeners();