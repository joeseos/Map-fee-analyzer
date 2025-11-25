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

// Color coding for fees
function getFeeColor(fee, avgFee) {
    if (fee > avgFee * 1.2) return '#e74c3c'; // High - red
    if (fee < avgFee * 0.8) return '#27ae60'; // Low - green
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
                    <div class="fee-info">
                        <p><strong>Installation Fee:</strong> ${location.installation_fee.toLocaleString()} kr</p>
                        <p><strong>Quarterly Fee:</strong> ${location.quarterly_fee.toLocaleString()} kr</p>
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

// Initialize application
async function init() {
    await loadCities();
    await loadLocations();
    await loadComparison();
}

// Start the app
init();
