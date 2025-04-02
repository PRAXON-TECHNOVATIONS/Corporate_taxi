


var OLA_API_KEY
var myMap, olaMaps;
var startMarker = null, endMarker = null;
var startCoords = null, endCoords = null;
var pick_up, drop_off;

$(document).ready(function () {
    
    frappe.call({
        method: "corporate_taxi.override.auth.get_api_key",  // Adjust the path as per your app structure
        callback: function(response) {
            if (response.message) {
                console.log("API Key:", response.message);
                OLA_API_KEY = response.message
                function getQueryParam(name) {
                    const urlParams = new URLSearchParams(window.location.search);
                    return urlParams.get(name);
                }
            
                pick_up = getQueryParam('pick_up');
                drop_off = getQueryParam('drop_off');
                console.log(pick_up);
                console.log(drop_off);

                $.getScript("/assets/corporate_taxi/js/olamaps-web-sdk/dist/olamaps-web-sdk.umd.js", function () {
                    
                        initializeMap(); // Ensure the function exists before calling
                    
                });


            } else {
                console.warn("API Key not found.");
            }
        }
    });

    
    
});

function initializeMap() {
    if (!OLA_API_KEY) {
        console.error("Ola API Key is missing!");
        return;
    }
    
    olaMaps = new OlaMaps({ apiKey: OLA_API_KEY });
    myMap = olaMaps.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: 'map',
        center: [77.616484, 12.931423],
        zoom: 12,
    });

    setTimeout(() => {
        if (pick_up) {
            fetchPlaceDetails(pick_up).then(coords => {
                if (coords) {
                    startCoords = coords;
                    setMarker(coords.lat, coords.lng, "start-location");
                }
            });
        }
        
        if (drop_off) {
            fetchPlaceDetails(drop_off).then(coords => {
                if (coords) {
                    endCoords = coords;
                    setMarker(coords.lat, coords.lng, "end-location");
                    if (startCoords) drawRoute();
                }
            });
        }
    }, 1000);
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

    if (type === "start-location") {
        if (startMarker) myMap.removeLayer(startMarker);
        startMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
    } else {
        if (endMarker) myMap.removeLayer(endMarker);
        endMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
    }

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
    // dwaw line between locations
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