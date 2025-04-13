import frappe
from frappe import _
from frappe.utils import getdate


def on_update(doc, method=None):
    # Fetch the old custom_user before the change
    old_custom_user = frappe.db.get_value(doc.doctype, doc.name, 'custom_user')

    # If custom_user has changed, delete the old User Permission
    if old_custom_user and old_custom_user != doc.custom_user:
        old_permission = frappe.get_all('User Permission', 
            filters={
                'user': old_custom_user,
                'allow': 'Driver',
                'for_value': doc.name
            },
            fields=['name']
        )
        for perm in old_permission:
            frappe.delete_doc('User Permission', perm['name'], ignore_permissions=True)
        

    # Check if a User Permission already exists for the new custom_user
    existing_permission = frappe.get_all('User Permission', 
        filters={
            'user': doc.custom_user,
            'allow': 'Driver',
            'for_value': doc.name
        },
        fields=['name']
    )

    # If no existing permission, create a new one
    if not existing_permission and doc.custom_user:
        permission = frappe.new_doc('User Permission')
        permission.user = doc.custom_user
        permission.allow = 'Driver'
        permission.for_value = doc.name
        permission.insert(ignore_permissions=True)

    
def validate(doc,method):
    # validate license issue and expiry date 
    validate_license_date(doc)

    # validate child table issue & expiry dates
    validate_license_category_dates(doc)
    # validate aadhar number
    aadhar_number_validate(doc)

    # validate license number
    license_number(doc)


# validate license issue and expiry date 
def validate_license_date(doc):
    if getdate(doc.issuing_date) > getdate(doc.expiry_date):
            frappe.throw("License issue date bigger then expiry date")

# validate child table license category issue and expiry date validation
def validate_license_category_dates(doc):
    for idx, data in enumerate(doc.driving_license_category):
        if getdate(data.issuing_date) > getdate(data.expiry_date):
            frappe.throw(f"Row {idx + 1}: License issue date is greater than expiry date for this category.")

def aadhar_number_validate(doc):
    if len(doc.custom_aadhar_number) != 12:
        frappe.throw("Please enter valid Aadhar number")

def license_number(doc):
    if len(doc.license_number) != 15:
        frappe.throw("Please enter valid License number")




# test current lat and log
import frappe
import requests

@frappe.whitelist()
def update_current_user_location():
    user = frappe.session.user
    ip = frappe.local.request_ip

    if not ip:
        frappe.throw("Could not get IP address.")

    try:
        url = f"https://ipapi.co/{ip}/json/"
        response = requests.get(url, timeout=5)

        if response.status_code != 200:
            frappe.throw(f"Error from IP API: {response.status_code}\n{response.text}")

        try:
            data = response.json()
            return data
        except requests.exceptions.JSONDecodeError:
            frappe.throw(f"Could not decode response from API:\n{response.text}")

        lat = data.get("latitude")
        lon = data.get("longitude")

        if not lat or not lon:
            frappe.throw(f"Latitude or longitude not found in response:\n{data}")

        # frappe.db.set_value("User", user, {
        #     "latitude": lat,
        #     "longitude": lon
        # })

        return {
            "message": "Location updated successfully",
            "latitude": lat,
            "longitude": lon
        }

    except Exception as e:
        frappe.log_error(f"Location update failed for {user}: {str(e)}")
        frappe.throw("Location update failed.")



# @frappe.whitelist()
# def update_driver_location(latitude, longitude):
#     user = frappe.session.user

#     driver = frappe.db.get_value('Driver', {'custom_user': user}, 'name')
#     if not driver:
#         return "No Driver linked to current user"

#     frappe.db.set_value('Driver', driver, {
#         'custom_latitude': latitude,
#         'custom_longitude': longitude
#     })

#     return driver


@frappe.whitelist()
def update_driver_location(latitude, longitude):
    user = frappe.session.user

  # Get the driver linked to the current user
    driver = frappe.db.get_value('Driver', {'custom_user': user}, 'name')
    if not driver:
        return "No Driver linked to current user"

    # Check if there's any active (e.g. "Ongoing") trip for this driver
    trip_exists = frappe.db.exists('Driver Trip', {
        'driver_id': driver,
        'status': 'Start',   
    })


    if not trip_exists:
        return "Driver has no ongoing trip"

    print(driver)
    print("\n\n\n\n\n\n\n")
    # Update driver's current location
    frappe.db.set_value('Driver', driver, {
        'custom_latitude': latitude,
        'custom_longitude': longitude
    })

    return driver



import frappe
from frappe import _

@frappe.whitelist()
def get_driver_location_by_trip(trip_id):
    driver_id = frappe.db.get_value("Driver Trip", trip_id, "driver_id")
    if not driver_id:
        return {}

    lat, lng = frappe.db.get_value("Driver", driver_id, ["custom_latitude", "custom_longitude"])
    return {
        "driver_id": driver_id,
        "latitude": lat,
        "longitude": lng
    }

@frappe.whitelist()
def get_driver_location(driver_id):
    lat, lng = frappe.db.get_value("Driver", driver_id, ["custom_latitude", "custom_longitude"])
    return {
        "latitude": lat,
        "longitude": lng
    }


import frappe
from frappe.utils import now_datetime, flt
@frappe.whitelist()
def save_trip_coordinates(trip_id, latitude, longitude):
    if not (trip_id and latitude and longitude):
        frappe.throw("Trip ID, latitude, and longitude are required")

    latitude = flt(latitude, 6)
    longitude = flt(longitude, 6)

    trip_doc = frappe.get_doc("Driver Trip", trip_id)

    # Check for duplicate coordinates
    if any(flt(child.latitude, 6) == latitude and flt(child.longitude, 6) == longitude
           for child in trip_doc.trip_route_history):
        return "duplicate"

    # Append the new coordinates
    trip_doc.append("trip_route_history", {
        "latitude": latitude,
        "longitude": longitude,
        "timestemp": now_datetime()  # corrected key to match child table field
    })
    trip_doc.save(ignore_permissions=True)
    return "success"


# @frappe.whitelist()
# def get_trip_route_history(trip_id):
#     if not trip_id:
#         frappe.throw("Trip ID is required")

#     return frappe.get_all(
#         "Trip Tracking Log", 
#         filters={"parent": trip_id},
#         fields=["latitude", "longitude", "timestemp"],
#         order_by="timestemp asc"
#     )

import frappe

@frappe.whitelist(allow_guest=True)
def get_trip_route_history(trip_id):
    """
    Fetch the trip route history for a given trip_id.
    Returns a list of coordinates (latitude, longitude) for the trip.
    """
    try:
        # Fetch trip route history for the given trip_id from the relevant table
        trip_history = frappe.db.get_all(
            'Trip Tracking Log',  # Assuming this is the correct table name
            filters={'parent': trip_id},  # Filter by trip_id
            fields=['latitude', 'longitude'],  # Get the latitude and longitude of each point
            order_by='timestemp'  # Order by timestamp to ensure correct order
        )
        
        if not trip_history:
            return {"message": "No route history found for this trip."}

        # Return the trip history as a response
        return {"message": trip_history}
    
    except Exception as e:
        frappe.log_error(f"Error fetching trip route history for trip_id {trip_id}: {str(e)}")
        return {"error": "An error occurred while fetching the route history."}
