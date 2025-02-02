// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt


var unavailable_drivers = {};

frappe.ui.form.on("Booking", {

    onload: function(frm) {
        // Set the get_query function for the 'vehicle' field in the child table
        // frm.fields_dict.booking_details.grid.get_field('vehicle').get_query = function(doc, cdt, cdn) {
        //     let row = locals[cdt][cdn];
        //     console.log(driver_vehicle_lists[cdn]);
        //     // Check if the row has a stored vehicle list
        //     if (driver_vehicle_lists[cdn]) {
        //         return { filters: { name: ['in', driver_vehicle_lists[cdn]] } };
        //     } else {
        //         return { filters: { name: ['!=', ''] } };
        //     }
        // };   


       // Set the get_query function for the 'vehicle' field in the child table
        frm.fields_dict.booking_details.grid.get_field('vehicle').get_query = function(doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            fetch_available_vehicles(frm, row)
            return {
                filters: {
                    custom_vehicle_type: row.vehicle_type || '' // Filter vehicles based on the selected vehicle_type
                }
            };
        };

       
        

        // Apply the dynamic filter globally before making any API calls
        frm.fields_dict.booking_details.grid.get_field('driver').get_query = function(doc, cdt, cdn) {
            let current_row = locals[cdt][cdn];
            return {
                filters: current_row && unavailable_drivers[current_row.name]
                    ? { name: ['not in', unavailable_drivers[current_row.name]] }
                    : {}
            };
        };
        
       
       



        // Set the get_query function for the 'driver' field in the child table
// frm.fields_dict.booking_details.grid.get_field('driver').get_query = function(doc, cdt, cdn) {
//     let row = locals[cdt][cdn];

//     // Ensure from_date_time and to_date_time are set
//     if (row.from_date_time && row.to_date_time) {
//         return new Promise((resolve) => {
//             frappe.call({
//                 method: 'corporate_taxi.taxi.doctype.booking.booking.get_available_drivers',
//                 args: {
//                     from_datetime: row.from_date_time,
//                     to_datetime: row.to_date_time
//                 },
//                 callback: function(response) {
//                     console.log(response);
//                     let booked_drivers = response.message || [];

//                     resolve({
//                         filters: {
//                             name: ['not in', booked_drivers] // Exclude booked drivers
//                         }
//                     });
//                 }
//             });
//         });
//     } else {
//         // If no date range is selected, show all drivers
//         return {
//             filters: {
//                 name: ['!=', '']
//             }
//         };
//     }
// };

      
    
    },
    // refresh: function(frm) {

    //   if(frm.doc.status != "Completed"){
    //        // add btn for create invoice
    //        frm.add_custom_button(__('Create Invoice'), function() {
    //         let customer_name = frm.doc.customer;
    //         let total_amount = frm.doc.total_amount - frm.doc.paid_amount;

    //         // open new sales invoice with form details
    //         frappe.new_doc('Sales Invoice', {
    //             customer: customer_name,
    //             custom_reference_booking_id:frm.doc.name,
    //             items: [
    //                 {
    //                     item_code: 'Ride Charges',  
    //                     qty: 1,  
    //                     rate: total_amount  
    //                 }
    //             ]
                
    //         });

    //     });
    //   }

    refresh: function(frm) {
    //     if (frm.doc.status != "Completed") {
    //         frm.add_custom_button(__('Create Invoice'), function() {
    //             let customer_name = frm.doc.customer;
    //             let total_amount = frm.doc.total_amount - frm.doc.paid_amount;
    
    //             // Create a new Sales Invoice
    //             frappe.model.with_doctype('Sales Invoice', function() {
    //                 let invoice = frappe.model.get_new_doc('Sales Invoice');
    //                 invoice.customer = customer_name;
    //                 invoice.custom_reference_booking_id = frm.doc.name;
    
    //                 // Add item to the child table
    //                 let item = frappe.model.add_child(invoice, 'items');
    //                 item.item_code = 'Ride Charges';
    //                 item.qty = 1;
    //                 item.rate = total_amount;
    
    //                 frm.script_manager.trigger('item_code', item.doctype, item.name);
    //                 // Open the new Sales Invoice form
    //                 frappe.set_route('Form', 'Sales Invoice', invoice.name);
    //             });
    //         });
    //     }
    


        frm.set_query('booking_request', function() {
            return {
                filters: {
                    'docstatus': 1,
                    'status': ["!=","Booked"],

                }
            };
        });
    },

    booking_request(frm) {
        var booking_req_id = frm.doc.booking_request;
    
        if (!booking_req_id) return;
    
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Booking Request",
                name: booking_req_id
            },
            callback: function(res) {
                if (res.message) {
                    frm.clear_table("booking_details");
                    res.message.booking_request_details.forEach(data => {
                        if (data.status === "Open") {  // Filter for 'Open' status only
                            frm.add_child("booking_details", {
                                guest_name: data.guest_name,
                                guest_phone_number: data.guest_phone_number,
                                vehicle_type: data.vehicle_type,
                                from_date_time: data.from_date_time,
                                to_date_time: data.to_date_time,
                                pick_up_location: data.pick_up_location,
                                drop_off_location: data.drop_off_location,
                                trip_type: data.trip_type,
                                reference_id: data.name
                            });
                        }
                    });
                    frm.refresh_field("booking_details");
                }
            }
        });
    },     
    before_save(frm){
        // set calculation for Total Amount
        calculate_total(frm)
        
    }
});

