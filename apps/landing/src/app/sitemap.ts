import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/components/site";
import { LEGAL_DOCUMENTS } from "@/legal/documents";

/** The home page, the features page, Book a demo, the partner application page and the published legal documents. Empty on staging. */
export default function sitemap(): MetadataRoute.Sitemap {
	if (!SITE_INDEXABLE) return [];
	return [
		{ url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
		{ url: `${SITE_URL}/features`, changeFrequency: "monthly", priority: 0.8 },
		{
			url: `${SITE_URL}/book-a-demo`,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/partners/apply`,
			changeFrequency: "monthly",
			priority: 0.6,
		},
		{ url: `${SITE_URL}/legal`, changeFrequency: "monthly", priority: 0.5 },
		...LEGAL_DOCUMENTS.map((d) => ({
			url: `${SITE_URL}/legal/${d.slug}`,
			lastModified: d.effectiveDate,
			changeFrequency: "monthly" as const,
			priority: 0.4,
		})),
	];
}
