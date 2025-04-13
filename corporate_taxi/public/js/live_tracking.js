

// var OLA_API_KEY;
// var myMap, olaMaps;
// var startMarker = null, endMarker = null, userMarker = null;
// var startCoords = null, endCoords = null;
// var pick_up, drop_off;

// $(document).ready(function () {
//     frappe.call({
//         method: "corporate_taxi.override.auth.get_api_key",
//         callback: function(response) {
//             if (response.message) {
//                 console.log("API Key:", response.message);
//                 OLA_API_KEY = response.message;
                
//                 function getQueryParam(name) {
//                     const urlParams = new URLSearchParams(window.location.search);
//                     return urlParams.get(name);
//                 }
                
//                 pick_up = getQueryParam('pick_up');
//                 drop_off = getQueryParam('drop_off');
//                 console.log("Pick Up:", pick_up);
//                 console.log("Drop Off:", drop_off);

//                 $.getScript("/assets/corporate_taxi/js/olamaps-web-sdk/dist/olamaps-web-sdk.umd.js", function () {
//                     initializeMap();
                    
//                 });
//             } else {
//                 console.warn("API Key not found.");
//             }
//         }
//     });
// });

// function initializeMap() {
//     if (!OLA_API_KEY) {
//         console.error("Ola API Key is missing!");
//         return;
//     }

//     olaMaps = new OlaMaps({ apiKey: OLA_API_KEY });
//     myMap = olaMaps.init({
//         style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
//         container: 'map',
//         center: [77.616484, 12.931423], // Default center (Bangalore)
//         zoom: 12,
//     });

//     // Add geolocation control to track user location
//     const geolocate = olaMaps.addGeolocateControls({
//         positionOptions: { enableHighAccuracy: true },
//         trackUserLocation: true,
//     });

//     myMap.addControl(geolocate);

//     // Trigger geolocation when the map loads
//     myMap.on('load', () => {
//         geolocate.trigger();
//     });

//     // Listen for geolocation updates
//     geolocate.on('geolocate', (position) => {
//         const { latitude, longitude } = position.coords;
//         console.log("User Location:", latitude, longitude);
//         setMarker(latitude, longitude, "user-location");
//         myMap.flyTo({ center: [longitude, latitude], zoom: 12 });
//     });

//     // Fetch pick-up and drop-off locations if provided
//     setTimeout(() => {
//         if (pick_up) {
//             fetchPlaceDetails(pick_up).then(coords => {
//                 if (coords) {
//                     startCoords = coords;
//                     setMarker(coords.lat, coords.lng, "start-location");
//                 }
//             });
//         }

//         if (drop_off) {
//             fetchPlaceDetails(drop_off).then(coords => {
//                 if (coords) {
//                     endCoords = coords;
//                     setMarker(coords.lat, coords.lng, "end-location");
//                     if (startCoords) drawRoute();
//                 }
//             });
//         }
//     }, 1100);
// }

// async function fetchPlaceDetails(placeId) {
//     try {
//         const response = await fetch(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${OLA_API_KEY}`);
//         if (!response.ok) throw new Error(`Place Details API Error: ${response.status}`);
//         const data = await response.json();
//         return data.result?.geometry?.location || null;
//     } catch (error) {
//         console.error("Place Details API error:", error);
//         return null;
//     }
// }

//     function setMarker(lat, lng, type) {
//         if (!myMap || !olaMaps) return;
//         const color = type === "start-location" ? "green" : type === "end-location" ? "red" : "blue";

//         if (type === "start-location") {
//             if (startMarker) myMap.removeLayer(startMarker);
//             startMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
//         } else if (type === "end-location") {
//             if (endMarker) myMap.removeLayer(endMarker);
//             endMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
//         } 
//         else {
//             // User location marker
//             if (userMarker) myMap.removeLayer(userMarker);
//             userMarker = olaMaps.addMarker({ color: "blue" }).setLngLat([lng, lat]).addTo(myMap);
//         }
//     }

// async function drawRoute() {
//     if (!startCoords || !endCoords) {
//         alert("Please enter both start and destination locations!");
//         return;
//     }
//     try {
//         const response = await fetch(`https://api.olamaps.io/routing/v1/directions?origin=${startCoords.lat},${startCoords.lng}&destination=${endCoords.lat},${endCoords.lng}&api_key=${OLA_API_KEY}`, { method: 'POST' });
//         const polyline = (await response.json()).routes?.[0]?.overview_polyline;

//         if (!polyline) {
//             throw new Error("No routes found.");
//         }
//         const routeCoords = decodePolyline(polyline);
//         if (myMap.getLayer('route-layer')) {
//             myMap.removeLayer('route-layer');
//             myMap.removeSource('route');
//         }
//         myMap.addSource('route', {
//             type: 'geojson',
//             data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } }
//         });
//         myMap.addLayer({
//             id: 'route-layer',
//             type: 'line',
//             source: 'route',
//             paint: { 'line-color': '#FF0000', 'line-width': 4 }
//         });
//         myMap.fitBounds([[startCoords.lng, startCoords.lat], [endCoords.lng, endCoords.lat]], { padding: 50 });
//     } catch (error) {
//         console.error("Routing API error:", error);
//         alert(`Failed to get route: ${error.message}`);
//     }
// }

