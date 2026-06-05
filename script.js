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

// Token ID Sequence Allocation Manager
let nextTokenId = parseInt(localStorage.getItem('nextTokenId')) || 1001;

let activeCallback = null;
let requiredPinType = 'refund'; 
let activeCustomerSearchQuery = "";

// Dynamic Temporary State Cache for Screen Refund Lookups
let targetRefundLogIndex = null;

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
    document.getElementById('btn-' + tabId).classList.add('active');
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

// POS Front-Counter Refund System Modals Orchestrator
function openCounterRefundModal() {
    document.getElementById('refund-token-input').value = '';
    resetCounterRefundModal();
    document.getElementById('pos-refund-modal').style.display = 'flex';
    document.getElementById('refund-token-input').focus();
}

function closeCounterRefundModal() {
    document.getElementById('pos-refund-modal').style.display = 'none';
    targetRefundLogIndex = null;
}

function resetCounterRefundModal() {
    document.getElementById('refund-search-step').style.display = 'block';
    document.getElementById('refund-confirm-step').style.display = 'none';
    document.getElementById('refund-verification-box').innerHTML = '';
    targetRefundLogIndex = null;
}

function lookupTokenForRefund() {
    let inputTokenStr = document.getElementById('refund-token-input').value.trim();
    if(!inputTokenStr) {
        alert("Please enter a valid Token Identification Number.");
        return;
    }
    
    let tokenToFind = parseInt(inputTokenStr);
    let foundIndex = currentDayLog.findIndex(log => log.tokenId === tokenToFind);
    
    if (foundIndex === -1) {
        alert(`Token Reference Number #${tokenToFind} could not be located in active shift registers.`);
        return;
    }
    
    targetRefundLogIndex = foundIndex;
    let targetLog = currentDayLog[foundIndex];
    
    // Generate clean confirmation summary inside screen card container view space
    let confirmBox = document.getElementById('refund-verification-box');
    confirmBox.innerHTML = `
        <div><strong>Token Reference:</strong> #${targetLog.tokenId}</div>
        <div><strong>Menu Item:</strong> ${targetLog.item}</div>
        <div><strong>Quantity:</strong> x${targetLog.qty}</div>
        <div><strong>Customer Account:</strong> ${targetLog.customer || "Walk-In"}</div>
        <div><strong>Timestamp:</strong> ${targetLog.time}</div>
    `;
    
    document.getElementById('refund-search-step').style.display = 'none';
    document.getElementById('refund-confirm-step').style.display = 'block';
}

