import {
	BedDoubleIcon,
	CalendarDaysIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { CONTACT_EMAIL, Wordmark } from "@/components/site";

/**
 * The guest's booking page, opened from "View booking" on a Hospio360 WhatsApp message (hospio-backend docs/sms-whatsapp.md).
 * No sign-in: the signed token in the address is the permission, checked by the API. Always fresh, never indexed.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
	title: "Your booking",
	robots: { index: false, follow: false },
};

const API_URL = (
	process.env.NEXT_PUBLIC_API_URL ?? "https://api-staging.hospio360.com"
).replace(/\/+$/, "");

type Hotel = {
	name: string;
	address?: string | null;
	city?: string | null;
	phone?: string | null;
	email?: string | null;
	checkInTime?: string | null;
	checkOutTime?: string | null;
};
type Stay = {
	reference: string;
	status: "BOOKED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
	guestFirstName?: string | null;
	checkInDate: string;
	checkOutDate: string;
	nights: number;
	adults: number;
	children: number;
	roomType?: string | null;
	cancellationReason?: string | null;
	hotel?: Hotel | null;
};
type Loaded =
	| { ok: true; stay: Stay }
	| { ok: false; kind: "invalid" | "expired" | "down"; message?: string };

async function load(token: string): Promise<Loaded> {
	if (!/^[A-Za-z0-9_-]{38}$/.test(token)) return { ok: false, kind: "invalid" };
	try {
		const res = await fetch(
			`${API_URL}/reservation/public/stays/${encodeURIComponent(token)}`,
			{ cache: "no-store", headers: { Accept: "application/json" } },
		);
		if (res.status === 404) return { ok: false, kind: "invalid" };
		const body = await res.json().catch(() => null);
		if (res.status === 410)
			return { ok: false, kind: "expired", message: body?.message };
		if (!res.ok || !body?.data) return { ok: false, kind: "down" };
		return { ok: true, stay: body.data as Stay };
	} catch {
		return { ok: false, kind: "down" };
	}
}

const STATUS: Record<Stay["status"], { label: string; tone: string }> = {
	BOOKED: { label: "Confirmed", tone: "bg-status-ok-soft text-status-ok" },
	CHECKED_IN: {
		label: "Checked in",
		tone: "bg-status-note-soft text-status-note",
	},
	CHECKED_OUT: { label: "Stay complete", tone: "bg-subtle text-ink-2" },
	CANCELLED: { label: "Cancelled", tone: "bg-status-bad-soft text-status-bad" },
	NO_SHOW: { label: "Missed", tone: "bg-status-warn-soft text-status-warn" },
};

/** "2027-02-15" → "Mon 15 Feb 2027", read as a calendar date (no time zone shift). */
function day(iso: string) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}

/** "14:00" → "2pm", "11:30" → "11:30am". */
function time(t?: string | null) {
	const m = t?.match(/^(\d{1,2}):(\d{2})/);
	if (!m) return null;
	const h = Number(m[1]);
	const suffix = h < 12 ? "am" : "pm";
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return m[2] === "00" ? `${h12}${suffix}` : `${h12}:${m[2]}${suffix}`;
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

export default async function StayPage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;
	const loaded = await load(token);
	return (
		<div className="flex min-h-screen flex-col bg-page">
			<header className="border-b border-line bg-card">
				<div className="mx-auto flex w-full max-w-[560px] items-center px-4 py-4">
					<Wordmark />
				</div>
			</header>
			<main className="mx-auto w-full max-w-[560px] flex-1 px-4 py-6 sm:py-10">
				{loaded.ok ? <StayCard stay={loaded.stay} /> : <Problem {...loaded} />}
			</main>
			<footer className="mx-auto w-full max-w-[560px] px-4 pb-8 text-center text-[12px] text-ink-3">
				Hospio360 by Oyeks Global ·{" "}
				<a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink-2">
					{CONTACT_EMAIL}
				</a>
			</footer>
		</div>
	);
}

