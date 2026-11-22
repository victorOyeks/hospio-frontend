/**
 * The Meta Pixel (measuring the Meta adverts): events go only when NEXT_PUBLIC_META_PIXEL_ID is set (production) and the base
 * code has loaded (components/meta-pixel.tsx). Never pass form contents (names, phones, emails): no advanced matching.
 */
type Fbq = (command: "track", event: string, params?: Record<string, string>) => void;

export function trackMeta(event: "PageView" | "Lead" | "Contact" | "CompleteRegistration", params?: Record<string, string>) {
	if (typeof window === "undefined") return;
	const fbq = (window as unknown as { fbq?: Fbq }).fbq;
	try {
		fbq?.("track", event, params);
	} catch {
		// Measuring never gets in the visitor's way.
	}
}