// calculate the total amount
function calculate_total(frm) {
    let total = 0;
    frm.doc.booking_details.forEach(item => {
        total += item.amount || 0;
    });

    frm.set_value('total_amount', total);
}


// let unavailable_drivers = {};  // Global object to store unavailable drivers
// let unavailable_vehicles = {}; // Global object to store unavailable vehicles

frappe.ui.form.on('Booking Form Details', {

    vehicle: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.from_date_time && row.to_date_time) {
            frappe.call({
                method: "corporate_taxi.taxi.doctype.booking.booking.get_available_drivers",
                args: {
                    from_datetime: row.from_date_time,
                    to_datetime: row.to_date_time,
                },
                callback: function(r) {
                    if (r.message) {
                        unavailable_drivers[cdn] = r.message;
                        frm.fields_dict.booking_details.grid.get_field('driver').refresh();
                    }
                },
            });
        }
    },


    
        // Trigger when vehicle_type is selected
        vehicle_type: function(frm, cdt, cdn) {
            let row = locals[cdt][cdn];
            if (row.from_date_time && row.to_date_time) {
                fetch_available_vehicles(frm, row);
            }
        },
    
        // Trigger when vehicle is selected to fetch available drivers
       
    });
    
    // // Function to fetch available vehicles
    // function fetch_available_vehicles(frm, row) {
    //     console.log(row);
    //     console.log("========================================");
    //     frappe.call({
    //         method: "corporate_taxi.taxi.doctype.booking.booking.get_available_vehicles",
    //         args: {
    //             vehicle_type: row.vehicle_type,
    //             from_datetime: row.from_date_time,
    //             to_datetime: row.to_date_time,
    //         },
    //         callback: function(r) {
    //             console.log(r);
    //             if (r.message) {
    //                 row.available_vehicles = r.message;
    //                 frm.fields_dict.booking_details.grid.get_field('vehicle').refresh();
    //             }
    //         }
    //     });
    // }




    // Function to fetch available vehicles
function fetch_available_vehicles(frm, row) {
    console.log(row);
    console.log("========================================");
    frappe.call({
        method: "corporate_taxi.taxi.doctype.booking.booking.get_available_vehicles",
        args: {
            vehicle_type: row.vehicle_type,
            from_datetime: row.from_date_time,
            to_datetime: row.to_date_time,
        },
        callback: function(r) {
            console.log(r);
            if (r.message) {
                console.log(r.message);
                // Set available vehicles in the row object
                row.available_vehicles = r.message;
                
                // Refresh the field in the grid
                frm.fields_dict.booking_details.grid.get_field('vehicle').refresh();

                // Optionally, you can set the options for the 'vehicle' field directly if needed
                frm.fields_dict.booking_details.grid.get_field('vehicle').set_options(r.message.join("\n"));
            }
        }
    });
}

    



