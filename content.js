let isRecording = false;

// Check initial state in case user refreshes the page
chrome.storage.local.get(['isRecording'], (result) => {
    isRecording = result.isRecording || false;
});

// Listen for Start/Stop from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START") {
        isRecording = true;
        showToast("Recording ON. Click a file.");
    } else if (request.action === "STOP") {
        isRecording = false;
        showToast("Recording OFF.");
    }
});

// Listen to all clicks on the page
document.addEventListener('click', async (e) => {
    if (!isRecording) return;

    // Check if the click was on a file row
    const row = e.target.closest('div[data-automationid="DetailsRow"]');
    if (!row) return;

    // Grab file name immediately
    let fileName = "Unknown";
    const nameElement = row.querySelector('[data-automationid="FieldRenderer-name"]');
    if (nameElement) fileName = nameElement.textContent.trim();

    showToast(`Loading: ${fileName}...`);

    // Wait 2.5 seconds for the right details pane to populate
    await new Promise(r => setTimeout(r, 2500));

    // Hunt for the Duration text
    let duration = "Not found";
    const possibleLabels = Array.from(document.querySelectorAll('*')).filter(el => {
        return el.children.length === 0 && el.textContent.trim().replace(/:$/, '') === 'Duration';
    });

    for (let label of possibleLabels) {
        if (label.nextElementSibling && label.nextElementSibling.textContent.trim() !== '') {
            duration = label.nextElementSibling.textContent.trim();
            break;
        }
        if (label.parentElement && label.parentElement.nextElementSibling) {
            duration = label.parentElement.nextElementSibling.textContent.trim();
            if (duration !== '') break;
        }
    }

    // Save it to Chrome's local storage
    chrome.storage.local.get({ scrapedData: {} }, (result) => {
        const data = result.scrapedData;
        data[fileName] = duration; // Uses the filename as a key to prevent duplicates
        
        chrome.storage.local.set({ scrapedData: data }, () => {
            showToast(`Saved: ${fileName} (${duration})`);
        });
    });
}, true);

// Small on-screen notification system
function showToast(message) {
    let toast = document.getElementById('od-scraper-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'od-scraper-toast';
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#107c41; color:white; padding:12px 24px; border-radius:4px; z-index:999999; font-family:sans-serif; font-size: 14px; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:opacity 0.3s; pointer-events: none;';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}