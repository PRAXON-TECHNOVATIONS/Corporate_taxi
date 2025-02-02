// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Driver Trip", {
 
    on_submit(frm){
        frm.set_value('trip_end', frappe.datetime.now_time());
            frm.refresh_field("trip_end")
    },

    before_save(frm) {
        // Ensure trip_end is NOT set during save (draft mode)
        if (frm.doc.docstatus === 0) {  // 0 = Draft
            frm.set_value('trip_end', "");  // Clear the field before save
            frm.refresh_field("trip_end");
        }
    },
    booking(frm){
        frappe.call({
            method:"frappe.client.get",
            args:{
                doctype:"Booking",
                name:frm.doc.booking,
            },
            callback:function(r){
                frm.clear_table("table_wupe");

                // Add new rows from the booking details
                var book_details = r.message.booking_details;
                book_details.forEach(function(data) {
                    frm.add_child("table_wupe", {
                        "guest_name": data.guest_name,
                        "guest_phone_number": data.guest_phone_number,
                        "pick_up_location": data.pick_up_location,
                        "drop_off_location": data.drop_off_location,
                        "reference_id":data.name
                    });
                });
        
                // Refresh the table to reflect the changes
                frm.refresh_field("table_wupe");
            }
        })
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
