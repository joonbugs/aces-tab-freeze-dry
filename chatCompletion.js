/*
    Filename: chatCompletion.js
    Purpose: This script is responsible for providing chat completion functionality in the Tab Manager Chrome extension. It will handle the identification and sorting of tab groups in google chrome.
    It contains the system prompts that allow for the dynamic sorting of chrome tabs



    Key Functions:
    - completeChat: makes a call to the LLM as part of its other processes
    - sortGroup: calls the LLM api with user input and returns the desired tab group
    - createGroup: calls the LLM api with user input and creates a new tab group
    - getApiKey: retrieves the user's LLM api key from chrome storage/environment variables

    Storage Variables:
    - model
    - apiKey (should this be part of the variables defined in background.js?)
    - systemPrompts



    Initialization:
    - The sortGroup function is called when the user wants to sort a tab group
    - The createGroup function is called when the sortGroup function returns no reasonable results
    - The getApiKey function is called at chrome.runtime.OnStartUp (when background.js runs getVariables)
 */

export function chatCompletion() {
  /*
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: { sysPrompt }
            },
            {
                role: 'user',
                content: { message }
            },
        ],
        model: { _model }
    })
    console.log(completion.choices[0].message.content);
    */
  console.log('Chat completion called');
  return 'Chat completion called';
}
