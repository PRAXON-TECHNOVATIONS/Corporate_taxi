// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Partner Quotation", {
	onload(frm) {
        // filter for vehicle
        frm.fields_dict.vehicle_details.grid.get_field('vehicle').get_query = function(doc, cdt, cdn) {
            let current_row = locals[cdt][cdn];
            return {
                filters: {
                    custom_vehicle_type: current_row.vehicle_type,
                    custom_partner:frm.doc.partner
                }
            };
        };

        // filter for driver
        frm.fields_dict.vehicle_details.grid.get_field('driver').get_query = function(doc, cdt, cdn) {
            let current_row = locals[cdt][cdn];
            return {
                filters: {
                    transporter:frm.doc.partner
                }
            };
        };
        
	},
    // refresh(frm){
    //   if(frm.doc.docstatus == 1)
    //   {
    //     frm.add_custom_button("Create Booking",function(){
           
    //         frappe.model.with_doctype("Booking", function () {
    //             let doc = frappe.model.get_new_doc("Booking");
    //             doc.booking_request = frm.doc.booking_request;
        
    //             if (frm.doc.vehicle_details && frm.doc.vehicle_details.length > 0) {
    //                 let first_row = frm.doc.vehicle_details[0]; // Get first row from the current form's child table
                  

    //                 setTimeout(() => {
    //                     if (doc.booking_details.length > 0) {
    //                         doc.booking_details[0].vehicle = first_row.vehicle;
    //                         doc.booking_details[0].driver = first_row.driver;

    //                         frappe.db.get_value("Vehicle", first_row.vehicle, "color").then(vehicle_color => {
    //                             if (vehicle_color && vehicle_color.message) {
    //                                 doc.booking_details[0].vehicle_number = first_row.vehicle;
    //                                 doc.booking_details[0].vehicle_color = vehicle_color.message.color;
    //                                 cur_frm.refresh_field("booking_details");
    //                             }
    //                         });

    //                         frappe.db.get_value("Driver", first_row.driver, "custom_user").then(user_id => {
    //                             if (user_id && user_id.message) {
    //                                 doc.booking_details[0].driver_user_id = user_id.message.custom_user;
                                    
    //                                 cur_frm.refresh_field("booking_details");
    //                             }
    //                         });
    //                     } 
    //                     cur_frm.refresh_field("booking_details");
    //                 }, 300);
    //             }
        
    //             frappe.set_route("Form", "Booking", doc.name);
    //         });
    //     })

        
    //   }
    // }


