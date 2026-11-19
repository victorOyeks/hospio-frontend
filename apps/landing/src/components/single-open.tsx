"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * Keeps one <details> open at a time among those inside it. Browsers that know <details name="…"> already do this by
 * themselves; this is the same behaviour for the ones that do not.
 */
export function SingleOpen({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const box = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = box.current;
		if (!el) return;
		// "toggle" does not bubble, so it is caught on the way down.
		const onToggle = (e: Event) => {
			const opened = e.target;
			if (!(opened instanceof HTMLDetailsElement) || !opened.open) return;
			for (const d of el.querySelectorAll("details[open]")) {
				if (d !== opened) (d as HTMLDetailsElement).open = false;
			}
		};
		el.addEventListener("toggle", onToggle, true);
		return () => el.removeEventListener("toggle", onToggle, true);
	}, []);
	return (
		<div ref={box} className={className}>
			{children}
		</div>
	);
}
