"use client";

import { CreditCardIcon, MessageSquareIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { saveSetupSection } from "@hospio/api/actions/hotel-config";
import type { TerminalRow } from "@hospio/api/data/types";
import { assignTerminalDesk, createTerminal, posKeysByHotel } from "@/lib/actions";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { FieldRow, SelectField, TextField } from "@hospio/ui/shared/field";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { DevicePackagePanel } from "../devices/device-package";
import type { WizardCtx } from "./wizard";
import {
	KeyRow,
	nextStep,
	prevStep,
	StepCard,
	StepFrame,
	useWizardSave,
	type WizardData,
} from "./shared";

/**
 * J11 · step 8: per hotel, the POS terminals (POST /payment/terminals with X-Hotel-Id) and the WhatsApp
 * number (hotel-config MESSAGING.whatsappNumber). The step saves the terminals it made and the numbers.
 */

/** The POS providers payments go through today (docs/pos-providers.md); the test terminal moves no money. */
const PROVIDERS = [
	{ value: "moniepoint", label: "Moniepoint", hint: "The hotel's own Moniepoint POS" },
	{ value: "opay", label: "OPay", hint: "The hotel's own OPay POS" },
	{ value: "logging", label: "Test terminal", hint: "No card machine: records payments, moves no money" },
];

/** What the terminal reference is on each provider's device. */
const REF: Record<string, { placeholder: string; hint: string }> = {
	moniepoint: { placeholder: "e.g. C5BP008D071J7555", hint: "The terminal serial on the back of the Moniepoint POS (or in the Moniepoint app)" },
	opay: { placeholder: "e.g. S6805370059963", hint: "The device SN on the OPay POS (Settings → About)" },
	logging: { placeholder: "e.g. TEST-FD-01", hint: "Any reference for the test terminal" },
};

const DESKS = [
	// Radix Select refuses an empty value, so "no desk" is NONE.
	{ value: "NONE", label: "No desk yet" },
	{ value: "FRONT_OFFICE", label: "Front office" },
	{ value: "BAR", label: "Bar" },
	{ value: "KITCHEN", label: "Kitchen & restaurant" },
	{ value: "LAUNDRY", label: "Laundry" },
];
const deskLabel = (r: string) => DESKS.find((d) => d.value === r)?.label ?? r;
const providerLabel = (p: string) => PROVIDERS.find((x) => x.value === p.toLowerCase())?.label ?? p;

type SavedTerminal = NonNullable<
	WizardData["connections"]
>["terminals"][number];

export function ConnectionsStep({ ctx }: { ctx: WizardCtx }) {
	const { hotels, data } = ctx;
	const saved = data.connections;
	const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "");
	const [savedTerminals, setSavedTerminals] = useState<SavedTerminal[]>(
		saved?.terminals ?? [],
	);
	const [numbers, setNumbers] = useState<Record<string, string>>(() => {
		const init: Record<string, string> = { ...(saved?.whatsappByHotel ?? {}) };
		if (saved?.whatsappNumber && hotels[0] && !init[hotels[0].id])
			init[hotels[0].id] = saved.whatsappNumber;
		return init;
	});
	const [savedNumbers, setSavedNumbers] = useState<Record<string, string>>(
		() => ({ ...(saved?.whatsappByHotel ?? {}) }),
	);
	// The numbers saved so far, for the save-all loop that runs before React re-renders.
	const savedRef = useRef(savedNumbers);
	savedRef.current = savedNumbers;
	const [form, setForm] = useState({
		name: "",
		provider: "moniepoint",
		terminalRef: "",
		desk: "FRONT_OFFICE",
	});
	// Which providers have the hotel's keys saved (null: this admin can't see keys, so nothing is said).
	const [keys, setKeys] = useState<Record<string, string[]> | null>(null);
	useEffect(() => {
		void posKeysByHotel().then(setKeys);
	}, []);
	const { pending, call, busy } = useWizardSave();
	const hotel = hotels.find((h) => h.id === hotelId) ?? hotels[0];
	const terminals = ctx.terminals[hotelId] ?? [];
	const number = numbers[hotelId] ?? "";
	const numberDirty = number.trim() !== (savedNumbers[hotelId] ?? "");

	const stepData = (): NonNullable<WizardData["connections"]> => ({
		terminals: savedTerminals,
		whatsappNumber:
			savedRef.current[hotels[0]?.id ?? ""] ??
			Object.values(savedRef.current)[0],
		whatsappByHotel: savedRef.current,
	});

	const addTerminal = () =>
		busy(async () => {
			const made = await call(
				() =>
					createTerminal(
						{
							name: form.name.trim(),
							provider: form.provider,
							terminalRef: form.terminalRef.trim(),
						},
						hotelId,
					),
				"Terminal added",
			);
			if (!made) return;
			// The desk that uses it: card payments from that desk go to this terminal.
			if (form.desk && form.desk !== "NONE") {
				const assigned = await assignTerminalDesk(made.id, form.desk as "FRONT_OFFICE" | "BAR" | "KITCHEN" | "LAUNDRY", hotelId);
				if (assigned.ok) made.roles = [form.desk];
				else toast.error(`${made.name} was added, but not given to ${deskLabel(form.desk)}: ${assigned.error}`, { duration: 8000 });
			}
			ctx.setTerminals(hotelId, [...terminals, made]);
			setSavedTerminals((list) => [
				...list,
				{
					hotelId,
					terminalId: made.id,
					name: made.name,
					provider: made.provider,
					terminalRef: made.ref,
				},
			]);
			setForm({ name: "", provider: form.provider, terminalRef: "", desk: form.desk });
		});

	const saveNumber = async (id: string): Promise<boolean> => {
		const value = (numbers[id] ?? "").trim();
		if (value === (savedRef.current[id] ?? "")) return true;
		// saveSetupSection answers {ok: true, data: null} on success, so the result itself is checked.
		const result = await saveSetupSection(
			"messaging",
			{ whatsappNumber: value },
			id,
		);
		if (!result.ok) {
			toast.error(result.error, { duration: 8000 });
			return false;
		}
		savedRef.current = { ...savedRef.current, [id]: value };
		setSavedNumbers(savedRef.current);
		return true;
	};

	const save = () =>
		busy(async () => {
			for (const h of hotels) if (!(await saveNumber(h.id))) return;
			const row = await ctx.saveStep("connections", stepData());
			if (row) ctx.goTo(nextStep("connections"));
		});

	if (hotels.length === 0) {
		return (
			<StepFrame
				venue={ctx.venue}
				step="connections"
				onBack={() => ctx.goTo(prevStep("connections"))}
			>
				<EmptyState
					title="Add a hotel first"
					hint="Connections belong to a hotel."
				>
					<button
						type="button"
						className={cn(btn.secondary, btn.small, "mt-2")}
						onClick={() => ctx.goTo("hotels")}
					>
						Back to hotels
					</button>
				</EmptyState>
			</StepFrame>
		);
	}

	return (
		<StepFrame
			venue={ctx.venue}
			step="connections"
			onBack={() => ctx.goTo(prevStep("connections"))}
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
			footerNote="WhatsApp numbers are saved for every hotel when you continue. Email is set up later in Hotel setup → Guest messaging."
		>
			{hotels.length > 1 && (
				<PillTabs
					tabs={hotels.map((h) => ({
						key: h.id,
						label: h.name,
						count: (ctx.terminals[h.id] ?? []).length,
					}))}
					value={hotelId}
					onChange={setHotelId}
				/>
			)}

			<StepCard
				title={`${hotel?.name ?? "Hotel"} · WhatsApp`}
				subtitle="Guests get confirmations and receipts from this number"
			>
				<div className="flex flex-col gap-3 md:flex-row md:items-end">
					<TextField
						label="WhatsApp Business number"
						value={number}
						onChange={(v) => setNumbers((m) => ({ ...m, [hotelId]: v }))}
						placeholder="+234 909 112 0041"
						className="flex-1"
						disabled={!ctx.editable}
					/>
					{ctx.editable && (
						<button
							type="button"
							className={cn(btn.secondary, "flex items-center gap-2")}
							disabled={pending || !numberDirty}
							onClick={() =>
								busy(async () => {
									if (await saveNumber(hotelId))
										toast.success("WhatsApp number saved");
								})
							}
						>
							<MessageSquareIcon className="size-4" /> Save number
						</button>
					)}
				</div>
				<KeyRow label="Status" last>
					{savedNumbers[hotelId] ? (
						<StatusPill tone="success">number saved</StatusPill>
					) : (
						<StatusPill tone="grey">no WhatsApp number yet</StatusPill>
					)}
				</KeyRow>
			</StepCard>

			<StepCard
				title={`${hotel?.name ?? "Hotel"} · POS terminals`}
				subtitle="Card machines at the front desk, bar and restaurant"
			>
				{terminals.length === 0 ? (
					<p className="text-[13px] text-ink-3">
						No terminals linked yet. Cash and transfer still work without one.
					</p>
				) : (
					<div>
						{terminals.map((t: TerminalRow, i) => (
							<KeyRow
								key={t.id}
								label={
									<span className="flex items-center gap-2">
										<CreditCardIcon className="size-4 text-ink-3" /> {t.name}{" "}
										<span className="text-xs text-ink-3">
											· {providerLabel(t.provider)} · {t.ref}
											{t.roles.length > 0 && ` · ${t.roles.map(deskLabel).join(", ")}`}
										</span>
									</span>
								}
								last={i === terminals.length - 1}
							>
								<StatusPill tone={t.status === "ONLINE" ? "success" : "grey"}>
									{t.status === "ONLINE" ? "online" : "linked · not seen yet"}
								</StatusPill>
							</KeyRow>
						))}
					</div>
				)}
				{ctx.editable && (
					<div className="rounded-xl bg-subtle/60 p-4">
						<p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
							Add a terminal
						</p>
						<FieldRow className="md:grid-cols-2 xl:grid-cols-4">
							<TextField
								label="Name"
								value={form.name}
								onChange={(v) => setForm((f) => ({ ...f, name: v }))}
								placeholder="Front desk POS"
							/>
							<SelectField
								label="Provider"
								value={form.provider}
								onChange={(v) => setForm((f) => ({ ...f, provider: v }))}
								options={PROVIDERS}
							/>
							<TextField
								label="Terminal reference"
								value={form.terminalRef}
								onChange={(v) => setForm((f) => ({ ...f, terminalRef: v }))}
								placeholder={REF[form.provider]?.placeholder}
								hint={REF[form.provider]?.hint}
							/>
							<SelectField
								label="Desk"
								value={form.desk}
								onChange={(v) => setForm((f) => ({ ...f, desk: v }))}
								options={DESKS}
								hint="Card payments from this desk go to this terminal"
							/>
						</FieldRow>
						{form.provider !== "logging" && keys && (
							keys[hotelId]?.includes(form.provider.toUpperCase()) ? (
								<p className="mt-2 text-[12px] text-success">
									{providerLabel(form.provider)} keys are saved for {hotel?.name ?? "this hotel"}: payments can go to this terminal.
								</p>
							) : (
								<p className="mt-2 text-[12px] text-warning">
									{hotel?.name ?? "This hotel"} has no {providerLabel(form.provider)} keys yet, so payments can't reach this terminal until a Super
									admin adds them in{" "}
									<Link href={`/dashboard/hotels?hotel=${hotelId}&htab=fees`} className="font-semibold underline">
										the hotel's POS & Hospio fees
									</Link>
									.
								</p>
							)
						)}
						<button
							type="button"
							className={cn(btn.secondary, "mt-3 flex items-center gap-2")}
							disabled={
								pending || !form.name.trim() || !form.terminalRef.trim()
							}
							onClick={addTerminal}
						>
							<PlusIcon className="size-4" /> Add terminal
						</button>
					</div>
				)}
			</StepCard>
			<StepCard
				title="Devices & internet"
				subtitle="What Hospio360 supplies to each hotel (tablets, router, data plan) and how it is paid for: own devices, from transactions, monthly or one time"
			>
				{ctx.hotels.length === 0 ? (
					<p className="text-[13px] text-ink-3">Add the hotels first.</p>
				) : (
					<div className="flex flex-col gap-4">
						{ctx.hotels.map((h) => (
							<DevicePackagePanel key={h.id} businessId={ctx.business.id} hotelId={h.id} hotelName={h.name} role={ctx.role} />
						))}
					</div>
				)}
			</StepCard>
		</StepFrame>
	);
}