// function decodePolyline(polyline) {
//     let index = 0, len = polyline.length;
//     let lat = 0, lng = 0;
//     const coordinates = [];
//     while (index < len) {
//         let byte, shift = 0, result = 0;
//         do {
//             byte = polyline.charCodeAt(index++) - 63;
//             result |= (byte & 0x1f) << shift;
//             shift += 5;
//         } while (byte >= 0x20);
//         const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
//         lat += deltaLat;
//         shift = 0;
//         result = 0;
//         do {
//             byte = polyline.charCodeAt(index++) - 63;
//             result |= (byte & 0x1f) << shift;
//             shift += 5;
//         } while (byte >= 0x20);
//         const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
//         lng += deltaLng;
//         coordinates.push([lng / 1e5, lat / 1e5]);
//     }
//     return coordinates;
// }


// ========================================================================================================
// var OLA_API_KEY;
// var myMap, olaMaps;
// var startMarker = null, endMarker = null, userMarker = null, driverMarker = null;
// var startCoords = null, endCoords = null;
// var pick_up, drop_off, trip_id, driver_id;

// $(document).ready(function () {
//     frappe.call({
//         method: "corporate_taxi.override.auth.get_api_key",
//         callback: function (response) {
//             if (response.message) {
//                 OLA_API_KEY = response.message;

//                 function getQueryParam(name) {
//                     const urlParams = new URLSearchParams(window.location.search);
//                     return urlParams.get(name);
//                 }

//                 pick_up = getQueryParam('pick_up');
//                 drop_off = getQueryParam('drop_off');
//                 trip_id = getQueryParam('trip_id');

//                 $.getScript("/assets/corporate_taxi/js/olamaps-web-sdk/dist/olamaps-web-sdk.umd.js", function () {
//                     initializeMap();
//                 });
//             } else {
//                 console.warn("API Key not found.");
//             }
//         }
//     });
// });

// function initializeMap() {
//     if (!OLA_API_KEY) return console.error("Ola API Key is missing!");

//     olaMaps = new OlaMaps({ apiKey: OLA_API_KEY });
//     myMap = olaMaps.init({
//         style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
//         container: 'map',
//         center: [77.616484, 12.931423],
//         zoom: 12,
//     });

//     const geolocate = olaMaps.addGeolocateControls({
//         positionOptions: { enableHighAccuracy: true },
//         trackUserLocation: true,
//     });

//     myMap.addControl(geolocate);

//     myMap.on('load', () => {
//         geolocate.trigger();
//         loadDriverInfo(); // Start after map load
//     });

//     geolocate.on('geolocate', (position) => {
//         const { latitude, longitude } = position.coords;
//         setMarker(latitude, longitude, "user-location");
//         myMap.flyTo({ center: [longitude, latitude], zoom: 12 });
//     });

//     setTimeout(() => {
//         if (pick_up) {
//             fetchPlaceDetails(pick_up).then(coords => {
//                 if (coords) {
//                     startCoords = coords;
//                     setMarker(coords.lat, coords.lng, "start-location");
//                 }
//             });
//         }

//         if (drop_off) {
//             fetchPlaceDetails(drop_off).then(coords => {
//                 if (coords) {
//                     endCoords = coords;
//                     setMarker(coords.lat, coords.lng, "end-location");
//                     if (startCoords) drawRoute();
//                 }
//             });
//         }
//     }, 1100);
// }

// function setMarker(lat, lng, type) {
//     if (!myMap || !olaMaps) return;
//     const color = type === "start-location" ? "green" : type === "end-location" ? "red" : "blue";

//     if (type === "start-location") {
//         if (startMarker) myMap.removeLayer(startMarker);
//         startMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
//     } else if (type === "end-location") {
//         if (endMarker) myMap.removeLayer(endMarker);
//         endMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
//     } else {
//         if (userMarker) myMap.removeLayer(userMarker);
//         userMarker = olaMaps.addMarker({ color: "blue" }).setLngLat([lng, lat]).addTo(myMap);
//     }
// }

// async function fetchPlaceDetails(placeId) {
//     try {
//         const response = await fetch(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${OLA_API_KEY}`);
//         if (!response.ok) throw new Error(`Place Details API Error: ${response.status}`);
//         const data = await response.json();
//         return data.result?.geometry?.location || null;
//     } catch (error) {
//         console.error("Place Details API error:", error);
//         return null;
//     }
// }

// async function drawRoute() {
//     if (!startCoords || !endCoords) {
//         alert("Please enter both start and destination locations!");
//         return;
//     }
//     try {
//         const response = await fetch(`https://api.olamaps.io/routing/v1/directions?origin=${startCoords.lat},${startCoords.lng}&destination=${endCoords.lat},${endCoords.lng}&api_key=${OLA_API_KEY}`, {
//             method: 'POST'
//         });
//         const polyline = (await response.json()).routes?.[0]?.overview_polyline;
//         if (!polyline) throw new Error("No routes found.");
//         const routeCoords = decodePolyline(polyline);

//         if (myMap.getLayer('route-layer')) {
//             myMap.removeLayer('route-layer');
//             myMap.removeSource('route');
//         }

