"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type {
	MarketerBusinessItem,
	MarketerMeData,
	MarketerProfileRow,
	MarketerStatementRow,
} from "@hospio/api/data/admin-types";
import { fmtLongDate } from "@hospio/ui/shared/format";
import type { PillTone } from "@hospio/ui/shared/status-pill";
import { copyText } from "@hospio/ui/shared/invite-card";
import { cn } from "@hospio/ui/utils";

export const stageTone: Record<string, PillTone> = {
	LEAD: "grey",
	CONTACTED: "info",
	ONBOARDING: "info",
	HANDED_OVER: "brand",
	LIVE: "success",
	AT_RISK: "warning",
	SUSPENDED: "danger",
	LOST: "grey",
	CHURNED: "grey",
};
export const stageLabel: Record<string, string> = {
	LEAD: "Lead",
	CONTACTED: "Contacted",
	ONBOARDING: "Onboarding",
	HANDED_OVER: "Handed over",
	LIVE: "Live",
	AT_RISK: "At risk",
	SUSPENDED: "Suspended",
	LOST: "Didn't sign up",
	CHURNED: "Churned",
};

/** ₦1,234.50: statement money to the kobo, so lines add up to the totals. */
export function naira2(n: number | null | undefined) {
	const v = Number(n ?? 0);
	const sign = v < 0 ? "-" : "";
	return `${sign}₦${Math.abs(v).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "2026-11" → "November 2026". */
export function monthLabel(month?: string | null) {
	if (!month) return "—";
	const [y, m] = month.split("-").map(Number);
	if (!y || !m) return month;
	return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
	});
}

/** "LIVE: 2, ONBOARDING: 1" → "2 live · 1 onboarding". */
export function byStageLine(byStage?: Record<string, number>) {
	const parts = Object.entries(byStage ?? {})
		.filter(([, n]) => n > 0)
		.map(([k, n]) => `${n} ${(stageLabel[k] ?? k).toLowerCase()}`);
	return parts.join(" · ");
}

export const statementTone: Record<string, PillTone> = {
	DRAFT: "info",
	QUERIED: "warning",
	APPROVED: "brand",
	PAID: "success",
	CARRIED_OVER: "grey",
};
export const statementLabel: Record<string, string> = {
	DRAFT: "Ready",
	QUERIED: "Queried",
	APPROVED: "Approved",
	PAID: "Paid",
	CARRIED_OVER: "Carried over",
};

/** What a statement's status means for the marketer, in one line. */
export function statementMeaning(s: MarketerStatementRow) {
	switch (s.status) {
		case "DRAFT":
			return s.queryUntil
				? `Ready · raise a query by ${fmtLongDate(s.queryUntil)}`
				: "Ready · 7 days to raise a query";
		case "QUERIED":
			return "Queried · Hospio360 is looking at it";
		case "APPROVED":
			return "Approved · to be paid by bank transfer by the 15th";
		case "PAID":
			return `Paid${s.paidOn ? ` ${fmtLongDate(s.paidOn)}` : ""}${s.paidReference ? ` · ref ${s.paidReference}` : ""}`;
		case "CARRIED_OVER":
			return `Under ${naira2(s.minimumPayout).replace(".00", "")} · rolls into ${s.carriedToMonth ? `the ${monthLabel(s.carriedToMonth)} statement` : "the next statement"}`;
		default:
			return s.status;
	}
}

/** Where a referred business's earning stands: not started, earning until a date, or ended. */
export function earningLine(b: MarketerBusinessItem, months: number) {
	const m = b.months || months;
	if (b.agreementStatus === "ENDED")
		return b.agreementEndedOn
			? `Agreement ended ${fmtLongDate(b.agreementEndedOn)}`
			: "Agreement ended";
	if (!b.agreementStatus) return "Earns once it is live and a fee is collected";
	if (!b.windowStart)
		return `${m} months start with the first collected fee`;
	if (b.windowEnd && b.windowEnd < new Date().toISOString().slice(0, 10))
		return `Earning ended ${fmtLongDate(b.windowEnd)}`;
	return b.windowEnd ? `Earning until ${fmtLongDate(b.windowEnd)}` : "Earning";
}

/** The agreement's key terms, from the marketer's own share and months. */
export function agreementTerms(me: MarketerMeData) {
	const p = me.profile;
	const min = naira2(me.minimumPayout).replace(".00", "");
	return [
		`You earn ${p.sharePct}% of the Hospio360 platform fee actually collected from each business you refer, for ${p.months} months from that business's first collected fee.`,
		"Nothing is earned on fees that are not collected. A fee carried over to a later day earns when it is collected.",
		"No commission on devices, data plans or message charges, and no sign-up bonus.",
		`${me.whtPct}% withholding tax (WHT) is deducted from what you earn.`,
		"A statement is made on the 5th for the month before. You have 7 days to raise a query on it.",
		`Once approved, you are paid by bank transfer by the 15th. Amounts under ${min} roll over to the next statement.`,
		"If a collected fee is refunded or reversed, the commission on it is deducted (clawback) on your next statement.",
	];
}

const HOTEL_APP =
	process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com";

/** The sign-up link that credits this marketer: the hotel app's sign-up with their referral code. */
export function referralLink(me: MarketerProfileRow) {
	const code =
		me.referralCode ?? me.fullName.toLowerCase().replace(/\s+/g, "-");
	return `${HOTEL_APP}/sign-up?ref=${encodeURIComponent(code)}`;
}

/** The link in a grey bar with a real copy button. */
export function ReferralLinkBox({
	me,
	className,
}: {
	me: MarketerProfileRow;
	className?: string;
}) {
	const [link, setLink] = useState(referralLink(me));
	const [done, setDone] = useState(false);
	useEffect(() => setLink(referralLink(me)), [me]);
	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-control bg-subtle px-3 py-[10px] text-[13px] font-medium text-ink",
				className,
			)}
		>
			<span className="min-w-0 flex-1 truncate" title={link}>
				{link}
			</span>
			<button
				type="button"
				onClick={async () => {
					if (await copyText(link, "Link copied")) {
						setDone(true);
						setTimeout(() => setDone(false), 1500);
					}
				}}
				className="text-ink-3 hover:text-ink"
				aria-label="Copy link"
			>
				{done ? (
					<CheckIcon className="size-4 text-success" />
				) : (
					<CopyIcon className="size-4" />
				)}
			</button>
		</div>
	);
}

export function whatsappShare(me: MarketerProfileRow) {
	const text = `Hi! I work with Hospio360, the hotel management system. Sign your hotel up through my link and we'll set you up: ${referralLink(me)}`;
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
