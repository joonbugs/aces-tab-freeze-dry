///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////                   IMPORTS AND EXPORTS                   ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { config } from './config.js';
import { cleanString } from './utils.js'; // TODO will not be imported in final version
import { chatCompletion } from './llm.js';
//import { setupEventListeners } from './eventListeners.js';

//console.error('Service worker started');

chrome.runtime.onInstalled.addListener(() => {
    //console.error('NOT AN ERROR background.js: Extension installed');

    //console.error('NOT AN ERROR stored groqapikey is', config.groqapikey); // for debugging purposes

    //cleanString('Lorem ipsum dolor sit amet
    chatCompletion('This is a test string. Reply with the words {Test Passed}');
    console.log('GROQ URL IS: ', config.groqUrl);
});

chrome.runtime.onStartup.addListener(() => {
    console.log('NOT AN ERROR background.js: Extension started');
    //    initializeExtension();
});

//setupEventListeners();