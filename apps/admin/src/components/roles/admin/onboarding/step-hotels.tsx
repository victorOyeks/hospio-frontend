"use client";

import { BuildingIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createHotel, updateHotel } from "@hospio/api/actions/tenant";
import type { Hotel } from "@hospio/api/api/schema";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { FieldRow, SelectField, TextField } from "@hospio/ui/shared/field";
import {
	defaultVenueFor,
	hasAccommodation,
	VENUE_TYPE_OPTIONS,
	type VenueTypeKey,
	venueLabel,
	venueType,
} from "@hospio/api/venue";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import {
	checkAddress,
	checkCity,
	checkEmail,
	checkName,
	checkPhone,
	checkTime,
	only,
} from "@hospio/ui/shared/validate";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import {
	nextStep,
	prevStep,
	ResultLine,
	roomsOrKind,
	StepFrame,
	useWizardSave,
	type WizardHotel,
} from "./shared";

/**
 * J5 · step 4: the business's hotels, each created on tenant with `businessId`; the step saves `{hotelIds}`. A hotel needs
 * a name with letters (one name per business), a real city and both times; address, phone and email are checked when typed.
 */

const toWizardHotel = (h: Hotel, prev?: WizardHotel): WizardHotel => ({
	id: h.id,
	name: h.name,
	city: h.city ?? "",
	address: h.address ?? "",
	rooms: h.roomCount || prev?.rooms || 0,
	timezone: h.timezone ?? "Africa/Lagos",
	occupancy: prev?.occupancy ?? 0,
	manager: prev?.manager ?? "—",
	phone: h.phone ?? undefined,
	email: h.email ?? undefined,
	checkInTime: h.checkInTime ?? undefined,
	checkOutTime: h.checkOutTime ?? undefined,
	venueType: h.venueType ?? "HOTEL",
	hasAccommodation: hasAccommodation(h),
});

export function HotelsStep({ ctx }: { ctx: WizardCtx }) {
	const { business, hotels } = ctx;
	// "Hotel" or "location" in this step's words (hospio-backend docs/plan-venue-type.md).
	const word = ctx.venue.locations ? "location" : "hotel";
	const [panel, setPanel] = useState<"new" | WizardHotel | null>(null);
	const { pending, busy } = useWizardSave();

	const save = () =>
		busy(async () => {
			const row = await ctx.saveStep("hotels", {
				hotelIds: hotels.map((h) => h.id),
			});
			if (row) {
				ctx.setBusiness({ ...business, hotels: hotels.length });
				ctx.goTo(nextStep("hotels"));
			}
		});

	return (
		<StepFrame
			venue={ctx.venue}
			step="hotels"
			onBack={() => ctx.goTo(prevStep("hotels"))}
			onContinue={ctx.editable ? save : undefined}
			continueDisabled={hotels.length === 0}
			pending={pending}
			footerNote={
				hotels.length === 0
					? `Add at least one ${word} to continue.`
					: `Currency ${business.currency ?? "NGN"} · time zone ${business.timezone ?? "Africa/Lagos"}.`
			}
		>
			<DataTable
				data={hotels}
				columns={[
					{
						accessorKey: "name",
						header: ctx.venue.locations ? "Location" : "Hotel",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.name}
								secondary={`${ctx.venue.locations ? `${venueLabel(row.original.venueType)} · ` : ""}${row.original.city || "—"}`}
							/>
						),
					},
					{
						accessorKey: "address",
						header: "Address",
						cell: ({ row }) => (
							<span className="text-ink-2">{row.original.address || "—"}</span>
						),
					},
					{
						id: "times",
						header: "Check-in · out",
						cell: ({ row }) =>
							hasAccommodation(row.original) ? (
								<span>
									{row.original.checkInTime ?? "14:00"} ·{" "}
									{row.original.checkOutTime ?? "12:00"}
								</span>
							) : (
								<span className="text-ink-3">Not used</span>
							),
					},
					{
						accessorKey: "rooms",
						header: "Rooms",
						cell: ({ row }) =>
							hasAccommodation(row.original) ? (
								row.original.rooms
							) : (
								<span className="text-ink-3">{roomsOrKind(row.original)}</span>
							),
					},
					{
						id: "edit",
						header: "",
						cell: ({ row }) =>
							ctx.editable ? (
								<button
									type="button"
									className={cn(
										btn.secondary,
										btn.small,
										"flex items-center gap-1",
									)}
									onClick={() => setPanel(row.original)}
								>
									<PencilIcon className="size-3" /> Edit
								</button>
							) : null,
					},
				]}
				emptyTitle={`No ${word}s yet`}
				emptyHint={
					ctx.venue.locations
						? "Each location gets its own setup and staff; a hotel also gets rooms."
						: "Each hotel gets its own setup, staff and rooms."
				}
			/>
			{ctx.editable && (
				<div>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setPanel("new")}
					>
						<PlusIcon className="size-4" /> Add a {word}
					</button>
				</div>
			)}
			{hotels.length > 0 && (
				<ResultLine tone="muted">
					{hotels.length} {hotels.length === 1 ? word : `${word}s`}
					{hotels.some((h) => hasAccommodation(h))
						? ` · ${hotels.reduce((s, h) => s + h.rooms, 0)} rooms so far`
						: ""}
				</ResultLine>
			)}

			<HotelPanel
				open={panel !== null}
				onOpenChange={(o) => !o && setPanel(null)}
				businessId={business.id}
				hotel={panel === "new" ? null : panel}
				defaultCity={business.city}
				defaultType={defaultVenueFor(business.venueKind)}
				locations={ctx.venue.locations}
				others={hotels.filter((h) => panel === "new" || h.id !== panel?.id)}
				onSaved={(h, prev) => {
					ctx.setHotels((list) =>
						prev
							? list.map((x) => (x.id === prev.id ? toWizardHotel(h, prev) : x))
							: [...list, toWizardHotel(h)],
					);
					setPanel(null);
				}}
			/>
		</StepFrame>
	);
}

