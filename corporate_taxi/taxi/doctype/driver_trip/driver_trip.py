# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import now

from frappe.model.document import Document


class DriverTrip(Document):
        
#    def on_submit(self):
#         self.status = "Completed"  # Corrected the assignment operator
#         self.trip_end = now()      # Set current time in trip_end field

#         for data in self.table_wupe:
#             frappe.db.set_value("Booking Form Details", data.reference_id, "status", "Trip Completed")
#         # Iterate through both tables and create or update Trip History records
#         for wupe_data, charge_data in zip(self.table_wupe, self.additional_charges):
#             merged_record = {
#                 "guest_name": wupe_data.get("guest_name"),
#                 "guest_phone_number": wupe_data.get("guest_phone_number"),
#                 "duty_type": wupe_data.get("duty_type"),
#                 "charges_type": charge_data.get("charges_type"),
#                 "extra_kmhour": charge_data.get("extra_kmhour"),
#                 "price_per_kmhour": charge_data.get("price_per_kmhour"),
#                 "total_extra_charges": charge_data.get("total_extra_charges")
#             }

#             # Check if Trip History record exists
#             existing_trip = frappe.db.exists(
#                 "Trip History",
#                 {
#                     "trip_id": self.name,
#                     "guest_name": merged_record["guest_name"]
#                 }
#             )

#             if existing_trip:
#                 # Update the existing Trip History record
#                 trip_history = frappe.get_doc("Trip History", existing_trip)
#                 trip_history.update(merged_record)
#                 trip_history.save(ignore_permissions=True)
#             else:
#                 # Create new Trip History record
#                 trip_history = frappe.get_doc({
#                     "doctype": "Trip History",
#                     "trip_id": self.name,
#                     "guest_name": merged_record["guest_name"],
#                     "guest_phone_number": merged_record["guest_phone_number"],
#                     "duty_type": merged_record["duty_type"],
#                     "charges_type": merged_record["charges_type"],
#                     "extra_kmhour": merged_record["extra_kmhour"],
#                     "price_per_kmhour": merged_record["price_per_kmhour"],
#                     "total_extra_charges": merged_record["total_extra_charges"],
#                     "parenttype": "Booking",
#                     "parentfield": "trip_history_details",
#                     "parent": self.booking
#                 })
#                 trip_history.insert(ignore_permissions=True)
        
#             frappe.db.commit()


   def on_submit(self):
    self.status = "Completed"  # Set status as Completed
    self.trip_end = now()      # Set current time in trip_end field

    # Update status in Booking Form Details
    for data in self.table_wupe:
        frappe.db.set_value("Booking Form Details", data.reference_id, "status", "Trip Completed")

    # Case 1: When additional_charges has data
    if self.additional_charges:
        for wupe_data, charge_data in zip(self.table_wupe, self.additional_charges):
            merged_record = {
                "guest_name": wupe_data.get("guest_name"),
                "guest_phone_number": wupe_data.get("guest_phone_number"),
                "duty_type": wupe_data.get("duty_type"),
                "amount":wupe_data.get("amount"),
                "charges_type": charge_data.get("charges_type"),
                "extra_kmhour": charge_data.get("extra_kmhour"),
                "price_per_kmhour": charge_data.get("price_per_kmhour"),
                "total_extra_charges": charge_data.get("total_extra_charges")
            }

            create_or_update_trip_history(self, merged_record)

    # Case 2: When additional_charges is empty
    else:
        for wupe_data in self.table_wupe:
            merged_record = {
                "guest_name": wupe_data.get("guest_name"),
                "guest_phone_number": wupe_data.get("guest_phone_number"),
                "duty_type": wupe_data.get("duty_type"),
                "amount": wupe_data.get("amount"),
                "charges_type": None,
                "extra_kmhour": 0,
                "price_per_kmhour": 0,
                "total_extra_charges": 0
            }

            create_or_update_trip_history(self, merged_record)

    frappe.db.commit()





   def on_cancel(self):
        # Delete Trip History records related to the current trip
        trip_histories = frappe.get_all(
            "Trip History",
            filters={"trip_id": self.name},
            fields=["name"]
        )

        for data in self.table_wupe:
            frappe.db.set_value("Booking Form Details",data.reference_id,"status","Open")

        for trip in trip_histories:
            frappe.delete_doc("Trip History", trip.name, ignore_permissions=True)


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





# Reusable Function to Create or Update Trip History
def create_or_update_trip_history(self, merged_record):
    existing_trip = frappe.db.exists(
        "Trip History",
        {
            "trip_id": self.name,
            "guest_name": merged_record["guest_name"]
        }
    )

    if existing_trip:
        # Update existing Trip History record
        trip_history = frappe.get_doc("Trip History", existing_trip)
        trip_history.update(merged_record)
        trip_history.save(ignore_permissions=True)
    else:
        # Create new Trip History record
        trip_history = frappe.get_doc({
            "doctype": "Trip History",
            "trip_id": self.name,
            "guest_name": merged_record["guest_name"],
            "guest_phone_number": merged_record["guest_phone_number"],
            "duty_type": merged_record["duty_type"],
            "amount": merged_record["amount"],
            "charges_type": merged_record["charges_type"],
            "extra_kmhour": merged_record["extra_kmhour"],
            "price_per_kmhour": merged_record["price_per_kmhour"],
            "total_extra_charges": merged_record["total_extra_charges"],
            "parenttype": "Booking",
            "parentfield": "trip_history_details",
            "parent": self.booking
        })
        trip_history.insert(ignore_permissions=True)

