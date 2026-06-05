// Base Menu Items Architecture Matrix
let defaultStructuredItems = [
    { name: "Chicken Biryani", category: "Rice", weight: 0 },
    { name: "Beef Biryani", category: "Rice", weight: 0 },
    { name: "Beef Pulao", category: "Rice", weight: 0 },
    { name: "Sada Biryani", category: "Rice", weight: 0 },
    { name: "Chicken Qorma", category: "Curry", weight: 0 },
    { name: "Beef karahi", category: "Curry", weight: 0 },
    { name: "Naan", category: "Bread", weight: 0 },
    { name: "Chapati", category: "Bread", weight: 0 }
];

// LocalStorage Persistent Global States Initialization
let customItems = JSON.parse(localStorage.getItem('categorizedMenu')) || defaultStructuredItems;
let currentActiveCategory = "All";

let currentCart = {};
let currentDayLog = JSON.parse(localStorage.getItem('currentDayLog')) || [];
let currentRefundLog = JSON.parse(localStorage.getItem('currentRefundLog')) || [];
let allTimeHistory = JSON.parse(localStorage.getItem('allTimeHistory')) || [];
let knownCustomers = JSON.parse(localStorage.getItem('knownCustomers')) || [];
let shiftStartTime = localStorage.getItem('shiftStartTime') || null;

// Unique Global Token Sequential Seed Tracking Index
let currentTokenSeed = parseInt(localStorage.getItem('currentTokenSeed')) || 1001;

let activeCallback = null;
let requiredPinType = 'refund'; 
let activeCustomerSearchQuery = "";

// Date String Sanitizer & Normalizer Engine
function normalizeToSystemDate(rawDateString) {
    if (!rawDateString) return getFormattedSystemDate();
    let workingString = rawDateString.split('(')[0].trim();
    let parsedDate = new Date(workingString);
    if (isNaN(parsedDate.getTime())) {
        let match = workingString.match(/^(\d+)[./-](\d+)[./-](\d+)/);
        if (match) {
            let parts = workingString.split(/[./-]/);
            if(parts[0].length === 4) {
                parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                parsedDate = new Date(parts[2], parts[0] - 1, parts[1]);
            }
        }
    }
    return isNaN(parsedDate.getTime()) ? rawDateString : getFormattedSystemDate(parsedDate);
}

