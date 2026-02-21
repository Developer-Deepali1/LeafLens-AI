// DOM Elements
const cityInput = document.getElementById('cityInput');
const detectBtn = document.getElementById('detectBtn');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherSection = document.getElementById('weatherSection');
const riskSection = document.getElementById('riskSection');
const confidenceSection = document.getElementById('confidenceSection');
const advisoriesSection = document.getElementById('advisoriesSection');
const exportSection = document.getElementById('exportSection');
const multiCityBtn = document.getElementById('multiCityBtn');
const locationInfo = document.getElementById('locationInfo');

// Global variable to store current report data
window.currentReportData = null;

console.log('✓ Script loaded successfully');

// Event Listeners
detectBtn.addEventListener('click', detectLocation);
searchBtn.addEventListener('click', () => searchWeather());
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});
multiCityBtn.addEventListener('click', analyzeMultipleCities);

// Detect Location
async function detectLocation() {
    detectBtn.disabled = true;
    detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
    
    try {
        const response = await fetch('/api/detect-location');
        const data = await response.json();
        
        if (data.success) {
            cityInput.value = data.city;
            showLocationInfo(`✓ Detected: ${data.city}, ${data.region}, ${data.country}`);
            await searchWeather();
        } else {
            showLocationInfo('✗ Location detection failed. Please enter city name manually.');
        }
    } catch (error) {
        console.error('Error:', error);
        showLocationInfo('✗ Could not detect location. Please enter manually.');
    } finally {
        detectBtn.disabled = false;
        detectBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Auto Detect';
    }
}

// Show Location Info
function showLocationInfo(message) {
    locationInfo.textContent = message;
    locationInfo.classList.remove('hidden');
}

// Search Weather
async function searchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }
    
    await fetchWeatherData(city);
}

