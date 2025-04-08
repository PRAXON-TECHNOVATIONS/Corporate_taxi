import frappe
from frappe.utils import getdate,nowdate



def validate(doc,method):
    # validate fasttag date
    validate_fasttag_date(doc)
    # validate fasttag number
    validate_fasttag_number(doc)


# validate fasttag date
def validate_fasttag_date(doc):
    if getdate(doc.custom_fastag_validity_start_date) > getdate(doc.custom_fastag_expiry_date):
            frappe.throw("Fasttag expiry date bigger then fast tag validity start date")
            
def validate_fasttag_number(doc):
     if doc.custom_fastag_number:
        if len(doc.custom_fastag_number) != 14:
            frappe.throw("Please Validate fasttag number")



@frappe.whitelist()
def check_expiry_date():
    try:
        # Get all vehicle records
        vehicles = frappe.get_all("Vehicle", fields=["name", "custom_fastag_expiry_date"])

        # Iterate through each vehicle record
        for vehicle in vehicles:
            # Get the expiry date from the vehicle record
            expiry_date = getdate(vehicle.custom_fastag_expiry_date)

            # Compare expiry date with today's date
            if expiry_date < getdate(nowdate()):
                # If expired, update the status
                frappe.db.set_value("Vehicle", vehicle.name, "custom_fastag_status", "Expired")
    except Exception as e:
        # Log the error with the exception message
        frappe.log_error(message=str(e), title="Fastag Expiry Check Error")
        # You can also log additional context if necessary
        frappe.log_error(message=f"Error occurred in check_expiry_date function while processing vehicles.", title="Fastag Expiry Check Error")
       
