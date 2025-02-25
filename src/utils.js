

export function cleanString(inText) {
    console.error('NOT AN ERROR utils.js cleanString called on the string: ', inText);

    let cleanOutput = inText.toLowerCase();
    console.log("string to be cleaned: ", cleanOutput);

    cleanOutput = cleanOutput.trim();
    cleanOutput = cleanOutput.replace(/\s+/g, '');
    cleanOutput = cleanOutput.replace(' ', '');
    cleanOutput = cleanOutput.replace('/n', '');
    cleanOutput = cleanOutput.replace('!', '');

    console.error('NOT AN ERROR utils.js cleaned string output as: ', cleanOutput);
}