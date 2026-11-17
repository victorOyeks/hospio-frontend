"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { chooseOutlet } from "@hospio/api/actions/fnb";
import { cn } from "@hospio/ui/utils";

/**
 * Which outlet this desk works, when the hotel has more than one of its kind (a Bar and a Patio Lounge, a
 * Kitchen and a Restaurant). The choice is kept on this device (cookie `hms.outlet.<desk>`, set by `chooseOutlet`, read by
 * `data.outlets.forRole`) so every screen of the desk follows it. Nothing shows with a single outlet.
 */
export function OutletSwitch({
	desk,
	outlets,
	current,
}: {
	desk: "KITCHEN" | "BAR";
	outlets: { id: string; name: string }[];
	current?: string;
}) {
	const router = useRouter();
	const [pending, start] = useTransition();
	if (outlets.length < 2) return null;
	const pick = (id: string) =>
		start(async () => {
			await chooseOutlet(desk, id);
			router.refresh();
		});
	return (
		<nav
			className={cn("flex flex-wrap gap-2", pending && "opacity-60")}
			aria-label="Outlet"
		>
			{outlets.map((o) => (
				<button
					key={o.id}
					type="button"
					disabled={pending}
					onClick={() => o.id !== current && pick(o.id)}
					aria-pressed={o.id === current}
					className={cn(
						"rounded-pill px-4 py-2 text-[13px] font-semibold",
						o.id === current
							? "bg-brand text-white"
							: "bg-subtle text-ink-2 hover:text-ink",
					)}
				>
					{o.name}
				</button>
			))}
		</nav>
	);
}
