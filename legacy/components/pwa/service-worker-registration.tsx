"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if (
			process.env.NODE_ENV !== "production" ||
			typeof window === "undefined" ||
			!("serviceWorker" in navigator)
		) {
			return;
		}

		const register = () => {
			void navigator.serviceWorker.register("/sw.js", { scope: "/" });
		};

		if (document.readyState === "complete") {
			register();
			return;
		}

		window.addEventListener("load", register, { once: true });

		return () => window.removeEventListener("load", register);
	}, []);

	return null;
}
