//import config so utils can have access to autoGroups
import { config } from './config.js';

export function cleanString(inText) {
    console.log('NOT AN ERROR utils.js cleanString called on the string: ', inText);

    let cleanOutput = inText.toLowerCase();
    console.log("string to be cleaned: ", cleanOutput);

    cleanOutput = cleanOutput.trim();
    cleanOutput = cleanOutput.replace(/\s+/g, '');
    cleanOutput = cleanOutput.replace(' ', '');
    cleanOutput = cleanOutput.replace('/n', '');
    cleanOutput = cleanOutput.replace('!', '');

    console.log('NOT AN ERROR utils.js cleaned string output as: ', cleanOutput);
}

export function getGroupNames() {
    //TODO implement the retrieval of groupNames here, returning a list of cleaned strings
}