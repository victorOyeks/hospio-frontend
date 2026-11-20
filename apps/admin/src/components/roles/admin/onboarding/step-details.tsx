"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { setChargesStart } from "@hospio/api/actions/billing";
import { changeBusinessMarketer } from "@hospio/api/actions/marketer-admin";
import { updateBusiness } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { BusinessRequest } from "@hospio/api/api/schema";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import {
	BUSINESS_KIND_OPTIONS,
	type BusinessKindKey,
	businessKind,
} from "@hospio/api/venue";
import {
	ChoiceCards,
	FieldRow,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	checkAddress,
	checkCity,
	checkEmail,
	checkName,
	checkPhone,
	checkRegistration,
	only,
} from "@hospio/ui/shared/validate";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	changeMessage,
	NOBODY,
	referrerOptions,
	useReferrers,
} from "../business/referred-by";
import { ChargesTag, useChargesStart } from "../business/charges-start";
import {
	FeeLockField,
	feeLockValue,
	showFeeLockError,
	useFeeLock,
} from "../business/fee-lock";
import type { WizardCtx } from "./wizard";
import {
	nextStep,
	refreshBusiness,
	prevStep,
	focusFirstError,
	SaveLaterButton,
	StepCard,
	StepFrame,
	useWizardSave,
	type WizardData,
} from "./shared";

/**
 * J2–J4 · steps 1–3 write the business (PUT /tenant/businesses/{id}, only the step's own fields) then save the step's
 * form. Every field is checked before saving (names with letters, a real city, address, email, phone, a CAC number,
 * a share from 0 to 100) and the API refuses the same; a refusal about one field shows under it.
 *
 * Required to continue (tester report, 21 Nov 2026; hospio-backend docs/onboarding.md "Back-office required fields"): step 1 the
 * registered name, business type, head office address, city and a business email or phone; step 2 the owner's phone and, when a
 * second contact is started, their name plus a phone or email. The CAC number and Charges start on stay optional. "Save and
 * finish later" keeps what is typed (only the format of a typed value is checked) without completing the step.
 */

/** Where "Save and finish later" leaves the admin. */
const BOARD = "/dashboard/onboarding";

/** A draft save sends only what is typed: a blank is not a value to clear (the API asks for a name or city when one is sent). */
function typedOnly<T extends Record<string, unknown>>(patch: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(patch).filter(([, v]) => v !== "" && v !== undefined),
	) as Partial<T>;
}

const CONTACT_NEEDED =
	"Enter the business email or phone (at least one) so statements and notices reach them";

const BUSINESS_TYPES = [
	"Limited company",
	"Business name",
	"Sole proprietor",
	"Partnership",
	"Other",
];
const TIMEZONES = [
	"Africa/Lagos",
	"Africa/Accra",
	"Africa/Nairobi",
	"Europe/London",
];

/** The step's field errors: one sentence per field, the same rules the API applies (tenant's Fields.java). */
type Errors<K extends string> = Partial<Record<K, string>>;

/**
 * Saves a step's business fields; a refusal about one field (a duplicate CAC number, a taken email) is shown under it,
 * anything else is toasted. Returns the saved business, or null.
 */
async function saveFields<K extends string>(
	ctx: WizardCtx,
	patch: Partial<BusinessRequest>,
	fieldOf: (message: string) => K | null,
	setErrors: (e: Errors<K>) => void,
) {
	const result = await updateBusiness(ctx.business.id, patch);
	if (!result.ok) {
		const field = fieldOf(result.error);
		if (field) setErrors({ [field]: result.error } as Errors<K>);
		else toast.error(result.error, { duration: 8000 });
		return null;
	}
	ctx.setBusiness(refreshBusiness(ctx.business, result.data));
	return result.data;
}

/** Clears one field's message as soon as it is edited. */
function editor<K extends string>(
	errors: Errors<K>,
	setErrors: (f: (e: Errors<K>) => Errors<K>) => void,
) {
	return (set: (v: string) => void, field: K) => (v: string) => {
		set(v);
		if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
	};
}

type BusinessField =
	| "name"
	| "legalName"
	| "registrationNumber"
	| "address"
	| "city"
	| "email"
	| "phone"
	| "businessType";

