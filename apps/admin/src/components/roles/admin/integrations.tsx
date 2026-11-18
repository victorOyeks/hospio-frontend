"use client";

import {
	CheckCircle2Icon,
	FlaskConicalIcon,
	Loader2Icon,
	LockIcon,
	MailIcon,
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
 */

const GROUPS: { key: IntegrationGroup; title: string; subtitle: string }[] = [
	{ key: "EMAIL", title: "Email", subtitle: "Sign-in codes, invites, statements and guest booking emails" },
	{ key: "MESSAGING", title: "Messaging", subtitle: "WhatsApp to guests and SMS phone checks" },
	{ key: "PAYMENTS", title: "Payments", subtitle: "Online payments, such as guest-message invoices" },
	{ key: "POS", title: "POS", subtitle: "The server's POS setting, used by hotels without their own keys" },
	{ key: "FEE_DEBIT", title: "Fee debit", subtitle: "How Hospio's daily fee is debited from hotels" },
];

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
	return (
		<>
			<PageHeader
				title="Integrations"
				subtitle="The keys Hospio360 uses to send email and messages, take payments and debit the daily fee"
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
			{data.ok && (
				<>
					{data.cards.length === 0 && (
						<Note tone="info">No providers were returned, so every provider uses the server's setting.</Note>
					)}
					{GROUPS.map((g) => {
						const cards = data.cards.filter((c) => c.group === g.key);
						if (cards.length === 0) return null;
						return (
							<section key={g.key} className="flex flex-col gap-3">
								<div>
									<h2 className="text-lg font-bold text-ink">{g.title}</h2>
									<p className="text-xs text-ink-3">{g.subtitle}</p>
								</div>
								<div className="grid gap-4 xl:grid-cols-2">
									{cards.map((c) => (
										<ProviderCard key={c.provider} initial={c} />
									))}
								</div>
							</section>
						);
					})}
				</>
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

	return (
		<SectionCard
			title={card.label}
			subtitle={
				card.updatedAt
					? `Changed ${fmtWhen(card.updatedAt)}${card.updatedByName ? ` by ${card.updatedByName}` : ""}`
					: "Never changed in the portal"
			}
			headerRight={
				anySaved ? (
					<StatusPill tone="success">Saved in the portal</StatusPill>
				) : (
					<StatusPill tone="grey">Using the server's setting</StatusPill>
				)
			}
			bodyClassName="gap-4 pt-2"
		>
			{card.fields.map((f) => {
				const clearing = clear.includes(f.key);
				const serverLink = f.saved ? (
					<button type="button" className={cn(btn.link, "text-xs")} onClick={() => toggleClear(f.key)}>
						{clearing ? "Keep the saved value" : "Use the server's value"}
					</button>
				) : null;
				if (clearing)
					return (
						<div key={f.key} className="flex flex-col gap-1 rounded-[10px] border border-dashed border-line px-3 py-2">
							<span className="text-[13px] font-medium text-ink">{f.label}</span>
							<span className="text-xs text-ink-3">Goes back to the server's value when you save.</span>
							{serverLink}
						</div>
					);
				if (f.type === "BOOLEAN")
					return (
						<div key={f.key} className="flex flex-col gap-1">
							<ToggleField
								label={f.label}
								hint={f.hint ?? undefined}
								checked={(edits[f.key] ?? (f.value === "true" ? "true" : "false")) === "true"}
								onChange={(v) => set(f.key, v ? "true" : "false")}
							/>
							{serverLink}
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
							{serverLink}
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
						{serverLink}
					</div>
				);
			})}
			{test && (
				<p
					className={cn(
						"flex items-center gap-2 rounded-[10px] px-3 py-[10px] text-xs font-medium",
						test.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
					)}
				>
					{test.ok ? <CheckCircle2Icon className="size-4" /> : <XCircleIcon className="size-4" />} {test.message}
				</p>
			)}
			{card.provider === "BREVO" && <SendTestEmail />}
			<div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
				{dirty && <span className="mr-auto text-xs text-ink-3">Unsaved changes</span>}
				{card.testable && (
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={runTest}
						disabled={testing || saving}
						title={dirty ? "Tests what is saved now; save first to test your changes" : undefined}
					>
						{testing ? <Loader2Icon className="size-4 animate-spin" /> : <PlugZapIcon className="size-4" />} Test connection
					</button>
				)}
				{dirty && (
					<button
						type="button"
						className={btn.secondary}
						onClick={() => {
							setEdits({});
							setClear([]);
						}}
						disabled={saving}
					>
						Discard
					</button>
				)}
				<button type="button" className={btn.primary} onClick={save} disabled={!dirty || invalid || saving}>
					{saving ? "Saving…" : "Save"}
				</button>
			</div>
		</SectionCard>
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
