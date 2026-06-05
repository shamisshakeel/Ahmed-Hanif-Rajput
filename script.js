// Initial Core Architecture Arrays Setup
const defaultStructuredItems = [
    { name: "Chicken Biryani", category: "Rice", weight: 0 },
    { name: "Beef Biryani", category: "Rice", weight: 0 },
    { name: "Beef Pulao", category: "Rice", weight: 0 },
    { name: "Sada Biryani", category: "Rice", weight: 0 },
    { name: "Chicken Qorma", category: "Curry", weight: 0 },
    { name: "Beef karahi", category: "Curry", weight: 0 },
    { name: "Naan", category: "Bread", weight: 0 },
    { name: "Chapati", category: "Bread", weight: 0 }
];

// Persistent States Mapping Initialization via LocalStorage API
let customItems = JSON.parse(localStorage.getItem('categorizedMenu')) || defaultStructuredItems;
let currentActiveCategory = "All";

let currentCart = {};
let currentDayLog = JSON.parse(localStorage.getItem('currentDayLog')) || [];
let currentRefundLog = JSON.parse(localStorage.getItem('currentRefundLog')) || [];
let allTimeHistory = JSON.parse(localStorage.getItem('allTimeHistory')) || [];
let knownCustomers = JSON.parse(localStorage.getItem('knownCustomers')) || [];
let shiftStartTime = localStorage.getItem('shiftStartTime') || null;

// Incremental Token Counter Seed Matrix Tracking Tracker
let nextGlobalTokenId = parseInt(localStorage.getItem('nextGlobalTokenId')) || 1001;

// Internal Void Query Workspace Buffer Reference Holders
let activeVoidTargetIndex = null;
let activeCallback = null;
let requiredPinType = 'refund'; 
let activeCustomerSearchQuery = "";

