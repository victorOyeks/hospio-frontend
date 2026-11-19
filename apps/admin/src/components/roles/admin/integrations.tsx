"use client";

import {
	CheckCircle2Icon,
	ChevronDownIcon,
	ChevronUpIcon,
	FlaskConicalIcon,
	Loader2Icon,
	LockIcon,
	MailIcon,
	PencilIcon,
	PlugZapIcon,
	RefreshCwIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	runConnectionChecks,
	saveIntegration,
	sendTestEmail,
	testIntegration,
} from "@hospio/api/actions/integrations";
import type {
	IntegrationCard,
	IntegrationFieldView,
	IntegrationGroup,
	IntegrationItem,
	IntegrationsData,
} from "@hospio/api/data/admin-types";
import { Note } from "@hospio/ui/shared/detail-list";
import { ToggleField, TextField } from "@hospio/ui/shared/field";
import { fmtDate, fmtWhen } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { useRefresh } from "./live";

/**
 * Platform → Integrations (Super admin): the keys Hospio360 uses with each provider, kept encrypted by platform-service. A
 * provider with nothing saved here runs on the server's own setting; a save sends only the fields that changed, and "Use the
 * server's value" clears a saved one. The services read changes within a minute.
 *
 * Compact layout (19 Nov 2026): each provider is a short summary card (name, status, last change, Test connection, Edit) whose
 * fields open on Edit; rarely changed fields (addresses, webhook keys) and the "Use the server's value" links sit under
 * "Advanced". From 1280px the groups run in two columns, split so each column holds about as many cards, in reading order.
 */

const GROUPS: { key: IntegrationGroup; title: string; subtitle: string }[] = [
	{ key: "EMAIL", title: "Email", subtitle: "Sign-in codes, invites, invoices and guest booking emails" },
	{ key: "MESSAGING", title: "Messaging", subtitle: "WhatsApp to guests and SMS sign-in codes" },
	{
		key: "PAYMENTS",
		title: "Payments",
		subtitle: "Paystack: owners pay their monthly Hospio360 invoice online (card, transfer or USSD)",
	},
	{ key: "POS", title: "POS", subtitle: "Card terminals for guest payments; each location's own keys are set on the location" },
];

/** Fields most people never change: shown under "Advanced" (unless they are all the card has). */
const ADVANCED_KEYS = new Set(["baseUrl", "notifyUrl", "webhookKey"]);
const isAdvanced = (card: IntegrationCard, f: IntegrationFieldView) =>
	ADVANCED_KEYS.has(f.key) || (card.provider === "TERMII" && f.key === "secretKey");

type Group = (typeof GROUPS)[number] & { cards: IntegrationCard[] };

/** Splits the groups, in order, into two columns holding about as many cards each. */
function twoColumns(groups: Group[]): [Group[], Group[]] {
	const weight = (g: Group) => g.cards.length + 0.5;
	const total = groups.reduce((n, g) => n + weight(g), 0);
	let best = groups.length;
	let bestGap = Number.POSITIVE_INFINITY;
	let left = 0;
	for (let i = 0; i <= groups.length; i++) {
		const gap = Math.abs(total - 2 * left);
		if (gap < bestGap) {
			bestGap = gap;
			best = i;
		}
		if (i < groups.length) left += weight(groups[i]);
	}
	return [groups.slice(0, best), groups.slice(best)];
}

function GroupSection({ g }: { g: Group }) {
	return (
		<section className="flex flex-col gap-2">
			<div>
				<h2 className="text-base font-bold text-ink">{g.title}</h2>
				<p className="text-xs text-ink-3">{g.subtitle}</p>
			</div>
			{g.cards.map((c) => (
				<ProviderCard key={c.provider} initial={c} />
			))}
		</section>
	);
}

