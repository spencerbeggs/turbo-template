/* eslint-disable turbo/no-undeclared-env-vars */
import "./global.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Footer } from "@modules/footer";
import { Navigation } from "@modules/navigation";

const favicon = (path: string) => {
	const base = new URL(`/favicons/${path}`, process.env.NEXT_PUBLIC_SITE_DOMAIN as string);
	return base.href;
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head key="head">
				<link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials"></link>
				<link rel="icon" sizes="any" href={favicon("favicon.ico")}></link>
				<link rel="icon" type="image/svg+xml" href={favicon("favicon.svg")}></link>
				<link rel="icon" type="image/x-icon" href={favicon("android-chrome-192x192.png")}></link>
				<link rel="icon" type="image/png" sizes="16x16" href={favicon("favicon-16x16.png")}></link>
				<link rel="icon" type="image/png" sizes="32x32" href={favicon("favicon-32x32.png")}></link>
				<link rel="icon" type="image/png" sizes="48x48" href={favicon("favicon-48x48.png")}></link>
				<link rel="icon" type="image/png" sizes="64x64" href={favicon("favicon-64x64.png")}></link>
				<link rel="apple-touch-icon" href={favicon("apple-touch-icon-60x60.png")}></link>
				<link rel="apple-touch-icon" sizes="120x120" href={favicon("apple-touch-icon-120x120.png")}></link>
				<link rel="apple-touch-icon" sizes="152x152" href={favicon("apple-touch-icon-152x152.png")}></link>
				<link rel="apple-touch-icon" sizes="167x167" href={favicon("apple-touch-icon-167x167.png")}></link>
				<link rel="apple-touch-icon" sizes="180x180" href={favicon("apple-touch-icon-180x180.png")}></link>
				<link rel="icon" type="image/png" sizes="512x512" href={favicon("android-chrome-512x512.png")}></link>
				<link rel="icon" type="image/png" sizes="16x16" href={favicon("favicon-16x16.png")}></link>
				<link rel="icon" type="image/png" sizes="32x32" href={favicon("favicon-32x32.png")}></link>
				<link rel="apple-touch-icon" sizes="180x180" href={favicon("apple-touch-icon-180x180.png")}></link>
				<meta name="theme-color" content="#000" />
			</head>
			<body className="bg-background-default text-text-primary overflow-x">
				<Navigation></Navigation>
				<main id="shell-content" className="min-h-screen flex flex-col">
					{children}
				</main>
				<Footer></Footer>
				{process.env.NEXT_PUBLIC_APP_ENV === "production" && <SpeedInsights />}
				{process.env.NEXT_PUBLIC_APP_ENV === "production" && <Analytics />}
			</body>
		</html>
	);
}

export const runtime = "edge"; // 'nodejs' (default) | 'edge'
