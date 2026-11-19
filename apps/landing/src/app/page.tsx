import type { Metadata } from "next";
import { ClosingCta } from "@/components/sections/closing-cta";
import { FAQS, Faq, FaqJsonLd, HOME_FAQ_COUNT } from "@/components/sections/faq";
import { FeatureGrid } from "@/components/sections/feature-grid";
import { Hero } from "@/components/sections/hero";
import { Onboarding } from "@/components/sections/onboarding";
import { Pricing } from "@/components/sections/pricing";
import { SeeItInAction } from "@/components/sections/see-it-in-action";
import { SiteFooter, SiteHeader } from "@/components/site";
import { VideoJsonLd } from "@/components/video-json-ld";
import { VIDEOS } from "@/config/videos";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * The public home page, kept short: hero, the overview video, six feature cards, the four steps, the price with the
 * partner offer, five questions and the closing call to action. The full feature sections are on /features.
 */
export default function HomePage() {
	return (
		<>
			<SiteHeader />
			<main className="bg-page">
				<Hero />
				<SeeItInAction />
				<FeatureGrid />
				<Onboarding />
				<Pricing />
				<Faq limit={HOME_FAQ_COUNT} />
				<ClosingCta />
			</main>
			<SiteFooter />
			<VideoJsonLd videos={[VIDEOS.overview, VIDEOS.partner]} />
			<FaqJsonLd faqs={FAQS.slice(0, HOME_FAQ_COUNT)} />
		</>
	);
}
