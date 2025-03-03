
import frappe
import time
from frappe.model.mapper import get_mapped_doc


def on_submit(doc, method):
    total_amount = frappe.db.get_value("Booking", doc.custom_reference_booking_id, ["total_amount_with_extra_charges", "paid_amount"], as_dict=True)

    # Update invoice_amount in Extra Charges Details
    for data in doc.items:
        if data.custom_extracharges_id:
            frappe.db.set_value("Extra Charges Details", data.custom_extracharges_id, "invoice_amount", data.amount)

    # Group by custom_booking and sum amounts
    booking_totals = {}
    for data in doc.items:
        if data.custom_booking:
            booking_totals[data.custom_booking] = booking_totals.get(data.custom_booking, 0) + data.amount

    # Update paid_amount and payment status in Booking
    for booking_id, total_amount in booking_totals.items():
        existing_paid_amount = frappe.db.get_value("Booking", booking_id, "paid_amount") or 0
        updated_paid_amount = existing_paid_amount + total_amount

        # Fetch the total amount due (including extra charges) for the booking
        total_due = frappe.db.get_value("Booking", booking_id, "total_amount_with_extra_charges") or 0

        # Determine payment status
        if updated_paid_amount >= total_due:
            paid_status = "Completed"
        elif updated_paid_amount > 0:
            paid_status = "Partial Complete"
        else:
            paid_status = "To Bill"

        # Update booking record
        frappe.db.set_value("Booking", booking_id, {
            "paid_amount": updated_paid_amount,
            "status": paid_status
        })

def on_cancel(doc, method):
    total_amount = frappe.db.get_value("Booking", doc.custom_reference_booking_id, ["total_amount_with_extra_charges", "paid_amount"], as_dict=True)


    # Reverse invoice_amount in Extra Charges Details
    for data in doc.items:
        if data.custom_extracharges_id:
            existing_invoice_amount = frappe.db.get_value("Extra Charges Details", data.custom_extracharges_id, "invoice_amount") or 0
            new_invoice_amount = max(existing_invoice_amount - data.amount, 0)  # Prevent negative values
            frappe.db.set_value("Extra Charges Details", data.custom_extracharges_id, "invoice_amount", new_invoice_amount)

    # Group by custom_booking and sum amounts to reverse
    booking_totals = {}
    for data in doc.items:
        if data.custom_booking:
            booking_totals[data.custom_booking] = booking_totals.get(data.custom_booking, 0) + data.amount



    for booking_id, total_amount in booking_totals.items():
        print(f"Booking ID: {booking_id}, Total Amount: {total_amount}, Type: {type(total_amount)}")  

        # Ensure total_amount is a float
        total_amount = float(total_amount) if total_amount else 0  

        # Fetch existing paid_amount directly as a float
        existing_paid_amount = frappe.db.get_value("Booking", booking_id, "paid_amount") or 0  
        print(f"Existing Paid Amount: {existing_paid_amount}, Type: {type(existing_paid_amount)}")

        # Correct calculation (No `.paid_amount`)
        new_paid_amount = max(existing_paid_amount - total_amount, 0)  # Prevent negative values

        print(f"New Paid Amount: {new_paid_amount}")

        frappe.db.set_value("Booking", booking_id, "paid_amount", new_paid_amount)

        # 🔹 Fetch total amount with extra charges separately
        total_amount_with_extra_charges = frappe.db.get_value("Booking", booking_id, "total_amount_with_extra_charges") or 0  

        # 🔹 Use new_paid_amount instead of paid_amount
        if new_paid_amount == 0:
            paid_status = "To Bill"
        elif new_paid_amount >= total_amount_with_extra_charges:
            paid_status = "Completed"
        else:
            paid_status = "Partial Complete"

        # Update Booking Status
        frappe.db.set_value("Booking", booking_id, {
            "paid_amount": new_paid_amount,
            "status": paid_status
        })





# @frappe.whitelist()
# def make_sales_invoice(source_names, target_doc=None):
#     if isinstance(source_names, str):
#         source_names = frappe.parse_json(source_names)

#     def map_extra_charges(source_doc, target_doc, source_parent=None):
#         for charge in source_doc.get("extra_charges_details", []):  
#             item = target_doc.append("items", {})
#             item.item_code = charge.extra_charges_type
#             item.qty = 1
#             item.custom_custom_rate = charge.price  
#             item.custom_booking = charge.parent
#             item.custom_extracharges_id = charge.name

#     target_doc = get_mapped_doc(
#         "Booking",
#         source_names,
#         {
#             "Booking": {
#                 "doctype": "Sales Invoice",
#                 "field_map": {
#                     "customer": "customer"
#                 },
#                 "postprocess": map_extra_charges,
#                 "field_no_map": ["items"]
#             },
#             "Booking Extra Charges": {  
#                 "doctype": "Sales Invoice Item",
#                 "add_if_empty": True
#             }
#         },
#         target_doc
#     )

#     return target_doc




@frappe.whitelist()
def make_sales_invoice(source_names, target_doc=None):
    if isinstance(source_names, str):
        source_names = frappe.parse_json(source_names)

    target_doc = get_mapped_doc(
        "Booking",
        source_names,
        {
            "Booking": {
                "doctype": "Sales Invoice",
                "field_map": {
                    "customer": "customer"
                },
                "field_no_map": ["items"]
            }
        },
        target_doc
    )

    # Fetch all extra charges for the selected bookings
    for booking_name in source_names:
        extra_charges = frappe.get_all(
            "Extra Charges Details",
            filters={"parent": booking_name},
            fields=["extra_charges_type", "price", "name"]
        )

        for charge in extra_charges:
            item = target_doc.append("items", {})
            item.item_code = charge.extra_charges_type
            item.qty = 1
            item.custom_custom_rate = charge.price
            item.custom_booking = booking_name
            item.custom_extracharges_id = charge.name

    return target_doc


