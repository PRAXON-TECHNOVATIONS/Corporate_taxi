# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PartnerQuotation(Document):
	def on_submit(self):
		frappe.db.set_value("Request for Quotation Supplier",self.reference_request_id,"quote_status","Received")

	def on_cancel(self):
		frappe.db.set_value("Request for Quotation Supplier",self.reference_request_id,"quote_status","Pending")