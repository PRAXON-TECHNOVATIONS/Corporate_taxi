// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Booking Request", {
    onload: function(frm) {
        frappe.call({
            method: 'corporate_taxi.taxi.doctype.booking_request.booking_request.get_customer_for_user',
            callback: function(response) {
                if (response.message) {
                    frm.set_value('customer', response.message);
                }
            }
        });
    },
    
    refresh: function(frm) {
        setTimeout(() => {
            attachOlaAutocomplete(frm, [
                { field: 'pick_up_location', place_id_field: 'pick_up_location_place_id' },
                { field: 'drop_off_location', place_id_field: 'drop_off_location_place_id' },
                { field: 'location_1', place_id_field: 'location_1_place_id' },
                { field: 'location_2', place_id_field: 'location_2_place_id' }
            ]);
        }, 500);

        // add booking button to directly create booking from here
        add_booking_button(frm)

        // create request for vehicle from booking request
        create_vehicle_for_request(frm)

        
    }


});


// function attachOlaAutocomplete(frm, fields) {
//     fields.forEach(({ field, place_id_field }) => {
//         frm.fields_dict[field].$wrapper.find('input').on('input', function () {
//             let inputValue = $(this).val();
//             if (inputValue.length >= 0) {
//                 fetchOlaPlaceDetails(inputValue, function (data) {
//                     if (data && data.length) {
//                         let suggestions = data.map(place => place.description);

//                         suggestions.unshift({
//                             label: "📍 Your Location",
//                             value: "Your Location"
//                         });

                        

//                         // Set suggestions in the Autocomplete field
//                         frm.fields_dict[field].set_data(suggestions);
                      
//                         // Store the place_id when a user selects a suggestion
//                         frm.fields_dict[field].$wrapper.find('input').on('change', function () {
//                             let selectedText = $(this).val();
//                             let selectedPlace = data.find(place => place.description === selectedText);

//                             if (selectedPlace) {
//                                 console.log(selectedPlace);
//                                 console.log(selectedPlace.place_id);
//                                 frm.set_value(field, selectedPlace.description); // Set place_id in Data field
//                                 frm.set_value(place_id_field, selectedPlace.place_id);
                                    
                                                        
//                             }
//                             if(selectedText == "Your Location")
//                             {
//                                 console.log("Your Location");
//                                 console.log(navigator);
                              


//                             // Flags to prevent repeated actions
//                             let locationFetched = false;
//                             let locationErrorShown = false;

//                             // Only run if we haven't already fetched location
//                             if (!locationFetched && navigator.geolocation) {
//                                 navigator.geolocation.getCurrentPosition(
//                                     // ✅ Success: Location fetched
//                                     function (position) {
//                                         locationFetched = true; // Prevent re-running

//                                         const lat = position.coords.latitude;
//                                         const lon = position.coords.longitude;

//                                         const userLocation = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
//                                         console.log("User Location:", userLocation);

//                                         // You can now use userLocation in your suggestions or other logic
//                                     },

//                                     // ❌ Error: Could not get location
//                                     function (error) {
//                                         if (!locationErrorShown) {
//                                             locationErrorShown = true; // Show message only once

//                                             let errorMessage = '';

//                                             if (error.code === error.PERMISSION_DENIED) {
//                                                 errorMessage = "Location access is denied. Please turn it on and allow access.";
//                                             } else if (error.code === error.POSITION_UNAVAILABLE) {
//                                                 errorMessage = "Unable to find your location. Please check your network or try again.";
//                                             } else if (error.code === error.TIMEOUT) {
//                                                 errorMessage = "Location request timed out. Please try again.";
//                                             } else {
//                                                 errorMessage = "Something went wrong while getting your location.";
//                                             }

//                                             frappe.throw(errorMessage);
//                                         }
//                                     },

//                                     // Optional settings
//                                     {
//                                         enableHighAccuracy: true,
//                                         timeout: 10000, // 10 seconds
//                                         maximumAge: 0
//                                     }
//                                 );
//                             } else if (!navigator.geolocation && !locationErrorShown) {
//                                 // Geolocation not supported in browser
//                                 locationErrorShown = true;
//                                 frappe.msgprint("Your browser does not support location access.");
//                             }

//                             }
//                         });
//                     }
//                 });
//             }
//         });
//     });
// }



