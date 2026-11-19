"use client";

import { BuildingIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveMyOnboardingStep } from "@hospio/api/actions/onboarding";
import { createHotel, updateHotel } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { Business, Me } from "@hospio/api/api/schema";
import type { OwnerOnboardingData } from "@hospio/api/types";
import { FieldRow, SelectField, TextField } from "@hospio/ui/shared/field";
import {
	businessKind,
	defaultVenueFor,
	VENUE_TYPE_OPTIONS,
	venueType as toVenueType,
} from "@hospio/api/venue";
import { SideCard, StepCard, StepFooter, StepPage } from "./common";
import { useFreshOnOpen, useSaveLater, useStepForm } from "./persist";
import { placeWord, setupWord, stepHref } from "./steps";
import {
	checkAddress,
	checkCity,
	checkEmail,
	checkName,
	checkPhone,
	only,
} from "./validate";

/** Step 2 · Your first hotel (Figma 3164:16239) → POST /tenant/hotels (the action refreshes the token), then the draft. */
export function HotelStep({
	business,
	draft,
	user,
	kind,
}: {
	business: Business | null;
	draft: OwnerOnboardingData;
	user?: Me | null;
	/** The business's kind (hospio-backend docs/plan-venue-type.md); MIXED picks the location's type here. */
	kind?: string | null;
	accommodation?: boolean;
}) {
	const mixed = businessKind(kind) === "MIXED";
	const router = useRouter();
	const saved = draft.hotel;
	// Coming back: the hotel exists; edit it instead of creating a second one.
	const existing = saved?.hotelId
		? (business?.hotels ?? []).find((h) => h.id === saved.hotelId)
		: undefined;
	useFreshOnOpen();
	const { form, update, forget } = useStepForm("hotel", user?.id, {
		name: existing?.name ?? saved?.name ?? "",
		address: existing?.address ?? "",
		city: existing?.city ?? saved?.city ?? business?.city ?? "",
		phone: existing?.phone ?? "",
		email: existing?.email ?? "",
		checkInTime: existing?.checkInTime ?? "14:00",
		checkOutTime: existing?.checkOutTime ?? "12:00",
		venueType: existing?.venueType
			? toVenueType(existing.venueType)
			: defaultVenueFor(kind),
	});
	// Check-in times only where there are rooms: a hotel, or a location that already has some.
	const rooms = form.venueType === "HOTEL" || (existing?.roomCount ?? 0) > 0;
	const word = mixed
		? form.venueType === "HOTEL"
			? "hotel"
			: "location"
		: placeWord(kind);
	const Word = word.charAt(0).toUpperCase() + word.slice(1);
	const set = <K extends keyof typeof form>(k: K, v: string) =>
		update({ [k]: v } as Partial<typeof form>);
	const [errors, setErrors] = useState<
		Partial<Record<keyof typeof form, string>>
	>({});
	const { run, pending } = useAction();

	const check = () =>
		only({
			name: checkName(form.name, `the ${word}'s name`),
			address: checkAddress(form.address),
			city: checkCity(form.city),
			phone: checkPhone(form.phone),
			email: checkEmail(form.email, false),
			checkOutTime:
				!rooms || (form.checkInTime && form.checkOutTime)
					? undefined
					: "Set both times",
		});

	async function save() {
		const body = {
			name: form.name.trim(),
			city: form.city.trim() || null,
			address: form.address.trim() || null,
			phone: form.phone.trim() || null,
			email: form.email.trim() || null,
			timezone: business?.timezone ?? "Africa/Lagos",
			...(rooms
				? {
						checkInTime: form.checkInTime || null,
						checkOutTime: form.checkOutTime || null,
					}
				: {}),
			venueType: form.venueType,
		};
		const r = saved?.hotelId
			? await updateHotel(saved.hotelId, body)
			: await createHotel(body);
		if (!r.ok) return r;
		const step = await saveMyOnboardingStep("hotel", {
			hotelId: r.data.id,
			name: r.data.name,
			city: r.data.city ?? body.city ?? "",
		});
		if (step.ok) forget();
		return step;
	}

	function submit() {
		const e = check();
		setErrors(e);
		if (Object.keys(e).length) return;
		run(save, saved?.hotelId ? `${Word} updated` : `${Word} created`, () => {
			router.push(stepHref("rooms"));
			// The step bar names step 3 by whether this location has rooms (Rooms & prices, or Outlets).
			router.refresh();
		});
	}

	useSaveLater(async () => {
		if (Object.keys(check()).length) return "kept";
		return (await save()).ok ? "saved" : "failed";
	});

	const trading = business?.name?.trim() || "your trading name";

	return (
		<StepPage
			aside={
				<>
					<SideCard dark eyebrow={`Your ${word === "hotel" ? "hotels" : "locations"}`}>
						<div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
							<BuildingIcon className="size-4 shrink-0" />
							<div className="min-w-0">
								<p className="truncate text-[13px] font-semibold text-white">
									{form.name.trim() || `Your first ${word}`}
								</p>
								<p className="truncate text-[11px] text-white/70">
									{[
										form.city.trim(),
										rooms
											? existing
												? `${existing.roomCount} rooms`
												: "rooms next"
											: "outlets next",
									]
										.filter(Boolean)
										.join(" · ")}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3 rounded-lg border border-dashed border-white/25 px-3 py-2">
							<PlusIcon className="size-4 shrink-0" />
							<div>
								<p className="text-[13px] font-semibold text-white">
									Add another {word} later
								</p>
								<p className="text-[11px] text-white/70">
									From {word === "hotel" ? "Hotels" : "Locations"} in your dashboard
								</p>
							</div>
						</div>
					</SideCard>
					<SideCard title={`Several ${word === "hotel" ? "hotels" : "locations"}?`}>
						<p>
							Add the one you know best first. When setup is done, {word === "hotel" ? '"Add hotel"' : '"Add a location"'}{" "}
							in your dashboard takes about two minutes for each one.
						</p>
					</SideCard>
				</>
			}
		>
			<StepCard
				step="hotel"
				title={
					saved?.hotelId
						? `Your first ${word} · ${saved.name}`
						: `Add your first ${word}`
				}
				intro={
					rooms
						? "Start with one. You can add more hotels any time; each one gets its own rooms, staff and manager."
						: `Start with one. You can add more locations any time; each one gets its own outlets, staff and manager.`
				}
			>
				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					{mixed && (
						<SelectField
							label="What kind of location is this?"
							value={form.venueType}
							onChange={(v) => set("venueType", v)}
							options={VENUE_TYPE_OPTIONS}
							hint="A hotel has rooms; a lounge, bar, restaurant or club sells at its outlets"
						/>
					)}
					<TextField
						label={`${Word} name`}
						value={form.name}
						onChange={(v) => set("name", v)}
						placeholder="Ivory Court Ikeja"
						required
						error={errors.name}
						hint={`Guests see this with your trading name: "${trading} · ${form.name.trim() || Word}"`}
					/>
					<TextField
						label="Address"
						value={form.address}
						onChange={(v) => set("address", v)}
						placeholder="Plot 12, Isaac John Street, Ikeja GRA, Lagos"
						required
						error={errors.address}
					/>
					<FieldRow>
						<TextField
							label="City"
							value={form.city}
							onChange={(v) => set("city", v)}
							placeholder="Lagos"
							required
							error={errors.city}
						/>
						<TextField
							label={rooms ? "Front desk phone" : "Phone"}
							type="tel"
							value={form.phone}
							onChange={(v) => set("phone", v)}
							placeholder="+234 1 280 4400"
							required
							error={errors.phone}
						/>
					</FieldRow>
					<FieldRow>
						<TextField
							label={rooms ? "Front desk email" : "Email"}
							type="email"
							value={form.email}
							onChange={(v) => set("email", v)}
							placeholder="ikeja@ivorycourt.example.ng"
							error={errors.email}
							hint="Optional"
						/>
						{rooms ? (
							<FieldRow>
								<TextField
									label="Check-in from"
									type="time"
									value={form.checkInTime}
									onChange={(v) => set("checkInTime", v)}
								/>
								<TextField
									label="Check-out by"
									type="time"
									value={form.checkOutTime}
									onChange={(v) => set("checkOutTime", v)}
									error={errors.checkOutTime}
								/>
							</FieldRow>
						) : (
							<span />
						)}
					</FieldRow>
					<StepFooter
						back={stepHref("business")}
						label="Continue"
						pending={pending}
						onContinue={submit}
						info={
							rooms
								? `You'll set room types next · photos and the brand colour live in ${mixed ? "Hotel setup" : setupWord(kind)}`
								: `You'll add your outlets next (bar, restaurant, kitchen) · the brand colour lives in ${mixed ? `${Word} setup` : setupWord(kind)}`
						}
					/>
				</form>
			</StepCard>
		</StepPage>
	);
}
