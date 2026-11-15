/**
 * A hotel's brand (Hotel setup → Brand & colours) turned into the design tokens every screen reads, so one saved colour
 * recolours the hotel app (sidebar, buttons, highlights), the guest's booking page and the WhatsApp banner; the emails read
 * the same setting in messaging-service. Pure: used on the server (the dashboard shell, the booking page, the banner) and
 * live in the browser (the Brand section's preview). Status colours (green, amber, red) never change.
 */

export const HOSPIO_MAROON = "#4c091e";

export type Brand = {
	/** "#rrggbb". */
	primary: string;
	/** The sidebar in the brand colour (true) or white with the brand as the accent (false). */
	darkNav: boolean;
	shortName?: string | null;
	logoUrl?: string | null;
};

/** "#4C091E", "4c091e" or "#abc" → "#4c091e"; anything else → null. */
export function normalizeHex(input: unknown): string | null {
	if (typeof input !== "string") return null;
	let h = input.trim().replace(/^#/, "").toLowerCase();
	if (/^[0-9a-f]{3}$/.test(h)) h = [...h].map((c) => c + c).join("");
	return /^[0-9a-f]{6}$/.test(h) ? `#${h}` : null;
}

function rgb(hex: string): [number, number, number] {
	const n = Number.parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]) {
	return `#${[r, g, b]
		.map((v) =>
			Math.round(Math.max(0, Math.min(255, v)))
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`;
}

/** `amount` of white (positive) or black (negative) mixed into the colour. */
export function mix(hex: string, amount: number): string {
	const [r, g, b] = rgb(hex);
	const t = amount >= 0 ? 255 : 0;
	const a = Math.abs(amount);
	return toHex([r + (t - r) * a, g + (t - g) * a, b + (t - b) * a]);
}

function luminance(hex: string) {
	const [r, g, b] = rgb(hex).map((v) => {
		const c = v / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours (1 to 21). */
export function contrast(a: string, b: string): number {
	const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
	return (x + 0.05) / (y + 0.05);
}

/** White text when it reads on the colour, else near-black. */
export function onColour(hex: string): string {
	return contrast(hex, "#ffffff") >= 3 ? "#ffffff" : "#1a1a1a";
}

/** A sentence when white text on this colour would be hard to read (buttons, the dark sidebar), else null. */
export function readabilityWarning(hex: string): string | null {
	const c = contrast(hex, "#ffffff");
	if (c >= 4.5) return null;
	if (c >= 3)
		return "White text on this colour is a little faint on small labels. A slightly darker shade reads better.";
	return "This colour is too light for white text: buttons and the sidebar will show dark text instead. Pick a darker shade for the best look.";
}

/** The CSS custom properties for a brand (light theme). */
export function brandVars(b: Brand): Record<string, string> {
	const p = normalizeHex(b.primary) ?? HOSPIO_MAROON;
	const on = onColour(p);
	const vars: Record<string, string> = {
		"--brand-primary": p,
		"--brand-primary-soft": mix(p, 0.92),
		"--brand-on-primary": on,
		"--primary-1": p,
		"--primary-2": mix(p, 0.1),
		"--primary-3": mix(p, 0.22),
		"--primary-4": mix(p, 0.38),
		"--primary-5": mix(p, 0.85),
		"--primary-foreground": on,
	};
	if (b.darkNav) {
		vars["--nav-background"] = p;
		vars["--nav-text"] = on === "#ffffff" ? mix(p, 0.8) : "#3a3a3a";
		vars["--nav-active"] = on;
	} else {
		vars["--nav-background"] = "#ffffff";
		vars["--nav-text"] = "#616161";
		vars["--nav-active"] = p;
	}
	return vars;
}

/**
 * The sidebar's look: "dark" when it is the brand colour with light text, "light" when it is white (Dark sidebar off) or the
 * colour is too pale for white text. The shell puts it on `data-nav`, and the stylesheet turns the sidebar's white text dark.
 */
export function navMode(b: Brand): "dark" | "light" {
	const p = normalizeHex(b.primary) ?? HOSPIO_MAROON;
	return b.darkNav && onColour(p) === "#ffffff" ? "dark" : "light";
}

/**
 * The style sheet the dashboard shell renders (and the Brand section's live preview injects): the brand's tokens on the light
 * theme only (dark mode keeps its own). A light sidebar (navMode) makes "white" ink inside the sidebar, so every text-white /
 * bg-white/10 there follows; count badges keep white text on their own colour. Covers the mobile sidebar too (a portal).
 */
export function brandStyle(b: Brand): string {
	const body = Object.entries(brandVars(b))
		.map(([k, v]) => `${k}:${v}`)
		.join(";");
	const sidebar = '[data-slot="sidebar-container"],[data-sidebar="sidebar"]';
	const light =
		navMode(b) === "light"
			? `:root:not(.dark) :is(${sidebar}){--color-white:#212121}` +
				`:root:not(.dark) [data-slot="sidebar-container"]{border-right:1px solid var(--border-default)}` +
				`:root:not(.dark) :is(${sidebar}) .rounded-pill{--color-white:#ffffff}` +
				// The page you're on: the brand's soft tint with the brand colour, not a grey box.
				`:root:not(.dark) :is(${sidebar}) [data-active="true"]{background:var(--brand-primary-soft);color:var(--brand-primary)}` +
				`:root:not(.dark) :is(${sidebar}) [data-active="true"] *{--color-white:var(--brand-primary)}`
			: "";
	return `:root:not(.dark){${body}}${light}`;
}

/** Brand from the BRAND setup section's API keys (primaryColour, darkSidebar, shortName, logoUrl). */
export function brandFromSettings(
	s: Record<string, unknown> | null | undefined,
): Brand {
	const logo =
		typeof s?.logoUrl === "string" && /^https:\/\/\S+$/.test(s.logoUrl.trim())
			? s.logoUrl.trim()
			: null;
	return {
		primary: normalizeHex(s?.primaryColour) ?? HOSPIO_MAROON,
		darkNav: s?.darkSidebar !== false,
		shortName:
			typeof s?.shortName === "string" && s.shortName.trim()
				? s.shortName.trim().slice(0, 24)
				: null,
		logoUrl: logo,
	};
}
