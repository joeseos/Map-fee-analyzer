// Initialize map centered on Sweden
const map = L.map('map').setView([62.0, 15.0], 5);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Store markers
let markers = [];
let allLocations = [];
let allCities = [];

// Settings - color thresholds (as decimals, e.g., 0.20 = 20%)
let settings = {
    highThreshold: 0.20,  // 20% above average
    lowThreshold: 0.20    // 20% below average
};

// Load settings from localStorage if available
function loadSettings() {
    const saved = localStorage.getItem('mapFeeSettings');
    if (saved) {
        settings = JSON.parse(saved);
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('mapFeeSettings', JSON.stringify(settings));
}

// Color coding for fees
function getFeeColor(fee, avgFee) {
    if (fee > avgFee * (1 + settings.highThreshold)) return '#e74c3c'; // High - red
    if (fee < avgFee * (1 - settings.lowThreshold)) return '#27ae60'; // Low - green
    return '#f39c12'; // Medium - orange
}

// Create custom marker icon
function createMarkerIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
}

// Load all locations
async function loadLocations(city = null) {
    try {
        const url = city ? `/api/locations?city=${encodeURIComponent(city)}` : '/api/locations';
        const response = await fetch(url);
        const locations = await response.json();
        
        allLocations = locations;
        displayLocations(locations);
        
        // Fit map to markers
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

// Display locations on map
function displayLocations(locations) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Calculate average fees for color coding
    const avgInstallation = locations.reduce((sum, l) => sum + l.installation_fee, 0) / locations.length;
    const avgQuarterly = locations.reduce((sum, l) => sum + l.quarterly_fee, 0) / locations.length;
    
    // Add markers for each location
    locations.forEach(location => {
        const color = getFeeColor(location.quarterly_fee, avgQuarterly);
        const icon = createMarkerIcon(color);
        
const marker = L.marker([location.latitude, location.longitude], { icon })
            .addTo(map)
            .bindPopup(`
                <div class="popup-content">
                    <h3>${location.name || 'N/A'}</h3>
                    <p><strong>City:</strong> ${location.city}</p>
                    <p><strong>Address:</strong> ${location.street} ${location.streetno}</p>
                    <p><strong>Zip:</strong> ${location.zip}</p>
                    ${location.supplier ? `<p><strong>Supplier:</strong> ${location.supplier}</p>` : ''}
                    ${location.accesstype ? `<p><strong>Access Type:</strong> ${location.accesstype}</p>` : ''}
                    <div class="fee-info">
                        <p><strong>Installation Fee:</strong> ${location.installation_fee.toLocaleString()} kr</p>
                        <p><strong>Monthly Fee:</strong> ${location.quarterly_fee.toLocaleString()} kr</p>
                    </div>
                </div>
            `);
        
        markers.push(marker);
    });
}

// Load cities for dropdown
async function loadCities() {
    try {
        const response = await fetch('/api/cities');
        const cities = await response.json();
        
        allCities = cities;
        
        const select = document.getElementById('city-select');
        select.innerHTML = '<option value="">All Cities</option>';
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.city;
            option.textContent = `${city.city} (${city.count} locations)`;
            select.appendChild(option);
        });
        
        // Update stats with overall data
        updateStats(null);
    } catch (error) {
        console.error('Error loading cities:', error);
    }
}

