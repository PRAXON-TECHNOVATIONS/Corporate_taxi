        // function update_driver_location() {
        //     if (navigator.geolocation) {
        //         navigator.geolocation.getCurrentPosition(function (position) {
        //             const lat = position.coords.latitude;
        //             const lng = position.coords.longitude;

        //             // Call server to update Driver doc for current user
        //             frappe.call({
        //                 method: 'corporate_taxi.override.driver.update_driver_location',
        //                 args: {
        //                     latitude: lat,
        //                     longitude: lng
        //                 },
        //                 callback: function (r) {
        //                     console.log('Location updated for driver:', r.message);
        //                 }
        //             });
        //         });
        //     } else {
        //         console.warn("Geolocation is not supported by this browser.");
        //     }
        // }

        //     update_driver_location();
        //     setInterval(update_driver_location, 5000);
