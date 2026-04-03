let isRecording = false;

// Pull current count from memory
function updateCount() {
    chrome.storage.local.get({ scrapedData: {} }, (result) => {
        document.getElementById('count').textContent = Object.keys(result.scrapedData).length;
    });
}

// Check if we are currently recording
chrome.storage.local.get(['isRecording'], (result) => {
    isRecording = result.isRecording || false;
    toggleButtons();
    updateCount();
});

function toggleButtons() {
    document.getElementById('startBtn').style.display = isRecording ? 'none' : 'block';
    document.getElementById('stopBtn').style.display = isRecording ? 'block' : 'none';
}

// Button Listeners
document.getElementById('startBtn').addEventListener('click', async () => {
    isRecording = true;
    chrome.storage.local.set({ isRecording: true });
    toggleButtons();
    
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "START" });
});

document.getElementById('stopBtn').addEventListener('click', async () => {
    isRecording = false;
    chrome.storage.local.set({ isRecording: false });
    toggleButtons();
    
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "STOP" });
});

document.getElementById('clearBtn').addEventListener('click', () => {
    if(confirm("Are you sure you want to wipe the collected data?")) {
        chrome.storage.local.set({ scrapedData: {} }, updateCount);
    }
});

document.getElementById('exportBtn').addEventListener('click', () => {
    chrome.storage.local.get({ scrapedData: {} }, (result) => {
        const data = result.scrapedData;
        const keys = Object.keys(data);
        
        if (keys.length === 0) {
            alert("No data to export!");
            return;
        }
        
        let csvContent = "File Name,Duration\n";
        keys.forEach(fileName => {
            const safeName = fileName.replace(/"/g, '""');
            const safeDuration = data[fileName].replace(/"/g, '""');
            csvContent += `"${safeName}","${safeDuration}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "OneDrive_Manual_Durations.csv");
        link.click();
    });
});

// Refresh the counter automatically
setInterval(updateCount, 1000);