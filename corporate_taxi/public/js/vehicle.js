frappe.ui.form.on('Vehicle', {
    refresh(frm){
        // hide dashboard connection
        hide_dashboard(frm)
    },
})

function hide_dashboard(frm){
    frm.dashboard.links_area.hide()
}
