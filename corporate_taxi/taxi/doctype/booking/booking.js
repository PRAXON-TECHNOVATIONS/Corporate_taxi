// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt


var unavailable_drivers = {};
var unavailable_vehicle = {}

frappe.ui.form.on("Booking", {

    onload: function(frm) {
    
        frm.fields_dict.booking_details.grid.get_field('vehicle').get_query = function(doc, cdt, cdn) {
            let current_row = locals[cdt][cdn];
            return {
                filters: Object.assign(
                    unavailable_vehicle[current_row.name]
                        ? { name: ['in', unavailable_vehicle[current_row.name]] }
                        : {},
                    { custom_vehicle_type: current_row.vehicle_type }
                )
            };
        };
        
        

        // Apply the dynamic filter globally before making any API calls
        frm.fields_dict.booking_details.grid.get_field('driver').get_query = function(doc, cdt, cdn) {
            let current_row = locals[cdt][cdn];
            return {
                filters: current_row && unavailable_drivers[current_row.name]
                    ? { name: ['in', unavailable_drivers[current_row.name]] }
                    : {}
            };
        };
        
       
    
      
    
    },
    refresh: function(frm) {
       
        // hide row for particular driver user
            frm.fields_dict['booking_details'].grid.grid_rows.forEach(row => {
                let child = row.doc;
                
                frappe.call({
                    method: 'corporate_taxi.taxi.doctype.driver_trip.driver_trip.get_driver_for_user',
                    callback: function(response) {
                        if (child.driver !== response.message.driver_id) {
                            row.wrapper.hide();  
                        }
                    }
                })
            });
     


            if (
                frm.doc.status != "Completed" &&
                (frappe.user.has_role("Supplier") ||
                 frappe.user.has_role("System Manager") ||
                 frappe.user.has_role("Accounts User") ||
                 frappe.user.has_role("Accounts Manager"))
            ) {
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
                        charge_item.price_list_rate = 0;  // Set price list rate to 0
                        charge_item.ignore_pricing_rule = 1; // Ignore pricing rules
                    });
        
                    setTimeout(() => {
                        // Now loop through the items and set the rate after the row is added
                        $.each(invoice.items || [], function(index, item) {
                            let charge = frm.doc.extra_charges[index];
                            if (item.item_code === charge.charges_type) {
                                frappe.model.set_value(item.doctype, item.name, 'rate', charge.price);
                                frappe.model.set_value(item.doctype, item.name, 'amount', item.qty * charge.price);
                            }
                        });
                    }, 500);
        
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
                        if (data.status === "Open") {  
                            let child = frm.add_child("booking_details", {
                                guest_name: data.guest_name,
                                guest_phone_number: data.guest_phone_number,
                                from_date_time: data.from_date_time,
                                to_date_time: data.to_date_time,
                                pick_up_location: data.pick_up_location,
                                drop_off_location: data.drop_off_location,
                                trip_type: data.trip_type,
                                reference_id: data.name
                            });
    
                                // set vehicle type for filter
                                frappe.model.set_value(child.doctype, child.name, 'vehicle_type', data.vehicle_type);
                            
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
        console.log("add row=======");
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