function getFormattedSystemDate(dateObj = new Date()) {
    const day = dateObj.getDate();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${day} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// Levenshtein String Proximity Matcher
function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function findClosestCustomerName(inputName) {
    let cleanInput = inputName.trim().toLowerCase();
    let bestMatch = null;
    let lowestDistance = Infinity;
    for (let known of knownCustomers) {
        let cleanKnown = known.toLowerCase();
        let distance = getLevenshteinDistance(cleanInput, cleanKnown);
        let threshold = cleanInput.length <= 4 ? 1 : 2; 
        if (distance <= threshold && distance < lowestDistance) {
            lowestDistance = distance;
            bestMatch = known;
        }
    }
    return bestMatch;
}

function populateCustomerDatalist() {
    const dataList = document.getElementById('customer-memory-list');
    if (!dataList) return;
    dataList.innerHTML = '';
    knownCustomers.sort().forEach(name => {
        let option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

// Router Workspace Tab Switch View Controller
function switchView(tabId) {
    document.querySelectorAll('.tab-content').forEach(element => element.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(element => element.classList.remove('active'));
    let btn = document.getElementById('btn-' + tabId);
    if(btn) btn.classList.add('active');
    if (tabId === 'history-tab' || tabId === 'logs-tab') {
        renderLogs();
    }
}

// Security Verification Layer Modals Engine
function openPinModal(title, type, successCallback) {
    document.getElementById('modal-title-text').innerText = title;
    document.getElementById('modal-pin-input').value = '';
    requiredPinType = type;
    activeCallback = successCallback;
    document.getElementById('secure-pin-modal').style.display = 'flex';
    document.getElementById('modal-pin-input').focus();
}

// POS Sidebar Reverse Processing Logic (Counter POS Panel Execution)
function initiateCounterRefund() {
    let inputToken = prompt("Enter Target Active Token ID String Code (e.g. 1005):");
    if (!inputToken) return;
    
    let targetId = parseInt(inputToken.trim().replace('#', ''));
    if (isNaN(targetId)) {
        alert("Incorrect formatting schema structure. Numeric inputs required.");
        return;
    }

    // Scan memory arrays for tracking match signatures
    let matchedIndex = currentDayLog.findIndex(log => log.tokenId === targetId);
    
    if (matchedIndex === -1) {
        alert(`Token ID #${targetId} not found in current operational shift log.`);
        return;
    }

    let itemRecord = currentDayLog[matchedIndex];
    let currentSystemFormattedDate = getFormattedSystemDate();

    // Verification screen interface prompt displaying details safely
    let promptConfirmation = confirm(
        `VERIFY TRANSACTION OVERRIDE SYSTEM PARAMETERS:\n` +
        `----------------------------------------\n` +
        `• Token Identifier ID: #${itemRecord.tokenId}\n` +
        `• Tracked Allocation Item: ${itemRecord.item}\n` +
        `• Volume Quantity Array: x${itemRecord.qty}\n` +
        `• Account Mapping Profile: ${itemRecord.customer || 'Walk-In'}\n` +
        `• Shift Operational Date: ${currentSystemFormattedDate}\n\n` +
        `Confirm data correction mutation sequence?`
    );

    if (!promptConfirmation) return;

    // Route processing to check authority configuration keys
    openPinModal("Verification authorization protocols requested.", "refund", function() {
        let now = new Date();
        let refundTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let refundObject = { 
            tokenId: itemRecord.tokenId,
            time: refundTime, 
            item: itemRecord.item, 
            qty: itemRecord.qty, 
            customer: itemRecord.customer || "Walk-In" 
        };
        
        // Mutate registry blocks safely
        currentRefundLog.push(refundObject);
        localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
        
        currentDayLog.splice(matchedIndex, 1);
        localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
        
        alert(`System state verified. Token ID #${targetId} successfully voided.`);
        renderLogs();
        // Paper print commands completely decoupled here to minimize printing waste
    });
}

function closePinModal() {
    document.getElementById('secure-pin-modal').style.display = 'none';
    activeCallback = null;
}

function submitPinModal() {
    let enteredPin = document.getElementById('modal-pin-input').value.trim();
    let targetPin = (requiredPinType === 'refund') ? '1414' : '787898';
    if (enteredPin === targetPin) {
        document.getElementById('secure-pin-modal').style.display = 'none';
        if (activeCallback) activeCallback();
        activeCallback = null;
    } else {
        alert("Security failure. Operation Denied.");
        document.getElementById('modal-pin-input').value = '';
    }
}

// System Backup and Data Restoration System
function exportSystemBackupJSON() {
    let backupPayload = {
        categorizedMenu: JSON.parse(localStorage.getItem('categorizedMenu')) || customItems,
        currentDayLog: JSON.parse(localStorage.getItem('currentDayLog')) || currentDayLog,
        currentRefundLog: JSON.parse(localStorage.getItem('currentRefundLog')) || currentRefundLog,
        allTimeHistory: JSON.parse(localStorage.getItem('allTimeHistory')) || allTimeHistory,
        knownCustomers: JSON.parse(localStorage.getItem('knownCustomers')) || knownCustomers,
        shiftStartTime: localStorage.getItem('shiftStartTime') || shiftStartTime,
        currentTokenSeed: currentTokenSeed
    };
    
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AHRP_POS_SYSTEM_BACKUP_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

function importSystemBackupJSON() {
    let fileInput = document.getElementById('import-backup-file');
    if(!fileInput || fileInput.files.length === 0) {
        alert("Please select a valid (.json) backup database template file first.");
        return;
    }
    
    if(!confirm("CRITICAL WARNING: This action will completely overwrite all local application data, current shift data, history ledgers, and configurations. Proceed?")) {
        return;
    }
    
    let selectedFile = fileInput.files[0];
    let reader = new FileReader();
    reader.onload = function(event) {
        try {
            let parsedData = JSON.parse(event.target.result);
            
            if(!parsedData.categorizedMenu || !parsedData.knownCustomers || !parsedData.allTimeHistory) {
                throw new Error("Invalid schema tracking configuration variables.");
            }
            
            localStorage.setItem('categorizedMenu', JSON.stringify(parsedData.categorizedMenu));
            localStorage.setItem('currentDayLog', JSON.stringify(parsedData.currentDayLog || []));
            localStorage.setItem('currentRefundLog', JSON.stringify(parsedData.currentRefundLog || []));
            localStorage.setItem('allTimeHistory', JSON.stringify(parsedData.allTimeHistory || []));
            localStorage.setItem('knownCustomers', JSON.stringify(parsedData.knownCustomers || []));
            if(parsedData.currentTokenSeed) {
                localStorage.setItem('currentTokenSeed', parsedData.currentTokenSeed);
                currentTokenSeed = parsedData.currentTokenSeed;
            }
            if(parsedData.shiftStartTime) {
                localStorage.setItem('shiftStartTime', parsedData.shiftStartTime);
            } else {
                localStorage.removeItem('shiftStartTime');
            }
            
            customItems = parsedData.categorizedMenu;
            currentDayLog = parsedData.currentDayLog || [];
            currentRefundLog = parsedData.currentRefundLog || [];
            allTimeHistory = parsedData.allTimeHistory || [];
            knownCustomers = parsedData.knownCustomers || [];
            shiftStartTime = parsedData.shiftStartTime || null;
            
            alert("Database Memory Override Successfully Restored!");
            location.reload(); 
            
        } catch(err) {
            alert("Error parsing memory file: Invalid or corrupted JSON backup package schema layout.\n" + err.message);
        }
    };
    reader.readAsText(selectedFile);
}

// Customers Layer Manual Actions
function addCustomerManually() {
    let input = document.getElementById('new-manual-customer');
    let name = input.value.trim().replace(/\b\w/g, char => char.toUpperCase());
    if (!name) return;
    if (!knownCustomers.includes(name)) {
        knownCustomers.push(name);
        localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
        populateCustomerDatalist();
        input.value = '';
    } else {
        alert("Account key already exists.");
    }
}

function openCustomerModal() {
    document.getElementById('cust-modal-name-input').value = '';
    document.getElementById('customer-name-modal').style.display = 'flex';
    document.getElementById('cust-modal-name-input').focus();
}

function closeCustomerModal() { document.getElementById('customer-name-modal').style.display = 'none'; }

function submitCustomerModal() {
    let rawName = document.getElementById('cust-modal-name-input').value.trim();
    if (rawName === "") {
        alert("Valid identification matrix required.");
        return;
    }
    let finalName = "";
    let matchedName = findClosestCustomerName(rawName);
    if (matchedName) {
        finalName = matchedName;
    } else {
        finalName = rawName.replace(/\b\w/g, char => char.toUpperCase());
        knownCustomers.push(finalName);
        localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
        populateCustomerDatalist(); 
    }
    closeCustomerModal();
    executeTokenPrinting(finalName); 
}

// POS Dynamic Grid Generators & Component Actions Layer
function renderCategoryFilters() {
    const container = document.getElementById('category-filter-container');
    if (!container) return;
    container.innerHTML = '';
    let categories = ["All", "Rice", "Curry", "Bread", "Others"];
    categories.forEach(cat => {
        let btn = document.createElement('button');
        btn.className = `category-filter-btn ${currentActiveCategory === cat ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => {
            currentActiveCategory = cat;
            renderCategoryFilters();
            renderMenu();
        };
        container.appendChild(btn);
    });
}

function getItemCategory(itemName) {
    let found = customItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    return found ? found.category : "Others";
}

// Retrieve Specific Weights Configuration Attributes
function getItemWeight(itemName) {
    let found = customItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    return found && found.weight ? parseFloat(found.weight) : 0;
}

function renderMenu() {
    const grid = document.getElementById('items-grid');
    if (!grid) return;
    grid.innerHTML = '';
    customItems.forEach((itemObj) => {
        if (currentActiveCategory !== "All" && itemObj.category !== currentActiveCategory) return;
        let card = document.createElement('div');
        card.className = 'menu-card';
        card.innerText = itemObj.name;
        card.onclick = () => { addToCart(itemObj.name); };
        grid.appendChild(card);
    });
}

function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;
    container.innerHTML = '';
    if (Object.keys(currentCart).length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding-top:45px; margin:0; font-size: 13px;">Queue Array Buffer Allocation Empty</p>';
        return;
    }
    for (let item in currentCart) {
        let div = document.createElement('div');
        div.className = 'cart-row';
        div.innerHTML = `
            <span style="font-weight: 600;">${item}</span>
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQty('${item}', -1)">-</button>
                <span style="font-weight:700; width:24px; text-align:center;">${currentCart[item]}</span>
                <button class="qty-btn" onclick="changeQty('${item}', 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    }
}

function addToCart(item) { currentCart[item] = (currentCart[item] || 0) + 1; renderCart(); }

function changeQty(item, amount) { 
    currentCart[item] += amount; 
    if (currentCart[item] <= 0) delete currentCart[item]; 
    renderCart();
}

function updateLiveBreakdown() {
    const container = document.getElementById('live-total-container');
    if (!container) return;
    if (currentDayLog.length === 0 && currentRefundLog.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; margin:0; font-size:13px;">Live operational transaction vectors empty.</p>';
        return;
    }
    let grossCount = 0; let refundCount = 0; let itemTotals = {};

    currentDayLog.forEach(log => { grossCount += log.qty; itemTotals[log.item] = (itemTotals[log.item] || 0) + log.qty; });
    currentRefundLog.forEach(log => { refundCount += log.qty; });

    let rangeStr = shiftStartTime ? ` (Opened: ${shiftStartTime})` : '';
    let html = `
        <div style="font-size:13px; margin-bottom:12px; color:var(--text-muted);">
            <div style="font-size:11px; font-weight:700; color:var(--primary); margin-bottom:6px;">${rangeStr}</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>Gross Generated Logs:</span><span style="font-weight:600; color:var(--text-main);">${grossCount + refundCount} Units</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--danger);">
                <span>Liquidated Void Logs:</span><span style="font-weight:600;">-${refundCount} Units</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:800; border-top:1px solid var(--border); padding-top:6px; font-size:14px; color:var(--accent);">
                <span>Net Verified Shift Inventory:</span><span>${grossCount} Units</span>
            </div>
        </div>
        <div style="font-weight:700; font-size:11px; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px; border-bottom:1px solid var(--border); padding-bottom:4px;">Dynamic Mass Metrics Breakdown</div>
        <table style="width:100%; font-size:13px; color:var(--text-main); border-collapse:collapse;">
    `;

    let categoryOrder = ["Rice", "Curry", "Bread", "Others"];
    categoryOrder.forEach(cat => {
        let catHeaderAdded = false;
        for (let item in itemTotals) {
            if (getItemCategory(item) === cat) {
                if (!catHeaderAdded) {
                    html += `<tr><td colspan="2" style="font-size:11px; font-weight:800; color:var(--primary); padding:6px 0 2px 0; text-transform:uppercase;">${cat}</td></tr>`;
                    catHeaderAdded = true;
                }
                let calcWeightKg = ((itemTotals[item] * getItemWeight(item)) / 1000).toFixed(2);
                html += `<tr>
                    <td style="padding:2px 0 2px 8px; font-weight:500;">${item}</td>
                    <td style="text-align:right; font-weight:700; color:var(--text-main);">x${itemTotals[item]} <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(${calcWeightKg} KG)</span></td>
                </tr>`;
            }
        }
    });
    html += `</table>`;
    container.innerHTML = html;
}

// Logging Engine: Renders token numbers, item specifications, and identity metrics
function renderLogs() {
    const logBody = document.getElementById('live-log');
    if (!logBody) return;
    logBody.innerHTML = '';
    
    if(currentDayLog.length === 0){ 
        logBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">No item array stream signals captured.</td></tr>`; 
    }
    
    for(let i = currentDayLog.length - 1; i >= 0; i--) {
        let log = currentDayLog[i];
        let itemWeightKg = ((log.qty * getItemWeight(log.item)) / 1000).toFixed(2);
        let row = `<tr>
            <td style="color:var(--text-muted); font-weight:500; font-size:13px;">${log.time}</td>
            <td style="font-weight:700; color:var(--accent); font-family:monospace; font-size:14px;">#${log.tokenId || 'N/A'}</td>
            <td>
                <div style="font-weight:600; color:var(--text-main); font-size:14px;">${log.item}</div>
                <div style="font-size:11px; color:var(--primary); font-weight:700; margin-top:2px;">Holder: ${log.customer || 'Walk-In'}</div>
            </td>
            <td style="text-align:center; font-weight:700; color:var(--primary); font-size:14px;">x${log.qty}<br><span style="font-size:10px; color:var(--text-muted); font-weight:normal;">${itemWeightKg} KG</span></td>
        </tr>`;
        logBody.insertAdjacentHTML('beforeend', row);
    }

    const refundBody = document.getElementById('refund-log');
    if (!refundBody) return;
    refundBody.innerHTML = '';
    
    if(currentRefundLog.length === 0) { 
        refundBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">No historical void signals logs generated.</td></tr>`; 
    }
    
    for(let j = currentRefundLog.length - 1; j >= 0; j--) {
        let rLog = currentRefundLog[j];
        let itemWeightKg = ((rLog.qty * getItemWeight(rLog.item)) / 1000).toFixed(2);
        let row = `<tr>
            <td style="color:var(--danger); font-weight:500; font-size:13px;">${rLog.time}</td>
            <td style="font-weight:700; color:var(--danger); font-family:monospace; font-size:14px;">#${rLog.tokenId || 'N/A'}</td>
            <td>
                <div style="font-weight:600; color:var(--text-muted); text-decoration: line-through; font-size:14px;">${rLog.item}</div>
                <div style="font-size:11px; color:var(--danger); font-weight:600; margin-top:2px;">Profile: ${rLog.customer || 'Walk-In'}</div>
            </td>
            <td style="text-align:center; font-weight:700; color:var(--danger); font-size:14px;">x${rLog.qty}<br><span style="font-size:10px; font-weight:normal;">-${itemWeightKg} KG</span></td>
        </tr>`;
        refundBody.insertAdjacentHTML('beforeend', row);
    }

    updateLiveBreakdown();
}

function printTokens() {
    if (Object.keys(currentCart).length === 0) return;
    openCustomerModal();
}

// Core Token Printing Engine: Prints unique token numbers and cleanly formats details
function executeTokenPrinting(customerName) {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;
    printArea.innerHTML = ''; 
    let now = new Date();
    let timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    let dateStr = getFormattedSystemDate(now);

    if (!shiftStartTime) {
        shiftStartTime = timeStr;
        localStorage.setItem('shiftStartTime', shiftStartTime);
    }

    for (let item in currentCart) {
        let qty = currentCart[item];
        
        // Save entry records with sequential seed tracking tags
        currentDayLog.push({ 
            tokenId: currentTokenSeed, 
            time: timeStr, 
            item: item, 
            qty: qty, 
            customer: customerName 
        });
        
        let token = document.createElement('div');
        token.className = 'pos-token';
        
        token.innerHTML = `
            <div class="brand-main" style="text-align:center; font-weight:800; font-size:16px;">AHMED HANIF RAJPUT</div>
            <div style="text-align:center; font-weight:900; font-size:26px; margin:6px 0; font-family:monospace; background:#000; color:#fff; padding:4px 0; border-radius:4px;">
                TOKEN #${currentTokenSeed}
            </div>
            <div class="pos-divider" style="border-bottom:2px dashed #000; margin:8px 0;"></div>
            <div class="item-container">
                <div class="pos-item" style="font-size:18px; font-weight:800;">${item}</div>
                <div class="pos-qty" style="font-size:14px; font-weight:700; margin-top:4px;">UNITS COUNT: [ ${qty} ]</div>
            </div>
            <div class="pos-divider" style="border-bottom:1px solid #000; margin:8px 0;"></div>
            <div class="meta-line" style="font-size:11px; font-weight:600;">DATE: ${dateStr} &nbsp;&nbsp;&nbsp;&nbsp; TIME: ${timeStr}</div>
            <div style="font-size:12px; font-weight:900; margin-top:4px; text-transform:uppercase;">ACCOUNT: ${customerName}</div>
        `;
        printArea.appendChild(token);
        
        // Increment global structural identification indexing pointer
        currentTokenSeed++;
    }
    
    localStorage.setItem('currentTokenSeed', currentTokenSeed);
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    
    setTimeout(() => { 
        window.print(); 
        currentCart = {}; 
        renderCart(); 
        renderLogs(); 
    }, 50);
}

function startNewDay() {
    currentDayLog = []; currentRefundLog = []; shiftStartTime = null;
    localStorage.removeItem('currentDayLog'); localStorage.removeItem('currentRefundLog'); localStorage.removeItem('shiftStartTime');
    currentCart = {}; if(typeof renderCart === 'function') renderCart(); renderLogs(); switchView('pos-tab');
}

// Operational DOM Global Event Key Bindings UI Hooks
let pinInput = document.getElementById('modal-pin-input');
if(pinInput) pinInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') submitPinModal(); });

let custModalInput = document.getElementById('cust-modal-name-input');
if(custModalInput) custModalInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') submitCustomerModal(); });

// Bootstrap Initial Startup Sequence Loop Trigger
renderCategoryFilters();
renderMenu();
if(typeof renderCart === 'function') renderCart();
renderLogs();
populateCustomerDatalist();
