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


function attachOlaAutocomplete(frm, fields) {
    fields.forEach(({ field, place_id_field }) => {
        frm.fields_dict[field].$wrapper.find('input').on('input', function () {
            let inputValue = $(this).val();
            if (inputValue.length > 2) {
                fetchOlaPlaceDetails(inputValue, function (data) {
                    if (data && data.length) {
                        let suggestions = data.map(place => place.description);


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

function fetchOlaPlaceDetails(inputValue, callback) {
    if (!inputValue) return;

    frappe.db.get_single_value('Map Setting', 'api_key')
        .then(apiKey => {
            
            const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(inputValue)}&api_key=${apiKey}`;

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
    console.log(user_role);
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