// System Normalizer Engine Logic Modules
function getFormattedSystemDate(dateObj = new Date()) {
    const day = dateObj.getDate();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${day} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function normalizeToSystemDate(rawDateString) {
    if (!rawDateString) return getFormattedSystemDate();
    let workingString = rawDateString.split('(')[0].trim();
    let parsedDate = new Date(workingString);
    return isNaN(parsedDate.getTime()) ? rawDateString : getFormattedSystemDate(parsedDate);
}

// Workspace Swapping Engine
function switchView(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const targetedTabBtn = document.getElementById('btn-' + tabId);
    if(targetedTabBtn) targetedTabBtn.classList.add('active');
    if (tabId === 'history-tab' || tabId === 'logs-tab') renderLogs();
}

// Security Checkpoint Operational Management Modals
function openPinModal(title, type, successCallback) {
    document.getElementById('modal-title-text').innerText = title;
    document.getElementById('modal-pin-input').value = '';
    requiredPinType = type;
    activeCallback = successCallback;
    document.getElementById('secure-pin-modal').style.display = 'flex';
    document.getElementById('modal-pin-input').focus();
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

function attemptOpenCustomers() {
    openPinModal("Enter Management Keys to Unlock Configuration Panel", "admin", function() {
        switchView('customers-tab');
        renderCustomerManagement();
        populateMergeDropdowns();
    });
}

// NEW INTERACTIVE POS COUNTER VOID LOGIC SYSTEM
function openPosVoidModal() {
    document.getElementById('void-token-number-input').value = '';
    document.getElementById('pos-void-input-modal').style.display = 'flex';
    document.getElementById('void-token-number-input').focus();
}

function closePosVoidModal() {
    document.getElementById('pos-void-input-modal').style.display = 'none';
}

function submitPosVoidLookup() {
    let lookupId = parseInt(document.getElementById('void-token-number-input').value.trim());
    if (isNaN(lookupId)) {
        alert("Please enter a valid numeric token ID sequence.");
        return;
    }
    
    // Scan current day shift register array logs trace to lock index position
    let logIdx = currentDayLog.findIndex(log => log.tokenId === lookupId);
    if (logIdx === -1) {
        alert(`Token record assignment reference #${lookupId} not found inside current shift trace buffers.`);
        return;
    }
    
    activeVoidTargetIndex = logIdx;
    let targetedRecord = currentDayLog[logIdx];
    
    // Close selection screen and render live visual confirm dashboard payload metrics
    closePosVoidModal();
    
    let container = document.getElementById('void-confirmation-details-box');
    container.innerHTML = `
        <div class="confirm-row"><span>Token Identifier ID:</span><strong class="pill-token">#${targetedRecord.tokenId}</strong></div>
        <div class="confirm-row"><span>Log Creation Time:</span><strong>${targetedRecord.time}</strong></div>
        <div class="confirm-row"><span>Assigned Profile Holder:</span><strong>${targetedRecord.customer}</strong></div>
        <div class="confirm-row"><span>Target Menu Allocation:</span><strong style="color:var(--primary);">${targetedRecord.item}</strong></div>
        <div class="confirm-row"><span>Buffered Quantity Multiplier:</span><strong style="font-size:16px; color:var(--danger);">x${targetedRecord.qty}</strong></div>
    `;
    
    document.getElementById('pos-void-confirm-modal').style.display = 'flex';
}

function closePosVoidConfirmModal() {
    document.getElementById('pos-void-confirm-modal').style.display = 'none';
    activeVoidTargetIndex = null;
}

function executeConfirmedPosVoid() {
    if (activeVoidTargetIndex === null) return;
    
    // Route control processing flow parameters directly through supervisor PIN barrier
    openPinModal("Verification authorization credentials requested.", "refund", function() {
        let now = new Date();
        let refundTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let matchedTargetItem = currentDayLog[activeVoidTargetIndex];
        
        // Construct void object payload data matrix nodes
        let voidRecordObject = {
            tokenId: matchedTargetItem.tokenId,
            time: refundTime,
            item: matchedTargetItem.item,
            qty: matchedTargetItem.qty,
            customer: matchedTargetItem.customer || "Walk-In"
        };
        
        // Mutate registries
        currentRefundLog.push(voidRecordObject);
        localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
        
        currentDayLog.splice(activeVoidTargetIndex, 1);
        localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
        
        closePosVoidConfirmModal();
        updateLiveBreakdown();
        renderLogs();
        
        alert(`Data mutation confirmation finalized. Token Instance #${voidRecordObject.tokenId} successfully voided on-screen.`);
    });
}

// Token Printing Operations Hub (Prints Token Number, No Weight)
function printTokens() {
    if (Object.keys(currentCart).length === 0) return;
    openCustomerModal();
}

function executeTokenPrinting(customerName) {
    const printArea = document.getElementById('print-area');
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
        let currentAssignedTokenId = nextGlobalTokenId++;
        
        // Commit newly assigned instances directly into structural live transaction index records
        currentDayLog.push({ 
            tokenId: currentAssignedTokenId, 
            time: timeStr, 
            item: item, 
            qty: qty, 
            customer: customerName 
        });
        
        let token = document.createElement('div');
        token.className = 'pos-token';
        token.innerHTML = `
            <div class="brand-main">AHMED HANIF RAJPUT</div>
            <div style="font-size: 16px; font-weight: 900; text-align: center; background: #000; color: #fff; padding: 4px 0; margin: 4px 0;">TOKEN ID: #${currentAssignedTokenId}</div>
            <div class="pos-divider"></div>
            <div class="item-container">
                <div class="pos-item">${item}</div>
                <div class="pos-qty">UNITS COUNT: [ ${qty} ]</div>
            </div>
            <div class="pos-divider"></div>
            <div class="meta-line">DATE: ${dateStr} &nbsp;&nbsp;&nbsp;&nbsp; TIME: ${timeStr}</div>
            <div style="font-size:12px; font-weight:900; margin-top:4px; text-transform:uppercase;">ACCOUNT MAPPING: ${customerName}</div>
        `;
        printArea.appendChild(token);
    }
    
    // Save live operational system state tracking arrays permanently to localized storage
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    localStorage.setItem('nextGlobalTokenId', nextGlobalTokenId.toString());
    
    setTimeout(() => { 
        window.print(); 
        currentCart = {}; 
        renderCart(); 
        updateLiveBreakdown(); 
    }, 50);
}

// POS Desktop Interface Core Component UI Render Engines
function renderCategoryFilters() {
    const container = document.getElementById('category-filter-container');
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

function getItemWeight(itemName) {
    let found = customItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    return found && found.weight ? parseFloat(found.weight) : 0;
}

// Levenshtein Logic Engine (For Identity Selection Auto-matching)
function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length; if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
    }
    return matrix[b.length][a.length];
}