function confirmTokenRefundAction() {
    if (targetRefundLogIndex === null) return;
    
    closeCounterRefundModal();
    
    // Open standard security operational manager check pipeline wrapper
    openPinModal("Verification authorization protocols requested.", "refund", function() {
        let now = new Date();
        let refundTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let targetItem = currentDayLog[targetRefundLogIndex];
        
        let refundObject = { 
            tokenId: targetItem.tokenId,
            time: refundTime, 
            item: targetItem.item, 
            qty: targetItem.qty, 
            customer: targetItem.customer || "Walk-In" 
        };
        
        currentRefundLog.push(refundObject);
        localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
        
        currentDayLog.splice(targetRefundLogIndex, 1);
        localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
        
        alert(`Transaction Success: Token #${refundObject.tokenId} completely voided.`);
        renderLogs();
    });
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

function closePinModal() {
    document.getElementById('secure-pin-modal').style.display = 'none';
    activeCallback = null;
}

function attemptOpenCustomers() {
    openPinModal("Enter Management Keys to Unlock Configuration Panel", "admin", function() {
        switchView('customers-tab');
        renderCustomerManagement();
        renderMenuWeightsManagement();
        populateMergeDropdowns();
    });
}

// Identity Registry Profile Controls & Dynamic Search
function handleCustomerSearchFilter() {
    activeCustomerSearchQuery = document.getElementById('customer-search-input').value.trim().toLowerCase();
    renderCustomerManagement();
}

function populateMergeDropdowns() {
    let srcSelect = document.getElementById('merge-source-select');
    let tgtSelect = document.getElementById('merge-target-select');
    
    srcSelect.innerHTML = '<option value="">-- Select Duplicate Profile --</option>';
    tgtSelect.innerHTML = '<option value="">-- Select Target Primary Master Profile --</option>';
    
    let sortedCustomers = [...knownCustomers].sort();
    sortedCustomers.forEach(cust => {
        srcSelect.innerHTML += `<option value="${cust}">${cust}</option>`;
        tgtSelect.innerHTML += `<option value="${cust}">${cust}</option>`;
    });
}

function renderCustomerManagement() {
    const listDiv = document.getElementById('customer-management-list');
    listDiv.innerHTML = '';
    
    let filteredCustomers = knownCustomers.filter(cust => 
        cust.toLowerCase().includes(activeCustomerSearchQuery)
    );

    if (filteredCustomers.length === 0) {
        listDiv.innerHTML = '<p style="color:var(--text-muted); padding: 12px 0;">No matching identity profiles found.</p>';
        return;
    }
    
    let table = `<table class="styled-table">
        <thead>
            <tr>
                <th>Account Holder Registry Label</th>
                <th style="text-align:right; width: 180px;">Actions Control</th>
            </tr>
        </thead>
        <tbody>`;
        
    filteredCustomers.forEach((cust) => {
        let actualIndex = knownCustomers.indexOf(cust);
        table += `<tr>
            <td style="font-weight:600; color:var(--text-main);">${cust}</td>
            <td style="text-align:right;">
                <button class="btn-action-small btn-edit" onclick="editCustomer(${actualIndex})">Modify</button>
                <button class="btn-action-small btn-refund" onclick="deleteCustomer(${actualIndex})">Purge</button>
            </td>
        </tr>`;
    });
    table += `</tbody></table>`;
    listDiv.innerHTML = table;
}

function executeCustomerMerge() {
    let source = document.getElementById('merge-source-select').value;
    let target = document.getElementById('merge-target-select').value;
    
    if(!source || !target) {
        alert("Please select both profiles.");
        return;
    }
    if(source === target) {
        alert("Cannot merge a profile into itself.");
        return;
    }
    
    if(!confirm(`Are you sure you want to merge "${source}" into "${target}"?`)) return;
    
    currentDayLog.forEach(log => { if(log.customer === source) log.customer = target; });
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    
    currentRefundLog.forEach(log => { if(log.customer === source) log.customer = target; });
    localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
    
    allTimeHistory.forEach(day => {
        if (day.detailedTimeline) {
            day.detailedTimeline.forEach(entry => { if (entry.customer === source) entry.customer = target; });
        }
    });
    localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
    
    let srcIdx = knownCustomers.indexOf(source);
    if(srcIdx > -1) knownCustomers.splice(srcIdx, 1);
    localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
    
    alert("Records integrated successfully.");
    populateCustomerDatalist();
    populateMergeDropdowns();
    renderCustomerManagement();
    renderLogs();
}

function renderMenuWeightsManagement() {
    const container = document.getElementById('menu-weights-management-container');
    container.innerHTML = '';
    let table = `<div class="section-title" style="margin-top:16px; font-weight:700; margin-bottom:8px;">Active Dynamic Mass Multiplier Factors</div>
    <table class="styled-table">
        <thead>
            <tr>
                <th>Menu Item Label</th>
                <th>Category Mapping</th>
                <th style="width:120px;">Unit Grams (g)</th>
                <th style="text-align:right; width:80px;">Execution</th>
            </tr>
        </thead>
        <tbody>`;
    customItems.forEach((itemObj, index) => {
        table += `<tr>
            <td style="font-weight:600; color:var(--text-main);">${itemObj.name}</td>
            <td style="color:var(--text-muted); font-size:12px;">${itemObj.category}</td>
            <td>
                <input type="number" class="input-field" id="weight-input-${index}" value="${itemObj.weight || 0}" style="padding:6px; font-size:13px; text-align:center; margin:0;">
            </td>
            <td style="text-align:right;">
                <button class="tab-btn active" style="padding:4px 10px; font-size:12px;" onclick="updateItemWeightRow(${index})">Bind</button>
            </td>
        </tr>`;
    });
    table += `</tbody></table>`;
    container.innerHTML = table;
}

function updateItemWeightRow(index) {
    let inputField = document.getElementById(`weight-input-${index}`);
    let newW = parseInt(inputField.value);
    if (isNaN(newW) || newW < 0) return;
    customItems[index].weight = newW;
    localStorage.setItem('categorizedMenu', JSON.stringify(customItems));
    alert("Item weight altered successfully.");
    renderMenu();
    updateLiveBreakdown();
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
        populateMergeDropdowns();
        renderCustomerManagement();
        input.value = '';
    } else {
        alert("Account key already exists.");
    }
}

