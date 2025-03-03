// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Request for Vehicle", {
    onload(frm) {
        frm.set_query("vehicle", function () {
            return {
                "filters": {
                    "custom_partner": frm.doc.partner,
                    
                }
            };
        });

        frm.set_query("driver", function () {
            return {
                "filters": {
                    "transporter": frm.doc.partner,
                    
                }
            };
        });


       
        
    },
    
    preview: (frm) => {
        let dialog = new frappe.ui.Dialog({
            title: __("Preview Email"),
            fields: [
                {
                    label: __("Partner"),
                    fieldtype: "Link",
                    fieldname: "supplier",
                    options: "Supplier",
                    reqd: 1,
                    read_only: 1,
                    default: frm.doc.partner,
                },
                {
                    fieldtype: "Column Break",
                    fieldname: "col_break_1",
                },
                {
                    label: __("Subject"),
                    fieldtype: "Data",
                    fieldname: "subject",
                    read_only: 1,
                    depends_on: "subject",
                },
                {
                    fieldtype: "Section Break",
                    fieldname: "sec_break_1",
                    hide_border: 1,
                },
                {
                    label: __("Email"),
                    fieldtype: "HTML",
                    fieldname: "email_preview",
                },
                {
                    fieldtype: "Section Break",
                    fieldname: "sec_break_2",
                },
                {
                    label: __("Note"),
                    fieldtype: "HTML",
                    fieldname: "note",
                },
            ],
        });

        // dialog.fields_dict["supplier"].df.onchange = () => {
        // 	frm.call("get_supplier_email_preview", {
        // 		supplier: dialog.get_value("partner"),
        // 	}).then(({ message }) => {
        // 		dialog.fields_dict.email_preview.$wrapper.empty();
        // 		dialog.fields_dict.email_preview.$wrapper.append(message.message);
        // 		dialog.set_value("subject", message.subject);
        // 	});
        // };


        setTimeout(() => {
            frm.call("get_supplier_email_preview", {
                supplier: dialog.get_value("supplier"),
            }).then(({ message }) => {
                dialog.fields_dict.email_preview.$wrapper.empty();
                dialog.fields_dict.email_preview.$wrapper.append(message.message);
                dialog.set_value("subject", message.subject);
            });
        }, 100);


        dialog.show();
    },

    refresh(frm) {
        if(frm.doc.status == "Approved" && frm.doc.status!="Completed")
        {

            frappe.call({
                method: "corporate_taxi.taxi.doctype.request_for_vehicle.request_for_vehicle.check_user_role_profile",
                callback: function (r) {
                    if (r.message.is_partner) {
                        console.log("User is Partner");
                    } 
                    else {
                        // console.log("User is NOT Partner");
                        frm.add_custom_button("Create Booking",function(){
                            if(frm.doc.vehicle){
                                frappe.new_doc("Booking",{
                                    request_for_vehicle:frm.doc.name,
                                    booking_request:frm.doc.booking_request,
                                    vehicle:frm.doc.vehicle,
                                    driver:frm.doc.driver
                                })
                            }
                            else{
                                frappe.throw("Please set a vehicle.")
                            }
                        })
                    }
                }
            });

            

            
        }



        // if (frm.doc.docstatus == 1) {
        //     frm.add_custom_button("Create Booking", function () {
        //         frappe.model.with_doctype("Booking", function () {
        //             let doc = frappe.model.get_new_doc("Booking");
        //             doc.booking_request = frm.doc.booking_request;
        //             doc.reference_partner_quotation = frm.doc.name;

        //             let allowed_vehicles = [];
        //             let allowed_drivers = [];
        //             let vehicle_map = {};

        //             if (frm.doc.vehicle_details && frm.doc.vehicle_details.length > 1) {
        //                 // Group vehicles and drivers by vehicle_type
        //                 frm.doc.vehicle_details.forEach(row => {
        //                     if (!vehicle_map[row.vehicle_type]) {
        //                         vehicle_map[row.vehicle_type] = { vehicles: [], drivers: [] };
        //                     }
        //                     vehicle_map[row.vehicle_type].vehicles.push(row.vehicle);
        //                     vehicle_map[row.vehicle_type].drivers.push(row.driver);
        //                 });

        //                 console.log(vehicle_map); // Debugging output

        //                 // Get allowed vehicles and drivers from the first vehicle_type
        //                 let first_vehicle_type = Object.keys(vehicle_map)[0];
        //                 if (first_vehicle_type) {
        //                     allowed_vehicles = vehicle_map[first_vehicle_type].vehicles;
        //                     allowed_drivers = vehicle_map[first_vehicle_type].drivers;
        //                 }
        //             } else if (frm.doc.vehicle_details.length == 1) {
        //                 allowed_vehicles = [frm.doc.vehicle_details[0].vehicle];
        //                 allowed_drivers = [frm.doc.vehicle_details[0].driver];

        //                 setTimeout(() => {
        //                     doc.booking_details[0].vehicle = frm.doc.vehicle_details[0].vehicle;
        //                 doc.booking_details[0].driver = frm.doc.vehicle_details[0].driver;
        //                 cur_frm.refresh_field("booking_details");
        //                 }, 300);
        //             }

        //             // Pass allowed vehicles and drivers to the new Booking form
        //             frappe.route_options = {
        //                 allowed_vehicles: allowed_vehicles,
        //                 allowed_drivers: allowed_drivers
        //             };

        //             frappe.set_route("Form", "Booking", doc.name);
        //         });
        //     });
        // }
        


        if(frm.doc.docstatus == 1 && frm.doc.status == "Pending")
            {
                frm.add_custom_button("Approved",function(){
                    frm.set_value("status","Approved")
                    frm.save('Update');
                })
            }




        // frm.add_custom_button("Create Quotation", function () {
        //     let suppliers = [];

        //     // Ensure 'partners' exists and fetch suppliers with 'Pending' status
        //     (frm.doc.partners || []).forEach(row => {
        //         if (row.quote_status === "Pending" && row.supplier) {
        //             suppliers.push(row.supplier);
        //         }
        //     });

        //     console.log("Suppliers:", suppliers); // Debugging output

        //     if (suppliers.length === 0) {
        //         frappe.msgprint(__('No suppliers with pending quotes.'));
        //         return;
        //     }

        //     // Open dialog box
        //     let d = new frappe.ui.Dialog({
        //         title: 'Select Supplier',
        //         fields: [
        //             {
        //                 label: 'Supplier',
        //                 fieldname: 'supplier',
        //                 fieldtype: 'Select',
        //                 options: suppliers, // Ensure this is always an array
        //                 reqd: 1
        //             }
        //         ],
        //         primary_action_label: 'Proceed',
        //         primary_action(values) {
        //             let selected_supplier = values.supplier;

        //             if (!selected_supplier) {
        //                 frappe.msgprint(__('Please select a supplier.'));
        //                 return;
        //             }

        //             let selected_row = frm.doc.partners.find(row => row.supplier === selected_supplier);



        //             frappe.model.with_doctype('Partner Quotation', function () {
        //                 let doc = frappe.model.get_new_doc('Partner Quotation');

        //                 doc.partner = selected_supplier;
        //                 doc.reference_request_id = selected_row ? selected_row.name : '';
        //                 doc.booking_request = frm.doc.booking_request;
        //                 doc.referece_id_rfv = frm.doc.name;

        //                 // child table exists or not
        //                 if (!doc.vehicle_details) {
        //                     doc.vehicle_details = [];
        //                 }

        //                 // add a row to the vehicle_details child table
        //                 let child = frappe.model.add_child(doc, 'vehicle_details');
        //                 child.from_date_time = frm.doc.from_date_time;
        //                 child.to_date_time = frm.doc.to_date_time;
        //                 child.vehicle_type = frm.doc.vehicle_type;

        //                 // open new created focument
        //                 frappe.set_route('Form', 'Partner Quotation', doc.name);
        //             });


        //             d.hide();
        //         }
        //     });

        //     d.show();
        // });


        // let all_received = frm.doc.partners.every(row => row.quote_status == "Received");

        // // Hide or show the custom button based on the status check
        // if (all_received && frm.doc.docstatus === 1) {
        //     frm.remove_custom_button("Create Quotation"); // Hide the button if form is submitted and all statuses are "Received"
        // }
    },
    booking_request(frm) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Booking Request",
                name: frm.doc.booking_request,
            },
            callback: function (r) {
                if (r.message) {
                    var row_val = r.message.booking_request_details[0]
                    frm.set_value("vehicle_type", row_val.vehicle_type)
                    frm.set_value("from_date_time", row_val.from_date_time)
                    frm.set_value("to_date_time", row_val.to_date_time)
                }
            }
        })
    }
});







