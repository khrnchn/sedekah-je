"use client";

import {
	sendNotification,
	subscribeUser,
	unsubscribeUser,
} from "@/actions/web-push";
import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "./url";

export function PushNotificationManager() {
	const [isSupported, setIsSupported] = useState(false);
	const [subscription, setSubscription] = useState<PushSubscription | null>(
		null,
	);
	const [message, setMessage] = useState("");

	useEffect(() => {
		if ("serviceWorker" in navigator && "PushManager" in window) {
			setIsSupported(true);
			registerServiceWorker();
		}
	}, []);

	async function registerServiceWorker() {
		const registration = await navigator.serviceWorker.register("/sw.js", {
			scope: "/",
			updateViaCache: "none",
		});
		const sub = await registration.pushManager.getSubscription();
		setSubscription(sub);
	}

	async function subscribeToPush() {
		const registration = await navigator.serviceWorker.ready;
		const sub = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(
				"BAvr8VkWL6OoAvVXM_7t1XijTxcQRWi1ZKl1BtBD4DtNJVm8V7x5HPMXJxc8C4l01yq80jp2boAbSh0sO9TKld0",
			),
		});
		setSubscription(sub);
		const serializedSub = JSON.parse(JSON.stringify(sub));
		await subscribeUser(serializedSub);
	}

	async function unsubscribeFromPush() {
		await subscription?.unsubscribe();
		setSubscription(null);
		await unsubscribeUser();
	}

	async function sendTestNotification() {
		if (subscription) {
			await sendNotification(message);
			setMessage("");
		}
	}

	if (!isSupported) {
		return <p>Push notifications are not supported in this browser.</p>;
	}

	return (
		<div>
			<h3>Push Notifications</h3>
			{subscription ? (
				<>
					<p>You are subscribed to push notifications.</p>
					<button type="button" onClick={unsubscribeFromPush}>
						Unsubscribe
					</button>
					<input
						type="text"
						placeholder="Enter notification message"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>
					<button type="button" onClick={sendTestNotification}>
						Send Test
					</button>
				</>
			) : (
				<>
					<p>You are not subscribed to push notifications.</p>
					<button type="button" onClick={subscribeToPush}>
						Subscribe
					</button>
				</>
			)}
		</div>
	);
}
