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

let currentCart = JSON.parse(localStorage.getItem('currentCart')) || {};
let currentDayLog = JSON.parse(localStorage.getItem('currentDayLog')) || [];
let currentRefundLog = JSON.parse(localStorage.getItem('currentRefundLog')) || [];
let allTimeHistory = JSON.parse(localStorage.getItem('allTimeHistory')) || [];
let knownCustomers = JSON.parse(localStorage.getItem('knownCustomers')) || [];
let shiftStartTime = localStorage.getItem('shiftStartTime') || null;

// Sequential Token Tracking Engine Initialization
let globalTokenCounter = parseInt(localStorage.getItem('globalTokenCounter')) || 100;

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

// Levenshtein String Proximity Matcher (Automated Customer Identification Matching)
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

function logAuditEvent(type, description) {
    console.log(`[AUDIT LOG] ${type}: ${description}`);
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
        renderMenuWeightsManagement();
        populateMergeDropdowns();
    });
}

function attemptOpenConsumption() {
    openPinModal("Enter Management Keys to Unlock Analytic Engine", "admin", function() {
        switchView('consumption-tab');
        populateFilterOptions();
        populateShiftSelectorOptions();
        renderConsumptionReport();
    });
}

function attemptOpenAudit() {
    openPinModal("Enter Management Keys to Unlock Security Audit Logs", "admin", function() {
        switchView('audit-tab');
    });
}

function handleCustomerSearchFilter() {
    activeCustomerSearchQuery = document.getElementById('customer-search-input').value.trim().toLowerCase();
    renderCustomerManagement();
}

function populateMergeDropdowns() {
    let srcSelect = document.getElementById('merge-source-select');
    let tgtSelect = document.getElementById('merge-target-select');
    
    srcSelect.innerHTML = '<option value="">-- Select Duplicate Profile (To Merge From) --</option>';
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
        alert("Please select both a source duplicate profile and a target master profile.");
        return;
    }
    if(source === target) {
        alert("Cannot merge a profile into itself.");
        return;
    }
    
    if(!confirm(`Are you absolutely sure you want to merge "${source}" into "${target}"?\nAll history records, shift logs, and analytics data will be combined into "${target}", and "${source}" will be deleted.`)) {
        return;
    }
    
    currentDayLog.forEach(log => {
        if(log.customer === source) log.customer = target;
    });
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    
    currentRefundLog.forEach(log => {
        if(log.customer === source) log.customer = target;
    });
    localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
    
    allTimeHistory.forEach(day => {
        if (day.detailedTimeline) {
            day.detailedTimeline.forEach(entry => {
                if (entry.customer === source) entry.customer = target;
            });
        }
    });
    localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
    
    let srcIdx = knownCustomers.indexOf(source);
    if(srcIdx > -1) knownCustomers.splice(srcIdx, 1);
    localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
    
    alert(`Customer Record Integration Successful! "${source}" has been combined into "${target}".`);
    
    populateCustomerDatalist();
    populateMergeDropdowns();
    renderCustomerManagement();
    renderLogs();
}

