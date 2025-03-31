var OLA_API_KEY = "W7VgTCXI2lsO0CXnRX6Trh3pUlHZXJuW6izkx25d";

var myMap, olaMaps;
var startMarker = null, endMarker = null;
var startCoords = null, endCoords = null;

frappe.pages['driver-map'].on_page_load = function (wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Driver Map',
        single_column: true
    });
    $(wrapper).find('.layout-main-section').append(`
        <h2>Ola Maps - Autocomplete & Routing</h2>
        <div class="search-container">
            <input type="text" id="start-location" placeholder="Enter start location">
            <div id="start-autocomplete" class="autocomplete-list"></div>
        </div>
        <div class="search-container">
            <input type="text" id="end-location" placeholder="Enter destination">
            <div id="end-autocomplete" class="autocomplete-list"></div>
        </div>
        <button id="set-route-btn">Set Route</button>
        <div id="map" style="width: 100%; height: 500px; margin-top: 10px;"></div>
    `);
    $.getScript("https://www.unpkg.com/olamaps-web-sdk@latest/dist/olamaps-web-sdk.umd.js", function () {
        initializeMap();
    });
};

function initializeMap() {
    if (!OLA_API_KEY) {
        console.error("Ola API Key is missing!");
        alert("Ola API Key is required for the map to function.");
        return;
    }
    olaMaps = new OlaMaps({ apiKey: OLA_API_KEY });
    myMap = olaMaps.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: 'map',
        center: [77.616484, 12.931423], // Default Bangalore
        zoom: 12,
    });
    setupAutocomplete("start-location", "start-autocomplete", (coords) => startCoords = coords);
    setupAutocomplete("end-location", "end-autocomplete", (coords) => endCoords = coords);
    document.getElementById("set-route-btn").addEventListener("click", drawRoute);
}

function setupAutocomplete(inputId, listId, setCoords) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    let debounceTimeout;
    input.addEventListener("input", function () {
        clearTimeout(debounceTimeout);
        const query = this.value.trim();
        list.innerHTML = "";
        if (query.length < 3) {
            list.style.display = "none";
            return;
        }

        debounceTimeout = setTimeout(async () => {
            const suggestions = await fetchAutocomplete(query);
            if (!suggestions.length) {
                list.style.display = "none";
                return;
            }
            suggestions.forEach(place => {
                const div = document.createElement("div");
                div.classList.add("suggestion");
                div.textContent = place.description;
                div.dataset.place_id = place.place_id;

                div.addEventListener("click", async function () {
                    input.value = this.textContent;
                    list.style.display = "none";
                    
                    const details = await fetchPlaceDetails(this.dataset.place_id);
                    if (details) {
                        setCoords({ lat: details.lat, lng: details.lng });
                        setMarker(details.lat, details.lng, inputId);
                    }
                });
                list.appendChild(div);
            });
            list.style.display = "block";
        }, 300);
    });

    document.addEventListener("click", function (event) {
        if (!input.contains(event.target) && !list.contains(event.target)) {
            list.style.display = "none";
        }
    });
}

async function fetchAutocomplete(query) {
    try {
        const response = await fetch(`https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${OLA_API_KEY}`);
        if (!response.ok) throw new Error(`Autocomplete API Error: ${response.status}`);
        const data = await response.json();
        return data.predictions || [];
    } catch (error) {
        console.error("Autocomplete API error:", error);
        return [];
    }
}

async function fetchPlaceDetails(placeId) {
    try {
        const response = await fetch(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${OLA_API_KEY}`);
        if (!response.ok) throw new Error(`Place Details API Error: ${response.status}`);
        const data = await response.json();
        return data.result?.geometry?.location || null;
    } catch (error) {
        console.error("Place Details API error:", error);
        return null;
    }
}

function setMarker(lat, lng, type) {
    if (!myMap || !olaMaps) return;
    const color = type === "start-location" ? "green" : "red";
    if (type === "start-location" && startMarker) myMap.removeLayer(startMarker);
    if (type === "end-location" && endMarker) myMap.removeLayer(endMarker);
    const marker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
    if (type === "start-location") startMarker = marker;
    else endMarker = marker;
    myMap.flyTo({ center: [lng, lat], zoom: 14 });
}

async function drawRoute() {
    if (!startCoords || !endCoords) {
        alert("Please enter both start and destination locations!");
        return;
    }
    try {
        const response = await fetch(`https://api.olamaps.io/routing/v1/directions?origin=${startCoords.lat},${startCoords.lng}&destination=${endCoords.lat},${endCoords.lng}&api_key=${OLA_API_KEY}`, { method: 'POST' });
        const polyline = (await response.json()).routes?.[0]?.overview_polyline;

        if (!polyline) {
            throw new Error("No routes found.");
        }
        const routeCoords = decodePolyline(polyline);
        if (myMap.getLayer('route-layer')) {
            myMap.removeLayer('route-layer');
            myMap.removeSource('route');
        }
        myMap.addSource('route', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } }
        });
        myMap.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            paint: { 'line-color': '#FF0000', 'line-width': 4 }
        });
        myMap.fitBounds([[startCoords.lng, startCoords.lat], [endCoords.lng, endCoords.lat]], { padding: 50 });
    } catch (error) {
        console.error("Routing API error:", error);
        alert(`Failed to get route: ${error.message}`);
    }
}

function decodePolyline(polyline) {
    let index = 0, len = polyline.length;
    let lat = 0, lng = 0;
    const coordinates = [];
    while (index < len) {
        let byte, shift = 0, result = 0;
        do {
            byte = polyline.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += deltaLat;
        shift = 0;
        result = 0;
        do {
            byte = polyline.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += deltaLng;
        coordinates.push([lng / 1e5, lat / 1e5]);
    }
    return coordinates;
}
