# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime
from frappe.model.document import Document


class Booking(Document):
	# def on_update(self):
	# 	for data in self.booking_details:
	# 		# Check if a Vehicle History record already exists
	# 		if not frappe.db.exists(
	# 			"Vehicle History",
	# 			{
	# 				"booking_id": data.parent,
	# 				"from_date_time": data.from_date_time,
	# 				"to_date_time": data.to_date_time,
	# 			}
	# 		):
	# 			# Create a new Vehicle History record
	# 			doc = frappe.new_doc("Vehicle History")
	# 			doc.booking_id = data.parent
	# 			doc.from_date_time = data.from_date_time
	# 			doc.to_date_time = data.to_date_time
	# 			doc.parent = data.vehicle
	# 			doc.parenttype = "Vehicle"
	# 			doc.parentfield = "custom_booking_history"
	# 			doc.insert(ignore_permissions=True)  # Use this to avoid permission issues
	# 			# Format the dates to dd-mm-yyyy HH:MM
	# 			from_date = datetime.strptime(str(data.from_date_time), "%Y-%m-%d %H:%M:%S").strftime("%d-%m-%Y %H:%M")
	# 			to_date = datetime.strptime(str(data.to_date_time), "%Y-%m-%d %H:%M:%S").strftime("%d-%m-%Y %H:%M")

	# 			# Show success message
	# 			frappe.msgprint(
	# 				f"Vehicle '{data.vehicle}' has been successfully assigned from {from_date} to {to_date}."
	# 			)
	# 		else:
	# 			frappe.throw(f"Duplicate Vehicle History for booking with same date and time.")


