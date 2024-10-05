// Event Listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Select all popup Nav tabs and content
    const popupNavTabs = document.querySelectorAll('.nav-tab');
    const popupContents = document.querySelectorAll('.popup-content');

    // Function to deactivate all tabs and content
    const deactivateAll = () => {
        popupNavTabs.forEach(tab => tab.classList.remove('nav-tab--active'));
        popupContents.forEach(content => content.classList.remove('popup-content--active'));
    };

    // Add click event listeners to each tab
    popupNavTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and contents
            deactivateAll();

            // Activate the clicked tab
            tab.classList.add('nav-tab--active');

            // Show the corresponding content by matching the ID
            const contentId = tab.id.replace('Btn', 'Content');
            document.getElementById(contentId).classList.add('popup-content--active');
        });
    });
});