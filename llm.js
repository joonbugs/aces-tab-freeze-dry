///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////                   IMPORTS AND EXPORTS                   ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { cleanString } from './utils.js';
import { url, groqapikey, openAIapikey, model } from './config.js';

export async function getLlmResponse(inText) {
    let llmOutput = '';
    if (model == 0) {
        llmOutput = await getGroqResponse(inText);
    } else if (model == 1) {
        llmOutput = await getOpenAIResponse(inText);
    } else if (model == 2) {
        llmOutput = await getOllamaResponse(inText);
    }
    return cleanString(llmOutput);
}

async function getOllamaResponse(inText) {
    console.log('getOllamaResponse inText: ' + inText);
    // Define the data to be sent to the Ollama API
    const data = {
        model: "gemma2:2b",  // Replace with the actual model name if needed
        messages: [
            {
                role: "user",
                content: inText
            }
        ],
        stream: false
    };

    console.log('Data being sent to API:', JSON.stringify(data));

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


// Function to get a response from the Groq API
async function getGroqResponse(inText) {
    console.log('getGroqResponse inText: ' + inText);
    // Define the data to be sent to the Groq API
    const responseText = '';
    const model = 'gemma2-9b-it';
    const messages = [{ role: 'user', content: inText }];
    const data = { model, messages };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqapikey}`,
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
            return cleanString(responseText); //TODO MUST PARSE THE RESPONSE TEXT OUT OF THE CHATCOMPLETION DATA STRUCTURE BEFORE RETURN
        } else {
            console.error('No choices found in response:', result);
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function getOpenAIResponse(inText) {
    // Ensure your API key is defined (e.g., process.env.OPENAI_API_KEY)
    const url = 'https://api.openai.com/v1/chat/completions';

    // Define the payload in the same structure as the cURL command
    const payload = {
        model: 'gpt-4o',
        messages: [
            {
                role: 'developer',
                content: 'You are a helpful assistant.',
            },
            {
                role: 'user',
                content: inText,
            },
        ],
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ${openAIapikey}',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log('Full response:', result);

        // Check if choices exist and extract the response from the assistant here
        if (result.choices && result.choices.length > 0) {
            const responseText = result.choices[0].message.content;
            return responseText;
        } else {
            console.error('No choices found in the response:', result);
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}