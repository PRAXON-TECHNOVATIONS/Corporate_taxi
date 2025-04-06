frappe.ui.form.on('Driver', {
	refresh(frm) {
		// your code here
		assign_vehicle_visibility(frm)

		// address filter partner wise
		partner_wise_address(frm)

	}
})


function assign_vehicle_visibility(frm){
	frm.fields_dict['custom_vehicles'].grid.get_field('vehicle').get_query = function(doc, cdt, cdn) {
		var selected_items = [];

		// Loop through the items in the child table to collect already selected items
		frm.doc.custom_vehicles.forEach(function(item_row) {
			if (item_row.vehicle) {
				selected_items.push(item_row.vehicle);
			}
		});

		// Filter out selected items from the Link field in the current row
		return {
			filters: {
				'name': ['not in', selected_items]
			}
		};
	};
}

function partner_wise_address(frm){
	frm.set_query('address', function() {
		return {
			filters: {
				'link_doctype': 'Supplier',    
				'link_name': frm.doc.partner,
				"is_your_company_address":0  
			}
		};
	});
	
}