//         myMap.addSource('route', {
//             type: 'geojson',
//             data: {
//                 type: 'Feature',
//                 geometry: { type: 'LineString', coordinates: routeCoords }
//             }
//         });

//         myMap.addLayer({
//             id: 'route-layer',
//             type: 'line',
//             source: 'route',
//             paint: {
//                 'line-color': '#FF0000',
//                 'line-width': 4
//             }
//         });

//         myMap.fitBounds([[startCoords.lng, startCoords.lat], [endCoords.lng, endCoords.lat]], { padding: 50 });
//     } catch (error) {
//         console.error("Routing API error:", error);
//         alert(`Failed to get route: ${error.message}`);
//     }
// }

// function decodePolyline(polyline) {
//     let index = 0, len = polyline.length;
//     let lat = 0, lng = 0;
//     const coordinates = [];
//     while (index < len) {
//         let byte, shift = 0, result = 0;
//         do {
//             byte = polyline.charCodeAt(index++) - 63;
//             result |= (byte & 0x1f) << shift;
//             shift += 5;
//         } while (byte >= 0x20);
//         const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
//         lat += deltaLat;
//         shift = 0;
//         result = 0;
//         do {
//             byte = polyline.charCodeAt(index++) - 63;
//             result |= (byte & 0x1f) << shift;
//             shift += 5;
//         } while (byte >= 0x20);
//         const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
//         lng += deltaLng;
//         coordinates.push([lng / 1e5, lat / 1e5]);
//     }
//     return coordinates;
// }


// let previousCoords = null;
// let routeCoords = []; // Live route coordinates (red)
// const routeLineId = "driver-route-line"; // Red line
// const blackRouteLineId = "driver-black-route-line"; // Historic line

// function loadDriverInfo() {
//     if (!trip_id) return console.warn("Trip ID not found in query string.");

//     frappe.call({
//         method: "corporate_taxi.override.driver.get_driver_location_by_trip",
//         args: { trip_id },
//         callback: function (r) {
//             if (r.message && r.message.driver_id) {
//                 driver_id = r.message.driver_id;
//                 console.log("driver_id", driver_id);

//                 const { latitude, longitude } = r.message;
//                 updateDriverMarker(latitude, longitude);

//                 // ✅ Save coordinates every 5 seconds
//                 setInterval(() => {
//                     saveTripCoords(trip_id, latitude, longitude);
//                 }, 5000);

//                 // ✅ Start live tracking
//                 setTimeout(() => {
//                     startDriverLocationTracking();
//                 }, 1000);

//                 // ✅ Draw historical black route
//                 drawTripRouteFromHistory(trip_id);
//             } else {
//                 console.warn("Driver not found for trip.");
//             }
//         }
//     });
// }

// function saveTripCoords(trip_id, latitude, longitude) {
//     console.log("Saving trip coordinates...");
//     frappe.call({
//         method: "corporate_taxi.override.driver.save_trip_coordinates",
//         args: {
//             trip_id,
//             latitude,
//             longitude
//         },
//         callback: function (r) {
//             if (r.message === "success") {
//                 console.log("Coordinates saved to trip history");
//             }
//         }
//     });
// }

// function startDriverLocationTracking() {
//     if (!driver_id) return;

//     setInterval(() => {
//         frappe.call({
//             method: "corporate_taxi.override.driver.get_driver_location",
//             args: { driver_id },
//             callback: function (r) {
//                 if (r.message) {
//                     const { latitude, longitude } = r.message;
//                     updateDriverMarker(latitude, longitude);
//                 }
//             }
//         });
//         console.log("Update driver location");
//     }, 5000);
// }

// function updateDriverMarker(lat, lng) {
//     if (!myMap || !olaMaps) return;

//     const currentCoords = [lng, lat];

//     // Update or create marker
//     if (driverMarker) {
//         driverMarker.setLngLat(currentCoords);
//     } else {
//         driverMarker = olaMaps.addMarker({ color: "blue" })
//             .setLngLat(currentCoords)
//             .addTo(myMap);
//     }

//     // Add new coordinate to live route if it changed
//     if (!previousCoords || previousCoords[0] !== currentCoords[0] || previousCoords[1] !== currentCoords[1]) {
//         routeCoords.push(currentCoords);
//         drawRouteLine(); // Red line
//         previousCoords = currentCoords;
//     }
// }

// function drawRouteLine() {
//     if (!myMap || !myMap.isStyleLoaded()) {
//         setTimeout(drawRouteLine, 500);
//         return;
//     }

//     if (myMap.getLayer(routeLineId)) {
//         myMap.removeLayer(routeLineId);
//     }
//     if (myMap.getSource(routeLineId)) {
//         myMap.removeSource(routeLineId);
//     }

//     const routeGeoJSON = {
//         type: "Feature",
//         geometry: {
//             type: "LineString",
//             coordinates: routeCoords
//         }
//     };

//     myMap.addSource(routeLineId, {
//         type: "geojson",
//         data: routeGeoJSON
//     });

//     myMap.addLayer({
//         id: routeLineId,
//         type: "line",
//         source: routeLineId,
//         layout: {
//             "line-join": "round",
//             "line-cap": "round"
//         },
//         paint: {
//             "line-color": "#ff0000", // Red
//             "line-width": 4
//         }
//     });
// }

