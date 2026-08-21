import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ["./components/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				heading: ["var(--font-heading)", ...fontFamily.sans],
				body: ["var(--font-body)", ...fontFamily.sans],
			},
			colors: {
				border: "oklch(var(--border))",
				input: "oklch(var(--input))",
				ring: "oklch(var(--ring))",
				background: "oklch(var(--background))",
				foreground: "oklch(var(--foreground))",
				primary: {
					DEFAULT: "oklch(var(--primary))",
					foreground: "oklch(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "oklch(var(--secondary))",
					foreground: "oklch(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "oklch(var(--destructive))",
					foreground: "oklch(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "oklch(var(--muted))",
					foreground: "oklch(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "oklch(var(--accent))",
					foreground: "oklch(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "oklch(var(--popover))",
					foreground: "oklch(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "oklch(var(--card))",
					foreground: "oklch(var(--card-foreground))",
				},
				sidebar: {
					DEFAULT: "oklch(var(--sidebar-background))",
					foreground: "oklch(var(--sidebar-foreground))",
					primary: "oklch(var(--sidebar-primary))",
					accent: "oklch(var(--sidebar-accent))",
					border: "oklch(var(--sidebar-border))",
					ring: "oklch(var(--sidebar-ring))",
					"primary-foreground": "oklch(var(--sidebar-primary-foreground))",
					"accent-foreground": "oklch(var(--sidebar-accent-foreground))",
				},
			},
			borderRadius: {
				xl: "calc(var(--radius) + 4px)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: 0,
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: 0,
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
};
