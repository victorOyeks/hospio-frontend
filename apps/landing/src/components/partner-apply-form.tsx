"use client";

import { CheckIcon, CircleAlertIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import {
	type FormEvent,
	type ReactNode,
	useId,
	useRef,
	useState,
	useTransition,
} from "react";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { btnLg } from "@/components/site";
import { submitPartnerApplication } from "@/partners/actions";
import {
	BUSINESS_COUNTS,
	BUSINESS_KINDS,
	type FieldErrors,
	fieldErrors,
	NOTE_MAX,
	PartnerApplication,
	type PartnerField,
	RECEIVED_MESSAGE,
	STATES,
} from "@/partners/schema";

/** 16px text on phones so iOS doesn't zoom into the field; the kit's 14px from the small breakpoint up. */
const field = cn(inputCls, "text-base sm:text-sm");
const ORDER: PartnerField[] = [
	"fullName",
	"email",
	"phone",
	"city",
	"state",
	"businessKinds",
	"businessCount",
	"networkNote",
	"companyName",
	"acceptedTerms",
];

function Labelled({
	id,
	label,
	optional,
	error,
	hint,
	children,
	className,
}: {
	id: string;
	label: string;
	optional?: boolean;
	error?: string;
	hint?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex min-w-0 flex-col gap-[6px]", className)}>
			<label htmlFor={id} className="text-[13px] font-medium text-ink-2">
				{label}
				{optional && <span className="font-normal text-ink-3"> (optional)</span>}
			</label>
			{children}
			{error ? (
				<p id={`${id}-error`} className="text-xs text-status-bad">
					{error}
				</p>
			) : hint ? (
				<p className="text-xs text-ink-3">{hint}</p>
			) : null}
		</div>
	);
}

/**
 * The "Apply to be a partner" form. Checked in the browser as you go and again on the server; sent through this site's own
 * server action, never straight to the API. The `website` box is hidden from people: only a script fills it.
 */
export function PartnerApplyForm() {
	const uid = useId();
	const id = (f: string) => `${uid}-${f}`;
	const formRef = useRef<HTMLFormElement>(null);
	const [pending, start] = useTransition();
	const [done, setDone] = useState<string | null>(null);
	const [banner, setBanner] = useState<string | null>(null);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [kinds, setKinds] = useState<string[]>([]);
	const [count, setCount] = useState("");
	const [note, setNote] = useState("");
	const [company, setCompany] = useState("");
	const [accepted, setAccepted] = useState(false);
	const [website, setWebsite] = useState("");

	const clear = (f: PartnerField) =>
		setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e));

	const showErrors = (fields: FieldErrors) => {
		setErrors(fields);
		const first = ORDER.find((f) => fields[f]);
		if (first)
			requestAnimationFrame(() => {
				const el = formRef.current?.querySelector<HTMLElement>(
					`[data-field="${first}"]`,
				);
				el?.scrollIntoView({ block: "center", behavior: "smooth" });
				el?.focus({ preventScroll: true });
			});
	};

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (pending) return;
		const values = {
			fullName,
			email,
			phone,
			city,
			state,
			businessKinds: kinds,
			businessCount: count,
			networkNote: note || undefined,
			companyName: company || undefined,
			acceptedTerms: accepted,
			website: website || undefined,
		};
		const checked = PartnerApplication.safeParse(values);
		if (!checked.success) {
			setBanner("Please check the highlighted fields.");
			showErrors(fieldErrors(checked.error));
			return;
		}
		setBanner(null);
		setErrors({});
		start(async () => {
			const r = await submitPartnerApplication(values);
			if (r.ok) {
				setDone(r.message || RECEIVED_MESSAGE);
				window.scrollTo({ top: 0, behavior: "smooth" });
				return;
			}
			setBanner(r.error);
			if (r.fields) showErrors(r.fields);
		});
	};

	if (done)
		return (
			<div
				aria-live="polite"
				className="flex flex-col items-center gap-5 rounded-[16px] border border-line bg-card px-6 py-12 text-center md:px-10 md:py-16"
			>
				<span className="flex size-14 items-center justify-center rounded-full bg-status-ok-soft text-status-ok">
					<CheckIcon className="size-7" strokeWidth={3} />
				</span>
				<h2 className="text-[26px] font-bold leading-[1.15] tracking-[-0.01em] text-ink md:text-[30px]">
					Application received
				</h2>
				<p className="max-w-[460px] text-[17px] leading-[1.55] text-ink-2">
					{done}
				</p>
				<p className="max-w-[460px] text-sm leading-[1.55] text-ink-3">
					We’ve sent a confirmation to your email. If we approve your
					application, a second email brings a link to set up your partner
					login.
				</p>
				<Link href="/" className={cn(btn.primary, btnLg, "mt-2 inline-flex")}>
					Back to the home page
				</Link>
			</div>
		);

	const invalid = (f: PartnerField) =>
		errors[f]
			? { "aria-invalid": true as const, "aria-describedby": `${id(f)}-error` }
			: {};

	return (
		<form
			ref={formRef}
			onSubmit={onSubmit}
			noValidate
			className="flex flex-col gap-6 rounded-[16px] border border-line bg-card p-5 sm:p-6 md:p-8"
		>
			<div className="flex flex-col gap-1">
				<h2 className="text-[22px] font-bold text-ink">Your details</h2>
				<p className="text-sm text-ink-2">
					It takes about two minutes. We reply by email within 2 working days.
				</p>
			</div>

			{banner && (
				<div
					role="alert"
					className="flex items-start gap-[10px] rounded-control bg-status-bad-soft px-4 py-3 text-sm text-status-bad"
				>
					<CircleAlertIcon className="mt-[2px] size-4 shrink-0" />
					<span className="min-w-0 break-words">{banner}</span>
				</div>
			)}

			<Labelled id={id("fullName")} label="Full name" error={errors.fullName}>
				<input
					id={id("fullName")}
					data-field="fullName"
					name="fullName"
					autoComplete="name"
					maxLength={150}
					value={fullName}
					onChange={(e) => {
						setFullName(e.target.value);
						clear("fullName");
					}}
					className={cn(field, errors.fullName && "border-status-bad")}
					{...invalid("fullName")}
				/>
			</Labelled>

			<div className="grid gap-6 sm:grid-cols-2">
				<Labelled id={id("email")} label="Email" error={errors.email}>
					<input
						id={id("email")}
						data-field="email"
						name="email"
						type="email"
						inputMode="email"
						autoComplete="email"
						autoCapitalize="none"
						spellCheck={false}
						maxLength={255}
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							clear("email");
						}}
						className={cn(field, errors.email && "border-status-bad")}
						{...invalid("email")}
					/>
				</Labelled>
				<Labelled
					id={id("phone")}
					label="Phone"
					error={errors.phone}
					hint="A Nigerian number, e.g. 0803 555 0192"
				>
					<input
						id={id("phone")}
						data-field="phone"
						name="phone"
						type="tel"
						inputMode="tel"
						autoComplete="tel"
						maxLength={20}
						value={phone}
						onChange={(e) => {
							setPhone(e.target.value);
							clear("phone");
						}}
						className={cn(field, errors.phone && "border-status-bad")}
						{...invalid("phone")}
					/>
				</Labelled>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<Labelled id={id("city")} label="City" error={errors.city}>
					<input
						id={id("city")}
						data-field="city"
						name="city"
						autoComplete="address-level2"
						maxLength={100}
						value={city}
						onChange={(e) => {
							setCity(e.target.value);
							clear("city");
						}}
						className={cn(field, errors.city && "border-status-bad")}
						{...invalid("city")}
					/>
				</Labelled>
				<Labelled id={id("state")} label="State" error={errors.state}>
					<select
						id={id("state")}
						data-field="state"
						name="state"
						autoComplete="address-level1"
						value={state}
						onChange={(e) => {
							setState(e.target.value);
							clear("state");
						}}
						className={cn(
							field,
							"appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10",
							!state && "text-ink-3",
							errors.state && "border-status-bad",
						)}
						style={{
							backgroundImage:
								"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
						}}
						{...invalid("state")}
					>
						<option value="">Choose…</option>
						{STATES.map((s) => (
							<option key={s} value={s}>
								{s === "FCT" ? "FCT (Abuja)" : s}
							</option>
						))}
					</select>
				</Labelled>
			</div>

			<fieldset
				className="flex min-w-0 flex-col gap-[10px]"
				{...(errors.businessKinds
					? { "aria-describedby": `${id("businessKinds")}-error` }
					: {})}
			>
				<legend className="mb-[10px] text-[13px] font-medium text-ink-2">
					Which kinds of businesses do you know?{" "}
					<span className="font-normal text-ink-3">Tick all that apply</span>
				</legend>
				<div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
					{BUSINESS_KINDS.map((k, i) => {
						const on = kinds.includes(k.value);
						return (
							<label
								key={k.value}
								className={cn(
									"flex cursor-pointer items-center gap-[10px] rounded-control border px-3 py-[11px] text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
									on
										? "border-brand bg-brand-soft text-brand"
										: "border-line bg-card text-ink hover:bg-subtle",
								)}
							>
								<input
									type="checkbox"
									name="businessKinds"
									value={k.value}
									checked={on}
									data-field={i === 0 ? "businessKinds" : undefined}
									onChange={() => {
										setKinds((all) =>
											on ? all.filter((x) => x !== k.value) : [...all, k.value],
										);
										clear("businessKinds");
									}}
									className="size-4 shrink-0 accent-brand"
								/>
								{k.label}
							</label>
						);
					})}
				</div>
				{errors.businessKinds && (
					<p
						id={`${id("businessKinds")}-error`}
						className="text-xs text-status-bad"
					>
						{errors.businessKinds}
					</p>
				)}
			</fieldset>

			<fieldset
				className="flex min-w-0 flex-col gap-[10px]"
				{...(errors.businessCount
					? { "aria-describedby": `${id("businessCount")}-error` }
					: {})}
			>
				<legend className="mb-[10px] text-[13px] font-medium text-ink-2">
					Roughly how many?
				</legend>
				<div className="grid grid-cols-4 gap-[10px]">
					{BUSINESS_COUNTS.map((c, i) => {
						const on = count === c.value;
						return (
							<label
								key={c.value}
								className={cn(
									"flex cursor-pointer items-center justify-center rounded-control border px-2 py-[11px] text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
									on
										? "border-brand bg-brand text-white"
										: "border-line bg-card text-ink hover:bg-subtle",
								)}
							>
								<input
									type="radio"
									name="businessCount"
									value={c.value}
									checked={on}
									data-field={i === 0 ? "businessCount" : undefined}
									onChange={() => {
										setCount(c.value);
										clear("businessCount");
									}}
									className="sr-only"
								/>
								{c.label}
							</label>
						);
					})}
				</div>
				{errors.businessCount && (
					<p
						id={`${id("businessCount")}-error`}
						className="text-xs text-status-bad"
					>
						{errors.businessCount}
					</p>
				)}
			</fieldset>

			<Labelled
				id={id("networkNote")}
				label="Tell us about your network"
				optional
				error={errors.networkNote}
				hint={`${note.length}/${NOTE_MAX} · e.g. how you know these owners, or the area you cover`}
			>
				<textarea
					id={id("networkNote")}
					data-field="networkNote"
					name="networkNote"
					rows={4}
					maxLength={NOTE_MAX}
					value={note}
					onChange={(e) => {
						setNote(e.target.value.slice(0, NOTE_MAX));
						clear("networkNote");
					}}
					className={cn(
						field,
						"min-h-[104px] resize-y",
						errors.networkNote && "border-status-bad",
					)}
					{...invalid("networkNote")}
				/>
			</Labelled>

			<Labelled
				id={id("companyName")}
				label="Company name"
				optional
				error={errors.companyName}
			>
				<input
					id={id("companyName")}
					data-field="companyName"
					name="companyName"
					autoComplete="organization"
					maxLength={150}
					value={company}
					onChange={(e) => {
						setCompany(e.target.value);
						clear("companyName");
					}}
					className={cn(field, errors.companyName && "border-status-bad")}
					{...invalid("companyName")}
				/>
			</Labelled>

			{/* Not for people: off screen, out of the tab order and hidden from screen readers. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
			>
				<label htmlFor={id("website")}>Leave this box empty</label>
				<input
					id={id("website")}
					name="website"
					type="text"
					tabIndex={-1}
					autoComplete="off"
					value={website}
					onChange={(e) => setWebsite(e.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-[6px]">
				<label
					className={cn(
						"flex cursor-pointer items-start gap-3 rounded-control border px-4 py-3 text-sm leading-[1.5] text-ink",
						errors.acceptedTerms ? "border-status-bad" : "border-line",
					)}
				>
					<input
						type="checkbox"
						name="acceptedTerms"
						data-field="acceptedTerms"
						checked={accepted}
						onChange={(e) => {
							setAccepted(e.target.checked);
							clear("acceptedTerms");
						}}
						className="mt-[3px] size-4 shrink-0 accent-brand"
						{...invalid("acceptedTerms")}
					/>
					<span className="min-w-0">
						I have read the{" "}
						<Link
							href="/legal/referral-partners"
							target="_blank"
							className="font-semibold text-brand underline underline-offset-2"
						>
							Referral partner terms
						</Link>{" "}
						and the{" "}
						<Link
							href="/legal/privacy"
							target="_blank"
							className="font-semibold text-brand underline underline-offset-2"
						>
							Privacy Policy
						</Link>
						.
					</span>
				</label>
				{errors.acceptedTerms && (
					<p
						id={`${id("acceptedTerms")}-error`}
						className="text-xs text-status-bad"
					>
						{errors.acceptedTerms}
					</p>
				)}
			</div>

			<button
				type="submit"
				disabled={pending}
				className={cn(
					btn.primary,
					btnLg,
					"inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:self-start",
				)}
			>
				{pending && <Loader2Icon className="size-4 animate-spin" />}
				{pending ? "Sending…" : "Send my application"}
			</button>
		</form>
	);
}