// Update statistics display
function updateStats(city) {
    if (city) {
        // Show city-specific stats
        fetch(`/api/stats/${encodeURIComponent(city)}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('avg-installation').textContent = 
                    `${data.avg_installation_fee.toLocaleString()} kr`;
                document.getElementById('avg-quarterly').textContent = 
                    `${data.avg_quarterly_fee.toLocaleString()} kr`;
                document.getElementById('location-count').textContent = 
                    data.count.toLocaleString();
            });
    } else {
        // Show overall stats
        if (allCities.length > 0) {
            const totalLocations = allCities.reduce((sum, c) => sum + c.count, 0);
            const avgInstallation = allCities.reduce((sum, c) => sum + (c.avg_installation_fee * c.count), 0) / totalLocations;
            const avgQuarterly = allCities.reduce((sum, c) => sum + (c.avg_quarterly_fee * c.count), 0) / totalLocations;
            
            document.getElementById('avg-installation').textContent = 
                `${avgInstallation.toFixed(0).toLocaleString()} kr`;
            document.getElementById('avg-quarterly').textContent = 
                `${avgQuarterly.toFixed(0).toLocaleString()} kr`;
            document.getElementById('location-count').textContent = 
                totalLocations.toLocaleString();
        }
    }
}

// Load comparison table
async function loadComparison() {
    try {
        const response = await fetch('/api/comparison');
        const comparison = await response.json();
        
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>City</th>
                    <th>Avg Installation Fee</th>
                    <th>Avg Quarterly Fee</th>
                    <th>Annual Cost (4 quarters)</th>
                </tr>
            </thead>
            <tbody>
                ${comparison.map(city => {
                    const annualCost = city.avg_installation_fee + (city.avg_quarterly_fee * 4);
                    return `
                        <tr>
                            <td><strong>${city.city}</strong></td>
                            <td>${city.avg_installation_fee.toLocaleString()} kr</td>
                            <td>${city.avg_quarterly_fee.toLocaleString()} kr</td>
                            <td><strong>${annualCost.toFixed(0).toLocaleString()} kr</strong></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        
        const container = document.getElementById('comparison-table');
        container.innerHTML = '';
        container.appendChild(table);
    } catch (error) {
        console.error('Error loading comparison:', error);
    }
}

// Handle city selection
document.getElementById('city-select').addEventListener('change', (e) => {
    const city = e.target.value;
    if (city) {
        loadLocations(city);
        updateStats(city);
    } else {
        loadLocations();
        updateStats(null);
    }
});

// File upload controls
const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const currentDataInfo = document.getElementById('current-data-info');

// Load current data info
async function loadCurrentDataInfo() {
    try {
        const response = await fetch('/api/data-info');
        const info = await response.json();
        
        currentDataInfo.innerHTML = `
            <strong>Current Data:</strong><br>
            ${info.total_locations} locations across ${info.total_cities} cities<br>
            Last updated: ${new Date(info.last_updated).toLocaleString()}
        `;
        currentDataInfo.classList.add('show');
    } catch (error) {
        console.error('Error loading data info:', error);
    }
}

// Handle file upload
async function uploadFile(file) {
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
        uploadStatus.className = 'upload-status error';
        uploadStatus.textContent = '❌ Please upload a CSV file';
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    uploadStatus.className = 'upload-status loading';
    uploadStatus.textContent = '⏳ Uploading and processing...';
    
    try {
        const response = await fetch('/api/upload-data', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            uploadStatus.className = 'upload-status success';
            uploadStatus.textContent = `✅ Success! Imported ${result.records_imported} records from ${result.cities_found} cities`;
            
            // Reload the data on the map
            await loadCities();
            await loadLocations();
            await loadComparison();
            await loadCurrentDataInfo();
            
            // Clear after 5 seconds
            setTimeout(() => {
                uploadStatus.style.display = 'none';
            }, 5000);
        } else {
            uploadStatus.className = 'upload-status error';
            uploadStatus.textContent = `❌ Error: ${result.detail || 'Failed to upload file'}`;
        }
    } catch (error) {
        uploadStatus.className = 'upload-status error';
        uploadStatus.textContent = `❌ Error: ${error.message}`;
    }
}

// Click to upload
uploadBox.addEventListener('click', () => {
    fileInput.click();
});

// File selected
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
});

// Drag and drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('drag-over');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        uploadFile(file);
    }
});

// Settings Modal Controls
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const highThresholdSlider = document.getElementById('high-threshold');
const lowThresholdSlider = document.getElementById('low-threshold');
const highThresholdValue = document.getElementById('high-threshold-value');
const lowThresholdValue = document.getElementById('low-threshold-value');
const applySettings = document.getElementById('apply-settings');
const resetSettings = document.getElementById('reset-settings');

// Update preview values
function updatePreview() {
    const high = parseInt(highThresholdSlider.value);
    const low = parseInt(lowThresholdSlider.value);
    
    document.getElementById('preview-high').textContent = `${100 + high}%`;
    document.getElementById('preview-high-2').textContent = `${100 + high}%`;
    document.getElementById('preview-low').textContent = `${100 - low}%`;
    document.getElementById('preview-low-2').textContent = `${100 - low}%`;
}

// Open settings modal
settingsBtn.addEventListener('click', () => {
    // Set sliders to current settings
    highThresholdSlider.value = settings.highThreshold * 100;
    lowThresholdSlider.value = settings.lowThreshold * 100;
    highThresholdValue.textContent = `${settings.highThreshold * 100}%`;
    lowThresholdValue.textContent = `${settings.lowThreshold * 100}%`;
    updatePreview();
    
    // Load current data info
    loadCurrentDataInfo();
    
    settingsModal.classList.add('show');
});

// Close settings modal
closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
    }
});

// Update slider value displays
highThresholdSlider.addEventListener('input', (e) => {
    highThresholdValue.textContent = `${e.target.value}%`;
    updatePreview();
});

lowThresholdSlider.addEventListener('input', (e) => {
    lowThresholdValue.textContent = `${e.target.value}%`;
    updatePreview();
});

// Apply settings
applySettings.addEventListener('click', () => {
    settings.highThreshold = parseInt(highThresholdSlider.value) / 100;
    settings.lowThreshold = parseInt(lowThresholdSlider.value) / 100;
    saveSettings();
    
    // Refresh the map with new colors
    const currentCity = document.getElementById('city-select').value;
    if (currentCity) {
        loadLocations(currentCity);
    } else {
        loadLocations();
    }
    
    settingsModal.classList.remove('show');
});

// Reset to defaults
resetSettings.addEventListener('click', () => {
    highThresholdSlider.value = 20;
    lowThresholdSlider.value = 20;
    highThresholdValue.textContent = '20%';
    lowThresholdValue.textContent = '20%';
    updatePreview();
});

// Initialize application
async function init() {
    loadSettings();
    await loadCities();
    await loadLocations();
    await loadComparison();
}

// Start the app
init();
