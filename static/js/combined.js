// ==================== DOM ELEMENTS ====================

// Navigation
const navTabs = document.querySelectorAll('[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');

// Weather Elements
const weatherCity = document.getElementById('weatherCity');
const weatherLoading = document.getElementById('weatherLoading');
const weatherDisplay = document.getElementById('weatherDisplay');
const risksContainer = document.getElementById('risksContainer');
const advisoriesContainer = document.getElementById('advisoriesContainer');

// Mandi Elements
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

// Combined View
const combinedCity = document.getElementById('combinedCity');
const combinedTemp = document.getElementById('combinedTemp');
const combinedCondition = document.getElementById('combinedCondition');
const combinedPrices = document.getElementById('combinedPrices');
const combinedDiseaseAlerts = document.getElementById('combinedDiseaseAlerts');
const combinedPriceAlerts = document.getElementById('combinedPriceAlerts');

// Multi-city Results
const multiCityResults = document.getElementById('multiCityResults');

console.log('✅ Combined Dashboard Script Loaded');

// ==================== GLOBAL VARIABLES ====================

window.currentCropId = null;
window.allMandis = [];
window.allCrops = [];
window.currentWeatherData = null;
let alertsData = [];

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Initializing Combined Dashboard...');
    console.log('═══════════════════════════════════════════');
    
    // Setup navigation with data-tab attributes
    setupNavigation();
    
    // Load mandi data
    loadCropsAndMandis();
    
    // Load alerts
    loadAlerts();
    
    // Check system health
    checkSystemHealth();
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('✓ Dashboard fully initialized');
    console.log('═══════════════════════════════════════════\n');
});

// ==================== NAVIGATION SETUP ====================

function setupNavigation() {
    console.log('🔧 Setting up navigation...');
    
    const navButtons = document.querySelectorAll('[data-tab]');
    console.log(`Found ${navButtons.length} navigation buttons`);
    
    navButtons.forEach(button => {
        console.log(`Setting up button for tab: ${button.getAttribute('data-tab')}`);
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            console.log(`Click event on tab button: ${tabName}`);
            switchTab(tabName);
        });
    });
    
    console.log('✓ Navigation setup complete');
}

// ==================== KEYBOARD SHORTCUTS ====================

function handleKeyboardShortcuts(event) {
    // Alt + W: Switch to Weather
    if (event.altKey && event.key === 'w') {
        event.preventDefault();
        switchTab('weather');
    }
    // Alt + M: Switch to Mandi
    if (event.altKey && event.key === 'm') {
        event.preventDefault();
        switchTab('mandi');
    }
    // Alt + C: Switch to Combined
    if (event.altKey && event.key === 'c') {
        event.preventDefault();
        switchTab('combined');
    }
    // Enter on weather city: Get weather
    if (event.key === 'Enter' && document.activeElement === weatherCity) {
        getWeather();
    }
    // Enter on add price: Add price
    if (event.key === 'Enter' && document.activeElement === document.getElementById('addPriceInput')) {
        addPrice();
    }
}

// ==================== TAB SWITCHING (FIXED) ====================

