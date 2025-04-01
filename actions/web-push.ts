"use server";

import webpush from "web-push";

webpush.setVapidDetails(
	"<mailto:your-email@example.com>",
	"BAvr8VkWL6OoAvVXM_7t1XijTxcQRWi1ZKl1BtBD4DtNJVm8V7x5HPMXJxc8C4l01yq80jp2boAbSh0sO9TKld0",
	"-CTjSamDp09U1QRIA4swxdKCBrG59Pp_OeL_u_i0MMA",
);

let subscription: PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
	subscription = sub;
	// In a production environment, you would want to store the subscription in a database
	// For example: await db.subscriptions.create({ data: sub })
	return { success: true };
}

export async function unsubscribeUser() {
	subscription = null;
	// In a production environment, you would want to remove the subscription from the database
	// For example: await db.subscriptions.delete({ where: { ... } })
	return { success: true };
}

export async function sendNotification(message: string) {
	if (!subscription) {
		throw new Error("No subscription available");
	}

	try {
		await webpush.sendNotification(
			// @ts-ignore
			subscription,
			JSON.stringify({
				title: "Test Notification",
				body: message,
				icon: "/masjid.svg",
			}),
		);
		return { success: true };
	} catch (error) {
		console.error("Error sending push notification:", error);
		return { success: false, error: "Failed to send notification" };
	}
}