export function IntegrationsScreen({ data }: { data: IntegrationsData }) {
	const { refresh, pending } = useRefresh();
	const reload = (
		<button
			type="button"
			className={cn(btn.secondary, "flex items-center gap-2")}
			onClick={refresh}
			disabled={pending}
		>
			{pending ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />} Reload
		</button>
	);
	const groups: Group[] = data.ok
		? GROUPS.map((g) => ({ ...g, cards: data.cards.filter((c) => c.group === g.key) })).filter((g) => g.cards.length > 0)
		: [];
	const [left, right] = twoColumns(groups);
	return (
		<>
			<PageHeader
				title="Integrations"
				subtitle="The keys Hospio360 uses to send email and messages and take payments"
			>
				{reload}
			</PageHeader>
			<p className="flex items-start gap-2 rounded-[10px] bg-subtle px-3 py-[10px] text-xs font-medium text-ink-2">
				<LockIcon className="mt-px size-[14px] shrink-0" />
				<span>
					Keys are stored encrypted. Once saved, a secret is only ever shown masked: paste a new one to replace it. Services
					pick up a change within a minute. A provider with nothing saved here keeps using the server's own setting.
				</span>
			</p>
			{!data.ok ? (
				<SectionCard title="Integrations can't load" subtitle="Nothing has changed. Your saved keys are safe.">
					<div className="flex flex-col items-start gap-3">
						<Note tone="danger">{data.error}</Note>
						<p className="text-[13px] text-ink-2">Try again in a moment.</p>
						{reload}
					</div>
				</SectionCard>
			) : null}
			{data.ok && data.cards.length === 0 && (
				<Note tone="info">No providers were returned, so every provider uses the server's setting.</Note>
			)}
			{groups.length > 0 && (
				<div className="grid items-start gap-5 xl:grid-cols-2">
					{[left, right].map((col, i) =>
						col.length === 0 ? null : (
							<div key={i === 0 ? "left" : "right"} className="flex min-w-0 flex-col gap-5">
								{col.map((g) => (
									<GroupSection key={g.key} g={g} />
								))}
							</div>
						),
					)}
				</div>
			)}
			{data.status.length > 0 && <IntegrationStatusList items={data.status} />}
		</>
	);
}

/** True when the edit differs from what is saved (an empty secret box means "keep it"). */
function changed(f: IntegrationFieldView, edit: string | undefined) {
	if (edit === undefined) return false;
	if (f.type === "SECRET") return edit.trim() !== "";
	if (f.type === "BOOLEAN") return edit !== (f.value === "true" ? "true" : "false");
	// An emptied box is not a change: "Use the server's value" is how a saved value is cleared.
	return edit.trim() !== "" && edit.trim() !== (f.value ?? "");
}

function fieldError(f: IntegrationFieldView, edit: string | undefined) {
	if (!changed(f, edit) || !edit) return undefined;
	const v = edit.trim();
	if (f.type === "URL" && !/^https?:\/\/\S+$/i.test(v)) return "Start with https://";
	if (f.type === "NUMBER" && Number.isNaN(Number(v))) return "A number, please";
	return undefined;
}

