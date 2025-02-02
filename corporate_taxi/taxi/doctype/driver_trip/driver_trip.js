// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Driver Trip", {
     // Update the form title whenever the status changes
     status: function(frm) {
        update_form_title(frm);
    },

    on_submit(frm){
        frm.set_value('trip_end', frappe.datetime.now_time());
        frm.set_value('status', );
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
    
                // add new rows from the booking details where status is Open
                var book_details = r.message.booking_details;
                book_details.forEach(function (data) {
                    if (data.status == "Open") {  
                        frm.add_child("table_wupe", {
                            "guest_name": data.guest_name,
                            "guest_phone_number": data.guest_phone_number,
                            "pick_up_location": data.pick_up_location,
                            "drop_off_location": data.drop_off_location,
                            "reference_id": data.name
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



    // Function to update the form title by appending the status
    function update_form_title(frm) {
        let status = frm.doc.status || 'Start'; // Default to 'Start' if status is not set
        let base_title = frm.doc.name; // Use the document name as the base title
        frm.set_title(`${base_title} - ${status}`);
    }