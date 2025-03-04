


frappe.ui.form.on('Sales Invoice', {
    onload(frm){
        setTimeout(() => {
            frm.remove_custom_button("Timesheet","Get Items From")
            frm.remove_custom_button("Sales Order","Get Items From")
            frm.remove_custom_button("Delivery Note","Get Items From")
            frm.remove_custom_button("Quotation","Get Items From")
    
           }, 500);
    },
    refresh(frm) {
       
     

        frm.add_custom_button(__('Get Booking'), function () {
            frappe.db.get_list('Booking', {
                fields: ['name', 'customer'],
                filters: { docstatus: 1, customer: frm.doc.customer }
            }).then(bookings => {
                if (!bookings.length) {
                    frappe.msgprint(__('No confirmed bookings found for this customer.'));
                    return;
                }

                new frappe.ui.form.MultiSelectDialog({
                    doctype: "Booking",
                    target: frm,
                    setters: { customer: frm.doc.customer },
                    get_query: () => ({ 
                        filters: { 
                            docstatus: 1, 
                            status: "To Bill"  
                        } 
                    }),
                    action(selections) {
                        if (!selections.length) {
                            frappe.msgprint(__("No bookings selected"));
                            return;
                        }

                        frappe.call({
                            method: "corporate_taxi.override.sales_invoice.make_sales_invoice",
                            args: { source_names: selections },
                            freeze: true,
                            callback(r) {
                                if (r.message) {
                                    frappe.model.sync(r.message);
                                    console.log(r.message);


                                    frappe.set_route("Form", "Sales Invoice", r.message.name);

                                    setTimeout(() => {
                                        frm.doc.items.forEach(item => {
                                            if (item.custom_custom_rate) {
                                                frappe.model.set_value(item.doctype, item.name, "rate", item.custom_custom_rate);
                                            }
                                        });
                                    }, 1000);

                                } else {
                                    frappe.msgprint(__("Failed to create Sales Invoice."));
                                }
                            }
                        });
                    }
                });
            });
        },);
    }
});