function ProviderCard({ initial }: { initial: IntegrationCard }) {
	const [card, setCard] = useState(initial);
	const [open, setOpen] = useState(false);
	const [advanced, setAdvanced] = useState(false);
	const [edits, setEdits] = useState<Record<string, string>>({});
	const [clear, setClear] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const [testing, setTesting] = useState(false);
	const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
	const anySaved = card.fields.some((f) => f.saved);
	const fields = Object.fromEntries(
		card.fields.filter((f) => !clear.includes(f.key) && changed(f, edits[f.key])).map((f) => [f.key, edits[f.key].trim()]),
	);
	const dirty = Object.keys(fields).length > 0 || clear.length > 0;
	const invalid = card.fields.some((f) => fieldError(f, edits[f.key]));
	const set = (key: string, v: string) => setEdits((e) => ({ ...e, [key]: v }));
	const toggleClear = (key: string) => setClear((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
	const allAdvanced = card.fields.every((f) => isAdvanced(card, f));
	const main = allAdvanced ? card.fields : card.fields.filter((f) => !isAdvanced(card, f));
	const extra = allAdvanced ? [] : card.fields.filter((f) => isAdvanced(card, f));
	// "Use the server's value" for the main fields lives under Advanced too, so the main form stays short.
	const savedMain = main.filter((f) => f.saved);
	const advancedCount = extra.length + savedMain.length;

	const save = async () => {
		setSaving(true);
		const r = await saveIntegration(card.provider, fields, clear, card);
		setSaving(false);
		if (!r.ok) {
			toast.error(r.error);
			return;
		}
		setCard(r.data);
		setEdits({});
		setClear([]);
		setTest(null);
		toast.success(`${card.label} saved. Services use it within a minute.`);
	};
	const runTest = async () => {
		setTesting(true);
		const r = await testIntegration(card.provider);
		setTesting(false);
		setTest(r.ok ? r.data : { ok: false, message: r.error });
	};

	const serverLink = (f: IntegrationFieldView) =>
		f.saved ? (
			<button type="button" className={cn(btn.link, "self-start text-xs")} onClick={() => toggleClear(f.key)}>
				{clear.includes(f.key) ? "Keep the saved value" : "Use the server's value"}
			</button>
		) : null;

	const renderField = (f: IntegrationFieldView, withLink: boolean) => {
		if (clear.includes(f.key))
			return (
				<div key={f.key} className="flex flex-col gap-1 rounded-[10px] border border-dashed border-line px-3 py-2">
					<span className="text-[13px] font-medium text-ink">{f.label}</span>
					<span className="text-xs text-ink-3">Goes back to the server's value when you save.</span>
					{serverLink(f)}
				</div>
			);
		const link = withLink ? serverLink(f) : null;
		if (f.type === "BOOLEAN")
			return (
				<div key={f.key} className="flex flex-col gap-1">
					<ToggleField
						label={f.label}
						hint={f.hint ?? undefined}
						checked={(edits[f.key] ?? (f.value === "true" ? "true" : "false")) === "true"}
						onChange={(v) => set(f.key, v ? "true" : "false")}
					/>
					{link}
				</div>
			);
		if (f.type === "SECRET")
			return (
				<div key={f.key} className="flex flex-col gap-1">
					<TextField
						label={f.saved ? `${f.label} · replace` : f.label}
						type="password"
						value={edits[f.key] ?? ""}
						onChange={(v) => set(f.key, v)}
						placeholder={f.saved ? `Saved ${f.value ?? "••••"} · paste a new one to replace it` : "Empty · paste to save"}
						hint={f.hint ?? undefined}
					/>
					{link}
				</div>
			);
		return (
			<div key={f.key} className="flex flex-col gap-1">
				<TextField
					label={f.label}
					type={f.type === "NUMBER" ? "number" : f.type === "URL" ? "url" : "text"}
					value={edits[f.key] ?? f.value ?? ""}
					onChange={(v) => set(f.key, v)}
					placeholder={f.saved ? undefined : "Empty"}
					hint={f.hint ?? undefined}
					error={fieldError(f, edits[f.key])}
				/>
				{link}
			</div>
		);
	};

	const testButton = card.testable && (
		<button
			type="button"
			className={cn(btn.secondary, btn.small, "flex items-center gap-2")}
			onClick={runTest}
			disabled={testing || saving}
			title={dirty ? "Tests what is saved now; save first to test your changes" : undefined}
		>
			{testing ? <Loader2Icon className="size-4 animate-spin" /> : <PlugZapIcon className="size-4" />} Test connection
		</button>
	);

	return (
		<article className="flex flex-col rounded-card border border-line bg-card px-4 py-3" aria-label={card.label}>
			<header className="flex flex-wrap items-center gap-x-3 gap-y-2">
				<div className="min-w-[180px] flex-1">
					<h3 className="text-[15px] font-bold text-ink">{card.label}</h3>
					<p className="text-xs text-ink-3">
						{card.updatedAt
							? `Changed ${fmtWhen(card.updatedAt)}${card.updatedByName ? ` by ${card.updatedByName}` : ""}`
							: "Never changed in the portal"}
					</p>
				</div>
				<div className="ml-auto flex flex-wrap items-center justify-end gap-2">
					{anySaved ? (
						<StatusPill tone="success">Saved in the portal</StatusPill>
					) : (
						<StatusPill tone="grey">Using the server's setting</StatusPill>
					)}
					{!open && testButton}
					<button
						type="button"
						className={cn(btn.secondary, btn.small, "flex items-center gap-2")}
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
					>
						{open ? <ChevronUpIcon className="size-4" /> : <PencilIcon className="size-4" />} {open ? "Close" : "Edit"}
					</button>
				</div>
			</header>
			{open && (
				<div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
					{main.map((f) => renderField(f, allAdvanced))}
					{advancedCount > 0 && (
						<div className="rounded-[10px] border border-line">
							<button
								type="button"
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-ink-2 hover:text-ink"
								onClick={() => setAdvanced((v) => !v)}
								aria-expanded={advanced}
							>
								{advanced ? <ChevronUpIcon className="size-4 shrink-0" /> : <ChevronDownIcon className="size-4 shrink-0" />}
								Advanced
								<span className="min-w-0 truncate font-normal text-ink-3">
									{extra.length > 0 ? extra.map((f) => f.label.toLowerCase()).join(", ") : "use the server's value"}
								</span>
							</button>
							{advanced && (
								<div className="flex flex-col gap-3 border-t border-line px-3 py-3">
									{extra.map((f) => renderField(f, true))}
									{savedMain.length > 0 && (
										<div className="flex flex-col gap-1">
											<p className="text-xs text-ink-3">Go back to the server's own setting for a saved field:</p>
											{savedMain.map((f) => (
												<div key={f.key} className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink">
													<span>{f.label}</span>
													{serverLink(f)}
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					)}
					{card.provider === "BREVO" && <SendTestEmail />}
				</div>
			)}
			{test && (
				<p
					className={cn(
						"mt-3 flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-medium",
						test.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
					)}
				>
					{test.ok ? <CheckCircle2Icon className="size-4 shrink-0" /> : <XCircleIcon className="size-4 shrink-0" />}{" "}
					{test.message}
				</p>
			)}
			{(open || dirty) && (
				<div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
					{dirty && <span className="mr-auto text-xs text-ink-3">Unsaved changes</span>}
					{open && testButton}
					{dirty && (
						<button
							type="button"
							className={cn(btn.secondary, btn.small)}
							onClick={() => {
								setEdits({});
								setClear([]);
							}}
							disabled={saving}
						>
							Discard
						</button>
					)}
					<button
						type="button"
						className={cn(btn.primary, btn.small)}
						onClick={save}
						disabled={!dirty || invalid || saving}
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>
			)}
		</article>
	);
}

/** Reserved test domains never receive mail; the server refuses them too (docs/email.md, "Test addresses are never sent"). */
const TEST_DOMAIN = /@(?:[^@\s]+\.)?(?:[^@\s.]+\.(?:test|example|invalid|localhost|local)|example\.(?:com|org|net)|localhost)\.?$/i;

/**
 * Brevo card → Send a test email: one short real email ("Hospio360 test email — delivery tracking check"), recorded like any
 * delivery, so Brevo's delivered/opened report shows in Connection checks → Email a minute later. At most one a minute.
 */
function SendTestEmail() {
	const [to, setTo] = useState("");
	const [sending, setSending] = useState(false);
	const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
	const value = to.trim();
	const error =
		value === ""
			? undefined
			: !/^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$/.test(value)
				? "An address like name@yourdomain.com"
				: TEST_DOMAIN.test(value)
					? "A test address (.test, .example, example.com…) can never receive email"
					: undefined;
	const send = async () => {
		setSending(true);
		setResult(null);
		try {
			const r = await sendTestEmail(value);
			const answer = r.ok ? r.data : { ok: false, message: r.error };
			setResult(answer);
			if (answer.ok) setTo("");
		} catch {
			setResult({ ok: false, message: "The test email could not be sent. Try again in a minute." });
		} finally {
			setSending(false);
		}
	};
	return (
		<div className="flex flex-col gap-3 rounded-[10px] border border-line px-3 py-3">
			<div>
				<p className="text-[13px] font-semibold text-ink">Send a test email</p>
				<p className="text-xs text-ink-3">
					Sends one short email to a real inbox you can open, recorded like any other. Its delivery shows in Connection
					checks → Email about a minute later. One a minute at most.
				</p>
			</div>
			<div className="flex flex-wrap items-end gap-2">
				<TextField
					className="min-w-[220px] flex-1"
					label="Send to"
					type="email"
					value={to}
					onChange={setTo}
					placeholder="name@yourdomain.com"
					error={error}
				/>
				<button
					type="button"
					className={cn(btn.secondary, "flex items-center gap-2")}
					onClick={send}
					disabled={sending || value === "" || !!error}
				>
					{sending ? <Loader2Icon className="size-4 animate-spin" /> : <MailIcon className="size-4" />}
					{sending ? "Sending…" : "Send a test email"}
				</button>
			</div>
			{result && (
				<p
					className={cn(
						"flex items-center gap-2 rounded-[10px] px-3 py-[10px] text-xs font-medium",
						result.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
					)}
				>
					{result.ok ? <CheckCircle2Icon className="size-4 shrink-0" /> : <XCircleIcon className="size-4 shrink-0" />}{" "}
					{result.message}
				</p>
			)}
		</div>
	);
}

const STATUS_TONE: Record<IntegrationItem["status"], "success" | "danger" | "info" | "grey"> = {
	CONNECTED: "success",
	ERROR: "danger",
	TEST_MODE: "info",
	NOT_CONFIGURED: "grey",
	DISCONNECTED: "grey",
};

/**
 * Connection checks (database, Kafka, POS provider, WhatsApp, email, SMS): each row is checked by the service that owns it, when
 * the page opens and again on "Run checks again". Nothing is sent or charged by a check; any platform role can run them.
 */
export function IntegrationStatusList({ items: initial }: { items: IntegrationItem[] }) {
	const [items, setItems] = useState(initial);
	const [running, setRunning] = useState(false);
	const run = async () => {
		setRunning(true);
		try {
			const r = await runConnectionChecks();
			if (r.ok) setItems(r.data);
			else toast.error(r.error);
		} catch {
			toast.error("The checks couldn't be run. Try again in a moment.");
		} finally {
			setRunning(false);
		}
	};
	return (
		<SectionCard
			title="Connection checks"
			subtitle="Each service checks its own connection live. Nothing is sent or charged."
			flush
			headerRight={
				<button
					type="button"
					className={cn(btn.secondary, "flex items-center gap-2")}
					onClick={run}
					disabled={running}
					aria-busy={running}
				>
					{running ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
					{running ? "Checking…" : "Run checks again"}
				</button>
			}
		>
			{items.map((i) => (
				<div key={i.key} className={cn("flex items-center gap-3 border-t border-line px-5 py-3", running && "opacity-60")}>
					{i.status === "CONNECTED" ? (
						<CheckCircle2Icon className="size-4 shrink-0 text-success" />
					) : i.status === "TEST_MODE" ? (
						<FlaskConicalIcon className="size-4 shrink-0 text-info" />
					) : (
						<XCircleIcon className={cn("size-4 shrink-0", i.status === "ERROR" ? "text-danger" : "text-ink-3")} />
					)}
					<div className="min-w-0 flex-1">
						<p className="text-[13px] font-semibold text-ink">
							{i.name} <span className="font-normal text-ink-3">· {i.kind}</span>
						</p>
						<p className="text-xs text-ink-3">
							{i.detail || "—"}
							{i.lastCheck ? ` · checked ${fmtDate(i.lastCheck, "d MMM, h:mm:ssaaa")}` : ""}
							{i.checkedBy ? ` by ${i.checkedBy}` : ""}
						</p>
					</div>
					<StatusPill tone={STATUS_TONE[i.status]}>
						{i.status === "TEST_MODE" ? "test mode" : i.status.toLowerCase().replace(/_/g, " ")}
					</StatusPill>
				</div>
			))}
		</SectionCard>
	);
}
