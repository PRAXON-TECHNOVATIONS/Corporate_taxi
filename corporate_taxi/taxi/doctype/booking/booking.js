// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt


var unavailable_drivers = {};
var unavailable_vehicle = {}

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


    //    Set the get_query function for the 'vehicle' field in the child table
        frm.fields_dict.booking_details.grid.get_field('vehicle').get_query = function(doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            fetch_available_vehicles(frm, row)
            return {
                filters: {
                    custom_vehicle_type: row.vehicle_type || '' // Filter vehicles based on the selected vehicle_type
                }
            };
        };

       
        // frm.fields_dict.booking_details.grid.get_field('vehicle').get_query = function(doc, cdt, cdn) {
        //     let current_row = locals[cdt][cdn];
        //     return {
        //         filters: unavailable_vehicle[current_row.name]
        //             ? { name: ['in', unavailable_vehicle[current_row.name]] }
        //             : {}
        //     };
        // };
        

        // // Apply the dynamic filter globally before making any API calls
        // frm.fields_dict.booking_details.grid.get_field('driver').get_query = function(doc, cdt, cdn) {
        //     let current_row = locals[cdt][cdn];
        //     return {
        //         filters: current_row && unavailable_drivers[current_row.name]
        //             ? { name: ['not in', unavailable_drivers[current_row.name]] }
        //             : {}
        //     };
        // };
        
       
       



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
        // if (frm.doc.status != "Completed") {
        //     frm.add_custom_button(__('Create Invoice'), function() {
        //         let customer_name = frm.doc.customer;
        //         let total_amount = frm.doc.total_amount - frm.doc.paid_amount;
    
        //         // Create a new Sales Invoice
        //         frappe.model.with_doctype('Sales Invoice', function() {
        //             let invoice = frappe.model.get_new_doc('Sales Invoice');
        //             invoice.customer = customer_name;
        //             invoice.custom_reference_booking_id = frm.doc.name;
    
        //             // Add item to the child table
        //             let item = frappe.model.add_child(invoice, 'items');
        //             item.item_code = 'Ride Charges';
        //             item.qty = 1;
        //             item.rate = total_amount;
    
        //             frm.script_manager.trigger('item_code', item.doctype, item.name);
        //             // Open the new Sales Invoice form
        //             frappe.set_route('Form', 'Sales Invoice', invoice.name);
        //         });
        //     });
        // }

        if (frm.doc.status != "Completed") {
            frm.add_custom_button(__('Create Invoice'), function() {
                let customer_name = frm.doc.customer;
                let total_amount = frm.doc.total_amount - frm.doc.paid_amount;
        
                // Create a new Sales Invoice
                frappe.model.with_doctype('Sales Invoice', function() {
                    let invoice = frappe.model.get_new_doc('Sales Invoice');
                    invoice.customer = customer_name;
                    invoice.custom_reference_booking_id = frm.doc.name;
        
                    // Add items for extra charges from the child table
                    $.each(frm.doc.extra_charges || [], function(index, charge) {
                        let charge_item = frappe.model.add_child(invoice, 'items');
                        
                        // Set the item code and quantity first
                        charge_item.item_code = charge.charges_type;  // 'charges_type' is the item code
                        charge_item.qty = 1;  // Default quantity
                    });
        
                   setTimeout(() => {
                         // Now loop through the items and set the rate after the row is added
                    $.each(invoice.items || [], function(index, item) {
                        let charge = frm.doc.extra_charges[index];
                        if (item.item_code === charge.charges_type) {
                            // Set the rate after matching the item code
                            item.price_list_rate = null;  // Explicitly set price_list_rate to null to prevent fetching from the price list
                            item.rate = charge.price;  // Set the custom rate
                            
                            // Set the amount manually
                            item.amount = item.qty * item.rate;
                        }
                    });
                   }, 2000);    
        
                    // Open the new Sales Invoice form
                    frappe.set_route('Form', 'Sales Invoice', invoice.name);
                });
            });
        }
        
        
    


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

    // based on the item selection set item price in amount field
    duty_type:function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Item Price',
                filters: {
                    item_code: row.duty_type,
                    selling: 1
                },
                fieldname: 'price_list_rate'
            },
            callback: function(response) {
                if (response && response.message) {
                    frappe.model.set_value(cdt, cdn, 'amount', response.message.price_list_rate);
                }
            }
        });

    },
    vehicle_type: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.vehicle_type && row.from_date_time && row.to_date_time) {
            frappe.call({
                method: "corporate_taxi.taxi.doctype.booking.booking.get_available_vehicles",
                args: {
                    vehicle_type: row.vehicle_type,
                    from_datetime: row.from_date_time,
                    to_datetime: row.to_date_time,
                },
                callback: function(r) {
                    if (r.message) {
                        unavailable_vehicle[cdn] = r.message;
                        frm.fields_dict.booking_details.grid.get_field('vehicle').refresh();
                    }
                },
            });
        }
    },
    // vehicle: function(frm, cdt, cdn) {
       


    //     let row = locals[cdt][cdn];
    // if (row.vehicle && row.from_date_time && row.to_date_time) {
    //     frappe.call({
    //         method: "corporate_taxi.taxi.doctype.booking.booking.get_available_drivers",
    //         args: {
    //             vehicle:row.vehicle,
    //             from_datetime: row.from_date_time,
    //             to_datetime: row.to_date_time,
    //         },
    //         callback: function(r) {
    //             if (r.message) {
    //                 unavailable_drivers[cdn] = r.message;
    //                 frm.fields_dict.booking_details.grid.get_field('driver').refresh();
    //             }
    //         },
    //     });
    // }
    // },

    // Call this function when any of the fields change
        // vehicle: function(frm, cdt, cdn) {
        //     check_available_drivers(frm, cdt, cdn);
        // },

        // from_date_time: function(frm, cdt, cdn) {
        //     check_available_drivers(frm, cdt, cdn);
        // },

        // to_date_time: function(frm, cdt, cdn) {
        //     check_available_drivers(frm, cdt, cdn);
        // },


    
        
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




    frappe.ui.form.on('Extra Charges', {
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
                        frappe.model.set_value(cdt, cdn, 'price', response.message.price_list_rate);
                    }
                }
            });

        },
    })

// A general function to check availability based on vehicle, from_date_time, and to_date_time
// function check_available_drivers(frm, cdt, cdn) {
//     console.log("call function--------------================");
//     let row = locals[cdt][cdn];

//     // Check if all required fields are available
//     if (row.vehicle && row.from_date_time && row.to_date_time) {
//         frappe.call({
//             method: "corporate_taxi.taxi.doctype.booking.booking.get_available_drivers",
//             args: {
//                 vehicle: row.vehicle,
//                 from_datetime: row.from_date_time,
//                 to_datetime: row.to_date_time,
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     unavailable_drivers[cdn] = r.message;
//                     frm.fields_dict.booking_details.grid.get_field('driver').refresh();
//                 }
//             },
//         });
//     }
// }
    



