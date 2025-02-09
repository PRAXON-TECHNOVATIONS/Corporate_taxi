// Copyright (c) 2025, taxi and contributors
// For license information, please see license.txt

frappe.query_reports["Booking Summary"] = {
	filters: [
        {
            fieldname: "company",
            label: "Company",
            fieldtype: "Link",
            options: "Company",
            reqd: 0,
			default: frappe.defaults.get_default("company")
        },
        {
            fieldname: "status",
            label: "Status",
            fieldtype: "Select",
            options: "\nOpen\nTrip Completed", // Adjust statuses as needed
            reqd: 0,
			
        },
        {
            fieldname: "from_date_time",
            label: "From Date Time",
            fieldtype: "Datetime",
            reqd: 0
        },
        {
            fieldname: "to_date_time",
            label: "To Date Time",
            fieldtype: "Datetime",
            reqd: 0
        }
    ]
};
