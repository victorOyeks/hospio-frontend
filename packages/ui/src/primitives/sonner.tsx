"use client";

import {
	AlertTriangleIcon,
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps, toast } from "sonner";

/**
 * How long each kind of message stays (22 Nov, owner): a success is a quick "done" and goes fast; an error or warning usually says
 * what to do next ("Open your till first…"), so it stays longer and has a close button. Sonner pauses a message while it is hovered.
 */
const SUCCESS_MS = 3000;
const INFO_MS = 4000;
const WARNING_MS = 6000;
const ERROR_MS = 7000;

// Sonner takes one duration for every type, so errors, warnings and info get theirs here, once, for every call in the apps. A
// duration or closeButton passed at the call site still wins.
type ToastFn = typeof toast.error;
const marked = toast as typeof toast & { __hospioDurations?: boolean };
if (!marked.__hospioDurations) {
	const longer =
		(fn: ToastFn, duration: number): ToastFn =>
		(message, data) =>
			fn(message, { duration, closeButton: true, ...data });
	toast.error = longer(toast.error, ERROR_MS);
	toast.warning = longer(toast.warning, WARNING_MS);
	toast.info = longer(toast.info, INFO_MS);
	marked.__hospioDurations = true;
}

/**
 * Messages at the top centre (22 Nov, owner): at the bottom right they covered the side panels' main button (Count cash, Record
 * payment, Save) for a few seconds. The top centre is the empty middle of the top bar on laptops and tablets. A slim white card with a
 * coloured icon in the Hospio palette (green done, maroon error, amber warning), at most three at once; clicks around it go through.
 */
const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			position="top-center"
			offset={16}
			mobileOffset={12}
			gap={8}
			visibleToasts={3}
			duration={SUCCESS_MS}
			icons={{
				success: <CircleCheckIcon className="size-[18px] text-[var(--success)]" />,
				error: <OctagonAlertIcon className="size-[18px] text-[var(--brand-primary)]" />,
				warning: <AlertTriangleIcon className="size-[18px] text-[var(--warning)]" />,
				info: <InfoIcon className="size-[18px] text-[var(--brand-primary)]" />,
				loading: <Loader2Icon className="size-[18px] animate-spin text-muted-foreground" />,
			}}
			style={
				{
					"--width": "400px",
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast:
						"!items-start !gap-2.5 !rounded-xl !border !border-border !bg-white !py-3 !pl-3.5 !pr-4 !text-[13px] !text-foreground !shadow-[0_10px_28px_-10px_rgba(76,9,30,0.28)] dark:!bg-popover",
					title: "!font-medium !leading-snug",
					description: "!text-[12px] !text-muted-foreground",
					icon: "!m-0 !mt-px",
					error: "!border-[color-mix(in_oklab,var(--brand-primary)_35%,transparent)]",
					warning: "!border-[color-mix(in_oklab,var(--warning)_45%,transparent)]",
					closeButton: "!border-border !bg-white !text-muted-foreground hover:!text-foreground",
					actionButton: "!rounded-md !bg-[var(--brand-primary)] !text-white",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