export function BusinessStep({ ctx }: { ctx: WizardCtx }) {
	const { business, data } = ctx;
	const saved = data.business;
	const [name, setName] = useState(saved?.name ?? business.name);
	const [legalName, setLegalName] = useState(
		saved?.legalName ?? business.legalName ?? "",
	);
	const [registrationNumber, setReg] = useState(
		saved?.registrationNumber ?? business.registrationNumber ?? "",
	);
	const [businessType, setType] = useState(
		saved?.businessType ?? business.businessType ?? "",
	);
	// What kind of business (hospio-backend docs/plan-venue-type.md): sets each new location's type; Mixed picks per location.
	const [venueKind, setVenueKind] = useState<BusinessKindKey>(
		businessKind(business.venueKind),
	);
	const [address, setAddress] = useState(
		saved?.address ?? business.address ?? "",
	);
	const [city, setCity] = useState(saved?.city ?? business.city ?? "");
	const [email, setEmail] = useState(business.email ?? "");
	const [phone, setPhone] = useState(business.phone ?? "");
	const [timezone, setTimezone] = useState(
		saved?.timezone ?? business.timezone ?? "Africa/Lagos",
	);
	const [errors, setErrors] = useState<Errors<BusinessField>>({});
	const edit = editor(errors, setErrors);
	const { pending, busy } = useWizardSave();
	const router = useRouter();
	const noContact = !email.trim() && !phone.trim();

	/** `complete`: Continue (every required field); false: Save and finish later (only what is typed is checked). */
	const save = (complete: boolean) =>
		busy(async () => {
			const found = only({
				name: checkName(name, "the trading name", 120, complete),
				legalName: checkName(legalName, "the registered name", 120, complete),
				registrationNumber: checkRegistration(registrationNumber),
				businessType:
					complete && !businessType ? "Choose the business type" : undefined,
				address:
					complete && !address.trim()
						? "Enter the head office address"
						: checkAddress(address, false),
				city: checkCity(city, complete),
				email:
					checkEmail(email, false) ??
					(complete && noContact ? CONTACT_NEEDED : undefined),
				phone:
					checkPhone(phone, false) ??
					(complete && noContact ? "Or enter the business phone" : undefined),
			});
			setErrors(found);
			if (Object.keys(found).length) {
				focusFirstError();
				return;
			}
			// Blank optional fields are sent as "" so a cleared value is cleared; the API refuses anything meaningless.
			const full = {
				name: name.trim(),
				legalName: legalName.trim(),
				registrationNumber: registrationNumber.trim(),
				businessType: businessType || "",
				venueKind,
				address: address.trim(),
				city: city.trim(),
				email: email.trim(),
				phone: phone.trim(),
				timezone,
			};
			const patch = complete ? full : typedOnly(full);
			const b = await saveFields<BusinessField>(
				ctx,
				patch,
				(m) =>
					/business type/i.test(m)
						? "businessType"
						: /CAC/i.test(m)
							? "registrationNumber"
							: /registered name/i.test(m)
								? "legalName"
								: /trading name|business called/i.test(m)
									? "name"
									: /address/i.test(m)
										? "address"
										: /city/i.test(m)
											? "city"
											: /email/i.test(m)
												? "email"
												: /phone/i.test(m)
													? "phone"
													: null,
				(e) => {
					setErrors(e);
					focusFirstError();
				},
			);
			if (!b) return;
			const row = await ctx.saveStep(
				"business",
				{
					name: b.name,
					legalName: b.legalName ?? undefined,
					registrationNumber: b.registrationNumber ?? undefined,
					businessType: b.businessType ?? undefined,
					address: b.address ?? undefined,
					city: b.city ?? undefined,
					country: business.country ?? "NG",
					timezone,
				},
				complete ? undefined : "Finish step 1 · Business & legal",
				!complete,
			);
			if (!row) return;
			if (complete) ctx.goTo(nextStep("business"));
			else {
				toast.success("Saved. Pick it up again from Onboarding.");
				router.push(BOARD);
			}
		});

	return (
		<StepFrame
			venue={ctx.venue}
			step="business"
			onContinue={ctx.editable ? () => save(true) : undefined}
			extra={
				ctx.editable ? (
					<SaveLaterButton onClick={() => save(false)} pending={pending} />
				) : undefined
			}
			pending={pending}
			footerNote={
				Object.keys(errors).length
					? "Fix the fields marked in red to continue."
					: undefined
			}
		>
			<StepCard title="Business">
				<ChoiceCards
					label="What kind of business?"
					hint="Sets what each new location starts as. A lounge, bar or restaurant needs no rooms and no check-in times."
					value={venueKind}
					onChange={setVenueKind}
					options={BUSINESS_KIND_OPTIONS}
					columns={2}
				/>
				<FieldRow>
					<TextField
						label="Trading name"
						value={name}
						onChange={edit(setName, "name")}
						placeholder="e.g. Zuma Heights"
						required
						error={errors.name}
					/>
					<TextField
						label="Registered name"
						value={legalName}
						onChange={edit(setLegalName, "legalName")}
						placeholder="e.g. Zuma Heights Hotels Ltd"
						hint="As on the CAC certificate; not registered yet? Use the trading name"
						required
						error={errors.legalName}
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="CAC / registration number"
						value={registrationNumber}
						onChange={edit(setReg, "registrationNumber")}
						placeholder="e.g. RC 1873402"
						hint="Optional: RC, BN or IT and the digits. Not registered yet? Add it later from the business page"
						error={errors.registrationNumber}
					/>
					<SelectField
						label="Business type"
						value={businessType}
						onChange={edit(setType, "businessType")}
						options={BUSINESS_TYPES}
						placeholder="Choose…"
						required
						error={errors.businessType}
					/>
				</FieldRow>
				<TextField
					label="Head office address"
					value={address}
					onChange={edit(setAddress, "address")}
					placeholder="e.g. Plot 41 Aminu Kano Crescent, Wuse 2, Abuja"
					required
					error={errors.address}
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
					<SelectField
						label="Time zone"
						value={timezone}
						onChange={setTimezone}
						options={TIMEZONES}
					/>
				</FieldRow>
			</StepCard>
			<StepCard
				title="Business contact"
				subtitle="Where statements and notices go: an email or a phone, or both. The owner's own contact is the next step."
			>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={(v) => {
							setEmail(v);
							// Either one satisfies "at least one": typing here clears the pair's message.
							if (errors.email || errors.phone)
								setErrors((e) => ({
									...e,
									email: undefined,
									phone: undefined,
								}));
						}}
						placeholder="e.g. accounts@zumaheights.example.ng"
						hint="Email or phone required"
						error={errors.email}
					/>
					<TextField
						label="Phone"
						value={phone}
						onChange={(v) => {
							setPhone(v);
							if (errors.email || errors.phone)
								setErrors((e) => ({
									...e,
									email: undefined,
									phone: undefined,
								}));
						}}
						placeholder="e.g. +234 803 555 0192"
						hint="Email or phone required"
						error={errors.phone}
					/>
				</FieldRow>
			</StepCard>
		</StepFrame>
	);
}