// function drawTripRouteFromHistory(trip_id) {
//     frappe.call({
//         method: "corporate_taxi.override.driver.get_trip_route_history",
//         args: { trip_id },
//         callback: function (r) {
//             if (r.message && Array.isArray(r.message) && r.message.length > 1) {
//                 const coordinates = r.message
//                     .filter(loc => loc.latitude && loc.longitude)
//                     .map(loc => [parseFloat(loc.longitude), parseFloat(loc.latitude)]);

//                 if (coordinates.length >= 2) {
//                     drawBlackRouteLine(coordinates);
//                     addRouteWaypoints(coordinates); // Optional markers
//                 } else {
//                     console.warn("Not enough coordinates to draw route.");
//                 }
//             } else {
//                 console.warn("No valid route history found.");
//             }
//         }
//     });
// }
// function drawBlackRouteLine(coordinates) {
//     // Check if the map is loaded
//     if (!myMap || !myMap.isStyleLoaded()) {
//         setTimeout(() => drawBlackRouteLine(coordinates), 500);
//         return;
//     }

//     // Remove existing black route line layer if it exists
//     if (myMap.getLayer(blackRouteLineId)) {
//         myMap.removeLayer(blackRouteLineId);
//     }
//     if (myMap.getSource(blackRouteLineId)) {
//         myMap.removeSource(blackRouteLineId);
//     }

//     // GeoJSON object for the black route line
//     const blackRouteGeoJSON = {
//         type: "Feature",
//         geometry: {
//             type: "LineString",
//             coordinates: coordinates // The historical route coordinates
//         }
//     };

//     // Add the black route line source to the map
//     myMap.addSource(blackRouteLineId, {
//         type: "geojson",
//         data: blackRouteGeoJSON
//     });

//     // Add the black route line layer to the map
//     myMap.addLayer({
//         id: blackRouteLineId,
//         type: "line",
//         source: blackRouteLineId,
//         layout: {
//             "line-join": "round",
//             "line-cap": "round"
//         },
//         paint: {
//             "line-color": "#000000", // Black color
//             "line-width": 3, // Line width
//             "line-opacity": 0.8 // Opacity for the line
//         }
//     });
// }


// // Optional: draw small black markers for each point in history
// function addRouteWaypoints(coordinates) {
//     coordinates.forEach((coord, index) => {
//         olaMaps.addMarker({ color: "black" })
//             .setLngLat(coord)
//             .setPopup(new olaMaps.Popup().setText(`Waypoint ${index + 1}`))
//             .addTo(myMap);
//     });
// }







// var OLA_API_KEY;
// var myMap, olaMaps;
// var startMarker = null, endMarker = null, userMarker = null, driverMarker = null;
// var startCoords = null, endCoords = null;
// var pick_up, drop_off, trip_id, driver_id;

// let previousCoords = null;
// let routeCoords = []; // Live route coordinates (red)
// const routeLineId = "driver-route-line"; // Red line
// const blackRouteLineId = "driver-black-route-line"; // Historic line

// $(document).ready(function () {
//     frappe.call({
//         method: "corporate_taxi.override.auth.get_api_key",
//         callback: function (response) {
//             if (response.message) {
//                 OLA_API_KEY = response.message;

//                 function getQueryParam(name) {
//                     const urlParams = new URLSearchParams(window.location.search);
//                     return urlParams.get(name);
//                 }

//                 pick_up = getQueryParam('pick_up');
//                 drop_off = getQueryParam('drop_off');
//                 trip_id = getQueryParam('trip_id');

//                 $.getScript("/assets/corporate_taxi/js/olamaps-web-sdk/dist/olamaps-web-sdk.umd.js", function () {
//                     initializeMap();
//                 });
//             } else {
//                 console.warn("API Key not found.");
//             }
//         }
//     });
// });

// function initializeMap() {
//     if (!OLA_API_KEY) return console.error("Ola API Key is missing!");

//     olaMaps = new OlaMaps({ apiKey: OLA_API_KEY });
//     myMap = olaMaps.init({
//         style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
//         container: 'map',
//         center: [77.616484, 12.931423],
//         zoom: 12,
//     });

//     const geolocate = olaMaps.addGeolocateControls({
//         positionOptions: { enableHighAccuracy: true },
//         trackUserLocation: true,
//     });

//     myMap.addControl(geolocate);

//     myMap.on('load', () => {
//         geolocate.trigger();
//         loadDriverInfo(); // Start after map load
//     });

//     geolocate.on('geolocate', (position) => {
//         const { latitude, longitude } = position.coords;
//         setMarker(latitude, longitude, "user-location");
//         myMap.flyTo({ center: [longitude, latitude], zoom: 12 });
//     });

//     setTimeout(() => {
//         if (pick_up) {
//             fetchPlaceDetails(pick_up).then(coords => {
//                 if (coords) {
//                     startCoords = coords;
//                     setMarker(coords.lat, coords.lng, "start-location");
//                 }
//             });
//         }