// Fetch Weather Data
async function fetchWeatherData(city) {
    showLoading(true);
    hideAllSections();
    
    console.log('🔄 Fetching weather for:', city);
    
    try {
        const url = `/api/weather/${city}`;
        console.log('📡 API URL:', url);
        
        const response = await fetch(url);
        console.log('📊 Response status:', response.status);
        
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (data.success) {
            console.log('✓ Success! Displaying data...');
            displayWeatherData(data);
            displayRisks(data);
            displayConfidence(data);
            displayAdvisories(data);
            showAllSections();
        } else {
            console.error('❌ Error from API:', data.message);
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        alert('Failed to fetch weather data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Display Weather Data
function displayWeatherData(data) {
    document.getElementById('weatherCity').textContent = `${data.city} - Weather Report`;
    document.getElementById('temp').textContent = `${data.weather.temperature}°C`;
    document.getElementById('humidity').textContent = `${data.weather.humidity}%`;
    document.getElementById('rainfall').textContent = `${data.weather.rainfall} mm`;
    document.getElementById('windSpeed').textContent = `${data.weather.wind_speed} m/s`;
    document.getElementById('clouds').textContent = `${data.weather.clouds}%`;
    document.getElementById('condition').textContent = data.weather.condition;
}

// Display Risk Assessment
function displayRisks(data) {
    const riskContainer = document.getElementById('riskContainer');
    riskContainer.innerHTML = '';
    
    for (const [disease, riskData] of Object.entries(data.risks)) {
        const riskLevel = riskData.risk_level.toLowerCase();
        const levelClass = riskLevel.includes('very high') ? 'very-high' : 
                          riskLevel.includes('high') ? 'high' :
                          riskLevel.includes('moderate') ? 'moderate' : 'low';
        
        const card = document.createElement('div');
        card.className = 'risk-card';
        card.innerHTML = `
            <h3>${disease.replace(/_/g, ' ')}</h3>
            <div class="risk-level">
                <span class="risk-level-badge risk-level-${levelClass}">${riskData.risk_level}</span>
            </div>
            <div class="risk-score">
                <div class="risk-score-label">
                    <span>Risk Score</span>
                    <span>${riskData.risk_score}/100</span>
                </div>
                <div class="risk-score-bar">
                    <div class="risk-score-fill" style="width: ${riskData.risk_score}%"></div>
                </div>
            </div>
            <div class="management-tips">
                <h4>Management Tips:</h4>
                <ul>
                    ${riskData.management_tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
        riskContainer.appendChild(card);
    }
}

// Display Confidence Score
function displayConfidence(data) {
    const conf = data.confidence;
    
    document.getElementById('confidenceValue').textContent = (conf.overall_score * 100).toFixed(1) + '%';
    document.getElementById('confidenceLevel').textContent = conf.confidence_level;
    document.getElementById('modelConf').textContent = (conf.components.model_confidence * 100).toFixed(1) + '%';
    document.getElementById('apiConf').textContent = (conf.components.api_reliability * 100).toFixed(1) + '%';
    document.getElementById('historyConf').textContent = (conf.components.historical_accuracy * 100).toFixed(1) + '%';
    document.getElementById('freshnessConf').textContent = (conf.components.data_freshness_score * 100).toFixed(1) + '%';
    document.getElementById('recommendation').textContent = conf.recommendation;
    
    // Update circle progress
    const circumference = 141;
    const offset = circumference - (conf.overall_score * circumference);
    document.getElementById('confidenceCircle').style.strokeDashoffset = offset;
}

// Display Advisories
function displayAdvisories(data) {
    const advisoriesContainer = document.getElementById('advisoriesContainer');
    const noAdvisories = document.getElementById('noAdvisories');
    const exportBtn = document.getElementById('exportBtn');
    const exportTextBtn = document.getElementById('exportTextBtn');
    
    advisoriesContainer.innerHTML = '';
    
    // Store data globally for export functions
    window.currentReportData = data;
    
    if (data.advisories && data.advisories.length > 0) {
        noAdvisories.classList.add('hidden');
        
        data.advisories.forEach(advisory => {
            const severityClass = advisory.severity.toLowerCase().split(' ')[0];
            
            const card = document.createElement('div');
            card.className = `advisory-card ${severityClass}`;
            card.innerHTML = `
                <div class="disease-name">${advisory.disease.replace(/_/g, ' ')}</div>
                <span class="severity ${severityClass}">${advisory.severity}</span>
                <div class="confidence">Confidence: ${(advisory.confidence * 100).toFixed(1)}%</div>
                <div class="message">${advisory.message}</div>
                <div class="recommendations">
                    <h4>Recommended Actions:</h4>
                    <ul>
                        ${advisory.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
            advisoriesContainer.appendChild(card);
        });
        
    } else {
        advisoriesContainer.innerHTML = '';
        noAdvisories.classList.remove('hidden');
    }
    
    // Setup export button click handlers
    if (exportBtn) {
        exportBtn.onclick = function(e) {
            e.preventDefault();
            console.log('📥 Exporting as JSON...');
            if (window.currentReportData) {
                exportReport(window.currentReportData);
            } else {
                alert('No data to export');
            }
        };
    }
    
    if (exportTextBtn) {
        exportTextBtn.onclick = function(e) {
            e.preventDefault();
            console.log('📥 Exporting as Text...');
            if (window.currentReportData) {
                exportReportAsText(window.currentReportData);
            } else {
                alert('No data to export');
            }
        };
    }
}

// Export Report as JSON
function exportReport(data) {
    try {
        console.log('🔄 Starting JSON export...');
        const city = data.city || 'report';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create report object
        const report = {
            title: 'LeafLens-AI Weather Alert Report',
            city: data.city,
            timestamp: data.timestamp,
            weather: data.weather,
            risks: data.risks,
            confidence: data.confidence,
            advisories: data.advisories,
            generated_at: new Date().toLocaleString()
        };
        
        // Convert to JSON string
        const reportJson = JSON.stringify(report, null, 2);
        
        // Create blob
        const blob = new Blob([reportJson], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `LeafLens_Report_${city}_${timestamp}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log('✓ JSON Report downloaded successfully');
        alert('✓ JSON Report downloaded successfully!');
        
    } catch (error) {
        console.error('❌ Download error:', error);
        alert('Failed to download report: ' + error.message);
    }
}

// Export Report as Text
function exportReportAsText(data) {
    try {
        console.log('🔄 Starting Text export...');
        const city = data.city || 'report';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        let textContent = `
╔════════════════════════════════════════════════════════════════╗
║           LEAFLENS-AI WEATHER ALERT REPORT                    ║
╚════════════════════════════════════════════════════════════════╝

📍 LOCATION: ${data.city}
⏰ GENERATED: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════════
🌤️  WEATHER DATA
═══════════════════════════════════════════════════════════════════

Temperature: ${data.weather.temperature}°C
Humidity: ${data.weather.humidity}%
Rainfall: ${data.weather.rainfall} mm
Wind Speed: ${data.weather.wind_speed} m/s
Cloud Cover: ${data.weather.clouds}%
Condition: ${data.weather.condition}
Pressure: ${data.weather.pressure} hPa

═════════════════���═════════════════════════════════════════════════
🦠 DISEASE RISK ASSESSMENT
═══════════════════════════════════════════════════════════════════
`;

        for (const [disease, risk] of Object.entries(data.risks)) {
            textContent += `
${disease.toUpperCase().replace(/_/g, ' ')}
  Risk Level: ${risk.risk_level}
  Risk Score: ${risk.risk_score}/100
  Management Tips:
${risk.management_tips.map(tip => `    • ${tip}`).join('\n')}
`;
        }

        textContent += `
═══════════════════════════════════════════════════════════════════
📊 CONFIDENCE ASSESSMENT
═══════════════════════════════════════════════════════════════════

Overall Score: ${(data.confidence.overall_score * 100).toFixed(1)}%
Level: ${data.confidence.confidence_level}
Recommendation: ${data.confidence.recommendation}

Components:
  • Model Confidence: ${(data.confidence.components.model_confidence * 100).toFixed(1)}%
  • API Reliability: ${(data.confidence.components.api_reliability * 100).toFixed(1)}%
  • Historical Accuracy: ${(data.confidence.components.historical_accuracy * 100).toFixed(1)}%
  • Data Freshness: ${(data.confidence.components.data_freshness_score * 100).toFixed(1)}%

═══════════════��═══════════════════════════════════════════════════
⚠️  DISEASE ADVISORIES
═══════════════════════════════════════════════════════════════════
`;

        if (data.advisories.length > 0) {
            data.advisories.forEach((adv, index) => {
                textContent += `
ADVISORY ${index + 1}: ${adv.disease.toUpperCase().replace(/_/g, ' ')}
Severity: ${adv.severity}
Confidence: ${(adv.confidence * 100).toFixed(1)}%
Message: ${adv.message}

Recommendations:
${adv.recommendations.map(rec => `  • ${rec}`).join('\n')}
`;
            });
        } else {
            textContent += `
✓ No high-risk advisories.
✓ Current weather conditions are favorable for crops!
`;
        }

        textContent += `
═══════════════════════════════════════════════════════════════════
© 2026 LeafLens-AI | Smart Crop Disease Prediction System
═══════════════════════════════════════════════════════════════════
`;

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `LeafLens_Report_${city}_${timestamp}.txt`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✓ Text Report downloaded successfully');
        alert('✓ Text Report downloaded successfully!');
        
    } catch (error) {
        console.error('❌ Download error:', error);
        alert('Failed to download report: ' + error.message);
    }
}

// Analyze Multiple Cities
async function analyzeMultipleCities() {
    console.log('🔄 Starting multi-city analysis...');
    showLoading(true);
    hideAllSections();
    
    try {
        const response = await fetch('/api/multi-city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cities: null })
        });
        
        console.log('📊 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✓ Multi-city data received:', data);
        
        if (data.success) {
            displayMultiCityResults(data.results);
            showMultiCitySection();
        } else {
            alert('Error: ' + (data.message || 'Failed to analyze cities'));
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Failed to analyze multiple cities: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Show Multi-City Section
function showMultiCitySection() {
    const multiCityResults = document.getElementById('multiCityResults');
    if (multiCityResults) {
        multiCityResults.classList.remove('hidden');
        // Scroll to results
        setTimeout(() => {
            multiCityResults.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }
}

// Display Multi-City Results
function displayMultiCityResults(results) {
    console.log('📍 Displaying results for', results.length, 'cities');
    
    const container = document.getElementById('multiCityResults');
    container.innerHTML = '';
    
    if (!results || results.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">No results available</p>';
        return;
    }
    
    results.forEach((result, index) => {
        console.log(`City ${index + 1}:`, result.city);
        
        const card = document.createElement('div');
        card.className = 'multi-city-card';
        
        const temp = result.weather.temperature || 'N/A';
        const condition = result.weather.condition || 'N/A';
        const alerts = result.advisories_count || 0;
        const confidence = (result.confidence * 100).toFixed(1);
        
        card.innerHTML = `
            <div class="city-name">${result.city}</div>
            <div class="temp">${temp}°C</div>
            <div class="condition">${condition}</div>
            <div class="alerts-count">Alerts: ${alerts}</div>
            <div class="confidence-badge">Confidence: ${confidence}%</div>
        `;
        
        card.style.cursor = 'pointer';
        card.onclick = () => {
            console.log('Clicked city:', result.city);
            cityInput.value = result.city;
            fetchWeatherData(result.city);
        };
        
        container.appendChild(card);
    });
    
    console.log('✓ Displayed', results.length, 'city cards');
}

// Helper Functions
function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
}

function hideAllSections() {
    weatherSection.classList.add('hidden');
    riskSection.classList.add('hidden');
    confidenceSection.classList.add('hidden');
    advisoriesSection.classList.add('hidden');
    exportSection.classList.add('hidden');
}

function showAllSections() {
    weatherSection.classList.remove('hidden');
    riskSection.classList.remove('hidden');
    confidenceSection.classList.remove('hidden');
    advisoriesSection.classList.remove('hidden');
    exportSection.classList.remove('hidden');
}

console.log('✓ All functions defined successfully - Ready to use!');