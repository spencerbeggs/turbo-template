import { Metadata } from "next";
import { Page } from "@components/structure";
import { Headline } from "@components/text";

export default function Homepage() {
	return (
		<Page id="homepage">
			<Headline as="h1" text="Homepage" />
			<a href="/about">About</a>
			<p>Current time: {new Date().toLocaleTimeString()}</p>
		</Page>
	);
}

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_DOMAIN as string),
	title: "Turbo Template for Next.js",
	description:
		"A nicely configured starting point for Next.js projects with Turbo, Tailwind CSS, TypeScript, ESLint, Prettier, Jest, and more.",
	alternates: {
		canonical: "/"
	},
	openGraph: {
		title: "Turbo Template for Next.js",
		description:
			"A nicely configured starting point for Next.js projects with Turbo, Tailwind CSS, TypeScript, ESLint, Prettier, Jest, and more."
	},
	robots: {
		index: false,
		follow: true,
		nocache: true,
		googleBot: {
			index: false,
			follow: false,
			noimageindex: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1
		}
	}
};