frappe.ui.form.on("Booking", {
    onload: function (frm) {
        setTimeout(() => {
            if (frappe.route_options) {
                if (frappe.route_options.allowed_vehicles) {
                    let allowed_vehicles = frappe.route_options.allowed_vehicles;
                    frm.set_query("vehicle", function () {
                        return {
                            filters: {
                                name: ["in", allowed_vehicles]
                            }
                        };
                    });
                    console.log(`Vehicle Filter applied: ${allowed_vehicles}`);
                }
                
                if (frappe.route_options.allowed_drivers) {
                    let allowed_drivers = frappe.route_options.allowed_drivers;
                    frm.set_query("driver", function () {
                        return {
                            filters: {
                                name: ["in", allowed_drivers]
                            }
                        };
                    });
                    console.log(`Driver Filter applied: ${allowed_drivers}`);
                }

                // Clear route options to prevent reapplying on future loads
                frappe.route_options = null;
            }
        }, 200);
    }
});





//  // Apply the filter when the Booking form loads
//  frappe.ui.form.on("Booking", {
//     onload: function (frm) {
//         setTimeout(() => {
//             if (frappe.route_options) {
//                 if (frappe.route_options.allowed_vehicles) {
//                     let allowed_vehicles = frappe.route_options.allowed_vehicles;
//                     frm.fields_dict["booking_details"].grid.get_field("vehicle").get_query = function () {
//                         return {
//                             filters: {
//                                 name: ["in", allowed_vehicles]
//                             }
//                         };
//                     };
//                     console.log(`Vehicle Filter applied: ${allowed_vehicles}`);
//                 }
                
//                 if (frappe.route_options.allowed_drivers) {
//                     let allowed_drivers = frappe.route_options.allowed_drivers;
//                     frm.fields_dict["booking_details"].grid.get_field("driver").get_query = function () {
//                         return {
//                             filters: {
//                                 name: ["in", allowed_drivers]
//                             }
//                         };
//                     };
//                     console.log(`Driver Filter applied: ${allowed_drivers}`);
//                 }
                
//                 // Clear route options to prevent reapplying on future loads
//                 frappe.route_options = null;
//             }
//         }, 200);
//     }
// });