function editCustomer(index) {
    let oldName = knownCustomers[index];
    let newName = prompt("Alter tracked profile allocation header string:", oldName);
    if (!newName || newName.trim() === "" || newName.trim() === oldName) return;
    let formattedName = newName.trim().replace(/\b\w/g, char => char.toUpperCase());
    knownCustomers[index] = formattedName;
    localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
    currentDayLog.forEach(log => { if (log.customer === oldName) log.customer = formattedName; });
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    allTimeHistory.forEach(day => {
        if (day.detailedTimeline) {
            day.detailedTimeline.forEach(entry => { if (entry.customer === oldName) entry.customer = formattedName; });
        }
    });
    localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
    populateCustomerDatalist();
    populateMergeDropdowns();
    renderCustomerManagement();
    renderLogs();
}

function deleteCustomer(index) {
    let targetName = knownCustomers[index];
    if (confirm(`Wipe "${targetName}" trace completely?`)) {
        knownCustomers.splice(index, 1);
        localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
        populateCustomerDatalist();
        populateMergeDropdowns();
        renderCustomerManagement();
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

// Fixed weight retrieval logic bug
function getItemWeight(itemName) {
    let found = customItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    return found && found.weight ? parseFloat(found.weight) : 0;
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
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; margin:0; font-size:13px;">Active transactions empty.</p>';
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
                <span>Gross Generated Items:</span><span style="font-weight:600; color:var(--text-main);">${grossCount + refundCount} Units</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--danger);">
                <span>Liquidated Void Items:</span><span style="font-weight:600;">-${refundCount} Units</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:800; border-top:1px solid var(--border); padding-top:6px; font-size:14px; color:var(--accent);">
                <span>Net Shift Inventory:</span><span>${grossCount} Units</span>
            </div>
        </div>
        <div style="font-weight:700; font-size:11px; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px; border-bottom:1px solid var(--border); padding-bottom:4px;">Mass Metrics Breakdown</div>
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

// Render Logs UI Layout Block with updated Token Number and Customer parameters
function renderLogs() {
    const logBody = document.getElementById('live-log');
    logBody.innerHTML = '';
    if(currentDayLog.length === 0){ logBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">No transaction entries recorded.</td></tr>`; }
    
    for(let i = currentDayLog.length - 1; i >= 0; i--) {
        let log = currentDayLog[i];
        let row = `<tr>
            <td style="color:var(--text-muted); font-weight:500;">${log.time}</td>
            <td style="font-weight:700; color:var(--primary);">#${log.tokenId}</td>
            <td style="font-weight:600; color:var(--text-main);">${log.customer || "Walk-In"}</td>
            <td style="font-weight:600;">${log.item}</td>
            <td style="text-align:right; font-weight:700; color:var(--text-main);">x${log.qty}</td>
        </tr>`;
        logBody.insertAdjacentHTML('beforeend', row);
    }

    const refundBody = document.getElementById('refund-log');
    refundBody.innerHTML = '';
    if(currentRefundLog.length === 0) { refundBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">No historical void logs found.</td></tr>`; }
    
    for(let j = currentRefundLog.length - 1; j >= 0; j--) {
        let rLog = currentRefundLog[j];
        let row = `<tr>
            <td style="color:var(--danger); font-weight:500;">${rLog.time}</td>
            <td style="font-weight:700; color:var(--text-muted);">#${rLog.tokenId}</td>
            <td style="font-weight:600; color:var(--text-muted); text-decoration: line-through;">${rLog.customer || "Walk-In"}</td>
            <td style="font-weight:600; color:var(--text-muted); text-decoration: line-through;">${rLog.item}</td>
            <td style="text-align:right; font-weight:700; color:var(--danger);">x${rLog.qty}</td>
        </tr>`;
        refundBody.insertAdjacentHTML('beforeend', row);
    }

    updateLiveBreakdown();

    const histContainer = document.getElementById('history-container');
    histContainer.innerHTML = '';
    if(allTimeHistory.length === 0) { histContainer.innerHTML = '<p style="color:#94a3b8; text-align:center; font-size:14px; padding-top:20px; width:100%;">Vault ledger archive empty.</p>'; }
    
    allTimeHistory.forEach((day, index) => {
        let normalizedDateLabel = normalizeToSystemDate(day.date);
        let rangeSuffix = (day.startTime && day.endTime) ? ` (${day.startTime} to ${day.endTime})` : '';

        let html = `<div class="history-card" style="background:white; border:1px solid var(--border); border-radius:12px; padding:16px; position:relative;">
            <button class="qty-btn" style="position:absolute; right:16px; top:16px; color:var(--danger); border-color:var(--danger);" onclick="deleteHistoryItem(${index})">×</button>
            <div style="font-weight:700; font-size:15px; margin-bottom:8px;">
                <span>Shift Date: <strong>${normalizedDateLabel}</strong></span>
                <span style="color:var(--primary); font-size:12px; margin-left:12px;">${rangeSuffix}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
                <span>Gross Items: ${day.grossItems || day.totalItems} | Voided: ${day.refundedItems || 0}</span>
                <span style="color:var(--accent); font-weight:bold;">Net Total: ${day.totalItems} Units</span>
            </div>
            <table style="width:100%; font-size:13px; color:#475569; border-collapse:collapse;">`;
        
        let categoryOrder = ["Rice", "Curry", "Bread", "Others"];
        categoryOrder.forEach(cat => {
            let catHeaderAdded = false;
            for(let itm in day.summary) {
                if(getItemCategory(itm) === cat) {
                    if(!catHeaderAdded) {
                        html += `<tr><td colspan="2" style="font-size:11px; font-weight:700; color:var(--primary); padding-top:6px; text-transform:uppercase;">${cat}</td></tr>`;
                        catHeaderAdded = true;
                    }
                    html += `<tr><td style="padding:2px 0 2px 6px;">${itm}</td><td style="text-align:right; font-weight:600; color:var(--text-main);">x${day.summary[itm]}</td></tr>`;
                }
            }
        });
        html += `</table>`;
        
        if (day.detailedTimeline && day.detailedTimeline.length > 0) {
            html += `<div style="font-weight:700; font-size:11px; margin-top:12px; color:var(--text-muted); text-transform:uppercase; border-top: 1px dashed var(--border); padding-top: 8px;">Action Log History Flow</div>
            <div style="max-height:120px; overflow-y:auto; font-family:monospace; font-size:11px; background:#f8fafc; padding:8px; border-radius:6px; margin-top:6px;">`;
            day.detailedTimeline.forEach(t => {
                let styleRule = t.type === 'REFUND' ? 'color:var(--danger);' : 'color:var(--text-main);';
                let tokDisplay = t.tokenId ? `[#${t.tokenId}] ` : '';
                html += `<div style="margin-bottom:4px; ${styleRule}">[${t.time}] ${tokDisplay}${t.type}: ${t.item} (${t.customer || 'Walk-In'}) x${t.qty}</div>`;
            });
            html += `</div>`;
        }
        html += `<button class="btn-prime" style="margin-top:12px; padding:8px; font-size:13px;" onclick="printSummaryReport(${index})">Generate Thermal Report</button></div>`;
        histContainer.insertAdjacentHTML('afterbegin', html);
    });
}

function printSummaryReport(index) {
    const day = allTimeHistory[index];
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';
    let topItem = "None"; let maxQty = 0;
    for (let itm in day.summary) { if (day.summary[itm] > maxQty) { maxQty = day.summary[itm]; topItem = itm; } }
    let reportDiv = document.createElement('div');
    reportDiv.className = 'pos-report';
    let itemsHtml = '';
    let categoryOrder = ["Rice", "Curry", "Bread", "Others"];
    categoryOrder.forEach(cat => {
        let catHeaderPrinted = false;
        for (let itm in day.summary) {
            if (getItemCategory(itm) === cat) {
                if (!catHeaderPrinted) {
                    itemsHtml += `<div style="font-weight:900; margin-top:6px;">${cat}</div>`;
                    catHeaderPrinted = true;
                }
                itemsHtml += `<div style="display:flex; justify-content:space-between;"><span>&nbsp;&nbsp;${itm.toUpperCase()}</span><span>x${day.summary[itm]}</span></div>`;
            }
        }
    });
    let timeRangeTitle = (day.startTime && day.endTime) ? `${day.startTime} TO ${day.endTime}` : 'SHIFT REPORT';
    reportDiv.innerHTML = `
        <div class="brand-main">AHMED HANIF RAJPUT</div>
        <div style="text-align:center; font-weight:900; font-size:14px;">SHIFT ANALYSIS METRICS</div>
        <div class="meta-line">DATE: ${normalizeToSystemDate(day.date)}</div>
        <div class="meta-line">SHIFT BLOCK: ${timeRangeTitle}</div>
        <div class="pos-divider"></div>
        <div style="display:flex; justify-content:space-between;"><span>GROSS EMITTED:</span><span>${day.grossItems || day.totalItems} Units</span></div>
        <div style="display:flex; justify-content:space-between;"><span>VOIDED RUNTIMES:</span><span>${day.refundedItems || 0} Units</span></div>
        <div style="display:flex; justify-content:space-between; font-weight:900; margin-top:4px; border-top:1px solid #000;"><span>NET TOTAL:</span><span>${day.totalItems} Units</span></div>
        <div class="pos-divider"></div>
        ${itemsHtml}
        <div class="pos-divider"></div>
        <div style="text-align:center; font-weight:900; font-size:12px; margin-top:4px;">TOP ITEM: ${topItem} (${maxQty})</div>
    `;
    printArea.appendChild(reportDiv);
    setTimeout(() => { window.print(); printArea.innerHTML = ''; }, 50);
}

function printTokens() {
    if (Object.keys(currentCart).length === 0) return;
    openCustomerModal();
}

// Token Printing Generation Loop with sequential Token ID numbers included
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
        
        // Grab unique assigned token ID number
        let currentAssignedTokenId = nextTokenId;
        
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
            <div style="font-size: 15px; font-weight: 900; text-align: center; margin: 4px 0;">TOKEN: #${currentAssignedTokenId}</div>
            <div class="pos-divider"></div>
            <div class="item-container">
                <div class="pos-item">${item}</div>
                <div class="pos-qty">UNITS COUNT: [ ${qty} ]</div>
            </div>
            <div class="pos-divider"></div>
            <div class="meta-line">DATE: ${dateStr} &nbsp;&nbsp;&nbsp;&nbsp; TIME: ${timeStr}</div>
            <div style="font-size:11px; font-weight:900; margin-top:4px; text-transform:uppercase;">ACCOUNT: ${customerName}</div>
        `;
        printArea.appendChild(token);
        
        // Advance global identity index tracker vector forward
        nextTokenId++;
    }
    
    // Backup live global counters states down into local filesystem state
    localStorage.setItem('nextTokenId', nextTokenId);
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    
    setTimeout(() => { window.print(); currentCart = {}; renderCart(); renderLogs(); }, 50);
}

function deleteHistoryItem(index) {
    if (!confirm("Permanently delete selected history ledger entry?")) return;
    openPinModal("Management validation requested.", "admin", function() {
        allTimeHistory.splice(index, 1);
        localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
        renderLogs();
    });
}

function clearAllHistory() {
    if (!confirm("Purge history index database completely?")) return;
    openPinModal("Administrative credentials requested.", "admin", function() {
        allTimeHistory = [];
        localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
        renderLogs();
    });
}

function startNewDay() {
    currentDayLog = []; currentRefundLog = []; shiftStartTime = null;
    localStorage.removeItem('currentDayLog'); localStorage.removeItem('currentRefundLog'); localStorage.removeItem('shiftStartTime');
    currentCart = {}; renderCart(); renderLogs(); switchView('pos-tab');
}

function endDay() {
    if (currentDayLog.length === 0 && currentRefundLog.length === 0) return alert("Shift arrays isolated as empty.");
    if (!confirm("Terminate current shift session operations window parameters?")) return;
    openPinModal("Administrative code check verified.", "admin", function() {
        let netItems = 0; let grossItemsCount = 0; let summary = {}; let detailedTimeline = [];

        currentDayLog.forEach(log => { 
            netItems += log.qty; grossItemsCount += log.qty;
            summary[log.item] = (summary[log.item] || 0) + log.qty; 
            detailedTimeline.push({tokenId: log.tokenId, time: log.time, type: 'SALE', item: log.item, qty: log.qty, customer: log.customer});
        });
        currentRefundLog.forEach(log => {
            grossItemsCount += log.qty;
            detailedTimeline.push({tokenId: log.tokenId, time: log.time, type: 'REFUND', item: log.item, qty: log.qty, customer: log.customer || "Walk-In"});
        });
        
        detailedTimeline.sort((a, b) => b.time.localeCompare(a.time));
        
        let shiftClosingTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let shiftOpeningTime = shiftStartTime || (currentDayLog.length > 0 ? currentDayLog[0].time : shiftClosingTime);
        let shiftClosingTimestamp = getFormattedSystemDate();
        
        let dayRecord = { 
            date: shiftClosingTimestamp, 
            startTime: shiftOpeningTime,
            endTime: shiftClosingTime,
            totalItems: netItems, 
            grossItems: grossItemsCount,
            refundedItems: currentRefundLog.length, 
            summary: summary, 
            detailedTimeline: detailedTimeline
        };
        allTimeHistory.push(dayRecord);
        localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
        
        currentDayLog = []; currentRefundLog = []; shiftStartTime = null;
        localStorage.removeItem('currentDayLog'); localStorage.removeItem('currentRefundLog'); localStorage.removeItem('shiftStartTime');
        
        renderLogs();
        switchView('history-tab');
    });
}

// Operational DOM Event Listeners Key Bindings Setup
document.getElementById('modal-pin-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') submitPinModal(); });
document.getElementById('cust-modal-name-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') submitCustomerModal(); });
document.getElementById('new-manual-customer').addEventListener('keypress', function(e) { if (e.key === 'Enter') addCustomerManually(); });
document.getElementById('refund-token-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') lookupTokenForRefund(); });

// Bootstrap POS Architecture Initialization Setup Hooks
renderCategoryFilters();
renderMenu();
renderLogs();
populateCustomerDatalist();