//         if (drop_off) {
//             fetchPlaceDetails(drop_off).then(coords => {
//                 if (coords) {
//                     endCoords = coords;
//                     setMarker(coords.lat, coords.lng, "end-location");
//                     if (startCoords) drawRoute();
//                 }
//             });
//         }
//     }, 1100);
// }

// function setMarker(lat, lng, type) {
//     if (!myMap || !olaMaps) return;
//     const color = type === "start-location" ? "green" : type === "end-location" ? "red" : "blue";

//     if (type === "start-location") {
//         if (startMarker) myMap.removeLayer(startMarker);
//         startMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
//     } else if (type === "end-location") {
//         if (endMarker) myMap.removeLayer(endMarker);
//         endMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
//     } else {
//         if (userMarker) myMap.removeLayer(userMarker);
//         userMarker = olaMaps.addMarker({ color: "blue" }).setLngLat([lng, lat]).addTo(myMap);
//     }
// }

// async function fetchPlaceDetails(placeId) {
//     try {
//         const response = await fetch(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${OLA_API_KEY}`);
//         if (!response.ok) throw new Error(`Place Details API Error: ${response.status}`);
//         const data = await response.json();
//         return data.result?.geometry?.location || null;
//     } catch (error) {
//         console.error("Place Details API error:", error);
//         return null;
//     }
// }

// async function drawRoute() {
//     if (!startCoords || !endCoords) {
//         alert("Please enter both start and destination locations!");
//         return;
//     }
//     try {
//         const response = await fetch(`https://api.olamaps.io/routing/v1/directions?origin=${startCoords.lat},${startCoords.lng}&destination=${endCoords.lat},${endCoords.lng}&api_key=${OLA_API_KEY}`, {
//             method: 'POST'
//         });
//         const polyline = (await response.json()).routes?.[0]?.overview_polyline;
//         if (!polyline) throw new Error("No routes found.");
//         const routeCoords = decodePolyline(polyline);

//         if (myMap.getLayer('route-layer')) {
//             myMap.removeLayer('route-layer');
//             myMap.removeSource('route');
//         }

//         myMap.addSource('route', {
//             type: 'geojson',
//             data: {
//                 type: 'Feature',
//                 geometry: { type: 'LineString', coordinates: routeCoords }
//             }
//         });

//         myMap.addLayer({
//             id: 'route-layer',
//             type: 'line',
//             source: 'route',
//             layout: {
//                 'line-join': 'round',
//                 'line-cap': 'round'
//             },
//             paint: {
//                 'line-color': '#00aaff',
//                 'line-width': 4
//             }
//         });
//     } catch (error) {
//         console.error("Error drawing route:", error);
//     }
// }

// function loadDriverInfo() {
//     if (!trip_id) return console.warn("Trip ID not found in query string.");

//     frappe.call({
//         method: "corporate_taxi.override.driver.get_driver_location_by_trip",
//         args: { trip_id },
//         callback: function (r) {
//             if (r.message && r.message.driver_id) {
//                 driver_id = r.message.driver_id;
//                 console.log("driver_id", driver_id);

//                 const { latitude, longitude } = r.message;
//                 updateDriverMarker(latitude, longitude);

//                 setInterval(() => {
//                     saveTripCoords(trip_id, latitude, longitude);
//                 }, 5000);

//                 setTimeout(() => {
//                     startDriverLocationTracking();
//                 }, 1000);

//                 drawTripRouteFromHistory(trip_id);
//             } else {
//                 console.warn("Driver not found for trip.");
//             }
//         }
//     });
// }

// function saveTripCoords(trip_id, latitude, longitude) {
//     console.log("Saving trip coordinates...");
//     frappe.call({
//         method: "corporate_taxi.override.driver.save_trip_coordinates",
//         args: {
//             trip_id,
//             latitude,
//             longitude
//         },
//         callback: function (r) {
//             if (r.message === "success") {
//                 console.log("Coordinates saved to trip history");
//             }
//         }
//     });
// }

// function startDriverLocationTracking() {
//     if (!driver_id) return;

//     setInterval(() => {
//         frappe.call({
//             method: "corporate_taxi.override.driver.get_driver_location",
//             args: { driver_id },
//             callback: function (r) {
//                 if (r.message) {
//                     const { latitude, longitude } = r.message;
//                     updateDriverMarker(latitude, longitude);
//                 }
//             }
//         });
//         console.log("Update driver location");
//     }, 5000);
// }

// function updateDriverMarker(lat, lng) {
//     if (!myMap || !olaMaps) return;

//     const currentCoords = [lng, lat];

//     if (driverMarker) {
//         driverMarker.setLngLat(currentCoords);
//     } else {
//         driverMarker = olaMaps.addMarker({ color: "blue" })
//             .setLngLat(currentCoords)
//             .addTo(myMap);
//     }

//     if (!previousCoords || previousCoords[0] !== currentCoords[0] || previousCoords[1] !== currentCoords[1]) {
//         routeCoords.push(currentCoords);
//         drawRouteLine();
//         previousCoords = currentCoords;
//     }
// }

// function drawRouteLine() {
//     if (!myMap || !myMap.isStyleLoaded()) {
//         setTimeout(drawRouteLine, 500);
//         return;
//     }