function exportSystemBackupJSON() {
    let backupPayload = {
        categorizedMenu: JSON.parse(localStorage.getItem('categorizedMenu')) || customItems,
        currentDayLog: JSON.parse(localStorage.getItem('currentDayLog')) || currentDayLog,
        currentRefundLog: JSON.parse(localStorage.getItem('currentRefundLog')) || currentRefundLog,
        allTimeHistory: JSON.parse(localStorage.getItem('allTimeHistory')) || allTimeHistory,
        knownCustomers: JSON.parse(localStorage.getItem('knownCustomers')) || knownCustomers,
        shiftStartTime: localStorage.getItem('shiftStartTime') || shiftStartTime,
        globalTokenCounter: globalTokenCounter
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
    if(fileInput.files.length === 0) {
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
            if(parsedData.shiftStartTime) {
                localStorage.setItem('shiftStartTime', parsedData.shiftStartTime);
            } else {
                localStorage.removeItem('shiftStartTime');
            }
            if(parsedData.globalTokenCounter) {
                localStorage.setItem('globalTokenCounter', parsedData.globalTokenCounter);
                globalTokenCounter = parseInt(parsedData.globalTokenCounter);
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

function renderMenuWeightsManagement() {
    const container = document.getElementById('menu-weights-management-container');
    container.innerHTML = '';
    let table = `<div class="section-title" style="margin-top:16px;">Active Dynamic Mass Multiplier Factors</div>
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
                <input type="number" class="input-field" id="weight-input-${index}" value="${itemObj.weight || 0}" style="padding:6px; font-size:13px; text-align:center;">
            </td>
            <td style="text-align:right;">
                <button class="btn-action-small btn-edit" style="background:var(--accent); color:white; border:none;" onclick="updateItemWeightRow(${index})">Bind</button>
            </td>
        </tr>`;
    });
    table += `</tbody></table>`;
    container.innerHTML = table;
}

function updateItemWeightRow(index) {
    let inputField = document.getElementById(`weight-input-${index}`);
    let newW = parseInt(inputField.value);
    if (isNaN(newW) || newW < 0) {
        alert("Entry out of bounds range parameters.");
        return;
    }
    customItems[index].weight = newW;
    localStorage.setItem('categorizedMenu', JSON.stringify(customItems));
    alert(`Retroactive execution mapping successful. Item weight altered to ${newW}g.`);
    renderMenu();
    updateLiveBreakdown();
}

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
    let newName = prompt("Modify Identity Mapping Label Registration:", oldName);
    if (newName === null) return;
    newName = newName.trim().replace(/\b\w/g, char => char.toUpperCase());
    if (!newName) return;
    if (newName === oldName) return;
    
    if (knownCustomers.includes(newName)) {
        alert("Target identity configuration already active.");
        return;
    }
    
    currentDayLog.forEach(log => { if(log.customer === oldName) log.customer = newName; });
    localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
    
    currentRefundLog.forEach(log => { if(log.customer === oldName) log.customer = newName; });
    localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
    
    allTimeHistory.forEach(day => {
        if(day.detailedTimeline) {
            day.detailedTimeline.forEach(e => { if(e.customer === oldName) e.customer = newName; });
        }
    });
    localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
    
    knownCustomers[index] = newName;
    localStorage.setItem('knownCustomers', JSON.stringify(knownCustomers));
    
    alert("Profile Label Registry Structural Trace Altered.");
    populateCustomerDatalist();
    populateMergeDropdowns();
    renderCustomerManagement();
    renderLogs();
}

function deleteCustomer(index) {
    let targetName = knownCustomers[index];
    if (confirm(`Wipe "${targetName}" identity mapping block trace completely?`)) {
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

function closeCustomerModal() {
    document.getElementById('customer-name-modal').style.display = 'none';
}

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

function renderCategoryFilters() {
    const container = document.getElementById('category-filter-container');
    container.innerHTML = '';
    let categories = ["All", "Rice", "Curry", "Bread", "Others"];
    categories.forEach(cat => {
        let btn = document.createElement('button');
        btn.className = 'category-filter-btn' + (currentActiveCategory === cat ? ' active' : '');
        btn.innerText = cat;
        btn.onclick = () => {
            currentActiveCategory = cat;
            renderCategoryFilters();
            renderMenu();
        };
        container.appendChild(btn);
    });
}

function renderMenu() {
    const grid = document.getElementById('items-grid');
    grid.innerHTML = '';
    let itemsToRender = customItems;
    if (currentActiveCategory !== "All") {
        itemsToRender = customItems.filter(i => i.category === currentActiveCategory);
    }
    itemsToRender.forEach(item => {
        let card = document.createElement('div');
        card.className = 'menu-card';
        card.innerText = item.name;
        card.onclick = () => addToCart(item.name);
        grid.appendChild(card);
    });
}

function renderCart() {
    const container = document.getElementById('cart-container');
    container.innerHTML = '';
    if (Object.keys(currentCart).length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px 0; margin:0; font-size:14px; font-weight:500;">Basket Queue Empty</p>';
        return;
    }
    for (let item in currentCart) {
        let qty = currentCart[item];
        let row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
            <span class="cart-item-name">${item}</span>
            <div class="cart-qty-controls">
                <button class="qty-btn" onclick="changeQty('${item}', -1)">-</button>
                <span class="qty-val">${qty}</span>
                <button class="qty-btn" onclick="changeQty('${item}', 1)">+</button>
            </div>
        `;
        container.appendChild(row);
    }
    localStorage.setItem('currentCart', JSON.stringify(currentCart));
}

function addToCart(item) {
    currentCart[item] = (currentCart[item] || 0) + 1;
    renderCart();
}

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
    let grossCount = 0;
    let refundCount = 0;
    let itemTotals = {};
    currentDayLog.forEach(log => {
        grossCount += log.qty;
        itemTotals[log.item] = (itemTotals[log.item] || 0) + log.qty;
    });
    currentRefundLog.forEach(log => {
        refundCount += log.qty;
    });
    let rangeStr = shiftStartTime ? ` (Opened: ${shiftStartTime})` : '';
    let html = `
        <div style="font-size:13px; margin-bottom:12px; color:var(--text-muted);">
            <div style="font-size:11px; font-weight:700; color:var(--primary); margin-bottom:6px;">${rangeStr}</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>Gross Generated Logs:</span><span style="font-weight:600; color:var(--text-main);">${grossCount + refundCount} Units</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>Active Ledger Volume:</span><span style="font-weight:600; color:var(--accent);">${grossCount} Units</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span>Void Signals Intercepted:</span><span style="font-weight:600; color:var(--danger);">${refundCount} Units</span>
            </div>
        </div>
        <div style="border-top:1px solid var(--border); padding-top:10px;">
            <div style="font-size:11px; font-weight:800; color:var(--text-main); text-transform:uppercase; margin-bottom:6px;">Itemized Scale Aggregate Volume</div>
    `;
    for(let itm in itemTotals) {
        let massKg = ((itemTotals[itm] * getItemWeight(itm)) / 1000).toFixed(2);
        html += `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px; color:var(--text-main);">
                <span>${itm}:</span>
                <span style="font-weight:600;">${itemTotals[itm]} Units (${massKg} KG)</span>
            </div>
        `;
    }
    html += `</div>`;
    container.innerHTML = html;
}

function renderLogs() {
    const logBody = document.getElementById('live-log-tbody');
    logBody.innerHTML = '';
    if(currentDayLog.length === 0) {
        logBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:30px; font-size:13px;">No transaction logs generated in current workspace runtime session.</td></tr>`;
    }
    for (let i = currentDayLog.length - 1; i >= 0; i--) {
        let log = currentDayLog[i];
        let itemWeightKg = ((log.qty * getItemWeight(log.item)) / 1000).toFixed(2);
        let row = `<tr>
            <td style="color:var(--text-muted); font-weight:500;">${log.time}</td>
            <td>
                <div style="font-size:11px; font-weight:800; color:var(--primary); margin-bottom:2px;">TOKEN #${log.tokenNum || 'N/A'}</div>
                <div style="font-weight:700; color:var(--text-main);">${log.item}</div>
                <div style="font-size:11px; color:var(--text-muted);">Registry Mapping Key: <span style="font-weight:600; color:var(--text-main);">${log.customer || 'Walk-In'}</span></div>
            </td>
            <td style="text-align:center; font-weight:700; color:var(--primary);">x${log.qty}<br><span style="font-size:10px; color:var(--text-muted); font-weight:normal;">${itemWeightKg} KG</span></td>
            <td style="text-align:center;"><button class="btn-action-small btn-refund" onclick="refundLogItem(${i})">Void</button></td>
        </tr>`;
        logBody.insertAdjacentHTML('beforeend', row);
    }

    const refundBody = document.getElementById('refund-log');
    refundBody.innerHTML = '';
    if(currentRefundLog.length === 0) {
        refundBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">No historical void signals logs generated.</td></tr>`;
    }
    for(let j = currentRefundLog.length - 1; j >= 0; j--) {
        let rLog = currentRefundLog[j];
        let itemWeightKg = ((rLog.qty * getItemWeight(rLog.item)) / 1000).toFixed(2);
        let row = `<tr>
            <td style="color:var(--danger); font-weight:500;">${rLog.time}</td>
            <td style="font-weight:600; color:var(--text-muted); text-decoration: line-through;">
                <div style="font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:2px;">TOKEN #${rLog.tokenNum || 'N/A'}</div>
                ${rLog.item}
            </td>
            <td style="text-align:center; font-weight:700; color:var(--danger);">x${rLog.qty}<br><span style="font-size:10px; text-decoration: line-through; font-weight:normal;">${itemWeightKg} KG</span></td>
        </tr>`;
        refundBody.insertAdjacentHTML('beforeend', row);
    }

    const historyContainer = document.getElementById('saved-history-container');
    historyContainer.innerHTML = '';
    if (allTimeHistory.length === 0) {
        historyContainer.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:20px; font-size:13px;">Historical structural persistent ledger partitions empty.</p>';
    } else {
        for(let k = allTimeHistory.length - 1; k >= 0; k--) {
            let day = allTimeHistory[k];
            let dateTitle = normalizeToSystemDate(day.date);
            let block = document.createElement('div');
            block.className = 'history-block';
            let itemSummaryHTML = '';
            for (let itm in day.summary) {
                itemSummaryHTML += `<div style="font-size:12px; margin-bottom:2px; display:flex; justify-content:space-between;">
                    <span>${itm}:</span><b>${day.summary[itm]} Units</b>
                </div>`;
            }
            block.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
                    <span style="font-weight:800; color:var(--text-main); font-size:13px;">${dateTitle}</span>
                    <span style="font-size:10px; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:var(--text-muted);">${day.startTime || 'N/A'} - ${day.endTime || 'N/A'}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">
                    Net Units: <b style="color:var(--accent);">${day.totalItems}</b> | Gross: <b>${day.grossItems || day.totalItems}</b> | Voids: <b style="color:var(--danger);">${day.refundedItems || 0}</b>
                </div>
                <div style="background:#f8fafc; padding:6px; border-radius:6px; margin-bottom:8px;">${itemSummaryHTML}</div>
                <div style="display:flex; gap:6px;">
                    <button class="btn-action-small btn-edit" style="font-size:10px; padding:4px 8px;" onclick="printHistoricalReport(${k})">Print Slip</button>
                    <button class="btn-action-small btn-refund" style="font-size:10px; padding:4px 8px; background:#fef2f2; color:var(--danger);" onclick="purgeHistoricalIndex(${k})">Wipe Shift</button>
                </div>
            `;
            historyContainer.appendChild(block);
        }
    }
    updateLiveBreakdown();
}

function getItemWeight(itemName) {
    let target = customItems.find(i => i.name === itemName);
    return target ? (target.weight || 0) : 0;
}

function refundLogItem(index) {
    if(!confirm("Are you sure you want to VOID this transaction log? This action requires management override keys.")) return;
    openPinModal("Verification authorization protocols requested.", "refund", function() {
        let now = new Date();
        let refundTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let targetItem = currentDayLog[index];
        let refundObject = {
            tokenNum: targetItem.tokenNum,
            time: refundTime,
            item: targetItem.item,
            qty: targetItem.qty,
            customer: targetItem.customer || "Walk-In"
        };
        currentRefundLog.push(refundObject);
        localStorage.setItem('currentRefundLog', JSON.stringify(currentRefundLog));
        currentDayLog.splice(index, 1);
        localStorage.setItem('currentDayLog', JSON.stringify(currentDayLog));
        renderLogs();
        printSingleRefundToken(refundObject);
    });
}

function printSingleRefundToken(refundObj) {
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';
    let token = document.createElement('div');
    token.className = 'pos-token';
    let weightStr = ((refundObj.qty * getItemWeight(refundObj.item)) / 1000).toFixed(2);
    token.innerHTML = `
        <div class="brand-main">AHMED HANIF RAJPUT</div>
        <div style="font-size: 14px; font-weight: 900; text-align: center; color: #ffffff !important; background-color: #000000 !important; padding: 2px 0; margin: 4px 0;">[ VOID CANCEL ]</div>
        <div style="font-family: Arial, sans-serif !important; font-size: 11px; font-weight: 900; margin-bottom: 6px; text-align: center;">
            TIME: ${refundObj.time} &nbsp;&nbsp; TOKEN: #${refundObj.tokenNum || 'N/A'}
        </div>
        <div class="pos-divider"></div>
        <div style="font-size:14px; font-weight:900; margin: 4px 0;">${refundObj.item}</div>
        <div style="font-size:13px; font-weight:900;">QTY: <span style="font-size:16px;">${refundObj.qty}</span></div>
        <div class="pos-divider"></div>
        <div style="font-size:11px; font-weight:900; text-align:center; margin-top:4px;">Account Track: ${refundObj.customer}</div>
    `;
    printArea.appendChild(token);
    setTimeout(() => {
        window.print();
        printArea.innerHTML = '';
    }, 50);
}

function addNewItem() {
    let nameIn = document.getElementById('new-item-name');
    let catIn = document.getElementById('new-item-category');
    let weightIn = document.getElementById('new-item-weight');
    
    let name = nameIn.value.trim().replace(/\b\w/g, char => char.toUpperCase());
    let category = catIn.value;
    let weight = parseInt(weightIn.value) || 0;
    
    if(!name) {
        alert("Menu Item Label cannot be left transparent.");
        return;
    }
    if(customItems.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        alert("This item definition label already exists in the local engine ecosystem mapping.");
        return;
    }
    
    customItems.push({ name, category, weight });
    localStorage.setItem('categorizedMenu', JSON.stringify(customItems));
    
    alert(`"${name}" initialization successfully injected.`);
    nameIn.value = '';
    weightIn.value = '';
    
    renderMenu();
    renderMenuWeightsManagement();
}

function attemptStartNewDay() {
    if (currentDayLog.length > 0 || currentRefundLog.length > 0) {
        if (!confirm("Active data matrices detected in current session. Open a completely new empty day anyway?")) {
            return;
        }
    }
    localStorage.removeItem('currentCart');
    localStorage.removeItem('currentDayLog');
    localStorage.removeItem('currentRefundLog');
    localStorage.removeItem('shiftStartTime');
    currentCart = {};
    currentDayLog = [];
    currentRefundLog = [];
    shiftStartTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    localStorage.setItem('shiftStartTime', shiftStartTime);
    renderCart();
    renderLogs();
    alert("System Runtime Matrix Initialized. Shift Timer Clock Triggered.");
}

function purgeHistoricalIndex(index) {
    if(!confirm("CRITICAL ACCESSIBILITY ALERT: Delete this permanent day segment log index from browser local storage framework?")) return;
    allTimeHistory.splice(index, 1);
    localStorage.setItem('allTimeHistory', JSON.stringify(allTimeHistory));
    renderLogs();
}

function endDay() {
    if (currentDayLog.length === 0 && currentRefundLog.length === 0) {
        alert("Active structural log storage empty. Closure signal rejected.");
        return;
    }
    if (!confirm("Are you sure you want to close this shift session? This action logs active metrics into persistent archives.")) return;
    
    openPinModal("Verification authorization keys required.", "admin", function() {
        let netItems = 0;
        let grossItemsCount = 0;
        let summary = {};
        let detailedTimeline = [];
        
        currentDayLog.forEach(log => {
            netItems += log.qty;
            grossItemsCount += log.qty;
            summary[log.item] = (summary[log.item] || 0) + log.qty;
            detailedTimeline.push({time: log.time, type: 'SALE', item: log.item, qty: log.qty, customer: log.customer, tokenNum: log.tokenNum});
        });
        currentRefundLog.forEach(log => {
            grossItemsCount += log.qty;
            detailedTimeline.push({time: log.time, type: 'REFUND', item: log.item, qty: log.qty, customer: log.customer || "Walk-In", tokenNum: log.tokenNum});
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
        
        printReport(dayRecord);
        
        localStorage.removeItem('currentCart');
        localStorage.removeItem('currentDayLog');
        localStorage.removeItem('currentRefundLog');
        localStorage.removeItem('shiftStartTime');
        currentCart = {};
        currentDayLog = [];
        currentRefundLog = [];
        shiftStartTime = null;
        
        renderCart();
        renderLogs();
        alert("Active Matrix Cleared & Successfully Archived into Permanent Data Blocks.");
    });
}

function printReport(dayRecord) {
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';
    let reportDiv = document.createElement('div');
    reportDiv.className = 'pos-report';
    let dateStr = normalizeToSystemDate(dayRecord.date);
    let itemsHTML = '';
    let categoriesTotal = {};
    for (let item in dayRecord.summary) {
        let qty = dayRecord.summary[item];
        let target = customItems.find(i => i.name === item);
        let cat = target ? target.category : "Others";
        let weightFactor = target ? target.weight : 0;
        let massTotalKg = ((qty * weightFactor) / 1000).toFixed(2);
        if (!categoriesTotal[cat]) categoriesTotal[cat] = { count: 0, weight: 0 };
        categoriesTotal[cat].count += qty;
        categoriesTotal[cat].weight += (qty * weightFactor);
        itemsHTML += `
            <div class="report-row">
                <span style="font-weight:700;">${item}</span>
                <span style="font-weight:900;">x${qty} <span style="font-size:11px; font-weight:normal; color:#000;">(${massTotalKg} KG)</span></span>
            </div>
        `;
    }
    let catSummaryHTML = '';
    for (let cat in categoriesTotal) {
        let catKg = (categoriesTotal[cat].weight / 1000).toFixed(2);
        catSummaryHTML += `
            <div class="report-row" style="font-size:12px; margin-bottom:2px;">
                <span>${cat}:</span>
                <span style="font-weight:900;">${categoriesTotal[cat].count} Units (${catKg} KG)</span>
            </div>
        `;
    }
    let timelineHTML = '';
    if(dayRecord.detailedTimeline && dayRecord.detailedTimeline.length > 0) {
        dayRecord.detailedTimeline.forEach(entry => {
            let cleanType = entry.type === 'REFUND' ? '[VOID]' : 'SALE';
            let styleColor = entry.type === 'REFUND' ? 'color:#000; text-decoration:line-through;' : '';
            let tNumStr = entry.tokenNum ? ` #${entry.tokenNum}` : '';
            timelineHTML += `
                <div style="font-size:11px; font-family:Arial, sans-serif; display:flex; justify-content:space-between; margin-bottom:3px; ${styleColor}">
                    <span>${entry.time} - T${tNumStr} - ${entry.customer || 'Walk-In'}</span>
                    <span>${cleanType} ${entry.item} x${entry.qty}</span>
                </div>
            `;
        });
    } else {
        timelineHTML = '<div style="font-size:11px; text-align:center;">No timeline logs saved.</div>';
    }
    reportDiv.innerHTML = `
        <div class="brand-main">AHMED HANIF RAJPUT</div>
        <div class="report-title">SHIFT CLOSURE MATRIX REPORT</div>
        <div class="meta-line">DATE: ${dateStr}</div>
        <div class="meta-line">TIMEFRAME: ${dayRecord.startTime || 'N/A'} - ${dayRecord.endTime || 'N/A'}</div>
        <div class="pos-divider"></div>
        <div class="report-category-header">Itemized Production Multipliers</div>
        ${itemsHTML}
        <div class="pos-divider"></div>
        <div class="report-category-header">Category Load Distribution Summary</div>
        ${catSummaryHTML}
        <div class="pos-divider"></div>
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:900; margin-top:4px;">
            <span>TOTAL QUANTITY MATRIX:</span><span>${dayRecord.totalItems} Units</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#000; margin-top:2px;">
            <span>Gross Session Signals:</span><span>${dayRecord.grossItems || dayRecord.totalItems} Units</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#000;">
            <span>Intercepted Void Counter:</span><span>${dayRecord.refundedItems || 0} Logs</span>
        </div>
        <div class="pos-divider"></div>
        <div class="report-category-header">Sequential Log Tracking Journal</div>
        ${timelineHTML}
        <div class="pos-divider" style="margin-top:12px;"></div>
        <div style="text-align:center; font-size:10px; font-weight:900; margin-top:6px;">ARCHIVAL END-OF-SHIFT VECTOR RECORD PRINTED</div>
    `;
    printArea.appendChild(reportDiv);
    setTimeout(() => { window.print(); printArea.innerHTML = ''; }, 50);
}

function printHistoricalReport(index) {
    let dayRecord = allTimeHistory[index];
    if(dayRecord) printReport(dayRecord);
}

function printTokens() {
    if (Object.keys(currentCart).length === 0) return;
    openCustomerModal();
}

// Token Printing Generator (Updated: Small unified line for Date, Time, and Token Number)
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
        globalTokenCounter++;
        localStorage.setItem('globalTokenCounter', globalTokenCounter);
        
        currentDayLog.push({
            tokenNum: globalTokenCounter,
            time: timeStr,
            item: item,
            qty: qty,
            customer: customerName
        });
        
        let token = document.createElement('div');
        token.className = 'pos-token';
        
        token.innerHTML = `
            <div class="brand-main">AHMED HANIF RAJPUT</div>
            <div style="font-family: Arial, sans-serif !important; font-size: 11px; font-weight: 900; margin-bottom: 6px; text-align: center;">
                DATE: ${dateStr} &nbsp;&nbsp; TIME: ${timeStr} &nbsp;&nbsp; TOKEN: #${globalTokenCounter}
            </div>
            <div class="pos-divider"></div>
            <div style="font-size: 18px; font-weight: 900; margin: 6px 0; text-transform: uppercase; letter-spacing: -0.3px;">${item}</div>
            <div style="font-size: 14px; font-weight: 900; margin-bottom: 4px;">QTY: <span style="font-size: 22px; font-weight: 900;">${qty}</span></div>
            <div class="pos-divider"></div>
            <div style="font-size: 11px; font-weight: 900; text-align: center; margin-top: 4px; text-transform: uppercase;">Mapping: ${customerName}</div>
        `;
        printArea.appendChild(token);
    }
    
    currentCart = {};
    localStorage.removeItem('currentCart');
    renderCart();
    renderLogs();
    
    setTimeout(() => {
        window.print();
        printArea.innerHTML = '';
    }, 50);
}

