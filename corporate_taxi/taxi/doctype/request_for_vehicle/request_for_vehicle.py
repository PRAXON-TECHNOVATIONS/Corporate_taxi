# Copyright (c) 2025, taxi and contributors
# For license information, please see license.txt

from datetime import datetime
import frappe
from frappe import _
from frappe.core.doctype.communication.email import make
from frappe.utils.user import get_user_fullname
from datetime import datetime
from frappe.model.document import Document

STANDARD_USERS = ("Guest", "Administrator")


class RequestforVehicle(Document):
    
	def on_submit(self):
		"""Trigger email previews for suppliers with send_email set to True."""
		
		if self.send_email:  # Direct check, no need to compare with 1
			self.send_request_email(self.partner)

		self.status = "Pending"
		self.save()


	@frappe.whitelist()
	def get_supplier_email_preview(self, supplier):
		"""Returns a formatted email preview as a string."""
		# rfq_suppliers = [row for row in self.partners if row.supplier == supplier]
		rfq_suppliers = self.partner
		if not rfq_suppliers:
			frappe.throw(_("Supplier {0} not found in partners").format(supplier))

		rfq_supplier = self.email_id
		self.validate_email_id(rfq_supplier)

		return self.supplier_rfq_mail(rfq_supplier, preview=True)


	def send_request_email(self, supplier):
			"""Returns a formatted email preview as a string."""
			# rfq_suppliers = [row for row in self.partners if row.supplier == supplier]
			rfq_suppliers = self.partner
			if not rfq_suppliers:
				frappe.throw(_("Supplier {0} not found in partners").format(supplier))

			rfq_supplier = self.email_id
			self.validate_email_id(rfq_supplier)

			return self.supplier_rfq_mail(rfq_supplier)


	def validate_email_id(self, partner):
		"""Ensures that the email ID is present before sending an email."""
		if not self.email_id:
			frappe.throw(
				_("Supplier {1} requires an Email Address to send an email").format(
					frappe.bold(self.partner)
				)
			)


	def supplier_rfq_mail(self, partner, preview=False):
		"""Generates and returns an email message for the supplier."""
		user_full_name = get_user_fullname(frappe.session["user"])
		if user_full_name == "Guest":
			user_full_name = "Administrator"

		doc_args = self.as_dict()

		
		doc_args.update(
			{
				"partner_name": self.partner,
				"from_date_time": self.format_datetime(self.from_date_time),
				"to_date_time": self.format_datetime(self.to_date_time),
				"vehicle_type": self.vehicle_type,
				"request_id":self.name	
			}
		)

		if not self.email_template:
			return

		email_template = frappe.get_doc("Email Template", self.email_template)
		message = frappe.render_template(email_template.response_, doc_args)
		subject = frappe.render_template(email_template.subject, doc_args)

		sender = None if frappe.session.user in STANDARD_USERS else frappe.session.user

		if preview:
			return {"message": message, "subject": subject}
		
		if self.email_send:
			self.send_email(partner, sender, subject, message)



	def send_email(self, partner, sender, subject, message):
		"""Sends an email to the supplier."""
		
		if not self.email_id:
			frappe.throw(_("Supplier does not have an email address."))

		# Create email log and send email
		email_log = make(
			subject=subject,
			content=message,
			recipients=self.email_id,  # Ensure this is valid
			sender=sender,
			send_email=True,
			doctype=self.doctype,
			name=self.name,
		)

		# Mark email as sent
		self.email_sent = 1
		self.save()

		frappe.msgprint(_("Email Sent to Partner {0}").format(self.partner))


	def format_datetime(self, dt):
		"""Formats datetime to the required format."""
		if isinstance(dt, str):
			dt = datetime.strptime(dt, "%Y-%m-%d %H:%M:%S")  # Convert string to datetime
		return dt.strftime("%d-%m-%y %I:%M %p")  # Format datetime



@frappe.whitelist()
def check_user_role_profile():
    role_profile = frappe.db.get_value("User", frappe.session.user, "role_profile_name")
    return {"is_partner": role_profile == "Partner"}
