// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Booking Request", {
    onload: function(frm) {
        frappe.call({
            method: 'corporate_taxi.taxi.doctype.booking_request.booking_request.get_customer_for_user',
            callback: function(response) {
                if (response.message) {
                    frm.set_value('customer', response.message);
                }
            }
        });
    }
});