function findClosestCustomerName(inputName) {
    let cleanInput = inputName.trim().toLowerCase();
    let bestMatch = null; let lowestDistance = Infinity;
    for (let known of knownCustomers) {
        let cleanKnown = known.toLowerCase();
        let distance = getLevenshteinDistance(cleanInput, cleanKnown);
        let threshold = cleanInput.length <= 4 ? 1 : 2; 
        if (distance <= threshold && distance < lowestDistance) { lowestDistance = distance; bestMatch = known; }
    }
    return bestMatch;
}

function renderMenu() {
    const grid = document.getElementById('items-grid');
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
    container.innerHTML = '';
    if (Object.keys(currentCart).length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding-top:45px; margin:0; font-size: 13px;">Queue Array Buffer Empty</p>';
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

// LOGS RENDERING HUB (Shows precise details including generated Token Number ID keys)
function renderLogs() {
    const logBody = document.getElementById('live-log');
    logBody.innerHTML = '';
    if(currentDayLog.length === 0){ 
        logBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">No item array stream signals captured.</td></tr>`; 
    }
    
    for(let i = currentDayLog.length - 1; i >= 0; i--) {
        let log = currentDayLog[i];
        let row = `<tr>
            <td><span class="pill-token">#${log.tokenId || 'N/A'}</span></td>
            <td style="color:var(--text-muted); font-weight:500;">${log.time}</td>
            <td style="font-weight:700; color:var(--primary);">${log.customer || 'Walk-In'}</td>
            <td style="font-weight:600; color:var(--text-main);">${log.item}</td>
            <td style="font-weight:700;">x${log.qty}</td>
        </tr>`;
        logBody.insertAdjacentHTML('beforeend', row);
    }

    const refundBody = document.getElementById('refund-log');
    refundBody.innerHTML = '';
    if(currentRefundLog.length === 0) { 
        refundBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">No historical void signals logs generated.</td></tr>`; 
    }
    
    for(let j = currentRefundLog.length - 1; j >= 0; j--) {
        let rLog = currentRefundLog[j];
        let row = `<tr>
            <td><span class="pill-void">#${rLog.tokenId || 'N/A'}</span></td>
            <td style="color:var(--danger); font-weight:500;">${rLog.time}</td>
            <td style="font-weight:700; color:var(--text-muted); text-decoration:line-through;">${rLog.customer || 'Walk-In'}</td>
            <td style="font-weight:600; color:var(--text-muted); text-decoration: line-through;">${rLog.item}</td>
            <td style="font-weight:700; color:var(--danger);">x${rLog.qty}</td>
        </tr>`;
        refundBody.insertAdjacentHTML('beforeend', row);
    }

    updateLiveBreakdown();
    renderVaultLedgerCards();
}

function renderVaultLedgerCards() {
    const histContainer = document.getElementById('history-container');
    histContainer.innerHTML = '';
    if(allTimeHistory.length === 0) { 
        histContainer.innerHTML = '<p style="color:#94a3b8; text-align:center; font-size:14px; padding-top:20px; width:100%;">Vault ledger history index empty array structure.</p>'; 
    }
    
    allTimeHistory.forEach((day, index) => {
        let normalizedDateLabel = normalizeToSystemDate(day.date);
        let rangeSuffix = (day.startTime && day.endTime) ? ` (${day.startTime} to ${day.endTime})` : '';

        let html = `<div class="history-card" style="background:#fff; border:1px solid var(--border); padding:16px; border-radius:var(--radius); box-shadow:var(--shadow); position:relative; margin-bottom:16px;">
            <button style="position:absolute; top:12px; right:12px; background:none; border:none; color:var(--danger); font-size:18px; font-weight:900; cursor:pointer;" onclick="deleteHistoryItem(${index})">×</button>
            <div class="history-header" style="margin-bottom:8px;">
                <span style="font-size:14px; font-weight:700;">Date: <strong>${normalizedDateLabel}</strong></span><br>
                <span style="color:var(--primary); font-size:11px;">Timeline: <strong>${rangeSuffix || 'N/A'}</strong></span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:11px; color:var(--text-muted);">
                <span>Gross: ${day.grossItems || day.totalItems} | Voided: ${day.refundedItems || 0}</span>
                <span style="color:var(--accent); font-weight:bold;">Net: ${day.totalItems}</span>
            </div>
            <table style="width:100%; font-size:13px; color:#475569;">`;
        
        let categoryOrder = ["Rice", "Curry", "Bread", "Others"];
        categoryOrder.forEach(cat => {
            let catHeaderAdded = false;
            for(let itm in day.summary) {
                if(getItemCategory(itm) === cat) {
                    if(!catHeaderAdded) {
                        html += `<tr><td colspan="2" style="font-size:11px; font-weight:700; color:var(--primary); padding-top:6px; text-transform:uppercase;">${cat}</td></tr>`;
                        catHeaderAdded = true;
                    }
                    let histItemWeight = ((day.summary[itm] * getItemWeight(itm)) / 1000).toFixed(2);
                    html += `<tr><td style="padding:2px 0 2px 6px;">${itm}</td><td style="text-align:right; font-weight:600; color:var(--text-main);">x${day.summary[itm]} <span style="font-size:11px; font-weight:normal; color:var(--text-muted);">(${histItemWeight} KG)</span></td></tr>`;
                }
            }
        });
        html += `</table>`;
        histContainer.insertAdjacentHTML('afterbegin', html);
    });
}

// User Configuration Panels Rendering Rules
function populateCustomerDatalist() {
    const dataList = document.getElementById('customer-memory-list');
    if(!dataList) return; dataList.innerHTML = '';
    knownCustomers.sort().forEach(name => {
        let option = document.createElement('option'); option.value = name; dataList.appendChild(option);
    });
}

function populateMergeDropdowns() {
    let srcSelect = document.getElementById('merge-source-select');
    let tgtSelect = document.getElementById('merge-target-select');
    if(!srcSelect || !tgtSelect) return;
    srcSelect.innerHTML = '<option value="">-- Merge From (Duplicate Profile) --</option>';
    tgtSelect.innerHTML = '<option value="">-- Merge To (Primary Master Profile) --</option>';
    let sortedCustomers = [...knownCustomers].sort();
    sortedCustomers.forEach(cust => {
        srcSelect.innerHTML += `<option value="${cust}">${cust}</option>`;
        tgtSelect.innerHTML += `<option value="${cust}">${cust}</option>`;
    });
}

function renderCustomerManagement() {
    const listDiv = document.getElementById('customer-management-list');
    if(!listDiv) return; listDiv.innerHTML = '';
    let filteredCustomers = knownCustomers.filter(cust => cust.toLowerCase().includes(activeCustomerSearchQuery));
    if (filteredCustomers.length === 0) {
        listDiv.innerHTML = '<p style="color:var(--text-muted); padding: 12px 0;">No matching identity profiles found.</p>'; return;
    }
    let table = `<table class="styled-table"><thead><tr><th>Account Name Label</th><th style="text-align:right; width:90px;">Control</th></tr></thead><tbody>`;
    filteredCustomers.forEach((cust) => {
        let actualIndex = knownCustomers.indexOf(cust);
        table += `<tr><td style="font-weight:600;">${cust}</td><td style="text-align:right;"><button class="btn-danger-outline" style="padding:4px 8px; font-size:11px;" onclick="deleteCustomer(${actualIndex})">Purge</button></td></tr>`;
    });
    table += `</tbody></table>`; listDiv.innerHTML = table;
}

function executeCustomerMerge() {
    let source = document.getElementById('merge-source-select').value;
    let target = document.getElementById('merge-target-select').value;
    if(!source || !target || source === target) return alert("Select distinct source/target profiles.");
    if(!confirm(`Merge "${source}" cleanly into "${target}"?`)) return;
    currentDayLog.forEach(log => { if(log.customer === source) log.customer = target; });
    currentRefundLog.forEach(log => { if(log.customer === source) log.customer = target; });
    let srcIdx = knownCustomers.indexOf(source); if(srcIdx > -1) knownCustomers.splice(srcIdx, 1);
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
    localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
    populateCustomerDatalist(); populateMergeDropdowns(); renderCustomerManagement(); renderLogs();
}

function addCustomerManually() {
    let input = document.getElementById('new-manual-customer');
    let name = input.value.trim().replace(/\b\w/g, char => char.toUpperCase());
    if (!name) return;
    if (!knownCustomers.includes(name)) {
        knownCustomers.push(name); localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
        populateCustomerDatalist(); populateMergeDropdowns(); renderCustomerManagement(); input.value = '';
    }
}

function deleteCustomer(index) {
    if (confirm(`Wipe identity mapping block trace?`)) {
        knownCustomers.splice(index, 1); localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
        populateCustomerDatalist(); populateMergeDropdowns(); renderCustomerManagement();
    }
}

function handleCustomerSearchFilter() {
    activeCustomerSearchQuery = document.getElementById('customer-search-input').value.trim().toLowerCase();
    renderCustomerManagement();
}

function openCustomerModal() {
    document.getElementById('cust-modal-name-input').value = '';
    document.getElementById('customer-name-modal').style.display = 'flex';
    document.getElementById('cust-modal-name-input').focus();
}
function closeCustomerModal() { document.getElementById('customer-name-modal').style.display = 'none'; }

function submitCustomerModal() {
    let rawName = document.getElementById('cust-modal-name-input').value.trim();
    if (rawName === "") return alert("Valid identity label required.");
    let finalName = ""; let matchedName = findClosestCustomerName(rawName);
    if (matchedName) finalName = matchedName;
    else {
        finalName = rawName.replace(/\b\w/g, char => char.toUpperCase());
        knownCustomers.push(finalName); localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
        populateCustomerDatalist();
    }
    closeCustomerModal(); executeTokenPrinting(finalName);
}

function deleteHistoryItem(index) {
    if (!confirm("Permanently drop selected ledger sequence index container?")) return;
    openPinModal("Management validation rules active.", "admin", function() {
        allTimeHistory.splice(index, 1); localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
        renderLogs();
    });
}

function clearAllHistory() {
    if (!confirm("Purge entire core relational historical index architecture? Action terminal.")) return;
    openPinModal("Administrative security credentials requested.", "admin", function() {
        allTimeHistory = []; localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
        renderLogs();
    });
}

function attemptStartNewDay() {
    openPinModal("Enter Mandatory Master Access Code to Open New Day Block", "admin", function() {
        currentDayLog = []; currentRefundLog = []; shiftStartTime = null;
        localStorage.removeItem('currentDayLog'); localStorage.removeItem('currentRefundLog'); localStorage.removeItem('shiftStartTime');
        currentCart = {}; renderCart(); renderLogs(); switchView('pos-tab');
        alert("New operational tracking register open.");
    });
}

function endDay() {
    if (currentDayLog.length === 0 && currentRefundLog.length === 0) return alert("System state registry empty.");
    if (!confirm("Terminate current runtime cycle shift datasets?")) return;
    openPinModal("Administrative checkpoint logic keys verified.", "admin", function() {
        let netItems = 0; let grossItemsCount = 0; let summary = {};
        currentDayLog.forEach(log => { 
            netItems += log.qty; grossItemsCount += log.qty;
            summary[log.item] = (summary[log.item] || 0) + log.qty; 
        });
        let shiftClosingTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let shiftOpeningTime = shiftStartTime || shiftClosingTime;
        
        allTimeHistory.push({ 
            date: getFormattedSystemDate(), startTime: shiftOpeningTime, endTime: shiftClosingTime,
            totalItems: netItems, grossItems: grossItemsCount, refundedItems: currentRefundLog.length, summary: summary
        });
        localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
        
        currentDayLog = []; currentRefundLog = []; shiftStartTime = null;
        localStorage.removeItem('currentDayLog'); localStorage.removeItem('currentRefundLog'); localStorage.removeItem('shiftStartTime');
        renderLogs(); switchView('history-tab');
    });
}

// Global Modal Input Keyboard Event Hook Key Listener Hooks
document.getElementById('modal-pin-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') submitPinModal(); });
document.getElementById('cust-modal-name-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') submitCustomerModal(); });
document.getElementById('void-token-number-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') submitPosVoidLookup(); });

// Application Bootup Trigger Execution
renderCategoryFilters();
renderMenu();
renderLogs();
populateCustomerDatalist();
