// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt


var unavailable_drivers = {};
var unavailable_vehicle = {}

frappe.ui.form.on("Booking", {

    // onload: function(frm) {
    
    //   setTimeout(() => {
    //     console.log("Vehicle List======================");
    //     console.log(unavailable_vehicle);
    //     frm.set_query('vehicle', function(doc) {
    //         return {
    //             filters: Object.assign(
    //                 unavailable_vehicle[doc.name]
    //                     ? { name: ['in', unavailable_vehicle[doc.name]] }
    //                     : {},
    //                 { custom_vehicle_type: doc.vehicle_type }
    //             )
    //         };
    //     });

    //     frm.set_query('driver', function(doc) {
    //         return {
    //             filters: doc && unavailable_drivers[doc.name]
    //                 ? { name: ['in', unavailable_drivers[doc.name]] }
    //                 : {}
    //         };
    //     });
    //   }, 1500);
        
        
       
    
      
    
    // },


    onload: function(frm) {
        setTimeout(() => {
            check_available_vehicles(frm);
            check_available_drivers(frm);
        }, 1000);


        if(frm.is_new()){
            frm.set_value("status","To Bill")
        }
    },
    refresh: function(frm) {
        check_available_vehicles(frm);
        check_available_drivers(frm);
    },
    booking_request: function(frm) {
        check_available_vehicles(frm);
        check_available_drivers(frm);
    },
    vehicle_type: function(frm) {
        check_available_vehicles(frm);
    },
    from_date_time: function(frm) {
        check_available_vehicles(frm);
        check_available_drivers(frm);
    },
    to_date_time: function(frm) {
        check_available_vehicles(frm);
        check_available_drivers(frm);
    },
    refresh: function(frm) {
       
        // hide row for particular driver user
            // frm.fields_dict['booking_details'].grid.grid_rows.forEach(row => {
            //     let child = row.doc;
                
            //     frappe.call({
            //         method: 'corporate_taxi.taxi.doctype.driver_trip.driver_trip.get_driver_for_user',
            //         callback: function(response) {
            //             if (child.driver !== response.message.driver_id) {
            //                 row.wrapper.hide();  
            //             }
            //             else{
            //                 row.wrapper.show();
            //             }
            //         }
            //     })
            // });
     


            if (
                frm.doc.status != "Completed" &&
                (frappe.user.has_role("Supplier") ||
                 frappe.user.has_role("System Manager") ||
                 frappe.user.has_role("Accounts User") ||
                 frappe.user.has_role("Accounts Manager"))
            ) {
            // frm.add_custom_button(__('Create Invoice'), function() {
            //     let customer_name = frm.doc.customer;
            //     let total_amount = frm.doc.total_amount - frm.doc.paid_amount;
        
            //     // Create a new Sales Invoice
            //     frappe.model.with_doctype('Sales Invoice', function() {
            //         let invoice = frappe.model.get_new_doc('Sales Invoice');
            //         invoice.customer = customer_name;
            //         invoice.custom_reference_booking_id = frm.doc.name;
        
            //         // Add items for extra charges from the child table
            //         $.each(frm.doc.extra_charges_details || [], function(index, charge) {
            //             let charge_item = frappe.model.add_child(invoice, 'items');
        
            //             // Set the item code and quantity first
            //             charge_item.item_code = charge.extra_charges_type;  // 'charges_type' is the item code
            //             charge_item.qty = 1;  // Default quantity
            //             charge_item.price_list_rate = 0;  // Set price list rate to 0
            //             charge_item.ignore_pricing_rule = 1; // Ignore pricing rules
            //         });
        
            //         setTimeout(() => {
            //             // Now loop through the items and set the rate after the row is added
            //             $.each(invoice.items || [], function(index, item) {
            //                 let charge = frm.doc.extra_charges[index];
            //                 if (item.item_code === charge.charges_type) {
            //                     frappe.model.set_value(item.doctype, item.name, 'rate', charge.price);
            //                     frappe.model.set_value(item.doctype, item.name, 'amount', item.qty * charge.price);
            //                 }
            //             });
            //         }, 1000);
        

            //         setTimeout(() => {
            //             $.each(cur_frm.doc.items || [], function(index, row) {
            //                 cur_frm.script_manager.trigger('item_code', row.doctype, row.name);
            //             });
                        
            //         }, 1000);
            //         // Open the new Sales Invoice form
            //         frappe.set_route('Form', 'Sales Invoice', invoice.name);
            //     });
            // });



            



            frm.add_custom_button(__('Create Invoice'), function() {
                let customer_name = frm.doc.customer;
                let total_amount = frm.doc.total_amount - frm.doc.paid_amount;
            
                frappe.model.with_doctype('Sales Invoice', function() {
                    let invoice = frappe.model.get_new_doc('Sales Invoice');
                    invoice.customer = customer_name;
                    invoice.custom_reference_booking_id = frm.doc.name;
            
                    // Add items for extra charges from the child table
                    $.each(frm.doc.extra_charges_details || [], function(index, charge) {
                        let charge_item = frappe.model.add_child(invoice, 'items');
                        
                        charge_item.item_code = charge.extra_charges_type;  // 'charges_type' is the item code
                        charge_item.qty = 1;  // Default quantity
                        charge_item.rate = charge.price; // Manually setting rate
                        charge_item.amount = charge.price; // Manually setting amount
                        charge_item.custom_booking = charge.parent
                        charge_item.custom_extracharges_id = charge.name
                        charge_item.price_list_rate = 0;  // Set price list rate to 0
                        charge_item.ignore_pricing_rule = 1; // Ignore pricing rules
            
                        setTimeout(() => {
                            // Ensure values are saved immediately
                        frappe.model.set_value(charge_item.doctype, charge_item.name, 'rate', charge.price);
                        frappe.model.set_value(charge_item.doctype, charge_item.name, 'amount', charge.price);
                        }, 1000);
                    });
            
                    // Ensure system doesn't override the custom rates
                    $.each(invoice.items || [], function(index, item) {
                        frappe.model.set_value(item.doctype, item.name, 'price_list_rate', 0);
                        frappe.model.set_value(item.doctype, item.name, 'ignore_pricing_rule', 1);
                    });
            
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


   
    // booking_request(frm) {
    //     var booking_req_id = frm.doc.booking_request;
    
    //     if (!booking_req_id) return;
    
    //     frappe.call({
    //         method: "corporate_taxi.taxi.doctype.booking.booking.get_booking_request_details",
    //         args: {
    //             booking_request: frm.doc.booking_request
    //         },
    //         callback: function(res) {
    //             if (res.message) {
    //                 frm.clear_table("booking_details");
    //                 res.message.forEach(data => {
    //                     if (data.status === "Open") {
    //                         let child = frm.add_child("booking_details", {
    //                             guest_name: data.guest_name,
    //                             guest_phone_number: data.guest_phone_number,
    //                             from_date_time: data.from_date_time,
    //                             to_date_time: data.to_date_time,
    //                             pick_up_location: data.pick_up_location,
    //                             drop_off_location: data.drop_off_location,
    //                             trip_type: data.trip_type,
    //                             reference_id: data.name,
    //                             vehicle_type: data.vehicle_type
    //                         });
    //                     }
    //                 });
    //                 frm.refresh_field("booking_details");
    //             }
    //         }
    //     });


        
    // },


    booking_request(frm) {
        var booking_req_id = frm.doc.booking_request;
    
        if (!booking_req_id) return;
    
        frappe.call({
            method: "corporate_taxi.taxi.doctype.booking.booking.get_booking_request",
            args: {
                booking_request: frm.doc.booking_request
            },
            callback: function(res) {
                if (res.message) {
                   console.log(res.message);
                   console.log(res.message.guest_phone_number);
                   frm.set_value("guest_phone_number",res.message.guest_phone_number)
                }
            }
        });




        
        
    },
    duty_type: function(frm) {

        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Item Price',
                filters: {
                    item_code: frm.doc.duty_type,
                    selling: 1
                },
                fieldname: 'price_list_rate'
            },
            callback: function(response) {
                if (response && response.message) {
                    frm.set_value("amount",response.message.price_list_rate)
                }
            }
        });
    },


    
    
    // before_save(frm){
    //     // set calculation for Total Amount
    //     calculate_total(frm)
        
    // }
});

// calculate the total amount
// function calculate_total(frm) {
//     let total = 0;
//     frm.doc.booking_details.forEach(item => {
//         total += item.amount || 0;
//     });

//     frm.set_value('total_amount', total);
// }


frappe.ui.form.on('Booking Form Details', {

    // Based on the item selection, set item price in amount field
    duty_type: function(frm, cdt, cdn) {
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
    booking_details_add:function(frm, cdt, cdn) {
      
        setTimeout(() => {
            check_available_vehicles(frm, cdt, cdn);
        }, 1000);
    },

    // Vehicle Type Change Event
    vehicle_type: function(frm, cdt, cdn) {
        check_available_vehicles(frm, cdt, cdn);
    },

    // Call this function when any of the fields change
    vehicle: function(frm, cdt, cdn) {
        check_available_drivers(frm, cdt, cdn);
    },

    from_date_time: function(frm, cdt, cdn) {
        check_available_drivers(frm, cdt, cdn);
        check_available_vehicles(frm, cdt, cdn);
    },

    to_date_time: function(frm, cdt, cdn) {
        check_available_drivers(frm, cdt, cdn);
        check_available_vehicles(frm, cdt, cdn);
    },

});

//function to check available drivers
function check_available_drivers(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (row.vehicle && row.from_date_time && row.to_date_time) {
        frappe.call({
            method: "corporate_taxi.taxi.doctype.booking.booking.get_available_drivers",
            args: {
                vehicle: row.vehicle,
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
}

//function to check available vehicles
function check_available_vehicles(frm, cdt, cdn) {
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
}

    


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



    frappe.ui.form.on('Extra Charges Details', {
        // based on the item selection set item price in amount field
        extra_charges_type:function(frm, cdt, cdn) {
            let row = locals[cdt][cdn];

            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'Item Price',
                    filters: {
                        item_code: row.extra_charges_type,
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







    // Function to check available vehicles
function check_available_vehicles(frm) {
    if (!frm.doc.vehicle_type || !frm.doc.from_date_time || !frm.doc.to_date_time) {
        return;
    }

    frappe.call({
        method: "corporate_taxi.taxi.doctype.booking.booking.get_available_vehicles",
        args: {
            vehicle_type: frm.doc.vehicle_type,
            from_datetime: frm.doc.from_date_time,
            to_datetime: frm.doc.to_date_time
        },
        callback: function(r) {
            if (r.message) {
                console.log(r.message);
                console.log("=============================");
                update_vehicle_query(frm, r.message);
            }
        }
    });
}

// Function to check available drivers
function check_available_drivers(frm) {
    if (!frm.doc.vehicle || !frm.doc.from_date_time || !frm.doc.to_date_time) {
        return;
    }

    frappe.call({
        method: "corporate_taxi.taxi.doctype.booking.booking.get_available_drivers",
        args: {
            vehicle: frm.doc.vehicle,
            from_datetime: frm.doc.from_date_time,
            to_datetime: frm.doc.to_date_time
        },
        callback: function(r) {
            if (r.message) {
                update_driver_query(frm, r.message);
            }
        }
    });
}

// Function to update vehicle query
function update_vehicle_query(frm, unavailable_vehicles) {
    console.log("Unavailable Vehicles:", unavailable_vehicles);

    frm.set_query('vehicle', function(doc) {
        return {
            filters: {
                name: ['in', unavailable_vehicles],
                custom_vehicle_type: doc.vehicle_type
            }
        };
    });

    frm.refresh_field('vehicle');
}

// Function to update driver query
function update_driver_query(frm, unavailable_drivers) {
    console.log("Unavailable Drivers:", unavailable_drivers);

    frm.set_query('driver', function(doc) {
        return {
            filters: {
                name: ['not in', unavailable_drivers]
            }
        };
    });

    frm.refresh_field('driver');
}