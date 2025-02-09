# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

# import frappe


# def execute(filters=None):
# 	columns, data = [], []
# 	return columns, data
import frappe

def execute(filters=None):
    user = frappe.session.user
    user_roles = frappe.get_roles(user)

    if "Driver" not in user_roles:
        frappe.throw("You do not have permission to view this report.")

    # Apply filters if provided
    booking_filters = {"docstatus": 1}  # Only submitted bookings

    if filters.get("company"):
        booking_filters["company"] = filters.get("company")

    child_filters = {}
    if filters.get("status"):
        child_filters["status"] = filters.get("status")
    if filters.get("from_date_time") and filters.get("to_date_time"):
        child_filters["from_date_time"] = [">=", filters.get("from_date_time")]
        child_filters["to_date_time"] = ["<=", filters.get("to_date_time")]

    data = []
    bookings = frappe.get_all("Booking", fields=["name", "booking_date"], filters=booking_filters)

    for booking in bookings:
        child_details = frappe.get_all("Booking Form Details", 
                                       filters={**child_filters, "parent": booking.name},
                                       fields=[
                                           "guest_name", "vehicle_type", "guest_phone_number",
                                           "status", "from_date_time", "to_date_time",
                                           "pick_up_location", "drop_off_location",
                                           "trip_type", "vehicle", "driver_phone_number",
                                           "duty_type", "driver"
                                       ])

        for detail in child_details:
            data.append({
                "booking_id": booking.name,
                "booking_date": booking.booking_date,
                "guest_name": detail.guest_name,
                "vehicle_type": detail.vehicle_type,
                "guest_phone_number": detail.guest_phone_number,
                "status": detail.status,
                "from_date_time": detail.from_date_time,
                "to_date_time": detail.to_date_time,
                "pick_up_location": detail.pick_up_location,
                "drop_off_location": detail.drop_off_location,
                "trip_type": detail.trip_type,
                "vehicle": detail.vehicle,
                "driver_phone_number": detail.driver_phone_number,
                "duty_type": detail.duty_type,
                "driver": detail.driver
            })

    columns = [
        {"label": "Booking ID", "fieldname": "booking_id", "fieldtype": "Link", "options": "Booking", "width": 120},
        {"label": "Booking Date", "fieldname": "booking_date", "fieldtype": "Date", "width": 100},
        {"label": "Guest Name", "fieldname": "guest_name", "fieldtype": "Data", "width": 150},
        {"label": "Vehicle Type", "fieldname": "vehicle_type", "fieldtype": "Data", "width": 120},
        {"label": "Guest Phone Number", "fieldname": "guest_phone_number", "fieldtype": "Data", "width": 130},
        {"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 100},
        {"label": "From Date Time", "fieldname": "from_date_time", "fieldtype": "Datetime", "width": 150},
        {"label": "To Date Time", "fieldname": "to_date_time", "fieldtype": "Datetime", "width": 150},
        {"label": "Pick-up Location", "fieldname": "pick_up_location", "fieldtype": "Data", "width": 150},
        {"label": "Drop-off Location", "fieldname": "drop_off_location", "fieldtype": "Data", "width": 150},
        {"label": "Trip Type", "fieldname": "trip_type", "fieldtype": "Data", "width": 100},
        {"label": "Vehicle", "fieldname": "vehicle", "fieldtype": "Link", "options": "Vehicle", "width": 120},
        {"label": "Driver Phone Number", "fieldname": "driver_phone_number", "fieldtype": "Data", "width": 130},
        {"label": "Duty Type", "fieldname": "duty_type", "fieldtype": "Data", "width": 100},
        {"label": "Driver", "fieldname": "driver", "fieldtype": "Link", "options": "Driver", "width": 120}
    ]

    return columns, data
