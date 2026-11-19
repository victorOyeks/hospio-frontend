import {
	ArrowRightIcon,
	CreditCardIcon,
	LayoutDashboardIcon,
	type LucideIcon,
	NetworkIcon,
	PaletteIcon,
	ReceiptIcon,
	ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { btnLg, Section } from "@/components/site";
import { IconTile } from "./shared";

/**
 * The six feature areas, one card each. A card's id is the id of its full section on /features, so older links such as
 * /#payments still land on the right card, and the card links on to the detail.
 */
const features: { id: string; icon: LucideIcon; title: string; text: string }[] =
	[
		{
			id: "product",
			icon: LayoutDashboardIcon,
			title: "A view for every role",
			text: "Owner, manager and staff each see their own work, on a computer or a shared tablet.",
		},
		{
			id: "folio",
			icon: ReceiptIcon,
			title: "Bills that keep themselves",
			text: "Every order and charge lands on the right bill, tab or room as it happens.",
		},
		{
			id: "payments",
			icon: CreditCardIcon,
			title: "Card, transfer or cash",
			text: "Take payment on your own POS, straight from the screen to the till.",
		},
		{
			id: "control",
			icon: ShieldCheckIcon,
			title: "You stay in charge",
			text: "Approval limits, access levels and a record of every action.",
		},
		{
			id: "departments",
			icon: NetworkIcon,
			title: "Every department, connected",
			text: "Front desk, housekeeping, kitchen, bar, stock and finance on one system.",
		},
		{
			id: "brand",
			icon: PaletteIcon,
			title: "Your brand, your colours",
			text: "Your logo and colours on every staff tablet and portal.",
		},
	];

/** The home page's one feature section: six compact cards, with the full detail on /features. */
export function FeatureGrid() {
	return (
		<Section
			id="features"
			tone="card"
			eyebrow="Features"
			title="Everything you need to run the place."
			compact
			className="border-y border-line"
		>
			<ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
				{features.map((f) => (
					<li key={f.id} id={f.id} className="flex scroll-mt-[88px]">
						<Link
							href={`/features#${f.id}`}
							className="group flex w-full flex-col gap-[10px] rounded-[14px] border border-line bg-page p-[14px] transition-colors hover:border-brand/40 md:flex-row md:items-start md:gap-4 md:p-5"
						>
							<IconTile icon={f.icon} tone="brand" size="sm" />
							<span className="flex min-w-0 flex-col gap-1">
								<span className="text-[15px] font-bold leading-[1.25] text-ink group-hover:text-brand md:text-[17px]">
									{f.title}
								</span>
								<span className="text-[13px] leading-[1.45] text-ink-2 md:text-sm">
									{f.text}
								</span>
							</span>
						</Link>
					</li>
				))}
			</ul>
			<Link
				href="/features"
				className={cn(
					btn.secondary,
					btnLg,
					"inline-flex items-center gap-[6px] self-center",
				)}
			>
				See all features
				<ArrowRightIcon className="size-[15px]" strokeWidth={2.5} />
			</Link>
		</Section>
	);
}
