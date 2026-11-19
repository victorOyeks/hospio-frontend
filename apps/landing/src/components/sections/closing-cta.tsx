import { ArrowRightIcon, CalendarDaysIcon, MailIcon } from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	btnLg,
	CONTACT_EMAIL,
	container,
	DEMO_MAILTO,
	SIGN_UP_URL,
} from "@/components/site";

export function ClosingCta() {
	return (
		<section id="contact" className="scroll-mt-[76px] bg-page">
			<div className={cn(container, "py-10 md:py-16")}>
				<div className="flex flex-col items-center gap-4 rounded-[20px] bg-brand px-5 py-9 text-center md:gap-5 md:px-16 md:py-14">
					<h2 className="max-w-[900px] text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-white md:text-[42px]">
						Bring every location onto one screen.
					</h2>
					<p className="max-w-[620px] text-[15px] leading-[1.55] text-nav-foreground md:text-[17px]">
						Create your account and set up your first location today, or ask us
						for a demo on a business like yours.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<a
							href={SIGN_UP_URL}
							className={cn(
								btn.secondary,
								btnLg,
								"inline-flex items-center gap-[6px]",
							)}
						>
							<ArrowRightIcon className="size-[15px]" strokeWidth={2.5} />
							Get started
						</a>
						<a
							href={DEMO_MAILTO}
							className="inline-flex items-center gap-[6px] rounded-control border border-white/80 px-4 py-[13px] text-[15px] font-semibold text-white hover:bg-white/10"
						>
							<CalendarDaysIcon className="size-[15px]" strokeWidth={2.5} />
							Book a demo
						</a>
					</div>
					<a
						href={`mailto:${CONTACT_EMAIL}`}
						className="inline-flex items-center gap-2 text-sm text-nav-foreground hover:text-white"
					>
						<MailIcon className="size-4" />
						{CONTACT_EMAIL}
					</a>
				</div>
			</div>
		</section>
	);
}
