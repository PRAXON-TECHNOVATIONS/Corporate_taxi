# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class BookingRequest(Document):
	pass

@frappe.whitelist()
def get_customer_for_user():
    user = frappe.session.user

    # Check if the user has the "Customer" role
    role_profile = frappe.db.get_value("User", user, "role_profile_name")
    
    if role_profile == "Customer":
        # Fetch the Customer linked to this user
        customer = frappe.db.get_value("Customer", {"custom_user": user}, "name")
        
        if customer:
            return customer

    return None