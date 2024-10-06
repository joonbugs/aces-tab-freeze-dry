// Listen for when the extension is installed to open new tab of given url
chrome.runtime.onInstalled.addListener(({reason}) => {
    if (reason === 'install') {
      chrome.tabs.create({
        url: "https://github.com/MaryEhb/tab-manager-chrome-extension"
      });
    }
});

