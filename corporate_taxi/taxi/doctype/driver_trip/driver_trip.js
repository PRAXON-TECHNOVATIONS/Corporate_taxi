// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Driver Trip", {
     // Update the form title whenever the status changes
     status: function(frm) {
        update_form_title(frm);
    },
    

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
    refresh:function(frm){
        view_map(frm)
        //set item only one row in whole table
        add_item_only_once(frm)
    },
    start_km:function(frm){
        calckm(frm)
    },
    end_km:function(frm){
        calckm(frm)
    },

    before_submit(frm){
        // frm.set_value('trip_end', frappe.datetime.now_time());
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
    
    driver_id: function(frm) {
        frappe.call({
            method: "corporate_taxi.taxi.doctype.driver_trip.driver_trip.get_setted_driver_booking_id",
            args: {
                driver: frm.doc.driver_id,
            },
            callback: function(r) {
                
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
        let status = frm.doc.status || 'Start'; 
        let base_title = frm.doc.name; 
        frm.set_title(`${base_title} - ${status}`);
    }


    function calckm(frm){
        var start_km = frm.doc.start_km
        var end_km = frm.doc.end_km

        if(start_km > end_km){
            frappe.throw("Start KM is not bigger then End KM")
        }
        else if(start_km && end_km)
        {
            total = end_km - start_km
            frm.set_value("total_km",total)
        }
    }


    function view_map(frm) {
        frm.add_custom_button(__('View Map'), function() {
            if (frm.doc.pick_up_location && frm.doc.drop_off_location) {
                let url = `/driver_map?driver=${encodeURIComponent(frm.doc.driver_id)}&pick_up=${encodeURIComponent(frm.doc.pick_up_location_place_id)}&drop_off=${encodeURIComponent(frm.doc.drop_off_location_place_id)}`;
                window.open(url, '_blank');
            } else {
                frappe.msgprint(__('Please select both Pick-up and Drop-off locations.'));
            }
        }).addClass('btn-primary');

        
    }



// set item in child table only one row of whole table
    function add_item_only_once(frm){
        frm.fields_dict['additional_charges'].grid.get_field('charges_type').get_query = function(doc, cdt, cdn) {
            var selected_items = [];
    
            // Loop through the items in the child table to collect already selected items
            frm.doc.additional_charges.forEach(function(item_row) {
                if (item_row.charges_type) {
                    selected_items.push(item_row.charges_type);
                }
            });
            // Filter out selected items from the Link field in the current row
            return {
                filters: {
                    'name': ['not in', selected_items],
                    'item_group':'Extra Charges'
                }
            };
        };
    
    }
    