# second validation of vehicle assgine or not set message =======================
    # def on_update(self):
    #     for data in self.booking_details:
    #         # Convert strings to datetime objects
    #         from_date_time = datetime.strptime(data.from_date_time, "%Y-%m-%d %H:%M:%S")
    #         to_date_time = datetime.strptime(data.to_date_time, "%Y-%m-%d %H:%M:%S")

    #         # Check for overlapping Vehicle History records
    #         overlapping_record = frappe.db.sql(
    #             """
    #             SELECT name FROM `tabVehicle History`
    #             WHERE parent = %(vehicle)s
    #             AND (
    #                 (%(from_date_time)s BETWEEN from_date_time AND to_date_time)
    #                 OR (%(to_date_time)s BETWEEN from_date_time AND to_date_time)
    #                 OR (from_date_time BETWEEN %(from_date_time)s AND %(to_date_time)s)
    #                 OR (to_date_time BETWEEN %(from_date_time)s AND %(to_date_time)s)
    #             )
    #             """,
    #             {
    #                 "vehicle": data.vehicle,
    #                 "from_date_time": from_date_time,
    #                 "to_date_time": to_date_time,
    #             },
    #         )

    #         if overlapping_record:
    #             frappe.throw(
    #                 f"'{data.vehicle}' this vehicle already assigned given date and time."
    #             )

    #         # Create a new Vehicle History record if no overlap exists
    #         new_doc = frappe.new_doc("Vehicle History")
    #         new_doc.booking_id = data.parent
    #         new_doc.from_date_time = data.from_date_time
    #         new_doc.to_date_time = data.to_date_time
    #         new_doc.parent = data.vehicle
    #         new_doc.parenttype = "Vehicle"
    #         new_doc.parentfield = "custom_booking_history"
    #         new_doc.insert(ignore_permissions=True)

    #         # Format the dates to dd-mm-yyyy HH:MM for the message
    #         formatted_from_date = from_date_time.strftime("%d-%m-%Y %H:%M")
    #         formatted_to_date = to_date_time.strftime("%d-%m-%Y %H:%M")

    #         # Show success message
    #         frappe.msgprint(
    #             f"Vehicle '{data.vehicle}' has been successfully assigned from {formatted_from_date} to {formatted_to_date}."
    #         )

	# def on_update(self):
	# 	for data in self.booking_details:
	# 		frappe.db.set_value("Booking Request Details",data.reference_id,"status","Booked")




	# def on_submit(self):
	# 	all_booked = True
	# 	partial_booked = False

	# 	for data in self.booking_details:
	# 		# Update child record status to "Booked"
	# 		frappe.db.set_value("Booking Request Details", data.reference_id, "status", "Booked")

	# 	# fetch updated statuses from child table from booking request
	# 	child_statuses = frappe.get_all(
	# 		"Booking Request Details", 
	# 		filters={"parent": self.booking_request}, 
	# 		fields=["status"]
	# 	)

	# 	# Check statuses to determine parent status
	# 	for status_record in child_statuses:
	# 		if status_record.status != "Booked":
	# 			all_booked = False
	# 			partial_booked = True
	# 			break

	# 	# Set parent status
	# 	if all_booked:
	# 		self.status = "Booked"
	# 	elif partial_booked:
	# 		self.status = "Partial Booked"
	# 	else:
	# 		self.status = "Open"  # Optional, if needed

	# 	# Update parent record
	# 	frappe.db.set_value("Booking Request", self.booking_request, "status", self.status)		

	# 	for data in self.booking_details:
	# 		# Convert strings to datetime objects
	# 		from_date_time = datetime.strptime(data.from_date_time, "%Y-%m-%d %H:%M:%S")
	# 		to_date_time = datetime.strptime(data.to_date_time, "%Y-%m-%d %H:%M:%S")

	# 		# Check for overlapping records (Vehicle and Driver)
	# 		for record_type, field, parenttype, parentfield in [
	# 			("Vehicle", "vehicle", "Vehicle", "custom_booking_history"),
	# 			("Vehicle", "driver", "Driver", "custom_booking_historys")
	# 		]:
	# 			overlapping_record = frappe.db.sql(
	# 				f"""
	# 				SELECT name FROM `tab{record_type} History`
	# 				WHERE parent = %(parent)s
	# 				AND (
	# 					(%(from_date_time)s BETWEEN from_date_time AND to_date_time)
	# 					OR (%(to_date_time)s BETWEEN from_date_time AND to_date_time)
	# 					OR (from_date_time BETWEEN %(from_date_time)s AND %(to_date_time)s)
	# 					OR (to_date_time BETWEEN %(from_date_time)s AND %(to_date_time)s)
	# 				)
	# 				""",
	# 				{
	# 					"parent": getattr(data, field),
	# 					"from_date_time": from_date_time,
	# 					"to_date_time": to_date_time,
	# 				},
	# 			)

	# 			if overlapping_record:
	# 				frappe.throw(f"'{getattr(data, field)}' this {record_type.lower()} is already assigned for the given date and time.")

	# 			# Create a new record for Vehicle or Driver History
	# 			new_doc = frappe.new_doc(f"{record_type} History")
	# 			new_doc.booking_id = data.parent
	# 			new_doc.from_date_time = data.from_date_time
	# 			new_doc.to_date_time = data.to_date_time
	# 			new_doc.parent = getattr(data, field)
	# 			new_doc.parenttype = parenttype
	# 			new_doc.parentfield = parentfield
	# 			new_doc.insert(ignore_permissions=True)

	# 		# Format the dates for the success message
	# 		formatted_from_date = from_date_time.strftime("%d-%m-%Y %H:%M")
	# 		formatted_to_date = to_date_time.strftime("%d-%m-%Y %H:%M")

	# 		# Show success message
	# 		frappe.msgprint(
	# 			f"Vehicle '{data.vehicle}' and Driver '{data.driver}' have been successfully assigned from {formatted_from_date} to {formatted_to_date}."
	# 		)






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

		self.status = "Booked" if all_booked else "Partial Booked" if partial_booked else "Open"
		frappe.db.set_value("Booking Request", self.booking_request, "status", self.status)

		# Process each booking detail
		for data in self.booking_details:
			from_date_time = datetime.strptime(data.from_date_time, "%Y-%m-%d %H:%M:%S")
			to_date_time = datetime.strptime(data.to_date_time, "%Y-%m-%d %H:%M:%S")

			# Check for overlapping records and create history
			for record_type, field, parenttype, parentfield in [
				("Vehicle", "vehicle", "Vehicle", "custom_booking_history"),
				("Vehicle", "driver", "Driver", "custom_booking_historys")
			]:
				parent_value = getattr(data, field)
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
					"booking_id": data.parent,
					"from_date_time": data.from_date_time,
					"to_date_time": data.to_date_time,
					"parent": parent_value,
					"parenttype": parenttype,
					"parentfield": parentfield,
				})
				new_doc.insert(ignore_permissions=True)

			# Show success message
			frappe.msgprint(
				f"Vehicle '{data.vehicle}' and Driver '{data.driver}' assigned from {from_date_time.strftime('%d-%m-%Y %H:%M')} to {to_date_time.strftime('%d-%m-%Y %H:%M')}."
			)





	def on_cancel(self):
		# Revert child records' status to "Open"
		for data in self.booking_details:
			frappe.db.set_value("Booking Request Details", data.reference_id, "status", "Open")

		# Check if there are any other booked details in the parent booking request
		child_statuses = frappe.get_all(
			"Booking Request Details",
			filters={"parent": self.booking_request},
			fields=["status"]
		)

		# Determine parent booking status
		all_open = all(status_record.status == "Open" for status_record in child_statuses)
		partial_booked = any(status_record.status == "Booked" for status_record in child_statuses)

		# Update parent status based on child statuses
		new_status = "Open" if all_open else "Partial Booked" if partial_booked else "Booked"
		frappe.db.set_value("Booking Request", self.booking_request, "status", new_status)

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
		for data in self.booking_details:
			delete_history(data.parent, data.vehicle, "Vehicle")
			delete_history(data.parent, data.driver, "Vehicle")

			frappe.msgprint(
				f"Booking for Vehicle '{data.vehicle}' and Driver '{data.driver}' has been successfully canceled."
			)




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








@frappe.whitelist()
def get_available_vehicles(vehicle_type, from_datetime, to_datetime):
    available_vehicles = frappe.db.sql("""
        SELECT name 
        FROM `tabVehicle`
        WHERE custom_vehicle_type = %s
        AND name NOT IN (
            SELECT parent 
            FROM `tabVehicle History` 
            WHERE (
                (%s BETWEEN from_date_time AND to_date_time)
                OR (%s BETWEEN from_date_time AND to_date_time)
                OR (from_date_time BETWEEN %s AND %s)
                OR (to_date_time BETWEEN %s AND %s)
                OR (from_date_time <= %s AND to_date_time >= %s)
            )
           
        )
    """, (vehicle_type, from_datetime, to_datetime, from_datetime, to_datetime, from_datetime, to_datetime, from_datetime, to_datetime), as_dict=True)

    return [vehicle['name'] for vehicle in available_vehicles]
