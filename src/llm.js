
import { config } from './config.js';
import { cleanString } from './utils.js';


export async function chatCompletion(inText) {
    console.log('NOT AN ERROR llm.js model index is: ', config.model);
    console.log('NOT AN ERROR llm.js intext is: ', inText);
    let cleanOutput = '';
    let llmOutput = '';

    if (config.model == 0) {
        llmOutput = inText;
        //llmOutput = getOllamaResponse(inText);
    }
    else if (config.model == 1) {
        //llmOutput = getOpenAiResponse(inText);
    }
    else if (config.model == 2) {
        llmOutput = await getGroqResponse(inText);
        console.log('NOT AN ERROR llm.js llmOutput is: ', llmOutput);
    }
    cleanOutput = cleanString(llmOutput);
    return cleanOutput;
}


async function getOllamaResponse(inText) {
    const data = {
        model: config.model,
        messages: [
            {
                role: "user",
                content: inText
            }
        ],
        stream: false
    };

    console.log('Data being sent to API: ', JSON.stringify(data));

    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        console.log('Full response:', response); // Debugging: Log the full response to understand its structure
        const result = await response.json();

        // Combine all message content from the response if there are multiple parts
        let responseText = '';
        if (Array.isArray(result)) {
            result.forEach(part => {
                if (part.message && part.message.content) {
                    responseText += part.message.content + ' ';
                }
            });
        } else if (result.message && result.message.content) {
            responseText = result.message.content;
        }

        // Trim any extra spaces at the ends of the combined message
        responseText = responseText.trim();

        // Ensure 'choices' exists and is an array before accessing it
        if (result.message.content && result.message.content.length > 0) {
            responseText = result.message.content;
        } else {
            console.error('No choices found in response:', result);
            return null;
        }

        return responseText;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function getOpenAiResponse(inText) {

}

async function getGroqResponse(inText) {
    console.log('getGroqResponse inText: ' + inText);
    // Define the data to be sent to the Groq API
    const responseText = '';
    const model = 'gemma2-9b-it';
    const messages = [{ role: 'user', content: inText }];
    const data = { model, messages };

    try {
        const response = await fetch(config.groqUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.groqapikey}`,
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        console.log("inText in GroqResponse is: ", inText);
        console.log('Full response:', result); // Debugging: Log the full response to understand its structure
        
        // Ensure 'choices' exists and is an array before accessing it
        if (result.choices && result.choices.length > 0) {
            const responseText = result.choices[0].message.content;
            //console.log('Parsed response:', responseText);  // Debugging: Log the parsed response
            return responseText;
        } else {
            console.error('No choices found in response:', result);
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}