type OwnerField =
	| "ownerName"
	| "ownerEmail"
	| "ownerPhone"
	| "contactName"
	| "contactEmail"
	| "contactPhone";

export function OwnerStep({ ctx }: { ctx: WizardCtx }) {
	const { business, data } = ctx;
	const saved = data.owner;
	const [ownerName, setOwnerName] = useState(
		saved?.ownerName ?? (business.ownerName === "—" ? "" : business.ownerName),
	);
	const [ownerEmail, setOwnerEmail] = useState(
		saved?.ownerEmail ?? business.ownerEmail ?? "",
	);
	const [ownerPhone, setOwnerPhone] = useState(
		saved?.ownerPhone ?? business.ownerPhone ?? "",
	);
	const [contactName, setContactName] = useState(saved?.contactName ?? "");
	const [contactEmail, setContactEmail] = useState(saved?.contactEmail ?? "");
	const [contactPhone, setContactPhone] = useState(saved?.contactPhone ?? "");
	const [errors, setErrors] = useState<Errors<OwnerField>>({});
	const edit = editor(errors, setErrors);
	const { pending, busy } = useWizardSave();
	const router = useRouter();

	/** `complete`: Continue (every required field); false: Save and finish later (only what is typed is checked). */
	const save = (complete: boolean) =>
		busy(async () => {
			// The second contact is optional: all blank is fine; once started it needs a name plus a phone or an email.
			const contactStarted = !!(
				contactName.trim() ||
				contactEmail.trim() ||
				contactPhone.trim()
			);
			const noReach = !contactEmail.trim() && !contactPhone.trim();
			const found = only({
				ownerName: checkName(ownerName, "the owner's full name", 120, complete),
				ownerEmail: checkEmail(ownerEmail, complete),
				ownerPhone:
					checkPhone(ownerPhone, false) ??
					(complete && !ownerPhone.trim()
						? "Enter the owner's phone: it is used for sign-in checks and WhatsApp"
						: undefined),
				contactName:
					checkName(contactName, "the contact's name", 120, false) ??
					(complete && contactStarted && !contactName.trim()
						? "Enter the contact's name, or clear their phone and email"
						: undefined),
				contactEmail: checkEmail(contactEmail, false),
				contactPhone:
					checkPhone(contactPhone, false) ??
					(complete && contactStarted && noReach
						? "Enter a phone or an email for this contact, or clear their name"
						: undefined),
			});
			setErrors(found);
			if (Object.keys(found).length) {
				focusFirstError();
				return;
			}
			const full = {
				ownerName: ownerName.trim(),
				ownerEmail: ownerEmail.trim().toLowerCase(),
				ownerPhone: ownerPhone.trim(),
			};
			const patch = complete ? full : typedOnly(full);
			const b = await saveFields<OwnerField>(
				ctx,
				patch,
				(m) =>
					/already has an account|email/i.test(m)
						? "ownerEmail"
						: /phone/i.test(m)
							? "ownerPhone"
							: /name/i.test(m)
								? "ownerName"
								: null,
				(e) => {
					setErrors(e);
					focusFirstError();
				},
			);
			if (!b) return;
			const stepData: NonNullable<WizardData["owner"]> = {
				ownerName: full.ownerName,
				ownerEmail: full.ownerEmail,
				ownerPhone: full.ownerPhone || undefined,
				contactName: contactName.trim() || undefined,
				contactEmail: contactEmail.trim() || undefined,
				contactPhone: contactPhone.trim() || undefined,
			};
			const row = await ctx.saveStep(
				"owner",
				stepData,
				complete ? undefined : "Finish step 2 · Owner & contacts",
				!complete,
			);
			if (!row) return;
			if (complete) ctx.goTo(nextStep("owner"));
			else {
				toast.success("Saved. Pick it up again from Onboarding.");
				router.push(BOARD);
			}
		});

	return (
		<StepFrame
			venue={ctx.venue}
			step="owner"
			onBack={() => ctx.goTo(prevStep("owner"))}
			onContinue={ctx.editable ? () => save(true) : undefined}
			extra={
				ctx.editable ? (
					<SaveLaterButton onClick={() => save(false)} pending={pending} />
				) : undefined
			}
			pending={pending}
			footerNote={
				Object.keys(errors).length
					? "Fix the fields marked in red to continue."
					: undefined
			}
		>
			<StepCard
				title="Owner"
				subtitle="Gets the handover pack and the owner login. The email is their sign-in."
			>
				<TextField
					label="Full name"
					value={ownerName}
					onChange={edit(setOwnerName, "ownerName")}
					placeholder="e.g. Haruna Dauda"
					required
					error={errors.ownerName}
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={ownerEmail}
						onChange={edit(setOwnerEmail, "ownerEmail")}
						placeholder="e.g. haruna@zumaheights.example.ng"
						required
						error={errors.ownerEmail}
					/>
					<TextField
						label="Phone"
						value={ownerPhone}
						onChange={edit(setOwnerPhone, "ownerPhone")}
						placeholder="e.g. +234 803 555 0192"
						hint="Used for sign-in checks and WhatsApp"
						required
						error={errors.ownerPhone}
					/>
				</FieldRow>
				{business.stage !== "ONBOARDING" && (
					<Note tone="info">
						The owner's login already exists. Changing the email here does not
						change their sign-in.
					</Note>
				)}
			</StepCard>
			<StepCard
				title="Second contact"
				subtitle="Optional · a co-owner or general manager we can call. Leave it all blank, or give a name plus a phone or an email. Kept on the onboarding notes only."
			>
				<TextField
					label="Full name"
					value={contactName}
					onChange={edit(setContactName, "contactName")}
					placeholder="e.g. Hadiza Jibrin"
					error={errors.contactName}
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={contactEmail}
						onChange={edit(setContactEmail, "contactEmail")}
						placeholder="e.g. hadiza@zumaheights.example.ng"
						error={errors.contactEmail}
					/>
					<TextField
						label="Phone"
						value={contactPhone}
						onChange={edit(setContactPhone, "contactPhone")}
						placeholder="e.g. +234 803 555 0193"
						error={errors.contactPhone}
					/>
				</FieldRow>
			</StepCard>
		</StepFrame>
	);
}

