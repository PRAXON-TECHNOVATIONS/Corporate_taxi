# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import getdate



class BookingRequest(Document):
	def validate(self):
          if getdate(self.from_date_time) > getdate(self.to_date_time):
              frappe.throw("From Date is bigger than To Date. Please enter a valid date.")


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