import frappe

def on_submit(doc, method):
    total_amount = frappe.db.get_value("Booking", doc.custom_reference_booking_id, ["total_amount", "paid_amount"], as_dict=True)
    
    if total_amount:
        # update the paid amount
        paid_amount = (total_amount.paid_amount or 0) + (doc.total or 0)

        # update payment status
        if paid_amount >= total_amount.total_amount:
            paid_status = "Completed"
        else:
            paid_status = "Partial Complete"

        frappe.db.set_value("Booking", doc.custom_reference_booking_id, {
            "paid_amount": paid_amount,
            "status": paid_status
        })




def on_cancel(doc, method):
    total_amount = frappe.db.get_value("Booking", doc.custom_reference_booking_id, ["total_amount", "paid_amount"], as_dict=True)

    if total_amount:
        # Revert the paid amount
        paid_amount = (total_amount.paid_amount or 0) - (doc.total or 0)
        if paid_amount < 0:
            paid_amount = 0  # Ensure it does not go negative

        # Update payment status
        if paid_amount == 0:
            paid_status = "Pending"
        elif paid_amount >= total_amount.total_amount:
            paid_status = "Completed"
        else:
            paid_status = "Partial Complete"

        frappe.db.set_value("Booking", doc.custom_reference_booking_id, {
            "paid_amount": paid_amount,
            "status": paid_status
        })