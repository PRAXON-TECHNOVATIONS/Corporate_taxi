// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Driver Trip", {
     // Update the form title whenever the status changes
     status: function(frm) {
        update_form_title(frm);
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
            method: "frappe.client.get",
            args: {
                doctype: "Booking",
                name: frm.doc.booking,
            },
            callback: function (r) {
                frm.clear_table("table_wupe");
    
                // Add new rows from the booking details where status is Open and driver matches
                var book_details = r.message.booking_details;
                book_details.forEach(function (data) {
                    if (data.status == "Open" && data.driver == frm.doc.driver_id) {  
                        frm.add_child("table_wupe", {
                            "guest_name": data.guest_name,
                            "guest_phone_number": data.guest_phone_number,
                            "pick_up_location": data.pick_up_location,
                            "drop_off_location": data.drop_off_location,
                            "duty_type": data.duty_type,
                            "reference_id": data.name,
                            "amount":data.amount
                        });
                    }
                });
    
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
                    let booking_list = r.message.map(item => item.parent);
                    
                   frm.set_query('booking', function() {
                        return {
                            filters: { name: ['in', booking_list] }
                        };
                    });
                }
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