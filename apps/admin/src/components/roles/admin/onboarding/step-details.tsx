"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changeBusinessMarketer } from "@hospio/api/actions/marketer-admin";
import { updateBusiness } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { BusinessRequest } from "@hospio/api/api/schema";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import {
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
	StepCard,
	StepFrame,
	useWizardSave,
	type WizardData,
} from "./shared";

/**
 * J2–J4 · steps 1–3 write the business (PUT /tenant/businesses/{id}, only the step's own fields) then save the step's
 * form. Every field is checked before saving (names with letters, a real city, address, email, phone, a CAC number,
 * a share from 0 to 100) and the API refuses the same; a refusal about one field shows under it.
 */

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
	| "phone";

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

	const save = () =>
		busy(async () => {
			const found = only({
				name: checkName(name, "the trading name"),
				legalName: checkName(legalName, "the registered name", 120, false),
				registrationNumber: checkRegistration(registrationNumber),
				address: checkAddress(address, false),
				city: checkCity(city),
				email: checkEmail(email, false),
				phone: checkPhone(phone, false),
			});
			setErrors(found);
			if (Object.keys(found).length) return;
			// Blank optional fields are sent as "" so a cleared value is cleared; the API refuses anything meaningless.
			const patch = {
				name: name.trim(),
				legalName: legalName.trim(),
				registrationNumber: registrationNumber.trim(),
				businessType: businessType || "",
				address: address.trim(),
				city: city.trim(),
				email: email.trim(),
				phone: phone.trim(),
				timezone,
			};
			const b = await saveFields<BusinessField>(
				ctx,
				patch,
				(m) =>
					/CAC/i.test(m)
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
				setErrors,
			);
			if (!b) return;
			const row = await ctx.saveStep("business", {
				name: b.name,
				legalName: b.legalName ?? undefined,
				registrationNumber: b.registrationNumber ?? undefined,
				businessType: b.businessType ?? undefined,
				address: b.address ?? undefined,
				city: b.city ?? undefined,
				country: business.country ?? "NG",
				timezone,
			});
			if (row) ctx.goTo(nextStep("business"));
		});

	return (
		<StepFrame
			step="business"
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
			footerNote={
				Object.keys(errors).length
					? "Fix the fields marked in red to continue."
					: undefined
			}
		>
			<StepCard title="Business">
				<FieldRow>
					<TextField
						label="Trading name"
						value={name}
						onChange={edit(setName, "name")}
						placeholder="e.g. Abuja Palms"
						required
						error={errors.name}
					/>
					<TextField
						label="Registered name"
						value={legalName}
						onChange={edit(setLegalName, "legalName")}
						placeholder="e.g. Abuja Palms Hotels Ltd"
						hint="As on the CAC certificate"
						error={errors.legalName}
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="CAC / registration number"
						value={registrationNumber}
						onChange={edit(setReg, "registrationNumber")}
						placeholder="e.g. RC 1873402"
						hint="RC, BN or IT and the digits; one business per number"
						error={errors.registrationNumber}
					/>
					<SelectField
						label="Business type"
						value={businessType}
						onChange={setType}
						options={BUSINESS_TYPES}
						placeholder="Choose…"
					/>
				</FieldRow>
				<TextField
					label="Head office address"
					value={address}
					onChange={edit(setAddress, "address")}
					placeholder="e.g. Plot 41 Aminu Kano Crescent, Wuse 2, Abuja"
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
				subtitle="Where statements and notices go. The owner's own contact is the next step."
			>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={edit(setEmail, "email")}
						placeholder="e.g. accounts@abujapalms.ng"
						error={errors.email}
					/>
					<TextField
						label="Phone"
						value={phone}
						onChange={edit(setPhone, "phone")}
						placeholder="e.g. +234 803 555 0192"
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

	const save = () =>
		busy(async () => {
			// The second contact is optional: blank is fine, anything typed must be real.
			const found = only({
				ownerName: checkName(ownerName, "the owner's full name"),
				ownerEmail: checkEmail(ownerEmail),
				ownerPhone: checkPhone(ownerPhone, false),
				contactName: checkName(contactName, "the contact's name", 120, false),
				contactEmail: checkEmail(contactEmail, false),
				contactPhone: checkPhone(contactPhone, false),
			});
			setErrors(found);
			if (Object.keys(found).length) return;
			const patch = {
				ownerName: ownerName.trim(),
				ownerEmail: ownerEmail.trim().toLowerCase(),
				ownerPhone: ownerPhone.trim(),
			};
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
				setErrors,
			);
			if (!b) return;
			const stepData: NonNullable<WizardData["owner"]> = {
				ownerName: patch.ownerName,
				ownerEmail: patch.ownerEmail,
				ownerPhone: patch.ownerPhone || undefined,
				contactName: contactName.trim() || undefined,
				contactEmail: contactEmail.trim() || undefined,
				contactPhone: contactPhone.trim() || undefined,
			};
			const row = await ctx.saveStep("owner", stepData);
			if (row) ctx.goTo(nextStep("owner"));
		});

	return (
		<StepFrame
			step="owner"
			onBack={() => ctx.goTo(prevStep("owner"))}
			onContinue={ctx.editable ? save : undefined}
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
					placeholder="e.g. Musa Danladi"
					required
					error={errors.ownerName}
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={ownerEmail}
						onChange={edit(setOwnerEmail, "ownerEmail")}
						placeholder="e.g. musa@abujapalms.ng"
						required
						error={errors.ownerEmail}
					/>
					<TextField
						label="Phone"
						value={ownerPhone}
						onChange={edit(setOwnerPhone, "ownerPhone")}
						placeholder="e.g. +234 803 555 0192"
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
				subtitle="Optional · a co-owner or general manager we can call. Kept on the onboarding notes only."
			>
				<TextField
					label="Full name"
					value={contactName}
					onChange={edit(setContactName, "contactName")}
					placeholder="e.g. Hauwa Danladi"
					error={errors.contactName}
				/>
				<FieldRow>
					<TextField
						label="Email"
						type="email"
						value={contactEmail}
						onChange={edit(setContactEmail, "contactEmail")}
						placeholder="e.g. hauwa@abujapalms.ng"
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

/** One fee model: a % of each day's sales, debited each morning from the hotel's POS provider account. Only the rate varies. */
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
	const [contractStartsOn, setStartsOn] = useState(
		saved?.contractStartsOn ?? business.contractStartsOn ?? "",
	);
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
			const patch = {
				feeModel: FEE_MODEL,
				feeValue,
				feeAddendumRef,
				contractStartsOn: contractStartsOn || null,
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
			step="fee"
			onBack={() => ctx.goTo(prevStep("fee"))}
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
		>
			<StepCard
				title="Hospio360 fee"
				subtitle={`${feeModelLabels.PERCENT_OF_SALES}: a share of each day's sales, debited each morning from the hotel's Moniepoint or OPay account. A statement for each day is emailed to the owner.`}
			>
				<FeeLockField lock={lock} disabled={!ctx.editable} />
			</StepCard>
			<StepCard title="Contract">
				<FieldRow>
					<TextField
						label="Agreement starts on"
						type="date"
						value={contractStartsOn}
						onChange={setStartsOn}
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
