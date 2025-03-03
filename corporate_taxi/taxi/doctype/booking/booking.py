# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime
from frappe.model.document import Document


class Booking(Document):
	
	def on_submit(self):
		# Initial booking status flags
		all_booked = True
		partial_booked = False

		# Update child records' status to "Booked"
		for data in self.booking_details:
			frappe.db.set_value("Booking Request Details", data.reference_id, "status", "Booked")

		# Fetch updated statuses from child table
		child_statuses = frappe.get_all(
			"Booking Request Details",
			filters={"parent": self.booking_request},
			fields=["status"]
		)

		# Determine parent booking status
		for status_record in child_statuses:
			if status_record.status != "Booked":
				all_booked = False
				partial_booked = True
				break

		book_status = "Booked" 
		frappe.db.set_value("Booking Request", self.booking_request, "status", book_status)


		# for data in self.booking_details:
		from_date_time = datetime.strptime(self.from_date_time, "%Y-%m-%d %H:%M:%S")
		to_date_time = datetime.strptime(self.to_date_time, "%Y-%m-%d %H:%M:%S")

		# Check for overlapping records and create history
		for record_type, field, parenttype, parentfield in [
				("Vehicle", "vehicle", "Vehicle", "custom_booking_history"),
				("Vehicle", "driver", "Driver", "custom_booking_historys")
			]:
				parent_value = getattr(self, field)
				overlapping_record = frappe.db.sql(
					f"""
					SELECT name FROM `tab{record_type} History`
					WHERE parent = %(parent)s
					AND (
						(%(from_date_time)s BETWEEN from_date_time AND to_date_time)
						OR (%(to_date_time)s BETWEEN from_date_time AND to_date_time)
						OR (from_date_time BETWEEN %(from_date_time)s AND %(to_date_time)s)
						OR (to_date_time BETWEEN %(from_date_time)s AND %(to_date_time)s)
					)
					""",
					{
						"parent": parent_value,
						"from_date_time": from_date_time,
						"to_date_time": to_date_time,
					},
				)

				if overlapping_record:
					frappe.throw(f"'{parent_value}' ({record_type.lower()}) is already assigned for the given date and time.")

				# Create history record
				new_doc = frappe.new_doc(f"{record_type} History")
				new_doc.update({
					"booking_id": self.name,
					"from_date_time": self.from_date_time,
					"to_date_time": self.to_date_time,
					"parent": parent_value,
					"parenttype": parenttype,
					"parentfield": parentfield,
				})
				new_doc.insert(ignore_permissions=True)

			# Show success message
		frappe.msgprint(
			f"Vehicle '{self.vehicle}' and Driver '{self.driver}' assigned from {from_date_time.strftime('%d-%m-%Y %H:%M')} to {to_date_time.strftime('%d-%m-%Y %H:%M')}."
		)

		if self.request_for_vehicle:
			frappe.db.set_value("Request for Vehicle",self.request_for_vehicle,"status","Completed")





	def on_cancel(self):
		# # Revert child records' status to "Open"
		# for data in self.booking_details:
		# 	frappe.db.set_value("Booking Request Details", data.reference_id, "status", "Open")

		# # Check if there are any other booked details in the parent booking request
		# child_statuses = frappe.get_all(
		# 	"Booking Request Details",
		# 	filters={"parent": self.booking_request},
		# 	fields=["status"]
		# )

		## Determine parent booking status
		# all_open = all(status_record.status == "Open" for status_record in child_statuses)
		# partial_booked = any(status_record.status == "Booked" for status_record in child_statuses)

		# # Update parent status based on child statuses
		book_status = "Open" 
		frappe.db.set_value("Booking Request", self.booking_request, "status", book_status)

		# Function to delete history records
		def delete_history(booking_id, parent_value, record_type):
			filters = {
				"booking_id": booking_id,
				"parent": parent_value
			}

			history_records = frappe.get_all(
				f"{record_type} History",
				filters=filters,
				fields=["name"]
			)

			for record in history_records:
				frappe.delete_doc(f"{record_type} History", record.name, ignore_permissions=True)

		# Delete related history records and show cancellation message
		
		delete_history(self.name, self.vehicle, "Vehicle")
		delete_history(self.name, self.driver, "Vehicle")

		frappe.msgprint(
			f"Booking for Vehicle '{self.vehicle}' and Driver '{self.driver}' has been successfully canceled."
		)

		if self.request_for_vehicle:
			frappe.db.set_value("Request for Vehicle",self.request_for_vehicle,"status","Approved")




@frappe.whitelist()
def get_driver_vehicle_list(driver):
    if not driver:
        return []

    # Fetch the vehicles linked to the selected driver
    vehicles = frappe.db.get_all(
        "Vehicle Assignment",
        filters={"parent": driver},
        fields=["vehicle"]
    )

    return vehicles



# @frappe.whitelist()
# def get_available_drivers(from_datetime, to_datetime):
#     # Fetch booked drivers within the specified date-time range
#     booked_drivers = frappe.db.sql("""
#         SELECT parent
#         FROM `tabVehicle History`
#         WHERE 
#             (from_date_time <= %(to_datetime)s AND to_date_time >= %(from_datetime)s)
#     """, {
#         "from_datetime": from_datetime,
#         "to_datetime": to_datetime
#     }, as_dict=True)

#     # Extract driver names from the query result
#     booked_driver_list = [d['parent'] for d in booked_drivers]

#     # Return a unique list of booked drivers
#     return list(set(booked_driver_list))


