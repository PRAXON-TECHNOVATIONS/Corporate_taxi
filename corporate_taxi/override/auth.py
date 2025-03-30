import frappe

@frappe.whitelist()
def get_api_key():
    return frappe.db.get_single_value('Map Setting', 'api_key')
