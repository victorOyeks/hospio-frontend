"use client";

import { LandmarkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { saveMarketerBank } from "@hospio/api/actions/marketer";
import { useAction } from "@hospio/api/actions/use-action";
import type { MarketerProfileRow } from "@hospio/api/data/admin-types";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import {
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/** Nigerian banks and the big mobile money banks; anything else is typed in under "Other". */
export const NIGERIAN_BANKS = [
	"Access Bank",
	"Citibank",
	"Ecobank",
	"Fidelity Bank",
	"First Bank",
	"FCMB",
	"Globus Bank",
	"GTBank",
	"Jaiz Bank",
	"Keystone Bank",
	"Kuda",
	"Moniepoint",
	"OPay",
	"PalmPay",
	"Parallex Bank",
	"Polaris Bank",
	"Providus Bank",
	"Stanbic IBTC",
	"Standard Chartered",
	"Sterling Bank",
	"SunTrust Bank",
	"Titan Trust Bank",
	"UBA",
	"Union Bank",
	"Unity Bank",
	"Wema Bank",
	"Zenith Bank",
];
const OTHER = "Other";

/** A NUBAN account number: exactly 10 digits. */
export const checkAccountNumber = (v: string) =>
	/^\d{10}$/.test(v.trim()) ? undefined : "Enter the 10-digit account number";

/** Finance's check on the details: checked (by whom, when) or waiting. */
export function BankCheckPill({ p }: { p: MarketerProfileRow }) {
	if (!p.bankName) return <StatusPill tone="grey">Not added</StatusPill>;
	return p.bankChecked ? (
		<StatusPill tone="success">Checked</StatusPill>
	) : (
		<StatusPill tone="warning">Waiting for finance</StatusPill>
	);
}

export function bankCheckLine(p: MarketerProfileRow) {
	if (!p.bankName) return "No bank details yet";
	return p.bankChecked
		? `Checked by Hospio360 finance${p.bankCheckedAt ? ` ${fmtLongDate(p.bankCheckedAt)}` : ""}${p.bankCheckedByName ? ` · ${p.bankCheckedByName}` : ""}`
		: "Waiting for finance to check these details";
}

/** Marketer · bank details card with the edit panel (PUT /platform/marketer/me/bank). */
export function BankDetailsCard({
	profile,
	onSaved,
	className,
}: {
	profile: MarketerProfileRow;
	onSaved: (p: MarketerProfileRow) => void;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const p = profile;
	return (
		<SectionCard
			title="Bank details"
			subtitle="Where your statements are paid"
			className={className}
			headerRight={<BankCheckPill p={p} />}
			bodyClassName="gap-3 pt-2"
		>
			{p.bankName ? (
				<>
					<DetailList
						items={[
							{ label: "Bank", value: p.bankName },
							{ label: "Account number", value: p.bankAccount ?? "—" },
							{ label: "Name on the account", value: p.bankAccountName ?? "—" },
						]}
					/>
					<p className="text-xs text-ink-3">{bankCheckLine(p)}</p>
				</>
			) : (
				<Note tone="warning">
					Add your bank details so Hospio360 can pay your statements. A statement
					can't be approved until finance has checked them.
				</Note>
			)}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(btn.secondary, btn.small, "w-fit")}
			>
				{p.bankName ? "Change bank details" : "Add bank details"}
			</button>
			<BankPanel
				open={open}
				profile={p}
				onClose={() => setOpen(false)}
				onSaved={(np) => {
					onSaved(np);
					setOpen(false);
				}}
			/>
		</SectionCard>
	);
}

function BankPanel({
	open,
	profile: p,
	onClose,
	onSaved,
}: {
	open: boolean;
	profile: MarketerProfileRow;
	onClose: () => void;
	onSaved: (p: MarketerProfileRow) => void;
}) {
	const { run, pending } = useAction();
	const saved = !!p.bankName;
	const known = !p.bankName || NIGERIAN_BANKS.includes(p.bankName);
	const [bank, setBank] = useState("");
	const [other, setOther] = useState("");
	const [account, setAccount] = useState("");
	const [name, setName] = useState("");
	const [note, setNote] = useState("");
	const [errors, setErrors] = useState<Record<string, string | undefined>>(
		{},
	);
	// Each opening starts from the saved details.
	useEffect(() => {
		if (!open) return;
		setBank(known ? (p.bankName ?? "") : OTHER);
		setOther(known ? "" : (p.bankName ?? ""));
		setAccount(p.bankAccount ?? "");
		setName(p.bankAccountName ?? p.fullName);
		setNote("");
		setErrors({});
	}, [open, p, known]);
	const bankName = bank === OTHER ? other.trim() : bank;
	const changed =
		saved &&
		(bankName !== p.bankName ||
			account.trim() !== p.bankAccount ||
			name.trim() !== p.bankAccountName);

	const save = () => {
		const found = {
			bank: bankName ? undefined : "Choose the bank",
			account: checkAccountNumber(account),
			name: name.trim().length >= 2 ? undefined : "Enter the name on the account",
			note:
				changed && note.trim().length < 5
					? "Say why the bank details are changing"
					: undefined,
		};
		setErrors(found);
		if (Object.values(found).some(Boolean)) return;
		run(
			() =>
				saveMarketerBank(
					{
						bankName,
						bankAccount: account.trim(),
						bankAccountName: name.trim(),
						note: changed ? note.trim() : undefined,
					},
					p,
				),
			"Bank details saved · finance will check them",
			onSaved,
		);
	};

	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Bank details"
			subtitle="Where your statements are paid"
			icon={LandmarkIcon}
			width="md"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || (saved && !changed)}
						onClick={save}
					>
						Save
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<PanelSection title="Account">
					<SelectField
						label="Bank"
						value={bank}
						onChange={(v) => {
							setBank(v);
							setErrors((e) => ({ ...e, bank: undefined }));
						}}
						options={[...NIGERIAN_BANKS, OTHER]}
						error={bank === OTHER ? undefined : errors.bank}
						required
					/>
					{bank === OTHER && (
						<TextField
							label="Bank name"
							value={other}
							onChange={setOther}
							error={errors.bank}
							required
						/>
					)}
					<TextField
						label="Account number"
						value={account}
						onChange={(v) => {
							setAccount(v.replace(/\D/g, "").slice(0, 10));
							setErrors((e) => ({ ...e, account: undefined }));
						}}
						placeholder="0123456789"
						hint="10 digits (NUBAN)"
						error={errors.account}
						required
					/>
					<TextField
						label="Name on the account"
						value={name}
						onChange={setName}
						error={errors.name}
						required
					/>
					{changed && (
						<TextareaField
							label="Why are you changing them?"
							value={note}
							onChange={(v) => {
								setNote(v);
								setErrors((e) => ({ ...e, note: undefined }));
							}}
							placeholder="New account at another bank…"
							error={errors.note}
							rows={2}
						/>
					)}
				</PanelSection>
				<Note tone="info">
					Every change is checked by Hospio360 finance before your next
					statement is approved.
				</Note>
			</div>
		</SidePanel>
	);
}