function populateFilterOptions() {
    let cSelect = document.getElementById('filter-cust');
    let iSelect = document.getElementById('filter-item');
    let dSelect = document.getElementById('filter-date');
    
    let currentC = cSelect ? cSelect.value : "ALL";
    let currentI = iSelect ? iSelect.value : "ALL";
    let currentD = dSelect ? dSelect.value : "ALL";
    
    let customers = new Set();
    let items = new Set();
    let dates = new Set();
    
    currentDayLog.forEach(r => {
        if(r.customer) customers.add(r.customer);
        if(r.item) items.add(r.item);
    });
    currentRefundLog.forEach(r => {
        if(r.customer) customers.add(r.customer);
        if(r.item) items.add(r.item);
    });
    
    allTimeHistory.forEach(day => {
        let dStr = normalizeToSystemDate(day.date);
        dates.add(dStr);
        if(day.detailedTimeline) {
            day.detailedTimeline.forEach(entry => {
                if(entry.customer) customers.add(entry.customer);
                if(entry.item) items.add(entry.item);
            });
        }
    });
    
    if(cSelect) {
        cSelect.innerHTML = '<option value="ALL">-- All Customer Profiles --</option>';
        Array.from(customers).sort().forEach(c => {
            cSelect.innerHTML += `<option value="${c}">${c}</option>`;
        });
        cSelect.value = currentC;
        if(cSelect.value !== currentC) cSelect.value = "ALL";
    }
    
    if(iSelect) {
        iSelect.innerHTML = '<option value="ALL">-- All Menu Labels --</option>';
        Array.from(items).sort().forEach(i => {
            iSelect.innerHTML += `<option value="${i}">${i}</option>`;
        });
        iSelect.value = currentI;
        if(iSelect.value !== currentI) iSelect.value = "ALL";
    }
    
    if(dSelect) {
        dSelect.innerHTML = '<option value="ALL">-- All Historical Dates --</option>';
        Array.from(dates).sort().forEach(d => {
            dSelect.innerHTML += `<option value="${d}">${d}</option>`;
        });
        dSelect.value = currentD;
        if(dSelect.value !== currentD) dSelect.value = "ALL";
    }
}

