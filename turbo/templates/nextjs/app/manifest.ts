/* eslint-disable turbo/no-undeclared-env-vars */
import { MetadataRoute } from "next";

const favicon = (path: string) => {
	const base = new URL(`/favicons/${path}`, process.env.NEXT_PUBLIC_SITE_DOMAIN as string);
	return base.href;
};

const apple_touch_60x60 = favicon("apple-touch-icon-60x60.png");
const apple_touch_120x120 = favicon("apple-touch-icon-120x120.png");
const apple_touch_152x152 = favicon("apple-touch-icon-152x152.png");
const apple_touch_167x167 = favicon("apple-touch-icon-167x167.png");
const apple_touch_180x180 = favicon("apple-touch-icon-180x180.png");
const android_192x192 = favicon("android-chrome-192x192.png");
const android_512x512 = favicon("android-chrome-512x512.png");

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Turbo Template",
		short_name: "turbo-tempalte",
		start_url: process.env.NEXT_PUBLIC_SITE_DOMAIN as string,
		scope: "/",
		icons: [
			{
				src: apple_touch_60x60,
				sizes: "60x60",
				type: "image/png"
			},
			{
				src: apple_touch_120x120,
				sizes: "120x120",
				type: "image/png"
			},
			{
				src: apple_touch_152x152,
				sizes: "152x152",
				type: "image/png"
			},
			{
				src: apple_touch_167x167,
				sizes: "167x167",
				type: "image/png"
			},
			{
				src: apple_touch_180x180,
				sizes: "180x180",
				type: "image/png"
			},
			{
				src: android_192x192,
				sizes: "192x192",
				type: "image/png"
			},
			{
				src: android_512x512,
				sizes: "512x512",
				type: "image/png"
			}
		],
		theme_color: "#ffffff",
		background_color: "#ffffff",
		display: "standalone",
		prefer_related_applications: false
	};
}