/** One fee model: a % of each day's sales, billed on the business's monthly invoice. Only the rate varies. */
const FEE_MODEL = "PERCENT_OF_SALES" as const;

export function FeeStep({ ctx }: { ctx: WizardCtx }) {
	const { business, data } = ctx;
	const saved = data.fee;
	// The rate saved for this business (on the daily-sales model): the platform default unless a signed addendum says otherwise.
	const fromBusiness = business.feeModelKey === FEE_MODEL && !!business.feeValue;
	const lock = useFeeLock(
		fromBusiness
			? business.feeValue
			: saved?.feeModel === FEE_MODEL
				? saved.feeValue
				: null,
		fromBusiness ? business.feeAddendumRef : saved?.feeAddendumRef,
	);
	// "Charges start on" (hospio-backend docs/plan-monthly-invoices.md) lives in platform-service: money roles set it here with a
	// reason; tenant's contractStartsOn keeps the same date (a mirror). No date = free: no platform fee, devices still billed.
	const charges = useChargesStart(business.id);
	const [contractStartsOn, setStartsOn] = useState(
		saved?.contractStartsOn ?? business.contractStartsOn ?? "",
	);
	const [chargesReason, setChargesReason] = useState("Order form: charges start date");
	const seeded = useRef(false);
	useEffect(() => {
		if (seeded.current || !charges.view) return;
		seeded.current = true;
		setStartsOn(charges.view.chargesStartOn ?? "");
	}, [charges.view]);
	const canSetCharges = !!charges.view?.canEdit && ctx.editable;
	const chargesChanged = !!charges.view && (contractStartsOn || null) !== (charges.view.chargesStartOn ?? null);
	const [contractNotes, setNotes] = useState(
		saved?.contractNotes ?? business.contractNotes ?? "",
	);
	const { pending, busy } = useWizardSave();
	// Referred by changes through platform-service at once (with a reason), never through the draft or the business PUT.
	const referrers = useReferrers();
	const [referrer, setReferrer] = useState(business.marketerId ?? NOBODY);
	const [reason, setReason] = useState("");
	const changing = (referrer === NOBODY ? undefined : referrer) !== business.marketerId;
	const referral = useAction();
	const referrerList = referrers ?? [];
	// The business's own marketer stays pickable even when the list doesn't have it (ended, or still loading).
	const pickable =
		business.marketerId &&
		!referrerList.some((m) => m.id === business.marketerId)
			? [
					...referrerOptions(referrerList),
					{
						value: business.marketerId,
						label: business.marketer ?? "Current marketer",
						hint: "",
					},
				]
			: referrerOptions(referrerList);

	const save = () =>
		busy(async () => {
			const fee = feeLockValue(lock);
			if (!fee) return;
			const { feeValue, feeAddendumRef } = fee;
			if (canSetCharges && chargesChanged) {
				const c = await setChargesStart(business.id, {
					chargesStartOn: contractStartsOn || null,
					reason: chargesReason,
				});
				if (!c.ok) {
					toast.error(c.error, { duration: 8000 });
					return;
				}
				charges.setView(c.data);
			}
			const patch = {
				feeModel: FEE_MODEL,
				feeValue,
				feeAddendumRef,
				contractStartsOn: contractStartsOn || null,
				// No date (free): the mirror is emptied too, so it never shows a date billing no longer uses.
				clearContractStartsOn: !contractStartsOn && !!business.contractStartsOn,
				contractNotes: contractNotes.trim(),
			};
			const b = await saveFields<"fee">(
				ctx,
				patch,
				(m) => (/share|fee|percent|addendum/i.test(m) ? "fee" : null),
				(e) => {
					if (e.fee) showFeeLockError(lock, e.fee);
				},
			);
			if (!b) return;
			const row = await ctx.saveStep("fee", {
				feeModel: FEE_MODEL,
				feeValue,
				feeAddendumRef: feeAddendumRef ?? undefined,
				currency: business.currency ?? "NGN",
				contractStartsOn: patch.contractStartsOn ?? undefined,
				contractNotes: patch.contractNotes || undefined,
				marketerId: business.marketerId,
			});
			if (row) ctx.goTo(nextStep("fee"));
		});

	return (
		<StepFrame
			venue={ctx.venue}
			step="fee"
			onBack={() => ctx.goTo(prevStep("fee"))}
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
		>
			<StepCard
				title="Hospio360 fee"
				subtitle={`${feeModelLabels.PERCENT_OF_SALES}: a share of each day's sales, billed on one Hospio360 invoice each month (issued on the 1st, due 7 days later). Nothing is debited; the owner sees each day under Hospio fees.`}
			>
				<FeeLockField lock={lock} disabled={!ctx.editable} />
			</StepCard>
			<StepCard title="Contract">
				<FieldRow>
					<TextField
						label="Charges start on"
						type="date"
						value={contractStartsOn}
						onChange={setStartsOn}
						disabled={!canSetCharges}
						hint={
							<>
								{/* Empty is allowed by design (free until a date is set), so the note says so in warning colour. */}
								<span
									className={cn(
										!contractStartsOn && "font-medium text-warning",
									)}
								>
									Leave empty to keep this business free until you set a date.
									Devices are still billed.
								</span>
								{charges.view && !charges.view.canEdit && " Only a Super admin or Finance admin can change it."}
								{charges.view && (
									<span className="mt-1 block">
										<ChargesTag row={charges.view} />
									</span>
								)}
							</>
						}
					/>
					<SelectField
						label="Referred by"
						value={referrer}
						onChange={(v) => {
							setReferrer(v);
							setReason("");
						}}
						options={pickable}
						placeholder={referrers ? "Nobody · direct" : "Loading marketers…"}
						disabled={!ctx.editable}
						hint={
							changing
								? "Give a reason and press Change: it applies at once"
								: "Changes are audit-logged; the marketer's agreement follows"
						}
					/>
				</FieldRow>
				{changing && ctx.editable && (
					<div className="flex items-end gap-2">
						<TextField
							label="Why is Referred by changing?"
							value={reason}
							onChange={setReason}
							placeholder="Introduced by another marketer"
							className="flex-1"
						/>
						<button
							type="button"
							className={cn(btn.secondary, "mb-[1px]")}
							disabled={referral.pending || reason.trim().length < 5}
							onClick={() =>
								referral.run(
									() =>
										changeBusinessMarketer(
											business.id,
											referrer === NOBODY ? null : referrer,
											reason,
										),
									changeMessage,
									(r) => {
										ctx.setBusiness({
											...business,
											marketerId: r.toProfileId,
											marketer: r.toName,
										});
										setReason("");
									},
								)
							}
						>
							Change
						</button>
						<button
							type="button"
							className={cn(btn.ghost, "mb-[1px]")}
							onClick={() => setReferrer(business.marketerId ?? NOBODY)}
						>
							Undo
						</button>
					</div>
				)}
				{canSetCharges && chargesChanged && (
					<TextField
						label="Why is the charges start date changing?"
						value={chargesReason}
						onChange={setChargesReason}
						hint="8 to 500 characters · saved when you continue, kept in Changes by Hospio360"
						error={chargesReason.trim().length < 8 ? "Give a reason (8 characters or more)" : undefined}
					/>
				)}
				<TextareaField
					label="Contract notes"
					value={contractNotes}
					onChange={setNotes}
					placeholder="First 30 days free · reviewed every 12 months"
					rows={3}
				/>
			</StepCard>
		</StepFrame>
	);
}
