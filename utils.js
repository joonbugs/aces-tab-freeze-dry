// utils.js

/**
 * Cleans a given string by converting it to lowercase, trimming whitespace,
 * and removing certain characters.
 * @param {string} inText - The input string to be cleaned.
 * @returns {string} - The cleaned string.
 */
export function cleanString(inText) {
    console.log('cleanString called on the string: ', inText);
    // Ensure inText is a string
    if (typeof inText !== 'string') {
        console.error('inText is not a string. Instead got: ', inText);
        return '';
    }
    let cleanOutput = inText.toLowerCase();
    console.log("string to be cleaned: ", cleanOutput);

    cleanOutput = cleanOutput.trim();
    cleanOutput = cleanOutput.replace(/\s+/g, '');
    cleanOutput = cleanOutput.replace(' ', '');
    cleanOutput = cleanOutput.replace('/n', '');
    cleanOutput = cleanOutput.replace('!', '');

    console.log('cleaned string output as: ', cleanOutput);

    return cleanOutput;
}