// ===================================== Latest
    // refresh(frm) {
    //     if (frm.doc.docstatus == 1) {
    //         frm.add_custom_button("Create Booking", function () {
    
    //             frappe.model.with_doctype("Booking", function () {
    //                 let doc = frappe.model.get_new_doc("Booking");
    //                 doc.booking_request = frm.doc.booking_request;
    //                 doc.reference_partner_quotation = frm.doc.name
    
    //                 if (frm.doc.vehicle_details && frm.doc.vehicle_details.length > 1) {
    //                     let vehicle_map = {};
    
    //                     // Group vehicles and drivers by vehicle_type
    //                     frm.doc.vehicle_details.forEach(row => {
    //                         if (!vehicle_map[row.vehicle_type]) {
    //                             vehicle_map[row.vehicle_type] = { vehicles: [], drivers: [] };
    //                         }
    //                         vehicle_map[row.vehicle_type].vehicles.push(row.vehicle);
    //                         vehicle_map[row.vehicle_type].drivers.push(row.driver);
    //                     });
    
    //                     console.log(vehicle_map); // Debugging output to check the arrays
    
    //                     // Example of using vehicle_map for further processing
    //                     Object.keys(vehicle_map).forEach(vehicle_type => {
    //                         let vehicles = vehicle_map[vehicle_type].vehicles;
    //                         let drivers = vehicle_map[vehicle_type].drivers;
    
    //                         console.log(`Vehicle Type: ${vehicle_type}`);
    //                         console.log("Vehicles:", vehicles);
    //                         console.log("Drivers:", drivers);
    //                     });
    
    //                 }
    
    //                 frappe.set_route("Form", "Booking", doc.name);
    //             });
    //         });
    //     }
    // }



    // =================+++++++++++++++++++++++++++++++++++
    
    //     refresh(frm) {
    //         if (frm.doc.docstatus == 1) {
    //             frm.add_custom_button("Create Booking", function () {
    //                 frappe.model.with_doctype("Booking", function () {
    //                     let doc = frappe.model.get_new_doc("Booking");
    //                     doc.booking_request = frm.doc.booking_request;
    //                     doc.reference_partner_quotation = frm.doc.name;
    
    //                     let allowed_vehicles = [];
    //                     let allowed_drivers = [];
    //                     let vehicle_map = {};
    
    //                     if (frm.doc.vehicle_details && frm.doc.vehicle_details.length > 1) {
    //                         // Group vehicles and drivers by vehicle_type
    //                         frm.doc.vehicle_details.forEach(row => {
    //                             if (!vehicle_map[row.vehicle_type]) {
    //                                 vehicle_map[row.vehicle_type] = { vehicles: [], drivers: [] };
    //                             }
    //                             vehicle_map[row.vehicle_type].vehicles.push(row.vehicle);
    //                             vehicle_map[row.vehicle_type].drivers.push(row.driver);
    //                         });
    
    //                         console.log(vehicle_map); // Debugging output
    
    //                         // Get allowed vehicles and drivers from the first vehicle_type
    //                         let first_vehicle_type = Object.keys(vehicle_map)[0];
    //                         if (first_vehicle_type) {
    //                             allowed_vehicles = vehicle_map[first_vehicle_type].vehicles;
    //                             allowed_drivers = vehicle_map[first_vehicle_type].drivers;
    //                         }
    //                     }
    
    //                     // Pass allowed vehicles and drivers to the new Booking form
    //                     frappe.route_options = {
    //                         allowed_vehicles: allowed_vehicles,
    //                         allowed_drivers: allowed_drivers
    //                     };
    
    //                     frappe.set_route("Form", "Booking", doc.name);
    //                 });
    //             });
    //         }
    //     }
    // });
    
    // // Apply the filter when the Booking form loads
    // frappe.ui.form.on("Booking", {
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
    





    
        refresh(frm) {
            if (frm.doc.docstatus == 1) {
                frm.add_custom_button("Create Booking", function () {
                    frappe.model.with_doctype("Booking", function () {
                        let doc = frappe.model.get_new_doc("Booking");
                        doc.booking_request = frm.doc.booking_request;
                        doc.reference_partner_quotation = frm.doc.name;
    
                        let allowed_vehicles = [];
                        let allowed_drivers = [];
                        let vehicle_map = {};
    
                        if (frm.doc.vehicle_details && frm.doc.vehicle_details.length > 1) {
                            // Group vehicles and drivers by vehicle_type
                            frm.doc.vehicle_details.forEach(row => {
                                if (!vehicle_map[row.vehicle_type]) {
                                    vehicle_map[row.vehicle_type] = { vehicles: [], drivers: [] };
                                }
                                vehicle_map[row.vehicle_type].vehicles.push(row.vehicle);
                                vehicle_map[row.vehicle_type].drivers.push(row.driver);
                            });
    
                            console.log(vehicle_map); // Debugging output
    
                            // Get allowed vehicles and drivers from the first vehicle_type
                            let first_vehicle_type = Object.keys(vehicle_map)[0];
                            if (first_vehicle_type) {
                                allowed_vehicles = vehicle_map[first_vehicle_type].vehicles;
                                allowed_drivers = vehicle_map[first_vehicle_type].drivers;
                            }
                        } 
                        // else if (frm.doc.vehicle_details.length == 1) {
                        //     allowed_vehicles = [frm.doc.vehicle_details[0].vehicle];
                        //     allowed_drivers = [frm.doc.vehicle_details[0].driver];

                        //     setTimeout(() => {
                        //         doc.booking_details[0].vehicle = frm.doc.vehicle_details[0].vehicle;
                        //     doc.booking_details[0].driver = frm.doc.vehicle_details[0].driver;

                        //     cur_frm.refresh_field("booking_details");
                        //     // set value in first row
                        //     frappe.db.get_value("Vehicle", first_row.vehicle, "color").then(vehicle_color => {
                        //           if (vehicle_color && vehicle_color.message) {
                        //               doc.booking_details[0].vehicle_number = first_row.vehicle;
                        //               doc.booking_details[0].vehicle_color = vehicle_color.message.color;
                        //               cur_frm.refresh_field("booking_details");
                        //           }
                        //       });

                        //       frappe.db.get_value("Driver", first_row.driver, "custom_user").then(user_id => {
                        //           if (user_id && user_id.message) {
                        //               doc.booking_details[0].driver_user_id = user_id.message.custom_user;
                                      
                        //               cur_frm.refresh_field("booking_details");
                        //           }
                        //       });


                        //     }, 300);
                        // }






                        else if (frm.doc.vehicle_details.length == 1) {
                            allowed_vehicles = [frm.doc.vehicle_details[0].vehicle];
                            allowed_drivers = [frm.doc.vehicle_details[0].driver];

                            setTimeout(() => {
                                doc.booking_details[0].vehicle = frm.doc.vehicle_details[0].vehicle;
                            doc.booking_details[0].driver = frm.doc.vehicle_details[0].driver;

                            cur_frm.refresh_field("booking_details");
                            // set value in first row
                            frappe.db.get_value("Vehicle", frm.doc.vehicle_details[0].vehicle, "color").then(vehicle_color => {
                                
                                  if (vehicle_color && vehicle_color.message) {
                                      doc.booking_details[0].vehicle_number = frm.doc.vehicle_details[0].vehicle;
                                      doc.booking_details[0].vehicle_color = vehicle_color.message.color;
                                      cur_frm.refresh_field("booking_details");
                                  }
                              });

                              frappe.db.get_value("Driver", frm.doc.vehicle_details[0].driver, "custom_user","cell_number").then(user_id => {
                                
                                  if (user_id && user_id.message) {
                                      doc.booking_details[0].driver_user_id = user_id.message.custom_user;
                                    //   doc.booking_details[0].driver_phone_number = user_id.message.cell_number;

                                    frappe.model.set_value(
                                        doc.booking_details[0].doctype, 
                                        doc.booking_details[0].name, 
                                        "driver_phone_number", 
                                        response.message.cell_number
                                    );
                                      
                                      cur_frm.refresh_field("booking_details");
                                  }
                              });


                            }, 300);
                        }


                        
                        
    
                        // Pass allowed vehicles and drivers to the new Booking form
                        frappe.route_options = {
                            allowed_vehicles: allowed_vehicles,
                            allowed_drivers: allowed_drivers
                        };
    
                        frappe.set_route("Form", "Booking", doc.name);
                    });
                });
            }
        }
    });
    
    // Apply the filter when the Booking form loads
    frappe.ui.form.on("Booking", {
        onload: function (frm) {
            setTimeout(() => {
                if (frappe.route_options) {
                    if (frappe.route_options.allowed_vehicles) {
                        let allowed_vehicles = frappe.route_options.allowed_vehicles;
                        frm.fields_dict["booking_details"].grid.get_field("vehicle").get_query = function () {
                            return {
                                filters: {
                                    name: ["in", allowed_vehicles]
                                }
                            };
                        };
                        console.log(`Vehicle Filter applied: ${allowed_vehicles}`);
                    }
                    
                    if (frappe.route_options.allowed_drivers) {
                        let allowed_drivers = frappe.route_options.allowed_drivers;
                        frm.fields_dict["booking_details"].grid.get_field("driver").get_query = function () {
                            return {
                                filters: {
                                    name: ["in", allowed_drivers]
                                }
                            };
                        };
                        console.log(`Driver Filter applied: ${allowed_drivers}`);
                    }
                    
                    // Clear route options to prevent reapplying on future loads
                    frappe.route_options = null;
                }
            }, 200);
        }
    });
    