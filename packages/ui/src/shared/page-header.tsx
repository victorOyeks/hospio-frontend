import type { ReactNode } from "react";

/** "Area — screen name" header: a bold title, one line of context, actions on the right. */
export function PageHeader({
	title,
	subtitle,
	mark,
	children,
}: {
	title: string;
	subtitle?: ReactNode;
	/** A small marker before the title (the outlet's colour and icon on bar and kitchen screens). */
	mark?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4">
			<div className="flex flex-col gap-[6px]">
				<h1 className="flex items-center gap-[10px] text-[28px] font-bold leading-none tracking-[-0.01em] text-ink">
					{mark}
					{title}
				</h1>
				{subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}
			</div>
			{children && <div className="flex flex-wrap items-center gap-[10px]">{children}</div>}
		</div>
	);
}
