# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import now

from frappe.model.document import Document


class DriverTrip(Document):
   def on_update(self):
       self.status = "Running"



   def on_submit(self):
    self.status = "Completed"  # Set status as Completed
    self.trip_end = now()       # Set current time in trip_end field

    # Update status in Booking Form Details
    if self.table_wupe:
        for data in self.table_wupe:
            if data.reference_id:
                frappe.db.set_value("Booking Form Details", data.reference_id, "status", "Trip Completed")

    # Grouping data by duty_type
    grouped_data = {}

    if self.table_wupe:
        for wupe_data in self.table_wupe:
            duty_type = wupe_data.get("duty_type")
            reference_id = wupe_data.get("reference_id")

            if not duty_type:
                continue

            key = duty_type

            if key not in grouped_data:
                grouped_data[key] = {
                    "guest_name": wupe_data.get("guest_name"),
                    "guest_phone_number": wupe_data.get("guest_phone_number"),
                    "duty_type": duty_type,
                    "reference_id": reference_id,
                    "amount": 0,
                    "charges_type": None,
                    "extra_kmhour": 0,
                    "price_per_kmhour": 0,
                    "total_extra_charges": 0
                }

            grouped_data[key]["amount"] += wupe_data.get("amount", 0)

    # Adding additional_charges if present
    if self.additional_charges:
        for wupe_data, charge_data in zip(self.table_wupe, self.additional_charges):
            duty_type = wupe_data.get("duty_type")
            if duty_type not in grouped_data:
                continue

            grouped_data[duty_type]["charges_type"] = charge_data.get("charges_type") or "N/A"
            grouped_data[duty_type]["extra_kmhour"] += charge_data.get("extra_kmhour", 0)
            grouped_data[duty_type]["price_per_kmhour"] = charge_data.get("price_per_kmhour", 0)
            grouped_data[duty_type]["total_extra_charges"] += charge_data.get("total_extra_charges", 0)

    # Create or update Trip History and update Booking form
    for merged_record in grouped_data.values():
        create_or_update_trip_history(self, merged_record)

        if merged_record.get("reference_id"):
            booking_doc = frappe.get_doc("Booking", self.booking)

            # Function to update or append extra_charges
            def update_or_append(charges_type, price):
                if charges_type:  # Only update or append if charges_type exists
                    existing_row = next(
                        (charge for charge in booking_doc.extra_charges if charge.charges_type == charges_type),
                        None
                    )

                    if existing_row:
                        
                        existing_row.price += price
                    else:
                        
                        booking_doc.append("extra_charges", {
                            "charges_type": charges_type,
                            "price": price
                        })

            
            update_or_append(merged_record.get("duty_type"), merged_record.get("amount"))

            
            update_or_append(merged_record.get("charges_type"), merged_record.get("total_extra_charges"))

            # Recalculate the sum of the price column in extra_charges
            total_price = sum(charge.price for charge in booking_doc.extra_charges)

            # Update the total sum field (you may need to add a field for this if it doesn't exist)
            booking_doc.total_amount_with_extra_charges = total_price

            booking_doc.save(ignore_permissions = True)

    frappe.db.commit()



   def on_cancel(self):
        # Delete Trip History records related to the current trip
        trip_histories = frappe.get_all(
            "Trip History",
            filters={"trip_id": self.name},
            fields=["name"]
        )

        # Update status in Booking Form Details
        for data in self.table_wupe:
            if data.reference_id:
                frappe.db.set_value("Booking Form Details", data.reference_id, "status", "Open")

        # Delete Trip History records
        for trip in trip_histories:
            frappe.delete_doc("Trip History", trip.name, ignore_permissions=True)

        # Function to subtract price or delete if zero
        def subtract_or_delete(charges_type, price):
            booking_doc = frappe.get_doc("Booking", self.booking)
            existing_row = next(
                (charge for charge in booking_doc.extra_charges if charge.charges_type == charges_type),
                None
            )

            if existing_row:
                existing_row.price -= price  # Subtract the price

                # Remove row if price <= 0
                if existing_row.price <= 0:
                    booking_doc.extra_charges.remove(existing_row)

                booking_doc.save()

        # Subtract price in extra_charges table for each item
        if self.table_wupe:
            for wupe_data in self.table_wupe:
                duty_type = wupe_data.get("duty_type")
                amount = wupe_data.get("amount", 0)

                # Subtract for duty_type
                subtract_or_delete(duty_type, amount)

        if self.additional_charges:
            for charge_data in self.additional_charges:
                charges_type = charge_data.get("charges_type")
                price_per_kmhour = charge_data.get("total_extra_charges", 0)

                # Subtract for charges_type
                subtract_or_delete(charges_type, price_per_kmhour)

         # Recalculate the sum of the price column in extra_charges
        booking_doc = frappe.get_doc("Booking", self.booking)
        total_price = sum(charge.price for charge in booking_doc.extra_charges)

        # Update the total sum field (you may need to add a field for this if it doesn't exist)
        booking_doc.total_amount_with_extra_charges = total_price

        # Save the updated booking document
        booking_doc.save()

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



@frappe.whitelist()
def get_driver_for_user(user=None):
    user = user or frappe.session.user

    user_doc = frappe.get_doc('User', user)
    if user_doc.role_profile_name == 'Driver':
        driver = frappe.get_value('Driver', {'custom_user': user}, ['name'])
        if driver:
            return {'driver_id': driver}
    return {}