function populateShiftSelectorOptions() {
    let selector = document.getElementById('rule-shift-selector');
    if(!selector) return;
    let currentSelection = selector.value;
    selector.innerHTML = '';
    let liveRange = shiftStartTime ? ` (Opened ${shiftStartTime})` : ' (No Active Shift Window)';
    selector.innerHTML += `<option value="LIVE">Active Operational Runtime Engine Segment${liveRange}</option>`;
    allTimeHistory.forEach((day, idx) => {
        let label = normalizeToSystemDate(day.date);
        let timeStr = (day.startTime && day.endTime) ? ` (${day.startTime} to ${day.endTime})` : '';
        selector.innerHTML += `<option value="SHIFT-${idx}">Ledger Segment: ${label}${timeStr}</option>`;
    });
    if (currentSelection && selector.querySelector(`option[value="${currentSelection}"]`)) {
        selector.value = currentSelection;
    } else {
        selector.value = "LIVE";
    }
}

function calculateHighConsumptionMatrix(data) {
    let selectedShift = document.getElementById('rule-shift-selector').value;
    let riceVal = document.getElementById('rule-rice-limit').value.trim();
    let curryVal = document.getElementById('rule-curry-limit').value.trim();
    let breadVal = document.getElementById('rule-bread-limit').value.trim();
    
    let riceLimit = riceVal !== "" ? parseInt(riceVal) : null;
    let curryLimit = curryVal !== "" ? parseInt(curryVal) : null;
    let breadLimit = breadVal !== "" ? parseInt(breadVal) : null;
    
    let aggregation = {};
    data.forEach(r => {
        if (r.shiftId !== selectedShift) return;
        if (!aggregation[r.customer]) {
            aggregation[r.customer] = { Rice: 0, Curry: 0, Bread: 0, Others: 0 };
        }
        let target = customItems.find(i => i.name === r.item);
        let cat = target ? target.category : "Others";
        if (r.type === 'REFUND') {
            aggregation[r.customer][cat] -= r.qty;
        } else {
            aggregation[r.customer][cat] += r.qty;
        }
    });
    
    let violations = [];
    for (let cust in aggregation) {
        let profile = aggregation[cust];
        let triggers = [];
        if (riceLimit !== null && profile.Rice >= riceLimit) triggers.push(`Rice Block Threshold Crossed (${profile.Rice}/${riceLimit})`);
        if (curryLimit !== null && profile.Curry >= curryLimit) triggers.push(`Curry Block Threshold Crossed (${profile.Curry}/${curryLimit})`);
        if (breadLimit !== null && profile.Bread >= breadLimit) triggers.push(`Bread Block Threshold Crossed (${profile.Bread}/${breadLimit})`);
        
        if (triggers.length > 0) {
            violations.push({ customer: cust, triggers: triggers });
        }
    }
    
    let ruleDiv = document.getElementById('consumption-rules-logs');
    if (!ruleDiv) return;
    ruleDiv.innerHTML = '';
    
    if (violations.length === 0) {
        ruleDiv.innerHTML = '<div style="color:var(--accent); font-weight:700; font-size:13px; padding:12px; border:1px solid #bbf7d0; background:#f0fdf4; border-radius:6px;">Operational Parameter Safe State: Zero limit boundary violations detected inside current window selection.</div>';
        return;
    }
    
    violations.forEach(v => {
        let triggerList = v.triggers.map(t => `<li style="margin-bottom:2px;">${t}</li>`).join('');
        ruleDiv.innerHTML += `
            <div style="border:1px solid #fca5a5; background:#fef2f2; padding:10px; border-radius:6px; margin-bottom:8px; font-size:13px;">
                <div style="font-weight:800; color:var(--danger); margin-bottom:4px;">Identity Tracker Trigger: ${v.customer}</div>
                <ul style="margin:0; padding-left:16px; font-weight:600; color:#7f1d1d;">${triggerList}</ul>
            </div>
        `;
    });
}

