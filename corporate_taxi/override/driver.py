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



@frappe.whitelist()
def update_driver_location(latitude, longitude):
    user = frappe.session.user

    driver = frappe.db.get_value('Driver', {'custom_user': user}, 'name')
    if not driver:
        return "No Driver linked to current user"

    frappe.db.set_value('Driver', driver, {
        'custom_latitude': latitude,
        'custom_longitude': longitude
    })

    return driver
