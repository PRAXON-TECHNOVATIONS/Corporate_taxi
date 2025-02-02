# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DriverTrip(Document):
	def on_submit(self):
		if self.status == "Completed":
			for data in self.table_wupe:
				frappe.db.set_value("Booking Form Details", data.reference_id, "status", "Trip Completed")

		frappe.db.commit()



@frappe.whitelist()
def get_setted_driver_booking_id(driver):
    if not driver:
        return []

    # Fetch the booking id linked to the selected driver in booking form
    booking_id = frappe.db.get_all(
        "Booking Form Details",
        filters={"driver": driver},
        fields=["parent"]
    )

    return booking_id