function renderConsumptionReport() {
    const tbody = document.getElementById('consumption-report-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    let fCust = document.getElementById('filter-cust').value;
    let fItem = document.getElementById('filter-item').value;
    let fDate = document.getElementById('filter-date').value;
    
    let structuralDataset = [];
    
    currentDayLog.forEach(r => {
        structuralDataset.push({
            date: getFormattedSystemDate(),
            time: r.time,
            customer: r.customer || "Walk-In",
            item: r.item,
            qty: r.qty,
            type: 'SALE',
            shiftId: 'LIVE',
            tokenNum: r.tokenNum
        });
    });
    
    currentRefundLog.forEach(r => {
        structuralDataset.push({
            date: getFormattedSystemDate(),
            time: r.time,
            customer: r.customer || "Walk-In",
            item: r.item,
            qty: r.qty,
            type: 'REFUND',
            shiftId: 'LIVE',
            tokenNum: r.tokenNum
        });
    });
    
    allTimeHistory.forEach((day, idx) => {
        let dayDateLabel = normalizeToSystemDate(day.date);
        if(day.detailedTimeline) {
            day.detailedTimeline.forEach(entry => {
                structuralDataset.push({
                    date: dayDateLabel,
                    time: entry.time,
                    customer: entry.customer || "Walk-In",
                    item: entry.item,
                    qty: entry.qty,
                    type: entry.type || 'SALE',
                    shiftId: `SHIFT-${idx}`,
                    tokenNum: entry.tokenNum
                });
            });
        }
    });
    
    calculateHighConsumptionMatrix(structuralDataset);
    
    let filtered = structuralDataset.filter(r => {
        if (fCust !== "ALL" && r.customer !== fCust) return false;
        if (fItem !== "ALL" && r.item !== fItem) return false;
        if (fDate !== "ALL" && r.date !== fDate) return false;
        return true;
    });
    
    if(filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">No ledger entries matched filter constraint attributes.</td></tr>`;
        return;
    }
    
    filtered.forEach(r => {
        let statusStyle = r.type === 'REFUND' ? 'color:var(--danger); font-weight:700;' : 'color:var(--accent); font-weight:700;';
        let qtyVal = r.type === 'REFUND' ? `-${r.qty}` : r.qty;
        let itemWeightKg = ((r.qty * getItemWeight(r.item)) / 1000).toFixed(2);
        let massStr = r.type === 'REFUND' ? `-${itemWeightKg}` : itemWeightKg;
        let tStr = r.tokenNum ? `TOKEN #${r.tokenNum}` : 'N/A';
        
        let row = `<tr>
            <td>${r.date}</td>
            <td style="color:var(--text-muted); font-weight:500;">${r.time || 'N/A'}</td>
            <td style="font-weight:700; color:var(--primary); font-size:12px;">${tStr}</td>
            <td style="font-weight:700; color:var(--text-main);">${r.customer}</td>
            <td style="font-weight:600;">${r.item}</td>
            <td style="text-align:center; font-weight:800; color:var(--text-main);">${qtyVal} Units<br><span style="font-size:10px; color:var(--text-muted); font-weight:normal;">${massStr} KG</span></td>
            <td style="text-align:center; ${statusStyle}">${r.type}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function exportConsumptionToCSV() {
    let fCust = document.getElementById('filter-cust').value;
    let fItem = document.getElementById('filter-item').value;
    let fDate = document.getElementById('filter-date').value;
    
    let structuralDataset = [];
    currentDayLog.forEach(r => {
        structuralDataset.push({ date: getFormattedSystemDate(), time: r.time, customer: r.customer || "Walk-In", item: r.item, qty: r.qty, type: 'SALE', tokenNum: r.tokenNum });
    });
    currentRefundLog.forEach(r => {
        structuralDataset.push({ date: getFormattedSystemDate(), time: r.time, customer: r.customer || "Walk-In", item: r.item, qty: r.qty, type: 'REFUND', tokenNum: r.tokenNum });
    });
    allTimeHistory.forEach((day, idx) => {
        let dayDateLabel = normalizeToSystemDate(day.date);
        if(day.detailedTimeline) {
            day.detailedTimeline.forEach(entry => {
                structuralDataset.push({ date: dayDateLabel, time: entry.time, customer: entry.customer || "Walk-In", item: entry.item, qty: entry.qty, type: entry.type || 'SALE', tokenNum: entry.tokenNum });
            });
        }
    });
    
    let data = structuralDataset.filter(r => {
        if (fCust !== "ALL" && r.customer !== fCust) return false;
        if (fItem !== "ALL" && r.item !== fItem) return false;
        if (fDate !== "ALL" && r.date !== fDate) return false;
        return true;
    });
    
    if (data.length === 0) return alert("Structural target storage layer empty.");
    let csvContent = "data:text/csv;charset=utf-8,Timestamp Block Node,Token Reference,Profile Mapping ID,Menu Label,Quantity Scalar,Retroactive Weight Metric(KG),State Vector\n";
    data.forEach(r => {
        let val = r.type === 'REFUND' ? `-${r.qty}` : r.qty;
        let wVal = ((r.qty * getItemWeight(r.item)) / 1000).toFixed(2);
        let wStr = r.type === 'REFUND' ? `-${wVal}` : wVal;
        csvContent += `"${r.date}, ${r.time || 'N/A'}","${r.tokenNum || 'N/A'}","${r.customer}","${r.item}",${val},${wStr},"${r.type}"\n`;
    });
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shift_Matrix_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Operational DOM Global Event Key Bindings UI Hooks
document.getElementById('modal-pin-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') submitPinModal(); });
document.getElementById('cust-modal-name-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') submitCustomerModal(); });
document.getElementById('new-manual-customer').addEventListener('keypress', function(e) { if (e.key === 'Enter') addCustomerManually(); });
document.getElementById('new-item-name').addEventListener('keypress', function(e) { if (e.key === 'Enter') addNewItem(); });
document.getElementById('new-item-weight').addEventListener('keypress', function(e) { if (e.key === 'Enter') addNewItem(); });

// Application Bootstrap Liftoff Initialization
renderCategoryFilters();
renderMenu();
renderCart();
populateCustomerDatalist();
</script>