function switchTab(tabName) {
    console.log(`\n📑 Switching to tab: ${tabName}`);
    console.log(`═══════════════════════════════════════════`);
    
    try {
        // Find all tab content elements
        const allTabs = document.querySelectorAll('.tab-content');
        console.log(`Found ${allTabs.length} tab content elements`);
        
        // Hide all tabs
        allTabs.forEach(tab => {
            const tabId = tab.id;
            const isActive = tab.classList.contains('active');
            console.log(`Tab ${tabId}: active=${isActive}, removing active class`);
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav tabs
        const allNavTabs = document.querySelectorAll('[data-tab]');
        allNavTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName + 'Tab');
        if (selectedTab) {
            console.log(`✓ Found tab element: ${tabName}Tab`);
            selectedTab.classList.add('active');
            console.log(`✓ Added active class to ${tabName}Tab`);
        } else {
            console.error(`❌ Tab element not found: ${tabName}Tab`);
            return;
        }
        
        // Activate corresponding nav button
        const navButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (navButton) {
            navButton.classList.add('active');
            console.log(`✓ Activated nav button for ${tabName}`);
        } else {
            console.error(`❌ Nav button not found for ${tabName}`);
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`✓ Successfully switched to ${tabName} tab`);
        console.log(`═══════════════════════════════════════════\n`);
        
    } catch (error) {
        console.error(`❌ Error switching tabs:`, error);
    }
}

// ==================== WEATHER FUNCTIONS ====================

async function detectLocation() {
    try {
        console.log('🌍 Detecting user location...');
        
        const response = await fetch('/api/detect-location');
        const data = await response.json();
        
        if (data.success) {
            weatherCity.value = data.city;
            console.log(`✓ Location detected: ${data.city}, ${data.country}`);
            showMessage(`📍 Location detected: ${data.city}, ${data.region}`, 'success');
        } else {
            console.warn('⚠️ Could not detect location automatically');
            showMessage('⚠️ Could not auto-detect location. Please enter manually.', 'error');
        }
    } catch (error) {
        console.error('❌ Error detecting location:', error);
        showMessage(`Error: ${error.message}`, 'error');
    }
}

async function getWeather() {
    const city = weatherCity.value.trim();
    const lang = window.currentLanguage || 'en';
    
    if (!city) {
        showMessage('⚠️ Please enter a city name', 'error');
        return;
    }
    
    await fetchWeather(city, lang);
}

async function getWeatherQuick(city) {
    console.log(`🔍 Quick weather fetch for: ${city}`);
    weatherCity.value = city;
    const lang = window.currentLanguage || 'en';
    await fetchWeather(city, lang);
    switchTab('weather');
}

async function fetchWeather(city, lang = 'en') {
    console.log(`🌤️ Fetching weather for: ${city} (Language: ${lang})`);
    showWeatherLoading(true);
    
    try {
        const response = await fetch(`/api/weather/${city}?lang=${lang}`);
        const data = await response.json();
        
        if (data.success) {
            window.currentWeatherData = data;
            displayWeather(data);
            updateCombinedView(data);
            console.log(`✓ Weather data received for ${data.city}`);
            console.log(`  - Temperature: ${data.weather.temperature}°C`);
            console.log(`  - Humidity: ${data.weather.humidity}%`);
            console.log(`  - Advisories: ${data.advisories.length}`);
            showMessage(`✅ Weather data loaded for ${data.city}`, 'success');
        } else {
            console.error('❌ Weather API error:', data.message);
            showMessage(`❌ ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error fetching weather:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        showWeatherLoading(false);
    }
}

function displayWeather(data) {
    console.log('🌤️ Displaying weather data...');
    
    // Update weather display
    const cityElement = document.getElementById('weatherCity2');
    if (cityElement) cityElement.textContent = data.city;
    
    const tempElement = document.getElementById('temperature');
    if (tempElement) tempElement.textContent = `${Math.round(data.weather.temperature)}°C`;
    
    const humidElement = document.getElementById('humidity');
    if (humidElement) humidElement.textContent = `${data.weather.humidity}%`;
    
    const rainElement = document.getElementById('rainfall');
    if (rainElement) rainElement.textContent = `${data.weather.rainfall}mm`;
    
    const windElement = document.getElementById('windSpeed');
    if (windElement) windElement.textContent = `${data.weather.wind_speed} km/h`;
    
    const cloudElement = document.getElementById('clouds');
    if (cloudElement) cloudElement.textContent = `${data.weather.clouds}%`;
    
    const condElement = document.getElementById('condition');
    if (condElement) condElement.textContent = data.weather.condition;
    
    // Display disease risks
    console.log('🦠 Displaying disease risks...');
    if (risksContainer) {
        risksContainer.innerHTML = '';
        
        if (Object.keys(data.risks).length === 0) {
            risksContainer.innerHTML = '<p>✓ No disease risks detected</p>';
        } else {
            for (const [disease, riskData] of Object.entries(data.risks)) {
                const riskLevel = riskData.risk_level.toLowerCase();
                const card = document.createElement('div');
                card.className = `risk-card ${riskLevel}`;
                card.innerHTML = `
                    <div class="risk-name">🦠 ${disease}</div>
                    <div class="risk-level ${riskLevel}">${riskData.risk_level}</div>
                    <div class="risk-score">${Math.round(riskData.risk_score)}/100</div>
                    <div class="management-tips">
                        <strong>Tips:</strong> ${riskData.management_tips}
                    </div>
                `;
                risksContainer.appendChild(card);
            }
        }
    }
    
    // Display confidence
    console.log('📊 Displaying confidence score...');
    const confidencePercent = Math.round(data.confidence.overall_score * 100);
    const scoreElement = document.getElementById('confidenceScore');
    if (scoreElement) scoreElement.textContent = confidencePercent;
    
    const levelElement = document.getElementById('confidenceLevel');
    if (levelElement) levelElement.textContent = data.confidence.confidence_level;
    
    const recElement = document.getElementById('confidenceRec');
    if (recElement) recElement.textContent = data.confidence.recommendation;
    
    // Display advisories
    console.log('📋 Displaying advisories...');
    if (advisoriesContainer) {
        advisoriesContainer.innerHTML = '';
        
        if (data.advisories.length === 0) {
            advisoriesContainer.innerHTML = '<p>No advisories at this time</p>';
        } else {
            data.advisories.forEach(advisory => {
                const card = document.createElement('div');
                card.className = 'advisory-card';
                card.innerHTML = `
                    <div class="advisory-title">📋 ${advisory.disease || advisory.title}</div>
                    <div class="advisory-text">${advisory.advisory || advisory.description}</div>
                `;
                advisoriesContainer.appendChild(card);
            });
        }
    }
    
    if (weatherDisplay) weatherDisplay.classList.remove('hidden');
    console.log('✓ Weather display updated');
}

async function exportWeatherReport() {
    const city = weatherCity.value;
    
    if (!city || !window.currentWeatherData) {
        showMessage('⚠️ Please load weather data first', 'error');
        return;
    }
    
    try {
        console.log(`📥 Exporting weather report for ${city}...`);
        
        const response = await fetch(`/api/export/${city}`);
        const report = await response.json();
        
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `weather-report-${city}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('✓ Report exported successfully');
        showMessage('✅ Report exported successfully', 'success');
    } catch (error) {
        console.error('❌ Error exporting report:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}

async function analyzeMultipleCities() {
    console.log('🌐 Analyzing multiple cities...');
    const lang = window.currentLanguage || 'en';
    showWeatherLoading(true);
    
    try {
        const response = await fetch(`/api/multi-city?lang=${lang}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cities: ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Kolkata', 'Bhubaneswar']
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`✓ Analyzed ${data.processed_cities} cities`);
            
            if (multiCityResults) {
                multiCityResults.innerHTML = '';
                data.results.forEach(result => {
                    const card = document.createElement('div');
                    card.className = 'city-result-card';
                    card.innerHTML = `
                        <h4>📍 ${result.city}</h4>
                        <div class="city-result-item">
                            <span>Temperature:</span>
                            <strong>${Math.round(result.weather.temperature)}°C</strong>
                        </div>
                        <div class="city-result-item">
                            <span>Humidity:</span>
                            <strong>${result.weather.humidity}%</strong>
                        </div>
                        <div class="city-result-item">
                            <span>Condition:</span>
                            <strong>${result.weather.condition}</strong>
                        </div>
                        <div class="city-result-item">
                            <span>Advisories:</span>
                            <strong>${result.advisories_count}</strong>
                        </div>
                        <div class="city-result-item">
                            <span>Confidence:</span>
                            <strong>${Math.round(result.confidence * 100)}%</strong>
                        </div>
                    `;
                    multiCityResults.appendChild(card);
                });
                
                multiCityResults.classList.remove('hidden');
                showMessage(`✅ Analyzed ${data.processed_cities} cities successfully`, 'success');
            }
        }
    } catch (error) {
        console.error('❌ Error analyzing cities:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        showWeatherLoading(false);
    }
}

function updateCombinedView(weatherData) {
    console.log('📊 Updating combined view with weather data...');
    
    if (combinedCity) combinedCity.textContent = weatherData.city;
    if (combinedTemp) combinedTemp.textContent = `${Math.round(weatherData.weather.temperature)}°C`;
    if (combinedCondition) combinedCondition.textContent = weatherData.weather.condition;
    
    // Update disease alerts
    if (combinedDiseaseAlerts) {
        combinedDiseaseAlerts.innerHTML = '';
        let highRiskCount = 0;
        
        for (const [disease, riskData] of Object.entries(weatherData.risks)) {
            if (riskData.risk_level === 'HIGH') {
                const item = document.createElement('div');
                item.style.marginBottom = '5px';
                item.innerHTML = `⚠️ <strong>${disease}:</strong> ${riskData.risk_level}`;
                combinedDiseaseAlerts.appendChild(item);
                highRiskCount++;
            }
        }
        
        if (highRiskCount === 0) {
            combinedDiseaseAlerts.innerHTML = '<p style="color: green;">✓ No high-risk diseases detected</p>';
        }
    }
    
    console.log('✓ Combined view updated');
}

// ==================== MANDI FUNCTIONS ====================

async function loadCropsAndMandis() {
    try {
        console.log('📥 Loading crops and mandis from server...');
        
        const cropsResponse = await fetch('/api/mandi/crops');
        const cropsData = await cropsResponse.json();
        console.log('Crops response:', cropsData);
        
        const mandisResponse = await fetch('/api/mandi/mandis');
        const mandisData = await mandisResponse.json();
        console.log('Mandis response:', mandisData);
        
        if (cropsData.success && cropsData.crops) {
            window.allCrops = cropsData.crops;
            console.log(`✅ ${cropsData.crops.length} crops loaded`);
            
            if (cropSelect) populateSelect(cropSelect, cropsData.crops);
            if (alertCropSelect) populateSelect(alertCropSelect, cropsData.crops);
            if (addCropSelect) populateSelect(addCropSelect, cropsData.crops);
        } else {
            console.error('❌ Failed to load crops:', cropsData.message);
        }
        
        if (mandisData.success && mandisData.mandis) {
            window.allMandis = mandisData.mandis;
            const odishaMandis = mandisData.mandis.filter(m => m.state === 'Odisha');
            console.log(`✅ ${mandisData.mandis.length} mandis loaded (${odishaMandis.length} from Odisha)`);
            
            if (addMandiSelect) populateSelect(addMandiSelect, mandisData.mandis);
        } else {
            console.error('❌ Failed to load mandis:', mandisData.message);
        }
    } catch (error) {
        console.error('❌ Error loading crops/mandis:', error);
        showMessage(`Error loading data: ${error.message}`, 'error');
    }
}

function populateSelect(selectElement, items) {
    if (!selectElement) {
        console.warn('⚠️ Select element is null');
        return;
    }
    
    // Clear existing options except first one
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        
        if (item.state) {
            option.textContent = `${item.name} (${item.state})`;
        } else {
            option.textContent = item.name || item.id;
        }
        
        selectElement.appendChild(option);
    });
    
    console.log(`✓ Populated select with ${items.length} items`);
}

async function loadSampleData() {
    console.log('📊 Loading sample mandi data...');
    showLoading(true);
    
    if (loadSampleBtn) {
        loadSampleBtn.disabled = true;
        loadSampleBtn.textContent = '⏳ Loading...';
    }
    
    try {
        const response = await fetch('/api/mandi/load-sample-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('📥 Sample data response:', data);
        
        if (data.success) {
            window.allMandis = data.mandis;
            window.allCrops = data.crops;
            
            console.log(`✅ Sample data loaded successfully!`);
            console.log(`   - ${data.count} price entries`);
            console.log(`   - ${data.mandis.length} mandis`);
            console.log(`   - ${data.crops.length} crops`);
            
            showMessage(`✅ ${data.message}`, 'success');
            
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            console.error('❌ Error loading sample data:', data.message);
            showMessage(`❌ Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
        
        if (loadSampleBtn) {
            loadSampleBtn.disabled = false;
            loadSampleBtn.textContent = '📊 Load Sample Data';
        }
    }
}

async function checkPrices() {
    const cropId = cropSelect ? cropSelect.value : null;
    const lang = window.currentLanguage || 'en';
    
    if (!cropId) {
        showMessage('⚠️ Please select a crop', 'error');
        return;
    }
    
    window.currentCropId = cropId;
    const cropName = window.allCrops.find(c => c.id === cropId)?.name || cropId;
    
    console.log(`🔍 Checking prices for: ${cropName} (${cropId})`);
    
    showLoading(true);
    hideMandiSections();
    
    try {
        const response = await fetch(`/api/mandi/comparison/${cropId}?lang=${lang}`);
        const data = await response.json();
        
        if (data.success) {
            displayComparison(data);
            displayBestWorst(data);
            displayMarketPrices(cropId);
            showMandiSections();
            
            console.log(`✅ Prices loaded for ${data.crop_name}`);
            console.log(`   - Average: ₹${data.statistics.average_price}`);
            console.log(`   - Range: ₹${data.statistics.min_price} - ₹${data.statistics.max_price}`);
            showMessage(`✅ Loaded prices for ${data.crop_name}`, 'success');
        } else {
            console.error('❌ Error:', data.message);
            showMessage(`❌ ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

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
    
    if (comparisonSection) comparisonSection.classList.remove('hidden');
    
    console.log('✓ Comparison displayed');
}

function displayBestWorst(data) {
    console.log('🏆 Displaying best and worst markets...');
    
    // Best Market
    if (data.best_market) {
        const elem = document.getElementById('bestMarketName');
        if (elem) elem.textContent = data.best_market.mandi_name || 'N/A';
        
        const loc = document.getElementById('bestMarketLocation');
        if (loc) loc.textContent = data.best_market.location || 'N/A';
        
        const price = document.getElementById('bestMarketPrice');
        if (price) price.textContent = `₹${data.best_market.price}`;
        
        const date = document.getElementById('bestMarketDate');
        if (date) date.textContent = data.best_market.timestamp ? 
            new Date(data.best_market.timestamp).toLocaleDateString('en-IN') : 'N/A';
    }
    
    // Worst Market
    if (data.worst_market) {
        const elem = document.getElementById('worstMarketName');
        if (elem) elem.textContent = data.worst_market.mandi_name || 'N/A';
        
        const loc = document.getElementById('worstMarketLocation');
        if (loc) loc.textContent = data.worst_market.location || 'N/A';
        
        const price = document.getElementById('worstMarketPrice');
        if (price) price.textContent = `₹${data.worst_market.price}`;
        
        const date = document.getElementById('worstMarketDate');
        if (date) date.textContent = data.worst_market.timestamp ? 
            new Date(data.worst_market.timestamp).toLocaleDateString('en-IN') : 'N/A';
    }
    
    if (bestWorstSection) bestWorstSection.classList.remove('hidden');
    
    console.log('✓ Best/Worst markets displayed');
}

async function displayMarketPrices(cropId) {
    try {
        console.log(`📊 Fetching market prices for ${cropId}...`);
        
        const response = await fetch(`/api/mandi/prices/${cropId}`);
        const data = await response.json();
        
        if (data.success) {
            const pricesGrid = document.getElementById('pricesGrid');
            
            if (!pricesGrid) {
                console.error('❌ pricesGrid element not found');
                return;
            }
            
            pricesGrid.innerHTML = '';
            
            // Sort prices by mandi state (Odisha first)
            const sortedPrices = data.prices.sort((a, b) => {
                const aIsOdisha = window.allMandis.find(m => m.id === a.mandi_id)?.state === 'Odisha' ? 0 : 1;
                const bIsOdisha = window.allMandis.find(m => m.id === b.mandi_id)?.state === 'Odisha' ? 0 : 1;
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
            
            if (marketsSection) marketsSection.classList.remove('hidden');
            
            console.log(`✓ Displayed ${data.count} market prices`);
        } else {
            console.error('❌ Failed to fetch market prices:', data.message);
        }
    } catch (error) {
        console.error('❌ Error displaying market prices:', error);
    }
}

async function setAlert() {
    const cropId = alertCropSelect ? alertCropSelect.value : null;
    const targetPriceInput = document.getElementById('targetPrice');
    const targetPrice = targetPriceInput ? parseFloat(targetPriceInput.value) : NaN;
    const alertTypeSelect = document.getElementById('alertType');
    const alertType = alertTypeSelect ? alertTypeSelect.value : 'above';
    
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
        
        if (data.success) {
            console.log('✅ Alert set successfully');
            showMessage(`✅ Price alert set for ${cropName}`, 'success');
            if (targetPriceInput) targetPriceInput.value = '';
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

async function loadAlerts() {
    try {
        console.log('📢 Loading active alerts...');
        
        const response = await fetch('/api/mandi/alerts');
        const data = await response.json();
        
        if (data.success && data.alerts && data.alerts.length > 0) {
            console.log(`✅ ${data.alerts.length} active alerts loaded`);
            displayAlerts(data.alerts);
            
            if (activeAlertsSection) activeAlertsSection.classList.remove('hidden');
            if (noAlerts) noAlerts.classList.add('hidden');
            
            updateCombinedAlerts(data.alerts);
        } else {
            console.log('📋 No active alerts');
            
            if (activeAlertsSection) activeAlertsSection.classList.add('hidden');
            if (noAlerts) noAlerts.classList.remove('hidden');
            
            if (combinedPriceAlerts) combinedPriceAlerts.innerHTML = '<p>No price alerts set</p>';
        }
    } catch (error) {
        console.error('❌ Error loading alerts:', error);
    }
}

function displayAlerts(alerts) {
    console.log(`📢 Displaying ${alerts.length} alerts...`);
    
    if (!alertsList) {
        console.warn('⚠️ alertsList element not found');
        return;
    }
    
    alertsList.innerHTML = '';
    
    if (noAlerts) noAlerts.classList.add('hidden');
    
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

function updateCombinedAlerts(alerts) {
    console.log('📢 Updating combined view alerts...');
    
    if (!combinedPriceAlerts) return;
    
    combinedPriceAlerts.innerHTML = '';
    
    if (alerts.length === 0) {
        combinedPriceAlerts.innerHTML = '<p>No price alerts set</p>';
        return;
    }
    
    alerts.forEach(alert => {
        const cropName = window.allCrops.find(c => c.id === alert.crop_id)?.name || alert.crop_id;
        const item = document.createElement('div');
        item.style.marginBottom = '5px';
        item.innerHTML = `📢 <strong>${cropName}:</strong> Price ${alert.alert_type} ₹${alert.target_price}`;
        combinedPriceAlerts.appendChild(item);
    });
}

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

async function addPrice() {
    const cropId = addCropSelect ? addCropSelect.value : null;
    const mandiId = addMandiSelect ? addMandiSelect.value : null;
    const priceInput = document.getElementById('addPriceInput');
    const price = priceInput ? parseFloat(priceInput.value) : NaN;
    
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
        
        if (data.success) {
            console.log('✅ Price added successfully');
            showMessage(`✅ Price added: ${cropName} @ ${mandiName} = ₹${price}`, 'success');
            if (priceInput) priceInput.value = '';
            
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

// ==================== SYSTEM HEALTH CHECK ====================

async function checkSystemHealth() {
    try {
        console.log('🔍 Checking system health...');
        
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.success) {
            console.log('✓ System is healthy');
            console.log(`  - Mandis: ${data.data.mandis}`);
            console.log(`  - Crops: ${data.data.crops}`);
            console.log(`  - Languages: ${data.data.languages}`);
            updateStatusIndicator(true);
        } else {
            console.warn('⚠️ System health check failed');
            updateStatusIndicator(false);
        }
    } catch (error) {
        console.error('❌ System health check error:', error);
        updateStatusIndicator(false);
    }
}

function updateStatusIndicator(isHealthy) {
    const statusDot = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (statusDot && statusText) {
        if (isHealthy) {
            statusDot.style.background = '#4ade80';
            statusText.textContent = 'Online';
        } else {
            statusDot.style.background = '#f87171';
            statusText.textContent = 'Offline';
        }
    }
}

// ==================== HELPER FUNCTIONS ====================

function showWeatherLoading(show) {
    if (weatherLoading) {
        weatherLoading.classList.toggle('hidden', !show);
    }
}

function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.classList.toggle('hidden', !show);
    }
}

function hideMandiSections() {
    if (comparisonSection) comparisonSection.classList.add('hidden');
    if (bestWorstSection) bestWorstSection.classList.add('hidden');
    if (marketsSection) marketsSection.classList.add('hidden');
}

function showMandiSections() {
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
        top: 80px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border: 2px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
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
    console.log('👋 Leaving dashboard - session ended');
});

// ==================== STARTUP LOG ====================

console.log('\n═══════════════════════════════════════════════════════');
console.log('🌾 LEAFLENS-AI COMBINED DASHBOARD');
console.log('═══════════════════════════════════════════════════════');
console.log('✓ Script loaded successfully');
console.log('✓ Waiting for DOM ready event...');
console.log('✓ Weather + Mandi modules active');
console.log('✓ Multi-language support enabled');
console.log('✓ Ready for user interaction');
console.log('═══════════════════════════════════════════════════════\n');
/* =========================================================
   APPENDED SAFE OVERRIDES (DO NOT MODIFY EXISTING CODE)
   This section fixes:
   - Combined View not working
   - Mandi Prices issues
   - Weather fallback
========================================================= */

// ==================== SAFE WEATHER FALLBACK ====================

(function () {

    // Prevent duplicate override
    if (window.__weatherOverrideApplied) return;
    window.__weatherOverrideApplied = true;

    const DEFAULT_CITIES = [
        "Delhi",
        "Mumbai",
        "Kolkata",
        "Chennai",
        "Bangalore",
        "Hyderabad",
        "Pune",
        "Ahmedabad"
    ];

    function createCitySelector() {
        const container = document.getElementById("weather-container");
        if (!container) return;

        const div = document.createElement("div");
        div.style.marginTop = "10px";

        div.innerHTML = `
            <p>Select your city:</p>
            <select id="fallback-city-select">
                ${DEFAULT_CITIES.map(c => `<option value="${c}">${c}</option>`).join("")}
            </select>
            <button onclick="__manualWeatherFetch()">Get Weather</button>
        `;

        container.appendChild(div);
    }

    window.__manualWeatherFetch = async function () {
        const select = document.getElementById("fallback-city-select");
        if (!select) return;
        const city = select.value;
        if (typeof fetchWeather === "function") {
            fetchWeather(city);
        }
    };

    // Override detectLocation safely
    const originalDetectLocation = window.detectLocation;

    window.detectLocation = async function () {
        try {
            if (originalDetectLocation) {
                await originalDetectLocation();
            }
        } catch (err) {
            console.warn("Location failed, showing fallback.");
            createCitySelector();
        }
    };

})();


// ==================== FIX: COMBINED VIEW ====================

(function () {

    if (window.__combinedFixApplied) return;
    window.__combinedFixApplied = true;

    const originalCombinedView = window.loadCombinedView;

    window.loadCombinedView = async function () {
        try {
            if (originalCombinedView) {
                await originalCombinedView();
            }
        } catch (error) {
            console.error("Combined view error:", error);
            alert("Unable to load combined data. Please try again.");
        }
    };

})();


// ==================== FIX: MANDI PRICE LOAD SAFETY ====================

(function () {

    if (window.__mandiFixApplied) return;
    window.__mandiFixApplied = true;

    const originalMandiFunction = window.loadMandiPrices;

    window.loadMandiPrices = async function (...args) {
        try {
            if (originalMandiFunction) {
                await originalMandiFunction(...args);
            }
        } catch (error) {
            console.error("Mandi price error:", error);
            alert("Unable to fetch mandi prices.");
        }
    };

})();


// ==================== AUTO INIT SAFETY ====================

document.addEventListener("DOMContentLoaded", function () {
    if (typeof detectLocation === "function") {
        detectLocation();
    }
});