//     if (myMap.getLayer(routeLineId)) {
//         myMap.removeLayer(routeLineId);
//     }
//     if (myMap.getSource(routeLineId)) {
//         myMap.removeSource(routeLineId);
//     }

//     const routeGeoJSON = {
//         type: "Feature",
//         geometry: {
//             type: "LineString",
//             coordinates: routeCoords
//         }
//     };

//     myMap.addSource(routeLineId, {
//         type: "geojson",
//         data: routeGeoJSON
//     });

//     myMap.addLayer({
//         id: routeLineId,
//         type: "line",
//         source: routeLineId,
//         layout: {
//             "line-join": "round",
//             "line-cap": "round"
//         },
//         paint: {
//             "line-color": "#ff0000",
//             "line-width": 4
//         }
//     });
// }

// function drawTripRouteFromHistory(trip_id) {
//     frappe.call({
//         method: "corporate_taxi.override.driver.get_trip_route_history",
//         args: { trip_id },
//         callback: function (r) {
//             if (r.message && Array.isArray(r.message) && r.message.length > 1) {
//                 const coordinates = r.message
//                     .filter(loc => loc.latitude && loc.longitude)
//                     .map(loc => [parseFloat(loc.longitude), parseFloat(loc.latitude)]);

//                 if (coordinates.length >= 2) {
//                     drawBlackRouteLine(coordinates);
//                     addRouteWaypoints(coordinates);
//                 } else {
//                     console.warn("Not enough coordinates to draw route.");
//                 }
//             } else {
//                 console.warn("No valid route history found.");
//             }
//         }
//     });
// }

// function drawBlackRouteLine(coordinates) {
//     if (!myMap || !myMap.isStyleLoaded()) {
//         setTimeout(() => drawBlackRouteLine(coordinates), 500);
//         return;
//     }

//     if (myMap.getLayer(blackRouteLineId)) {
//         myMap.removeLayer(blackRouteLineId);
//     }
//     if (myMap.getSource(blackRouteLineId)) {
//         myMap.removeSource(blackRouteLineId);
//     }

//     const blackRouteGeoJSON = {
//         type: "Feature",
//         geometry: {
//             type: "LineString",
//             coordinates: coordinates
//         }
//     };

//     myMap.addSource(blackRouteLineId, {
//         type: "geojson",
//         data: blackRouteGeoJSON
//     });

//     myMap.addLayer({
//         id: blackRouteLineId,
//         type: "line",
//         source: blackRouteLineId,
//         layout: {
//             "line-join": "round",
//             "line-cap": "round"
//         },
//         paint: {
//             "line-color": "#000000",
//             "line-width": 3,
//             "line-opacity": 0.8
//         }
//     });
// }

// function addRouteWaypoints(coordinates) {
//     coordinates.forEach((coord, index) => {
//         olaMaps.addMarker({ color: "black" })
//             .setLngLat(coord)
//             .setPopup(new olaMaps.Popup().setText(`Waypoint ${index + 1}`))
//             .addTo(myMap);
//     });
// }   





var OLA_API_KEY;
var myMap, olaMaps;
var startMarker = null, endMarker = null, userMarker = null, driverMarker = null;
var startCoords = null, endCoords = null;
var pick_up, drop_off, trip_id, driver_id;

let previousCoords = null;
let routeCoords = []; // Live route coordinates (red)
const routeLineId = "driver-route-line"; // Red line
const blackRouteLineId = "driver-black-route-line"; // Historic line
let addedMarkers = []; // Array to hold the markers and their coordinates

$(document).ready(function () {
    frappe.call({
        method: "corporate_taxi.override.auth.get_api_key",
        callback: function (response) {
            if (response.message) {
                OLA_API_KEY = response.message;

                function getQueryParam(name) {
                    const urlParams = new URLSearchParams(window.location.search);
                    return urlParams.get(name);
                }

                pick_up = getQueryParam('pick_up');
                drop_off = getQueryParam('drop_off');
                trip_id = getQueryParam('trip_id');

                $.getScript("/assets/corporate_taxi/js/olamaps-web-sdk/dist/olamaps-web-sdk.umd.js", function () {
                    initializeMap();
                });
            } else {
                console.warn("API Key not found.");
            }
        }
    });
});

function initializeMap() {
    if (!OLA_API_KEY) return console.error("Ola API Key is missing!");

    olaMaps = new OlaMaps({ apiKey: OLA_API_KEY });
    myMap = olaMaps.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: 'map',
        center: [77.616484, 12.931423],
        zoom: 12,
    });

    const geolocate = olaMaps.addGeolocateControls({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
    });

    myMap.addControl(geolocate);

    myMap.on('load', () => {
        geolocate.trigger();
        loadDriverInfo(); // Start after map load
    });

    geolocate.on('geolocate', (position) => {
        const { latitude, longitude } = position.coords;
        setMarker(latitude, longitude, "user-location");
        myMap.flyTo({ center: [longitude, latitude], zoom: 12 });
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
    }, 1100);
}

