import frappe
from frappe import _

def before_save(doc, method=None):
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

        
