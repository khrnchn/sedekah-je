/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "sedekah.je",
				pathname: "**",
				port: "",
			},
			{
				protocol: "https",
				hostname: "pub-713906db9ee448e4af59aa8fb2e44c84.r2.dev",
				pathname: "**",
				port: "",
			},
		],
	},

	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});

		return config;
	},

	async headers() {
		return [
			{
				source: "/qr/:path*",
				headers: [
					{
						key: "Cross-Origin-Embedder-Policy",
						value: "require-corp",
					},
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin",
					},
				],
			},
		];
	},
};

export default nextConfig;