function setMarker(lat, lng, type) {
    if (!myMap || !olaMaps) return;
    const color = type === "start-location" ? "green" : type === "end-location" ? "red" : "blue";

    if (type === "start-location") {
        if (startMarker) myMap.removeLayer(startMarker);
        startMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
    } else if (type === "end-location") {
        if (endMarker) myMap.removeLayer(endMarker);
        endMarker = olaMaps.addMarker({ color }).setLngLat([lng, lat]).addTo(myMap);
    } else {
        if (userMarker) myMap.removeLayer(userMarker);
        userMarker = olaMaps.addMarker({ color: "blue" }).setLngLat([lng, lat]).addTo(myMap);
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

async function drawRoute() {
    if (!startCoords || !endCoords) {
        alert("Please enter both start and destination locations!");
        return;
    }
    try {
        const response = await fetch(`https://api.olamaps.io/routing/v1/directions?origin=${startCoords.lat},${startCoords.lng}&destination=${endCoords.lat},${endCoords.lng}&api_key=${OLA_API_KEY}`, { method: 'POST' });
        
        const polyline = (await response.json()).routes?.[0]?.overview_polyline;
        if (!polyline) throw new Error("No routes found.");
        const routeCoords = decodePolyline(polyline);

        if (myMap.getLayer('route-layer')) {
            myMap.removeLayer('route-layer');
            myMap.removeSource('route');
        }

        myMap.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: routeCoords }
            }
        });

        myMap.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#00aaff',
                'line-width': 4
            }
        });
    } catch (error) {
        console.error("Error drawing route:", error);
    }
}

function loadDriverInfo() {
    if (!trip_id) return console.warn("Trip ID not found in query string.");

    frappe.call({
        method: "corporate_taxi.override.driver.get_driver_location_by_trip",
        args: { trip_id },
        callback: function (r) {
            if (r.message && r.message.driver_id) {
                driver_id = r.message.driver_id;
                console.log("driver_id", driver_id);

                const { latitude, longitude } = r.message;
                updateDriverMarker(latitude, longitude);

                setInterval(() => {
                    saveTripCoords(trip_id, latitude, longitude);

                    drawTripRouteFromHistory(trip_id);
                }, 10000);

                setTimeout(() => {
                    startDriverLocationTracking();
                }, 1000);

               
            } else {
                console.warn("Driver not found for trip.");
            }
        }
    });
}

function saveTripCoords(trip_id, latitude, longitude) {
    console.log("Saving trip coordinates...");
    frappe.call({
        method: "corporate_taxi.override.driver.save_trip_coordinates",
        args: {
            trip_id,
            latitude,
            longitude
        },
        callback: function (r) {
            if (r.message === "success") {
                console.log("Coordinates saved to trip history");
            }
        }
    });
}

function startDriverLocationTracking() {
    if (!driver_id) return;

    setInterval(() => {
        frappe.call({
            method: "corporate_taxi.override.driver.get_driver_location",
            args: { driver_id },
            callback: function (r) {
                if (r.message) {
                    const { latitude, longitude } = r.message;
                    updateDriverMarker(latitude, longitude);
                }
            }
        });
        console.log("Update driver location");
    }, 10000);
}

function updateDriverMarker(lat, lng) {
    if (!myMap || !olaMaps) return;

    const currentCoords = [lng, lat];

    if (driverMarker) {
        driverMarker.setLngLat(currentCoords);
    } else {
        driverMarker = olaMaps.addMarker({ color: "blue" })
            .setLngLat(currentCoords)
            .addTo(myMap);
    }

    if (!previousCoords || previousCoords[0] !== currentCoords[0] || previousCoords[1] !== currentCoords[1]) {
        routeCoords.push(currentCoords);
        drawRouteLine();
        previousCoords = currentCoords;
    }
}

function drawRouteLine() {
    if (!myMap || !myMap.isStyleLoaded()) {
        setTimeout(drawRouteLine, 500);
        return;
    }

    if (myMap.getLayer(routeLineId)) {
        myMap.removeLayer(routeLineId);
    }
    if (myMap.getSource(routeLineId)) {
        myMap.removeSource(routeLineId);
    }

    const routeGeoJSON = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: routeCoords
        }
    };

    myMap.addSource(routeLineId, {
        type: "geojson",
        data: routeGeoJSON
    });

    myMap.addLayer({
        id: routeLineId,
        type: "line",
        source: routeLineId,
        layout: {
            "line-join": "round",
            "line-cap": "round"
        },
        paint: {
            "line-color": "#ff0000",
            "line-width": 4
        }
    });
}

// function drawTripRouteFromHistory(trip_id) {
//     frappe.call({
//         method: "corporate_taxi.override.driver.get_trip_route_history",
//         args: { trip_id },
//         callback: function (r) {
//             if (r.message && Array.isArray(r.message) && r.message.length > 1) {
//                 const coordinates = r.message
//                     .filter(loc => loc.latitude && loc.longitude)
//                     .map(loc => [parseFloat(loc.longitude), parseFloat(loc.latitude)]);