function StayCard({ stay }: { stay: Stay }) {
	const s = STATUS[stay.status] ?? STATUS.BOOKED;
	const h = stay.hotel;
	const where = [h?.address, h?.city].filter(Boolean).join(", ");
	const mapsUrl = where
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h?.name ?? ""} ${where}`)}`
		: null;
	const tel = h?.phone?.replace(/[^\d+]/g, "");
	const guests = [
		plural(stay.adults, "adult"),
		stay.children > 0
			? `${stay.children} ${stay.children === 1 ? "child" : "children"}`
			: null,
	]
		.filter(Boolean)
		.join(", ");
	const cancelled = stay.status === "CANCELLED";

	return (
		<div className="flex flex-col gap-4">
			<section className="overflow-hidden rounded-[16px] border border-line bg-card">
				<div className="bg-brand px-5 pt-5 pb-6 text-white">
					<span
						className={cn(
							"inline-flex rounded-pill px-[10px] py-[3px] text-[12px] font-semibold",
							s.tone,
						)}
					>
						{s.label}
					</span>
					<p className="mt-4 text-[14px] text-white/75">
						{stay.guestFirstName
							? `Hello ${stay.guestFirstName}, your stay at`
							: "Your stay at"}
					</p>
					<h1 className="mt-1 text-[26px] font-bold leading-[1.15] tracking-[-0.01em]">
						{h?.name ?? "your hotel"}
					</h1>
					<p className="mt-3 text-[13px] text-white/75">
						Booking reference{" "}
						<span className="font-mono text-[15px] font-semibold tracking-wider text-white">
							{stay.reference}
						</span>
					</p>
				</div>

				<div className="grid grid-cols-2 border-b border-line">
					<DateCell
						label="Check-in"
						date={day(stay.checkInDate)}
						note={time(h?.checkInTime) ? `from ${time(h?.checkInTime)}` : null}
						muted={cancelled}
					/>
					<DateCell
						label="Check-out"
						date={day(stay.checkOutDate)}
						note={time(h?.checkOutTime) ? `by ${time(h?.checkOutTime)}` : null}
						muted={cancelled}
						border
					/>
				</div>

				<dl className="flex flex-col gap-3 px-5 py-4 text-[14px]">
					<Row
						icon={<CalendarDaysIcon className="size-4" />}
						label="Length of stay"
					>
						{plural(stay.nights, "night")}
					</Row>
					{stay.roomType && (
						<Row icon={<BedDoubleIcon className="size-4" />} label="Room">
							{stay.roomType}
						</Row>
					)}
					<Row icon={<UsersIcon className="size-4" />} label="Guests">
						{guests}
					</Row>
				</dl>

				{cancelled && (
					<p className="mx-5 mb-5 rounded-control bg-status-bad-soft px-4 py-3 text-[14px] text-status-bad">
						This booking has been cancelled
						{stay.cancellationReason
							? `: ${stay.cancellationReason.replace(/[.\s]+$/, "")}.`
							: "."}
					</p>
				)}
			</section>

			{h && (tel || mapsUrl || h.email) && (
				<section className="rounded-[16px] border border-line bg-card px-5 py-5">
					<h2 className="text-[15px] font-bold text-ink">
						Getting there and getting in touch
					</h2>
					{where && (
						<p className="mt-2 flex gap-2 text-[14px] leading-[1.5] text-ink-2">
							<MapPinIcon className="mt-[2px] size-4 shrink-0 text-ink-3" />
							{where}
						</p>
					)}
					<div className="mt-4 grid gap-2 sm:grid-cols-2">
						{tel && (
							<a
								href={`tel:${tel}`}
								className={cn(
									btn.primary,
									btn.large,
									"flex items-center justify-center gap-2",
								)}
							>
								<PhoneIcon className="size-4" />
								Call the hotel
							</a>
						)}
						{mapsUrl && (
							<a
								href={mapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								className={cn(
									btn.secondary,
									btn.large,
									"flex items-center justify-center gap-2",
								)}
							>
								<MapPinIcon className="size-4" />
								Get directions
							</a>
						)}
					</div>
					{(h.phone || h.email) && (
						<p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
							{h.phone && <span>{h.phone}</span>}
							{h.email && (
								<a
									href={`mailto:${h.email}`}
									className="inline-flex items-center gap-1 hover:text-ink"
								>
									<MailIcon className="size-[14px]" />
									{h.email}
								</a>
							)}
						</p>
					)}
				</section>
			)}

			<p className="px-1 text-center text-[12px] leading-[1.5] text-ink-3">
				This page is private to you. Anyone with the link can see it, so share
				it only with people travelling with you.
			</p>
		</div>
	);
}

function DateCell({
	label,
	date,
	note,
	muted,
	border,
}: {
	label: string;
	date: string;
	note: string | null;
	muted?: boolean;
	border?: boolean;
}) {
	return (
		<div className={cn("px-5 py-4", border && "border-l border-line")}>
			<p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 text-[16px] font-bold text-ink",
					muted && "text-ink-3 line-through",
				)}
			>
				{date}
			</p>
			{note && <p className="mt-[2px] text-[13px] text-ink-2">{note}</p>}
		</div>
	);
}

function Row({
	icon,
	label,
	children,
}: {
	icon: ReactNode;
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className="flex items-center gap-2 text-ink-2">
				<span className="flex w-4 justify-center text-ink-3">{icon}</span>
				{label}
			</dt>
			<dd className="text-right font-semibold text-ink">{children}</dd>
		</div>
	);
}

function Problem({
	kind,
	message,
}: {
	kind: "invalid" | "expired" | "down";
	message?: string;
}) {
	const copy = {
		invalid: {
			title: "This link isn't working",
			text: "Check that you opened the whole link from your message. If it still doesn't work, contact the hotel you booked with.",
		},
		expired: {
			title: "This link has expired",
			text:
				message ??
				"Booking links stop working a while after check-out. Contact the hotel if you need your booking details.",
		},
		down: {
			title: "We couldn't load your booking",
			text: "Something went wrong on our side. Please try again in a minute.",
		},
	}[kind];
	return (
		<section className="rounded-[16px] border border-line bg-card px-5 py-8 text-center">
			<h1 className="text-[22px] font-bold text-ink">{copy.title}</h1>
			<p className="mx-auto mt-2 max-w-[400px] text-[14px] leading-[1.55] text-ink-2">
				{copy.text}
			</p>
		</section>
	);
}
