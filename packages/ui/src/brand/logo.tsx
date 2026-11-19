import { cn } from "../utils";
import { ICON_H_PATH, WORDMARK_H, WORDMARK_LETTERS, WORDMARK_NUMBERS, WORDMARK_W } from "./logo-paths";

/**
 * The Hospio360 wordmark ("hospio" + "360" at 62%), the outlined master drawn inline so it matches the spec exactly
 * (./logo-paths.ts). It takes the text colour (`currentColor`): maroon on light (`text-[#4C091E]`), white on maroon.
 * Size it by height (e.g. `h-6`); the width follows (554 : 110).
 */
export function HospioWordmark({
	className,
	title = "Hospio360",
}: {
	className?: string;
	/** The accessible name; pass "" when a text label beside it already names the product. */
	title?: string;
}) {
	return (
		<svg
			viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role={title ? "img" : undefined}
			aria-label={title || undefined}
			aria-hidden={title ? undefined : true}
			className={cn("h-6 w-auto shrink-0", className)}
		>
			{WORDMARK_LETTERS.map((d) => (
				<path key={d.slice(0, 24)} d={d} fill="currentColor" />
			))}
			{WORDMARK_NUMBERS.map((d) => (
				<path key={d.slice(0, 24)} d={d} fill="currentColor" fillOpacity={0.62} />
			))}
		</svg>
	);
}

/**
 * The Hospio360 app icon: a white "h" on a maroon rounded square (favicon, PWA icon, the app's small square marks).
 * `tile={false}` draws only the "h" in the text colour, for a square that already has its own background.
 */
export function HospioIcon({
	className,
	tile = true,
	title = "",
}: {
	className?: string;
	tile?: boolean;
	title?: string;
}) {
	return (
		<svg
			viewBox="0 0 100 100"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role={title ? "img" : undefined}
			aria-label={title || undefined}
			aria-hidden={title ? undefined : true}
			className={cn("size-9 shrink-0", className)}
		>
			{tile && <rect width="100" height="100" rx="24" fill="#4C091E" />}
			<path
				d={ICON_H_PATH}
				stroke={tile ? "#FFFFFF" : "currentColor"}
				strokeWidth={12}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
