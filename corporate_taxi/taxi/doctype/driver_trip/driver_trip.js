// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Driver Trip", {
     // Update the form title whenever the status changes
     status: function(frm) {
        update_form_title(frm);
    },
    // onload: function(frm) {
        
    //     // Fetch the User document for the current logged-in user
    //     frappe.call({
    //         method: 'frappe.client.get',
    //         args: {
    //             doctype: 'User',
    //             name: frappe.session.user
    //         },
    //         callback: function(response) {
                
    //             if (response.message) {
    //                 // Check if the role profile name is "Driver"
    //                 let roleprofile_name = response.message.role_profile_name;
    //                     console.log(roleprofile_name);
    //                 if (roleprofile_name === 'Driver') {
    //                      frappe.call({
    //                         method: 'frappe.client.get_list',
    //                         args: {
    //                             doctype: 'Driver',
    //                             filters: {
    //                                 custom_user: frappe.session.user
    //                             },
    //                             fields: ['name', 'custom_user'] 
    //                         },
    //                         callback: function(driverResponse) {
    //                             console.log(driverResponse);
    //                             if (driverResponse.message && driverResponse.message.length > 0) {
    //                                 let driver = driverResponse.message[0].name; 
    //                                 frm.set_value('driver_id', driver);  
    //                             }
    //                         }
    //                     });
    //                 }
    //             }
    //         }
    //     });
    // },


    onload: function(frm) {
        frappe.call({
            method: 'corporate_taxi.taxi.doctype.driver_trip.driver_trip.get_driver_for_user',
            callback: function(response) {
                if (response.message && response.message.driver_id) {
                    frm.set_value('driver_id', response.message.driver_id);
                }
            }
        });
    },

    before_submit(frm){
        frm.set_value('trip_end', frappe.datetime.now_time());
        frm.set_value('status', "Completed");
            frm.refresh_field("trip_end")
    },

    before_save(frm) {
        // Ensure trip_end is NOT set during save (draft mode)
        if (frm.doc.docstatus === 0) {  // 0 = Draft
            frm.set_value('trip_end', "");  // Clear the field before save
            frm.refresh_field("trip_end");
        }
    },
    booking(frm) {
        frappe.call({
            method: "corporate_taxi.taxi.doctype.driver_trip.driver_trip.get_booking_details",
            args: {
                booking_name: frm.doc.booking,
                driver_id: frm.doc.driver_id
            },
            callback: function (r) {
                frm.clear_table("table_wupe");
    
                if (r.message) {
                    r.message.forEach(function (data) {
                        frm.add_child("table_wupe", {
                            "guest_name": data.guest_name,
                            "guest_phone_number": data.guest_phone_number,
                            "pick_up_location": data.pick_up_location,
                            "drop_off_location": data.drop_off_location,
                            "duty_type": data.duty_type,
                            "reference_id": data.reference_id,
                            "amount": data.amount
                        });
                    });
                }
    
                frm.refresh_field("table_wupe");
            }
        });
    },
     
    driver_id: function(frm) {
        frappe.call({
            method: "corporate_taxi.taxi.doctype.driver_trip.driver_trip.get_setted_driver_booking_id",
            args: {
                driver: frm.doc.driver_id,
            },
            callback: function(r) {
                console.log(r);
                if (r.message) {
                    
                   frm.set_query('booking', function() {
                        return {
                            filters: { name: ['in', r.message] }
                        };
                    });

                }

                setTimeout(() => {
                    
                }, 500);
            },
        });
        
    }
});


frappe.ui.form.on('Additional Charges', {
      // based on the item selection set item price in amount field
      charges_type:function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Item Price',
                filters: {
                    item_code: row.charges_type,
                    selling: 1
                },
                fieldname: 'price_list_rate'
            },
            callback: function(response) {
                if (response && response.message) {
                    frappe.model.set_value(cdt, cdn, 'price_per_kmhour', response.message.price_list_rate);
                }
            }
        });

    },
    extra_kmhour: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.total_extra_charges = row.extra_kmhour * row.price_per_kmhour;
        frappe.model.set_value(cdt, cdn, 'total_extra_charges', row.total_extra_charges);
        // Refresh the specific field in the child table
        frm.fields_dict.additional_charges.grid.refresh();
    }
    
})



    // Function to update the form title by appending the status
    function update_form_title(frm) {
        let status = frm.doc.status || 'Start'; // Default to 'Start' if status is not set
        let base_title = frm.doc.name; // Use the document name as the base title
        frm.set_title(`${base_title} - ${status}`);
    }