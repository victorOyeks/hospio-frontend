import type { LucideIcon } from "lucide-react";
import {
	BeerIcon,
	ChefHatIcon,
	CitrusIcon,
	CupSodaIcon,
	GlassWaterIcon,
	MartiniIcon,
	PizzaIcon,
	SaladIcon,
	SandwichIcon,
	SoupIcon,
	UtensilsIcon,
	WineIcon,
} from "lucide-react";
import { cn } from "@hospio/ui/utils";

/**
 * A small colour and icon per outlet, so staff at a hotel with two bars (a Bar and a Patio Lounge) or a Kitchen and
 * a Restaurant can tell at a glance where they are working. Muted accents that sit beside the maroon brand; they mark,
 * they never theme a screen. Each outlet gets its place among its desk's outlets sorted by id, so the same outlet has
 * the same mark on every screen and device. Nothing shows when the desk has a single outlet.
 */
const ACCENTS = [
	"#2e7d74", // teal
	"#b7832f", // ochre
	"#4c6a92", // slate blue
	"#6e7b3a", // olive
	"#7e4f7a", // plum
	"#a35d44", // clay
];
const BAR_ICONS: LucideIcon[] = [
	WineIcon,
	MartiniIcon,
	BeerIcon,
	GlassWaterIcon,
	CupSodaIcon,
	CitrusIcon,
];
const FOOD_ICONS: LucideIcon[] = [
	ChefHatIcon,
	UtensilsIcon,
	SoupIcon,
	PizzaIcon,
	SaladIcon,
	SandwichIcon,
];

export type OutletAccent = { color: string; Icon: LucideIcon };

/** The mark of `id` among `peers` (the ids of the desk's outlets); null when there is only one outlet. */
export function outletAccent(
	id: string | undefined,
	peers: string[],
	kind?: string,
): OutletAccent | null {
	if (!id || peers.length < 2) return null;
	const sorted = [...new Set(peers)].sort();
	let i = sorted.indexOf(id);
	if (i < 0) i = [...id].reduce((n, c) => n + c.charCodeAt(0), 0);
	const icons = kind === "BAR" ? BAR_ICONS : FOOD_ICONS;
	return {
		color: ACCENTS[i % ACCENTS.length] ?? ACCENTS[0],
		Icon: icons[i % icons.length] ?? icons[0],
	};
}

/** The outlet's mark: a round coloured badge with its icon (`size="sm"` is a plain dot for dense rows). */
export function OutletMark({
	id,
	peers,
	kind,
	size = "md",
	className,
	title,
}: {
	id: string | undefined;
	peers: string[];
	kind?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
	/** The outlet's name as a tooltip; the mark is decorative, the name is always written next to it. */
	title?: string;
}) {
	const accent = outletAccent(id, peers, kind);
	if (!accent) return null;
	const { color, Icon } = accent;
	if (size === "sm")
		return (
			<span
				aria-hidden
				title={title}
				className={cn("inline-block size-2 shrink-0 rounded-full", className)}
				style={{ backgroundColor: color }}
			/>
		);
	return (
		<span
			aria-hidden
			title={title}
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-full text-white",
				size === "lg" ? "size-8" : "size-5",
				className,
			)}
			style={{ backgroundColor: color }}
		>
			<Icon className={size === "lg" ? "size-4" : "size-3"} />
		</span>
	);
}