/** Add or edit a hotel: name, city, address, contacts, check-in and check-out times. */
export function HotelPanel({
	open,
	onOpenChange,
	businessId,
	hotel,
	defaultCity,
	defaultType = "HOTEL",
	locations = false,
	others = [],
	onSaved,
}: {
	/** The type a new location starts as (the business's kind). */
	defaultType?: VenueTypeKey;
	/** Words: "location" instead of "hotel". */
	locations?: boolean;
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businessId: string;
	hotel: WizardHotel | null;
	defaultCity?: string;
	/** The business's other hotels: a name already used is refused (one name per business). */
	others?: WizardHotel[];
	onSaved: (saved: Hotel, prev: WizardHotel | null) => void;
}) {
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={hotel ? `Edit ${hotel.name}` : locations ? "Add a location" : "Add a hotel"}
			subtitle={
				hotel
					? "Name, kind, address, contacts and times"
					: locations
						? "A new location with default setup; a hotel's rooms come in the next step"
						: "A new hotel with default setup; rooms come in the next step"
			}
			icon={BuildingIcon}
			width="md"
		>
			{open && (
				<HotelForm
					key={hotel?.id ?? "new"}
					businessId={businessId}
					hotel={hotel}
					defaultCity={defaultCity}
					defaultType={defaultType}
					others={others}
					onCancel={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			)}
		</SidePanel>
	);
}

type HotelField =
	| "name"
	| "city"
	| "address"
	| "phone"
	| "email"
	| "checkIn"
	| "checkOut";

/** Which field a refusal from tenant-service is about. */
function hotelFieldOf(message: string): HotelField | null {
	if (/hotel called|hotel name|location name/i.test(message)) return "name";
	if (/city/i.test(message)) return "city";
	if (/address/i.test(message)) return "address";
	if (/phone/i.test(message)) return "phone";
	if (/email/i.test(message)) return "email";
	if (/check-in/i.test(message)) return "checkIn";
	if (/check-out/i.test(message)) return "checkOut";
	return null;
}

