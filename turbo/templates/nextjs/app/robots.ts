import { MetadataRoute } from "next";

const DOMAIN_URL = process.env.NEXT_PUBLIC_SITE_DOMAIN as string;

const href = (path: string) => new URL(path, DOMAIN_URL).href;

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			disallow: "*"
		},
		sitemap: href("sitemap.xml")
	};
}