function attachOlaAutocomplete(frm, fields) {
    fields.forEach(({ field, place_id_field }) => {
        const input = frm.fields_dict[field].$wrapper.find('input');

        input.on('input', frappe.utils.debounce(function () {
            let inputValue = $(this).val();
            if (inputValue.length >= 0) {
                fetchOlaPlaceDetails(inputValue, function (data) {
                    if (data && data.length) {
                        let suggestions = data.map(place => ({
                            label: place.description,
                            value: place.description
                        }));

                        suggestions.unshift({
                            label: "📍 Your Location",
                            value: "Your Location"
                        });

                        frm.fields_dict[field].set_data(suggestions);

                        // Store place details for later reference
                        input.data('place-data', data);
                    }
                });
            }
        }, 300)); // debounce added to limit API calls

        // Handle selection
        input.on('awesomplete-selectcomplete', function (e) {
            let selectedText = $(this).val();
            let data = $(this).data('place-data') || [];

            if (selectedText === "Your Location") {
                if (!navigator.geolocation) {
                    frappe.msgprint("Your browser does not support location access.");
                    return;
                }
            
                // Get API key using .then()
                frappe.db.get_single_value('Map Setting', 'api_key')
                    .then(function (apiKey) {
                        console.log("Fetched API Key:", apiKey);
            
                        navigator.geolocation.getCurrentPosition(
                            function (position) {
                                const lat = position.coords.latitude;
                                const lon = position.coords.longitude;
                                const userLocation = `${lat.toFixed(9)}, ${lon.toFixed(9)}`;
                                console.log("User Location:", userLocation);
            
                                // Call getAddressFromCoordinates using .then()
                                getAddressFromCoordinates(lat, lon, apiKey)
                                    .then(function (result) {
                                        const { address, place_id } = result;
                                        frm.set_value(field, address || userLocation);
                                        frm.set_value(place_id_field, place_id || "UNKNOWN_PLACE_ID");
                                    })
                                    .catch(function (error) {
                                        console.error("Error fetching address:", error);
                                        frm.set_value(field, userLocation);
                                        frm.set_value(place_id_field, "CURRENT_LOCATION");
                                    });
                            },
                            function (error) {
                                let errorMessage = '';
                                switch (error.code) {
                                    case error.PERMISSION_DENIED:
                                        errorMessage = "Location access is denied. Please allow access.";
                                        break;
                                    case error.POSITION_UNAVAILABLE:
                                        errorMessage = "Location unavailable. Please check your network.";
                                        break;
                                    case error.TIMEOUT:
                                        errorMessage = "Location request timed out.";
                                        break;
                                    default:
                                        errorMessage = "Unable to get your location.";
                                }
                                frappe.throw(errorMessage);
                            }
                        );
                    })
                    .catch(function (err) {
                        console.error("Error getting API key:", err);
                        frappe.throw("Unable to fetch API key or location.");
                    });
            
            } else {
                let selectedPlace = data.find(place => place.description === selectedText);
                if (selectedPlace) {
                    frm.set_value(field, selectedPlace.description);
                    frm.set_value(place_id_field, selectedPlace.place_id);
                }
            }
            
        });
    });
}
    




function fetchOlaPlaceDetails(inputValue, callback) {
    if (!inputValue) return;

    frappe.db.get_single_value('Map Setting', 'api_key')
        .then(apiKey => {
            
            const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(inputValue)}&limit=10&api_key=${apiKey}`;

            return fetch(url);
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return response.json();
        })
        .then(result => {

            if (result && result.predictions) {
                callback(result.predictions);
            } else {
                frappe.msgprint(__('No data found for the entered location.'));
                callback([]);
            }
        })
        .catch(error => {
            console.error('Error fetching place details:', error);
            frappe.msgprint(__('Failed to fetch place details. Please try again later.'));
            callback([]);
        });
}



// add booking button to create booking from booking request
function add_booking_button(frm){
    const user_role = check_user_role()
    // if status is open and form is submitted then visible this button
    if(frm.doc.status == "Open" && frm.doc.docstatus == 1 && user_role==true){
        // add custom button create booking
        frm.add_custom_button("Booking",function(){
            // create new booking
            frappe.new_doc("Booking",{
                "booking_request":frm.doc.name
            })
        },"Create")
    }

}


// add booking button to create booking from booking request
function create_vehicle_for_request(frm){
    // if status is open and form is submitted then visible this button
    if(frm.doc.status == "Open" && frm.doc.docstatus == 1){
        // add custom button create booking
        frm.add_custom_button("Vehicle Request",function(){
            // create new booking
            frappe.new_doc("Request for Vehicle",{
                "booking_request":frm.doc.name
            })
        },"Create")
    }

}

// check user role is system manager or not
function check_user_role() {
    if(frappe.user.has_role("System Manager")) {
        return true
    } else {
        return false
    }
}


// Also define this globally if needed
window.getAddressFromCoordinates = async function(lat, lon, apiKey) {
    const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lon}&api_key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Request-Id': 'location-lookup-' + Date.now()
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ola Maps API Response:", data);

        if (data?.results?.length > 0) {
            const firstResult = data.results[0];
            return {
                address: firstResult.formatted_address,
                place_id: firstResult.place_id
            };
        } else {
            throw new Error("No results found in Ola Maps API response.");
        }
    } catch (error) {
        console.error("Error fetching address:", error);
        throw error;
    }
};