//                 if (coordinates.length >= 2) {
//                     drawBlackRouteLine(coordinates);
//                     addRouteWaypoints(coordinates);
//                 } else {
//                     console.warn("Not enough coordinates to draw route.");
//                 }
//             } else {
//                 console.warn("No valid route history found.");
//             }
//         }
//     });
// }
async function drawTripRouteFromHistory(trip_id) {
    frappe.call({
        method: "corporate_taxi.override.driver.get_trip_route_history",
        args: { trip_id },
        callback: function (r) {
            setTimeout(() => {
                console.log(r);
                console.log("RESPONSE");
                // Check if the response is valid and contains valid coordinates
              
                    const originRow = r.message.message[0];  // First row (origin)
                    const destinationRow = r.message.message[r.message.message.length - 1];  // Last row (destination)
                    const prev_coords = r.message.message[r.message.message.length - 2];
                   
                    const prev_end_coord = { lat: prev_coords.latitude, lng: prev_coords.longitude };

                    // Call removeMarkerByCoords with only the end coordinates
                    removeMarkerByCoords(prev_end_coord);

    
                    const originCoords = {
                        lat: parseFloat(originRow.latitude),
                        lng: parseFloat(originRow.longitude)
                    };
    
                    const destinationCoords = {
                        lat: parseFloat(destinationRow.latitude),
                        lng: parseFloat(destinationRow.longitude)
                    };
    
                    // If we have valid coordinates, draw the route and waypoints
                    if (originCoords.lat && originCoords.lng && destinationCoords.lat && destinationCoords.lng) {
                       
                            drawBlackRouteLine([originCoords, destinationCoords]);
                       
                        addRouteWaypoints([originCoords, destinationCoords]); // Add waypoints for origin and destination
                    } else {
                        console.warn("Invalid coordinates in route history.");
                    }
             
            }, 1000);  
        },
        error: function (err) {
            console.error("Error fetching trip history:", err);
        }
    });
}

async function drawBlackRouteLine(coordinates) {
    try {
        if (!coordinates || coordinates.length < 2) {
            console.error("Not enough coordinates to draw the route.");
            return;
        }

        console.log(coordinates);
        // Get the first and last coordinates from the route history
        const startCoords = { lat: coordinates[0]["lat"], lng: coordinates[0]["lng"] };
        const endCoords = { lat: coordinates[1]["lat"], lng: coordinates[1]["lng"] };
        console.log(startCoords.lat);
        console.log(endCoords);
        // Use the Ola Maps API to fetch the route between start and end coordinates
        const routeResponse = await fetch(`https://api.olamaps.io/routing/v1/directions?origin=${startCoords.lat},${startCoords.lng}&destination=${endCoords.lat},${endCoords.lng}&api_key=${OLA_API_KEY}`, { method: 'POST' });

        const data = await routeResponse.json();
        const polyline = data.routes?.[0]?.overview_polyline;
        console.log(polyline);
        if (!polyline) {
            console.error("No route found.");
            return;
        }

        // Decode the polyline into coordinates
        const routeCoords = decodePolyline(polyline);

        // Remove any existing black route lines from the map
        if (myMap.getLayer('blackRouteLineId')) {
            myMap.removeLayer('blackRouteLineId');
        }
        if (myMap.getSource('blackRouteLineId')) {
            myMap.removeSource('blackRouteLineId');
        }

        // Create the GeoJSON data for the black route line
        const blackRouteGeoJSON = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: routeCoords 
            }
        };

        // Add the source for the black route line
        myMap.addSource('blackRouteLineId', {
            type: "geojson",
            data: blackRouteGeoJSON
        });

        // Add the black route line layer
        myMap.addLayer({
            id: 'blackRouteLineId',
            type: "line",
            source: 'blackRouteLineId',
            layout: {
                "line-join": "round",
                "line-cap": "round"
            },
            paint: {
                "line-color": "#000000",
                "line-width": 3,
                "line-opacity": 0.8
            }
        });

        // Optionally, you can add waypoints here if needed
        addRouteWaypoints([startCoords, endCoords]);

    } catch (error) {
        console.error("Error drawing black route history:", error);
    }
}

// function addRouteWaypoints(coordinates) {
//     coordinates.forEach(coord => {
//         olaMaps.addMarker({ color: "black" })
//             .setLngLat(coord)
//             .addTo(myMap);
//     });
// }




function addRouteWaypoints(coordinates) {
    coordinates.forEach(coord => {
       const marker =  olaMaps.addMarker({ color: "black" })
            .setLngLat(coord)
            .addTo(myMap);


        // Store the marker and its coordinates in addedMarkers array
        addedMarkers.push({ marker, coord });
    });
}

// Function to remove a marker based on coordinates
function removeMarkerByCoords(coordToRemove) {
    console.log(addedMarkers);
    if(addedMarkers.length > 2){

        addedMarkers.forEach((item, index) => {
            const { marker, coord } = item;

            // Check if the current marker's coordinates match the ones to be removed
            if (coord.latitude === coordToRemove.latitude && coord.longitude === coordToRemove.longitude) {
                marker.remove(); // Remove the marker from the map
                addedMarkers.splice(index, 1); // Remove this entry from the array
            }
        });
    }
}



async function fetchRouteHistory(trip_id) {
    // Fetch the route history from your backend using frappe.call
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "corporate_taxi.override.driver.get_trip_route_history",
            args: { trip_id },
            callback: function (r) {
                if (r.message && Array.isArray(r.message)) {
                    resolve(r.message);  // Return the history data
                } else {
                    reject("No history found");
                }
            },
            error: function (err) {
                reject(err);
            }
        });
    });
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


