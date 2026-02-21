// ==================== DOM ELEMENTS ====================

const cropSelect = document.getElementById('cropSelect');
const checkPricesBtn = document.getElementById('checkPricesBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const comparisonSection = document.getElementById('comparisonSection');
const bestWorstSection = document.getElementById('bestWorstSection');
const marketsSection = document.getElementById('marketsSection');
const alertCropSelect = document.getElementById('alertCropSelect');
const addCropSelect = document.getElementById('addCropSelect');
const addMandiSelect = document.getElementById('addMandiSelect');
const setAlertBtn = document.getElementById('setAlertBtn');
const addPriceBtn = document.getElementById('addPriceBtn');
const activeAlertsSection = document.getElementById('activeAlertsSection');
const alertsList = document.getElementById('alertsList');
const noAlerts = document.getElementById('noAlerts');

console.log('✅ Mandi Dashboard Script Loaded');

// ==================== GLOBAL VARIABLES ====================

window.currentCropId = null;
window.allMandis = [];
window.allCrops = [];
let alertsData = [];

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Initializing Mandi Dashboard...');
    loadCropsAndMandis();
    loadAlerts();
});

// ==================== EVENT LISTENERS ====================

loadSampleBtn.addEventListener('click', loadSampleData);
checkPricesBtn.addEventListener('click', checkPrices);
setAlertBtn.addEventListener('click', setAlert);
addPriceBtn.addEventListener('click', addPrice);

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (document.activeElement === cropSelect) {
            checkPrices();
        }
        if (document.activeElement === addPriceInput) {
            addPrice();
        }
        if (document.activeElement === targetPrice) {
            setAlert();
        }
    }
});

// ==================== LOAD CROPS AND MANDIS ====================

async function loadCropsAndMandis() {
    try {
        console.log('📥 Loading crops and mandis from server...');
        
        // Load crops
        const cropsResponse = await fetch('/api/mandi/crops');
        const cropsData = await cropsResponse.json();
        
        // Load mandis
        const mandisResponse = await fetch('/api/mandi/mandis');
        const mandisData = await mandisResponse.json();
        
        if (cropsData.success) {
            window.allCrops = cropsData.crops;
            console.log(`✅ ${cropsData.crops.length} crops loaded`);
            populateSelect(cropSelect, cropsData.crops);
            populateSelect(alertCropSelect, cropsData.crops);
            populateSelect(addCropSelect, cropsData.crops);
        } else {
            console.error('❌ Failed to load crops');
            showMessage('Failed to load crops', 'error');
        }
        
        if (mandisData.success) {
            window.allMandis = mandisData.mandis;
            const odishaMandis = mandisData.mandis.filter(m => m.state === 'Odisha');
            console.log(`✅ ${mandisData.mandis.length} mandis loaded (${odishaMandis.length} from Odisha)`);
            populateSelect(addMandiSelect, mandisData.mandis);
        } else {
            console.error('❌ Failed to load mandis');
            showMessage('Failed to load mandis', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading crops/mandis:', error);
        showMessage(`Error: ${error.message}`, 'error');
    }
}

function populateSelect(selectElement, items) {
    if (!selectElement) return;
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        
        // Show state for mandis
        if (item.state) {
            option.textContent = `${item.name} (${item.state})`;
        } else {
            option.textContent = item.name || item.id;
        }
        
        selectElement.appendChild(option);
    });
    
    console.log(`✓ Populated select with ${items.length} items`);
}

// ==================== LOAD SAMPLE DATA ====================

