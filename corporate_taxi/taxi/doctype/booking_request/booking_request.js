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
    // refresh:function(frm){
    //     setTimeout(() => {
    //         attachOlaAutocomplete(frm, ['pick_up_location', 'drop_off_location','location_1','location_2']);
    //     }, 500); 
    //    }

    refresh: function(frm) {
        setTimeout(() => {
            attachOlaAutocomplete(frm, [
                { field: 'pick_up_location', place_id_field: 'pick_up_location_place_id' },
                { field: 'drop_off_location', place_id_field: 'drop_off_location_place_id' },
                { field: 'location_1', place_id_field: 'location_1_place_id' },
                { field: 'location_2', place_id_field: 'location_2_place_id' }
            ]);
        }, 500);
    }


});



// function attachOlaAutocomplete(frm, fieldnames) {
//     fieldnames.forEach(fieldname => {
//         frm.fields_dict[fieldname].$wrapper.find('input').on('input', function () {
//             let placeId = $(this).val();
//             if (placeId.length > 2) {
//                 fetchOlaPlaceDetails(placeId, function (data) {
//                     if (data && data.length) {
//                         let suggestions = data.map(place => place.description);
//                         console.log(suggestions);
//                         frm.fields_dict[fieldname].set_data(suggestions);
//                     }
//                 });
//             }
//         });
//     });
// }


// async function fetchOlaPlaceDetails(placeId, callback) {
//     if (!placeId) return;

//     const apiKey = "aOiY35G2qUrtTRaLE7cN9Yfct0m4tJar6LvMaGKR"; // Load API key securely from backend
//     const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(placeId)}&api_key=${apiKey}`;

//     try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

//         const result = await response.json();
//         console.log('API Response:', result);

//         if (result && result.predictions) {
//             callback(result.predictions);
//         } else {
//             frappe.msgprint(__('No data found for the entered location.'));
//             callback([]);
//         }
//     } catch (error) {
//         console.error('Error fetching place details:', error);
//         frappe.msgprint(__('Failed to fetch place details. Please try again later.'));
//         callback([]);
//     }
// }




function attachOlaAutocomplete(frm, fields) {
    fields.forEach(({ field, place_id_field }) => {
        frm.fields_dict[field].$wrapper.find('input').on('input', function () {
            let inputValue = $(this).val();
            if (inputValue.length > 2) {
                fetchOlaPlaceDetails(inputValue, function (data) {
                    if (data && data.length) {
                        let suggestions = data.map(place => place.description);

                        console.log('Suggestions:', suggestions);

                        // Set suggestions in the Autocomplete field
                        frm.fields_dict[field].set_data(suggestions);

                        // Store the place_id when a user selects a suggestion
                        frm.fields_dict[field].$wrapper.find('input').on('change', function () {
                            let selectedText = $(this).val();
                            let selectedPlace = data.find(place => place.description === selectedText);

                            if (selectedPlace) {
                                frm.set_value(place_id_field, selectedPlace.place_id); // Set place_id in Data field
                            }
                        });
                    }
                });
            }
        });
    });
}

async function fetchOlaPlaceDetails(inputValue, callback) {
    if (!inputValue) return;

    const apiKey = "aOiY35G2qUrtTRaLE7cN9Yfct0m4tJar6LvMaGKR"; // Load API key securely from backend
    const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(inputValue)}&api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const result = await response.json();
        console.log('API Response:', result);

        if (result && result.predictions) {
            callback(result.predictions);
        } else {
            frappe.msgprint(__('No data found for the entered location.'));
            callback([]);
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        frappe.msgprint(__('Failed to fetch place details. Please try again later.'));
        callback([]);
    }
}