# ==========================================================================
# @frappe.whitelist()
# def get_available_drivers(vehicle, from_datetime, to_datetime):
#     # Step 1: Get drivers assigned to the given vehicle
#     excluded_drivers = frappe.db.sql("""
#         SELECT parent
#         FROM `tabVehicle Assignment`
#         WHERE parenttype = 'Driver' AND vehicle = %(vehicle)s
#     """, {
#         "vehicle": vehicle
#     }, as_dict=True)

#     # Convert to a list of driver IDs to exclude
#     excluded_driver_list = [d['parent'] for d in excluded_drivers]

#     # Step 2: Fetch available drivers who are not assigned to the given vehicle
#     drivers = frappe.db.sql("""
#         SELECT parent
#         FROM `tabVehicle History`
#         WHERE 
#             (from_date_time <= %(to_datetime)s AND to_date_time >= %(from_datetime)s)
#             AND parent NOT IN %(excluded_drivers)s
        
#         UNION
        
#         SELECT parent
#         FROM `tabVehicle Assignment`
#         WHERE 
#             parenttype = 'Driver' AND parent NOT IN %(excluded_drivers)s
#     """, {
#         "from_datetime": from_datetime,
#         "to_datetime": to_datetime,
#         "excluded_drivers": tuple(excluded_driver_list) or ('',)  # Handles empty list case
#     }, as_dict=True)

#     # Extract unique driver names
#     driver_list = [d['parent'] for d in drivers]

#     return list(set(driver_list))


import frappe

@frappe.whitelist()
def get_available_drivers(vehicle, from_datetime, to_datetime):
    # Step 1: Fetch drivers who are occupied during the requested time slot in Vehicle History
    query = """
        SELECT vh.parent
        FROM `tabVehicle History` vh
        WHERE (
            (vh.from_date_time BETWEEN %(from_datetime)s AND %(to_datetime)s)
            OR (vh.to_date_time BETWEEN %(from_datetime)s AND %(to_datetime)s)
            OR (%(from_datetime)s BETWEEN vh.from_date_time AND vh.to_date_time)
            OR (%(to_datetime)s BETWEEN vh.from_date_time AND vh.to_date_time)
        )
    """

    occupied_drivers = frappe.db.sql(query, {
        "from_datetime": from_datetime,
        "to_datetime": to_datetime
    }, as_dict=True)

    # Get list of occupied drivers
    occupied_driver_list = [d['parent'] for d in occupied_drivers]

    # Step 2: Fetch all drivers excluding those who are occupied
    available_drivers = frappe.db.get_all('Driver', filters={
        'name': ('not in', occupied_driver_list)
    }, pluck='name')

    return available_drivers








# @frappe.whitelist()
# def get_available_vehicles(vehicle_type, from_datetime, to_datetime):
#     available_vehicles = frappe.db.sql("""
#         SELECT name 
#         FROM `tabVehicle`
#         WHERE custom_vehicle_type = %s
#         AND name NOT IN (
#             SELECT parent 
#             FROM `tabVehicle History` 
#             WHERE (
#                 (%s BETWEEN from_date_time AND to_date_time)
#                 OR (%s BETWEEN from_date_time AND to_date_time)
#                 OR (from_date_time BETWEEN %s AND %s)
#                 OR (to_date_time BETWEEN %s AND %s)
#                 OR (from_date_time <= %s AND to_date_time >= %s)
#             )
           
#         )
#     """, (vehicle_type, from_datetime, to_datetime, from_datetime, to_datetime, from_datetime, to_datetime, from_datetime, to_datetime), as_dict=True)

#     return [vehicle['name'] for vehicle in available_vehicles]


@frappe.whitelist()
def get_available_vehicles(vehicle_type, from_datetime, to_datetime):
    available_vehicles = frappe.db.sql("""
        SELECT v.name 
        FROM `tabVehicle` v
        LEFT JOIN `tabVehicle History` vh ON v.name = vh.parent
        AND (
            (%s BETWEEN vh.from_date_time AND vh.to_date_time)
            OR (%s BETWEEN vh.from_date_time AND vh.to_date_time)
            OR (vh.from_date_time BETWEEN %s AND %s)
            OR (vh.to_date_time BETWEEN %s AND %s)
            OR (vh.from_date_time <= %s AND vh.to_date_time >= %s)
        )
        WHERE v.custom_vehicle_type = %s
        AND vh.parent IS NULL
    """, (
        from_datetime, to_datetime, from_datetime, to_datetime, 
        from_datetime, to_datetime, from_datetime, to_datetime, 
        vehicle_type
    ), as_dict=True)

    return [vehicle['name'] for vehicle in available_vehicles]



# get booking details
@frappe.whitelist()
def get_booking_request_details(booking_request):
    booking_request_doc = frappe.get_doc("Booking Request", booking_request)
    booking_details = []

    for detail in booking_request_doc.booking_request_details:
        if detail.status == "Open":
            booking_details.append({
                "guest_name": detail.guest_name,
                "guest_phone_number": detail.guest_phone_number,
                "from_date_time": detail.from_date_time,
                "to_date_time": detail.to_date_time,
                "pick_up_location": detail.pick_up_location,
                "drop_off_location": detail.drop_off_location,
                "trip_type": detail.trip_type,
                "name": detail.name,
                "vehicle_type": detail.vehicle_type,
                "status": detail.status
            })

    return booking_details


@frappe.whitelist()
def get_booking_request(booking_request):
	return frappe.get_doc("Booking Request", booking_request)