async function loadSampleData() {
    console.log('📊 Loading sample data...');
    showLoading(true);
    loadSampleBtn.disabled = true;
    loadSampleBtn.textContent = '⏳ Loading...';
    
    try {
        const response = await fetch('/api/mandi/load-sample-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('📥 Response received:', data);
        
        if (data.success) {
            // Update global data
            window.allMandis = data.mandis;
            window.allCrops = data.crops;
            
            console.log(`✅ Sample data loaded successfully!`);
            console.log(`   - ${data.count} price entries`);
            console.log(`   - ${data.mandis.length} mandis (${data.odisha_mandis_count} from Odisha)`);
            console.log(`   - ${data.crops.length} crops`);
            
            showMessage(`✅ ${data.message}`, 'success');
            
            // Show loading message
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            console.error('❌ Error loading sample data:', data.message);
            showMessage(`❌ Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
        loadSampleBtn.disabled = false;
        loadSampleBtn.textContent = '📊 Load Sample Data';
    }
}

// ==================== CHECK PRICES ====================

async function checkPrices() {
    const cropId = cropSelect.value;
    
    if (!cropId) {
        showMessage('⚠️ Please select a crop', 'error');
        return;
    }
    
    window.currentCropId = cropId;
    const cropName = window.allCrops.find(c => c.id === cropId)?.name || cropId;
    
    console.log(`🔍 Checking prices for: ${cropName} (${cropId})`);
    
    showLoading(true);
    hideSections();
    
    try {
        const response = await fetch(`/api/mandi/comparison/${cropId}`);
        const data = await response.json();
        console.log('📊 Price data received:', data);
        
        if (data.success) {
            displayComparison(data);
            displayBestWorst(data);
            displayMarketPrices(cropId);
            showSections();
            
            console.log(`✅ Prices loaded for ${data.crop_name}`);
            showMessage(`✅ Loaded prices for ${data.crop_name} from ${data.statistics.total_records} markets`);
        } else {
            console.error('❌ Error:', data.message);
            showMessage(`❌ Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== DISPLAY COMPARISON ====================

function displayComparison(data) {
    console.log('📊 Displaying price comparison...');
    
    const avgPrice = document.getElementById('avgPrice');
    const maxPrice = document.getElementById('maxPrice');
    const minPrice = document.getElementById('minPrice');
    const priceRange = document.getElementById('priceRange');
    
    if (avgPrice) avgPrice.textContent = `₹${data.statistics.average_price.toFixed(2)}`;
    if (maxPrice) maxPrice.textContent = `₹${data.statistics.max_price}`;
    if (minPrice) minPrice.textContent = `₹${data.statistics.min_price}`;
    if (priceRange) priceRange.textContent = `₹${data.statistics.price_range}`;
    
    console.log('✓ Comparison displayed');
}

// ==================== DISPLAY BEST & WORST MARKETS ====================

function displayBestWorst(data) {
    console.log('🏆 Displaying best and worst markets...');
    
    // Best Market
    if (data.best_market) {
        document.getElementById('bestMarketName').textContent = data.best_market.mandi_name || 'N/A';
        document.getElementById('bestMarketLocation').textContent = data.best_market.location || 'N/A';
        document.getElementById('bestMarketPrice').textContent = `₹${data.best_market.price}`;
        document.getElementById('bestMarketDate').textContent = data.best_market.timestamp ? 
            new Date(data.best_market.timestamp).toLocaleDateString('en-IN') : 'N/A';
    }
    
    // Worst Market
    if (data.worst_market) {
        document.getElementById('worstMarketName').textContent = data.worst_market.mandi_name || 'N/A';
        document.getElementById('worstMarketLocation').textContent = data.worst_market.location || 'N/A';
        document.getElementById('worstMarketPrice').textContent = `₹${data.worst_market.price}`;
        document.getElementById('worstMarketDate').textContent = data.worst_market.timestamp ? 
            new Date(data.worst_market.timestamp).toLocaleDateString('en-IN') : 'N/A';
    }
    
    console.log('✓ Best/Worst markets displayed');
}

// ==================== DISPLAY MARKET PRICES ====================

async function displayMarketPrices(cropId) {
    try {
        console.log(`📊 Fetching market prices for ${cropId}...`);
        
        const response = await fetch(`/api/mandi/prices/${cropId}`);
        const data = await response.json();
        
        if (data.success) {
            const pricesGrid = document.getElementById('pricesGrid');
            pricesGrid.innerHTML = '';
            
            // Sort prices by mandi state (Odisha first, then others)
            const sortedPrices = data.prices.sort((a, b) => {
                const aIsOdisha = a.location && window.allMandis.find(m => m.id === a.mandi_id)?.state === 'Odisha' ? 0 : 1;
                const bIsOdisha = b.location && window.allMandis.find(m => m.id === b.mandi_id)?.state === 'Odisha' ? 0 : 1;
                return aIsOdisha - bIsOdisha;
            });
            
            sortedPrices.forEach(price => {
                const card = document.createElement('div');
                card.className = 'price-card';
                
                // Check if it's an Odisha mandi
                const mandi = window.allMandis.find(m => m.id === price.mandi_id);
                const isOdisha = mandi?.state === 'Odisha';
                
                if (isOdisha) {
                    card.classList.add('odisha-mandi');
                }
                
                card.innerHTML = `
                    <div class="price-market-name">${price.mandi_name}</div>
                    <div class="price-location">
                        ${price.location}
                        ${isOdisha ? '<span class="odisha-badge">🌾 Odisha</span>' : ''}
                    </div>
                    <div class="price-amount">₹${price.price}</div>
                    <div class="price-unit">per ${price.unit}</div>
                    <div class="price-date">${new Date(price.timestamp).toLocaleDateString('en-IN')}</div>
                `;
                pricesGrid.appendChild(card);
            });
            
            console.log(`✓ Displayed ${data.count} market prices`);
        } else {
            console.error('❌ Failed to fetch market prices');
        }
    } catch (error) {
        console.error('❌ Error displaying market prices:', error);
    }
}

// ==================== SET PRICE ALERT ====================

async function setAlert() {
    const cropId = alertCropSelect.value;
    const targetPrice = parseFloat(document.getElementById('targetPrice').value);
    const alertType = document.getElementById('alertType').value;
    
    if (!cropId) {
        showMessage('⚠️ Please select a crop', 'error');
        return;
    }
    
    if (isNaN(targetPrice) || targetPrice <= 0) {
        showMessage('⚠️ Please enter a valid target price', 'error');
        return;
    }
    
    const cropName = window.allCrops.find(c => c.id === cropId)?.name || cropId;
    
    console.log(`🔔 Setting alert: ${cropName} - ${alertType} ₹${targetPrice}`);
    
    try {
        const response = await fetch('/api/mandi/set-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop_id: cropId,
                target_price: targetPrice,
                alert_type: alertType
            })
        });
        
        const data = await response.json();
        console.log('📲 Alert response:', data);
        
        if (data.success) {
            console.log('✅ Alert set successfully');
            showMessage(`✅ Price alert set for ${cropName}: Price ${alertType} ₹${targetPrice}`, 'success');
            document.getElementById('targetPrice').value = '';
            loadAlerts();
        } else {
            console.error('❌ Error:', data.message);
            showMessage(`❌ Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error setting alert:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}

// ==================== LOAD ALERTS ====================

async function loadAlerts() {
    try {
        console.log('📢 Loading active alerts...');
        
        const response = await fetch('/api/mandi/alerts');
        const data = await response.json();
        
        if (data.success && data.alerts && data.alerts.length > 0) {
            console.log(`✅ ${data.alerts.length} active alerts loaded`);
            displayAlerts(data.alerts);
            activeAlertsSection.classList.remove('hidden');
            noAlerts.classList.add('hidden');
        } else {
            console.log('📋 No active alerts');
            activeAlertsSection.classList.add('hidden');
            noAlerts.classList.remove('hidden');
        }
    } catch (error) {
        console.error('❌ Error loading alerts:', error);
    }
}

// ==================== DISPLAY ALERTS ====================

function displayAlerts(alerts) {
    console.log(`📢 Displaying ${alerts.length} alerts...`);
    
    alertsList.innerHTML = '';
    noAlerts.classList.add('hidden');
    
    alerts.forEach(alert => {
        const cropName = window.allCrops.find(c => c.id === alert.crop_id)?.name || alert.crop_id;
        const createdDate = new Date(alert.created_at).toLocaleDateString('en-IN');
        
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';
        
        alertItem.innerHTML = `
            <div class="alert-header">
                <h4>🔔 ${cropName}</h4>
                <span class="alert-type alert-${alert.alert_type}">${alert.alert_type.toUpperCase()}</span>
            </div>
            <div class="alert-details">
                <p><strong>Target Price:</strong> ₹${alert.target_price}</p>
                <p><strong>Alert Type:</strong> Price ${alert.alert_type} ₹${alert.target_price}</p>
                <p><strong>Created:</strong> ${createdDate}</p>
            </div>
            <div class="alert-actions">
                <button class="btn btn-delete" onclick="deleteAlert(${alert.id})">
                    🗑️ Delete Alert
                </button>
            </div>
        `;
        alertsList.appendChild(alertItem);
    });
    
    console.log('✓ Alerts displayed');
}

// ==================== DELETE ALERT ====================

async function deleteAlert(alertId) {
    console.log(`🗑️ Deleting alert: ${alertId}`);
    
    if (!confirm('Are you sure you want to delete this alert?')) {
        console.log('⏸️ Delete cancelled');
        return;
    }
    
    try {
        const response = await fetch(`/api/mandi/delete-alert/${alertId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Alert deleted');
            showMessage('✅ Alert deleted successfully', 'success');
            loadAlerts();
        } else {
            console.error('❌ Error:', data.message);
            showMessage(`❌ Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting alert:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}

// ==================== ADD PRICE ====================

async function addPrice() {
    const cropId = addCropSelect.value;
    const mandiId = addMandiSelect.value;
    const price = parseFloat(document.getElementById('addPriceInput').value);
    
    if (!cropId) {
        showMessage('⚠️ Please select a crop', 'error');
        return;
    }
    
    if (!mandiId) {
        showMessage('⚠️ Please select a mandi', 'error');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        showMessage('⚠️ Please enter a valid price', 'error');
        return;
    }
    
    const cropName = window.allCrops.find(c => c.id === cropId)?.name || cropId;
    const mandiName = window.allMandis.find(m => m.id === mandiId)?.name || mandiId;
    
    console.log(`💰 Adding price: ${cropName} @ ${mandiName} = ₹${price}`);
    
    try {
        const response = await fetch('/api/mandi/add-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop_id: cropId,
                mandi_id: mandiId,
                price: price
            })
        });
        
        const data = await response.json();
        console.log('💾 Price add response:', data);
        
        if (data.success) {
            console.log('✅ Price added successfully');
            showMessage(`✅ Price added: ${cropName} @ ${mandiName} = ₹${price}`, 'success');
            document.getElementById('addPriceInput').value = '';
            
            // Refresh prices if this crop is currently viewed
            if (window.currentCropId === cropId) {
                console.log('🔄 Refreshing current crop prices...');
                setTimeout(() => {
                    checkPrices();
                }, 1500);
            }
        } else {
            console.error('❌ Error:', data.message);
            showMessage(`❌ Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error adding price:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}

// ==================== HELPER FUNCTIONS ====================

function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.classList.toggle('hidden', !show);
    }
}

function hideSections() {
    if (comparisonSection) comparisonSection.classList.add('hidden');
    if (bestWorstSection) bestWorstSection.classList.add('hidden');
    if (marketsSection) marketsSection.classList.add('hidden');
}

function showSections() {
    if (comparisonSection) comparisonSection.classList.remove('hidden');
    if (bestWorstSection) bestWorstSection.classList.remove('hidden');
    if (marketsSection) marketsSection.classList.remove('hidden');
}

function showMessage(message, type = 'success') {
    console.log(`💬 ${type.toUpperCase()}: ${message}`);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 5px;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// ==================== LOGGING UTILITY ====================

function logStatus(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-IN');
    const emoji = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    }[type] || '📌';
    
    console.log(`[${timestamp}] ${emoji} ${message}`);
}

// ==================== PAGE VISIBILITY DETECTION ====================

document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('👁️ Page is visible - refreshing data...');
        loadAlerts();
    } else {
        console.log('👁️ Page is hidden');
    }
});

// ==================== WINDOW UNLOAD ====================

window.addEventListener('beforeunload', function() {
    console.log('👋 Leaving page - session ended');
});

// ==================== INITIALIZATION LOG ====================

console.log('='*50);
console.log('🌾 MANDI DASHBOARD INITIALIZED');
console.log('='*50);
console.log('✓ All DOM elements loaded');
console.log('✓ All event listeners attached');
console.log('✓ Ready for user interaction');
console.log('='*50);