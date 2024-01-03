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
		},
		webpack: (config, { webpack }) => {
			// if (isDev && process.env.APP_ENV === "local") {
			// 	const localhost = new URL(process.env.DEV_ASSET_PREFIX as string).host;
			// 	config.module.rules.push({
			// 		test: /\.js$/,
			// 		loader: "string-replace-loader",
			// 		options: {
			// 			search: "${url}/_next/webpack-hmr",
			// 			replace: `wss://${localhost}/_next/webpack-hmr`
			// 		}
			// 	});
			// }
			config.plugins.push(
				// provides commonly used modules and their exports as global variables
				// when ever the global is refeferenced in a module
				new webpack.ProvidePlugin({
					react: "react",
					React: "react",
					Component: ["react", "Component"],
					PureComponent: ["react", "PureComponent"],
					memo: ["react", "memo"],
					Fragment: ["react", "Fragment"],
					useState: ["react", "useState"],
					useEffect: ["react", "useEffect"],
					useRef: ["react", "useRef"],
					useReducer: ["react", "useReducer"],
					useCallback: ["react", "useCallback"],
					useLayoutEffect: ["react", "useLayoutEffect"],
					createRef: ["react", "createRef"],
					createElement: ["react", "createElement"],
					GetServerSideProps: ["next", "GetServerSideProps"],
					NextPageContext: ["next", "NextPageContext"]
				})
			);

			return config;
		}
	};
};

export default config;
