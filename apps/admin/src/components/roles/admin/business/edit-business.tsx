"use client";

import { PencilIcon, ShieldAlertIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { recordChange } from "@hospio/api/actions/platform-admin";
import { updateBusiness } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { BusinessRequest } from "@hospio/api/api/schema";
import type { AdminChangeRow } from "@hospio/api/data/admin-types";
import type { BusinessRow } from "@hospio/api/data/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { FieldRow, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { businessRequestFrom, refreshBusiness } from "../onboarding/shared";
import { ChargesStartField } from "./charges-start";
import { FeeLockField, feeLockValue, showFeeLockError, useFeeLock } from "./fee-lock";

/** Edit business and Edit as Hospio360: the same form, the second with a required reason that is logged as a change. */

export function EditBusinessPanel({
	open,
	onOpenChange,
	business,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	onSaved: (b: BusinessRow) => void;
}) {
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Edit business"
			subtitle={`${business.name} · the owner sees these on their Company page`}
			icon={PencilIcon}
			width="md"
		>
			{open && (
				<EditBusinessForm
					key={business.id}
					business={business}
					onCancel={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			)}
		</SidePanel>
	);
}

/** What Edit as Hospio360 writes into the change log for each field it can touch. */
const FIELD_LABELS: Partial<Record<keyof BusinessRequest, string>> = {
	name: "Trading name",
	legalName: "Registered name",
	registrationNumber: "Registration number",
	businessType: "Business type",
	address: "Address",
	city: "City",
	email: "Business email",
	phone: "Phone",
	ownerName: "Owner's name",
	ownerEmail: "Owner email",
	ownerPhone: "Owner phone",
	feeModel: "Fee model",
	feeValue: "Fee",
	feeAddendumRef: "Fee addendum",
	contractNotes: "Contract notes",
};

/** The fields whose value differs between the row and the edit, with their before and after values. */
function diffBusiness(
	business: BusinessRow,
	patch: Partial<BusinessRequest>,
): {
	keys: (keyof BusinessRequest)[];
	before: Record<string, unknown>;
	after: Record<string, unknown>;
} {
	const current = businessRequestFrom(business, {});
	const keys: (keyof BusinessRequest)[] = [];
	const before: Record<string, unknown> = {};
	const after: Record<string, unknown> = {};
	for (const key of Object.keys(patch) as (keyof BusinessRequest)[]) {
		const was = current[key] ?? null;
		const now = patch[key] ?? null;
		if (JSON.stringify(was) === JSON.stringify(now)) continue;
		keys.push(key);
		before[key] = was;
		after[key] = now;
	}
	return { keys, before, after };
}

function EditBusinessForm({
	business: initial,
	onCancel,
	onSaved,
	asHms,
}: {
	business: BusinessRow;
	onCancel: () => void;
	onSaved: (b: BusinessRow, change?: AdminChangeRow) => void;
	/** Edit as Hospio360: a reason is required and the change is recorded with before/after values. */
	asHms?: boolean;
}) {
	const { run, pending } = useAction();
	// The row this form edits; a charges start change mirrors its date into contractStartsOn at once, so later saves start from that.
	const [business, setBase] = useState(initial);
	const [reason, setReason] = useState("");
	const [name, setName] = useState(business.name);
	const [legalName, setLegalName] = useState(business.legalName ?? "");
	const [registrationNumber, setReg] = useState(
		business.registrationNumber ?? "",
	);
	const [businessType, setType] = useState(business.businessType ?? "");
	const [address, setAddress] = useState(business.address ?? "");
	const [city, setCity] = useState(business.city ?? "");
	const [email, setEmail] = useState(business.email ?? "");
	const [phone, setPhone] = useState(business.phone ?? "");
	const [ownerName, setOwnerName] = useState(
		business.ownerName === "—" ? "" : business.ownerName,
	);
	const [ownerEmail, setOwnerEmail] = useState(business.ownerEmail ?? "");
	const [ownerPhone, setOwnerPhone] = useState(business.ownerPhone ?? "");
	// One fee model (a % of daily sales, billed on the monthly invoice), fixed at the platform default unless a signed addendum says otherwise.
	const lock = useFeeLock(
		business.feeModelKey === "PERCENT_OF_SALES" && business.feeValue
			? business.feeValue
			: null,
		business.feeAddendumRef,
	);
	const [contractNotes, setNotes] = useState(business.contractNotes ?? "");
	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim());
	const reasonOk = !asHms || reason.trim().length >= 8;
	const valid =
		name.trim().length > 1 && ownerName.trim().length > 1 && emailOk && reasonOk;

	// "Charges start on" lives in platform-service (the Money tab's API and rules); tenant's contractStartsOn keeps the same date as a
	// mirror, written here exactly as onboarding step 3 does, from the saved row only (unsaved form edits are not sent).
	const mirrorChargesStart = async (date: string | null) => {
		if ((business.contractStartsOn ?? null) === date) return;
		const saved = await updateBusiness(
			business.id,
			businessRequestFrom(business, {
				contractStartsOn: date,
				clearContractStartsOn: date === null,
			}),
		);
		if (!saved.ok) {
			toast.error(
				`Charges start ${date ? `on ${fmtLongDate(date)}` : "cleared"}, but the business record could not be updated: ${saved.error}`,
				{ duration: 8000 },
			);
			return;
		}
		setBase((prev) => refreshBusiness(prev, saved.data));
	};

	const save = () => {
		const fee = feeLockValue(lock);
		if (!fee) return;
		const patch: Partial<BusinessRequest> = {
			name: name.trim(),
			legalName: legalName.trim() || null,
			registrationNumber: registrationNumber.trim() || null,
			businessType: businessType.trim() || null,
			address: address.trim() || null,
			city: city.trim() || null,
			email: email.trim() || null,
			phone: phone.trim() || null,
			ownerName: ownerName.trim(),
			ownerEmail: ownerEmail.trim().toLowerCase(),
			ownerPhone: ownerPhone.trim() || null,
			feeModel: "PERCENT_OF_SALES",
			feeValue: fee.feeValue,
			feeAddendumRef: fee.feeAddendumRef,
			contractNotes: contractNotes.trim() || null,
		};
		const body = businessRequestFrom(business, patch);
		if (!asHms) {
			run(
				async () => {
					const saved = await updateBusiness(business.id, body);
					if (!saved.ok) showFeeLockError(lock, saved.error);
					return saved;
				},
				"Business saved",
				(b) => onSaved(refreshBusiness(business, b)),
			);
			return;
		}
		const diff = diffBusiness(business, patch);
		run(
			async () => {
				if (diff.keys.length === 0)
					return { ok: false as const, error: "Nothing has changed yet" };
				const saved = await updateBusiness(business.id, body);
				if (!saved.ok) {
					showFeeLockError(lock, saved.error);
					return saved;
				}
				const change = await recordChange({
					businessId: business.id,
					area: "BUSINESS",
					description: `${diff.keys
						.map((k) => FIELD_LABELS[k] ?? k)
						.join(", ")} changed`,
					reason: reason.trim(),
					before: diff.before,
					after: diff.after,
				});
				if (!change.ok) return change;
				return {
					ok: true as const,
					data: { business: saved.data, change: change.data },
				};
			},
			"Change saved and logged · the owner can ask support to undo it within 7 days",
			({ business: b, change }) =>
				onSaved(refreshBusiness(business, b), change),
		);
	};

	return (
		<div className="flex h-full flex-col gap-5">
			{asHms && (
				<PanelSection title="Why">
					<Note tone="info">
						Use this for support fixes the business can't do itself. The owner sees
						the change in their activity log, marked "by Hospio360", with this reason.
					</Note>
					<TextareaField
						label="Reason"
						value={reason}
						onChange={setReason}
						rows={2}
						placeholder="Ticket #4412 · owner asked for the new phone number"
						hint="At least 8 characters. A ticket number is best."
						error={
							reason.length > 0 && reason.trim().length < 8
								? "Say a little more"
								: undefined
						}
					/>
				</PanelSection>
			)}
			<PanelSection title="Business">
				<FieldRow>
					<TextField
						label="Trading name"
						value={name}
						onChange={setName}
						required
					/>
					<TextField
						label="Registered name"
						value={legalName}
						onChange={setLegalName}
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="Registration number"
						value={registrationNumber}
						onChange={setReg}
						placeholder="RC 1873402"
					/>
					<TextField
						label="Business type"
						value={businessType}
						onChange={setType}
						placeholder="Limited company"
					/>
				</FieldRow>
				<TextField
					label="Head office address"
					value={address}
					onChange={setAddress}
				/>
				<FieldRow>
					<TextField label="City" value={city} onChange={setCity} />
					<TextField
						label="Phone"
						value={phone}
						onChange={setPhone}
						placeholder="+234 …"
					/>
				</FieldRow>
				<TextField
					label="Business email"
					type="email"
					value={email}
					onChange={setEmail}
				/>
			</PanelSection>
			<PanelSection title="Owner">
				<TextField
					label="Owner's full name"
					value={ownerName}
					onChange={setOwnerName}
					required
				/>
				<FieldRow>
					<TextField
						label="Owner email"
						type="email"
						value={ownerEmail}
						onChange={setOwnerEmail}
						required
						error={
							ownerEmail && !emailOk
								? "That does not look like an email"
								: undefined
						}
						hint={
							business.stage !== "ONBOARDING"
								? "Does not change their sign-in"
								: undefined
						}
					/>
					<TextField
						label="Owner phone"
						value={ownerPhone}
						onChange={setOwnerPhone}
					/>
				</FieldRow>
			</PanelSection>
			<PanelSection title="Fee & contract">
				<FeeLockField lock={lock} />
				<ChargesStartField
					businessId={business.id}
					onChanged={(d) => void mirrorChargesStart(d)}
				/>
				<TextareaField
					label="Contract notes"
					value={contractNotes}
					onChange={setNotes}
					rows={2}
				/>
			</PanelSection>
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
					onClick={save}
					disabled={!valid || pending}
				>
					{asHms ? "Save change" : "Save business"}
				</button>
			</div>
		</div>
	);
}

/**
 * Phase 3 · Edit as Hospio360: the same business form with a required reason; the edit goes to tenant and
 * is then recorded (POST /platform/admin/changes, area BUSINESS, before/after of the fields that changed)
 * so it shows under "Changes by Hospio360" and in the owner's activity log; the owner can ask support to undo it within 7 days.
 */
export function EditAsHmsPanel({
	open,
	onOpenChange,
	business,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	onSaved: (b: BusinessRow, change: AdminChangeRow) => void;
}) {
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Edit as Hospio360"
			subtitle={`${business.name} · logged in the business's activity log; the owner can ask support to undo it within 7 days`}
			icon={ShieldAlertIcon}
			width="md"
			tone="danger"
			footerInfo="The owner and managers see this change in their activity log, marked 'by Hospio360'."
		>
			{open && (
				<EditBusinessForm
					key={`hms-${business.id}`}
					business={business}
					asHms
					onCancel={() => onOpenChange(false)}
					onSaved={(b, change) => {
						if (change) onSaved(b, change);
						else onOpenChange(false);
					}}
				/>
			)}
		</SidePanel>
	);
}