function HotelForm({
	businessId,
	hotel,
	defaultCity,
	defaultType,
	others,
	onCancel,
	onSaved,
}: {
	defaultType: VenueTypeKey;
	businessId: string;
	hotel: WizardHotel | null;
	defaultCity?: string;
	others: WizardHotel[];
	onCancel: () => void;
	onSaved: (saved: Hotel, prev: WizardHotel | null) => void;
}) {
	const [name, setName] = useState(hotel?.name ?? "");
	const [city, setCity] = useState(hotel?.city ?? defaultCity ?? "");
	const [address, setAddress] = useState(hotel?.address ?? "");
	const [phone, setPhone] = useState(hotel?.phone ?? "");
	const [email, setEmail] = useState(hotel?.email ?? "");
	const [checkIn, setCheckIn] = useState(hotel?.checkInTime ?? "14:00");
	const [checkOut, setCheckOut] = useState(hotel?.checkOutTime ?? "12:00");
	const [kind, setKind] = useState<VenueTypeKey>(
		hotel ? venueType(hotel.venueType) : defaultType,
	);
	// Check-in and check-out are for places with rooms: a hotel, or a location that already has rooms.
	const stays = kind === "HOTEL" || (hotel?.rooms ?? 0) > 0;
	const [errors, setErrors] = useState<Partial<Record<HotelField, string>>>({});
	const { pending, busy } = useWizardSave();
	const edit = (set: (v: string) => void, field: HotelField) => (v: string) => {
		set(v);
		if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
	};

	const submit = () =>
		busy(async () => {
			const key = name.trim().replace(/\s+/g, " ").toLowerCase();
			const twin = others.find(
				(h) => h.name.trim().replace(/\s+/g, " ").toLowerCase() === key,
			);
			const found = only({
				name:
					checkName(name, kind === "HOTEL" ? "the hotel name" : "the location name") ??
					(twin
						? `This business already has a hotel called ${twin.name}. Give this one a different name`
						: undefined),
				city: checkCity(city),
				address: checkAddress(address, false),
				phone: checkPhone(phone, false),
				email: checkEmail(email, false),
				checkIn: stays ? checkTime(checkIn, "check-in") : undefined,
				checkOut: stays ? checkTime(checkOut, "check-out") : undefined,
			});
			setErrors(found);
			if (Object.keys(found).length) return;
			const input = {
				name: name.trim(),
				city: city.trim(),
				address: address.trim() || null,
				phone: phone.trim() || null,
				email: email.trim() || null,
				timezone: hotel?.timezone ?? "Africa/Lagos",
				...(stays ? { checkInTime: checkIn, checkOutTime: checkOut } : {}),
				venueType: kind,
				businessId,
			};
			const result = hotel
				? await updateHotel(hotel.id, input)
				: await createHotel(input);
			if (!result.ok) {
				const field = hotelFieldOf(result.error);
				if (field) setErrors({ [field]: result.error });
				else toast.error(result.error, { duration: 8000 });
				return;
			}
			const noun = venueLabel(kind);
			toast.success(hotel ? `${noun} saved` : `${noun} added`);
			onSaved(result.data, hotel);
		});

	return (
		<div className="flex h-full flex-col gap-5">
			{Object.keys(errors).length > 0 && (
				<p className="text-xs font-medium text-danger" role="alert">
					Fix the fields marked in red to {hotel ? "save" : "add"} the{" "}
					{venueLabel(kind).toLowerCase()}.
				</p>
			)}
			<PanelSection title="Location">
				<SelectField
					label="What kind of place?"
					value={kind}
					onChange={(v) => setKind(venueType(v))}
					options={VENUE_TYPE_OPTIONS}
					hint="A lounge, bar or restaurant has no rooms; it gets sales, tabs, tills and menus. Adding rooms later turns room features on."
				/>
				<TextField
					label="Name"
					value={name}
					onChange={edit(setName, "name")}
					placeholder="e.g. Zuma Heights Wuse"
					required
					error={errors.name}
				/>
				<FieldRow>
					<TextField
						label="City"
						value={city}
						onChange={edit(setCity, "city")}
						placeholder="e.g. Abuja"
						required
						error={errors.city}
					/>
					<TextField
						label="Address"
						value={address}
						onChange={edit(setAddress, "address")}
						placeholder="e.g. Plot 41 Aminu Kano Cres, Wuse 2"
						error={errors.address}
					/>
				</FieldRow>
			</PanelSection>
			<PanelSection title="Contact">
				<FieldRow>
					<TextField
						label="Phone"
						value={phone}
						onChange={edit(setPhone, "phone")}
						placeholder="e.g. +234 803 555 0192"
						error={errors.phone}
					/>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={edit(setEmail, "email")}
						placeholder="e.g. wuse@zumaheights.example.ng"
						error={errors.email}
					/>
				</FieldRow>
			</PanelSection>
			{stays && (
			<PanelSection title="Times">
				<FieldRow>
					<TextField
						label="Check-in"
						type="time"
						value={checkIn}
						onChange={edit(setCheckIn, "checkIn")}
						required
						error={errors.checkIn}
					/>
					<TextField
						label="Check-out"
						type="time"
						value={checkOut}
						onChange={edit(setCheckOut, "checkOut")}
						required
						error={errors.checkOut}
					/>
				</FieldRow>
			</PanelSection>
			)}
			<div className="mt-auto flex items-center justify-end gap-2 border-t border-line pt-4">
				<button
					type="button"
					className={btn.secondary}
					onClick={onCancel}
					disabled={pending}
				>
					Cancel
				</button>
				<button
					type="button"
					className={btn.primary}
					onClick={submit}
					disabled={pending}
				>
					{hotel ? "Save" : `Add ${venueLabel(kind).toLowerCase()}`}
				</button>
			</div>
		</div>
	);
}
