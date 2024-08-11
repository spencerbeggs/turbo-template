import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants.js";

const config = async (phase) => {
	const isDev = phase === PHASE_DEVELOPMENT_SERVER;
	const isProd = phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;
	const { hostname } = new URL(process.env.NEXT_PUBLIC_SITE_DOMAIN);
	let imageDomains = [hostname];
	if (isDev) {
		const os = await import("os");
		imageDomains.push(os.hostname());
	}
	/**
	 * @type {import('next').NextConfig}
	 */
	return {
		compress: isProd,
		poweredByHeader: false,
		reactStrictMode: true,
		transpilePackages: [],
		experimental: {
			typedRoutes: false,
			optimizePackageImports: ["lodash"]
		},
		modularizeImports: {
			"lodash-es": {
				transform: "lodash-es/{{member}}"
			},
			lodash: {
				transform: "lodash/{{member}}"
			}
		},
		compiler: {
			removeConsole: isDev ? false : { exclude: ["error"] }
		},
		images: {
			formats: ["image/avif", "image/webp"],
			domains: imageDomains,
			dangerouslyAllowSVG: true,
			contentSecurityPolicy:
				"default-src 'self'; script-src 'none'; sandbox; connect-src 'self' 'https://vitals.vercel-insights.com/v1/vitals';"
		},
		async headers() {
			return [
				{
					source: "/:path*",
					has: [
						{
							type: "header",
							key: "x-device",
							value: "(<nonce>.*)"
						}
					],
					headers: [
						{
							key: "vary",
							value: "x-device,accept-encoding"
						}
					]
				}
			];
		}
	};
};

export default config;
