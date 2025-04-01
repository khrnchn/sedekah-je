self.addEventListener("push", (event) => {
	if (event.data) {
		const data = event.data.json();
		const options = {
			body: data.body,
			icon: data.icon || "/masjid.svg",
			badge: "/masjid.svg",
			vibrate: [100, 50, 100],
			data: {
				dateOfArrival: Date.now(),
				primaryKey: "2",
			},
		};
		event.waitUntil(self.registration.showNotification(data.title, options));
	}
});

self.addEventListener("notificationclick", (event) => {
	console.log("Notification click received.");
	event.notification.close();
	event.waitUntil(clients.openWindow("https://sedekah.je"));
});
