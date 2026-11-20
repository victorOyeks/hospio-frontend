"use client";

import { CheckIcon, CircleAlertIcon, Loader2Icon, UserCheckIcon } from "lucide-react";
import Link from "next/link";
import {
	type FormEvent,
	type InputHTMLAttributes,
	type ReactNode,
	useId,
	useRef,
	useState,
	useTransition,
} from "react";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { btnLg } from "@/components/site";
import { submitDemoRequest } from "@/demo-request/actions";
import {
	BUSINESS_TYPES,
	CALL_TIMES,
	type DemoField,
	DemoRequest,
	type FieldErrors,
	fieldErrors,
	HEARD_FROM,
	MAX_ROOMS,
	MESSAGE_MAX,
	MONTHLY_SALES,
	RECEIVED_MESSAGE,
	STATES,
	WITH_ROOMS,
} from "@/demo-request/schema";

/** 16px text on small screens so iOS doesn't zoom into the field; the kit's 14px from the small breakpoint up. */
const field = cn(inputCls, "text-base sm:text-sm");
const ORDER: DemoField[] = [
	"ownerName",
	"phone",
	"email",
	"businessName",
	"businessType",
	"city",
	"state",
	"rooms",
	"monthlySales",
	"heardFrom",
	"preferredTime",
	"message",
];
const chevron = {
	backgroundImage:
		"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};
const selectCls =
	"appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10";

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
 * The "Book a demo" form (hospio-backend docs/onboarding.md, "Applications"). Checked in the browser as you go and again on the
 * server; sent through this site's own server action, never straight to the API. The `website` box is hidden from people: only a
 * script fills it. A marketer's code from the link (?ref=) goes with the request so the referral is recorded.
 */
export function BookDemoForm({ referralCode }: { referralCode?: string }) {
	const uid = useId();
	const id = (f: string) => `${uid}-${f}`;
	const formRef = useRef<HTMLFormElement>(null);
	const [pending, start] = useTransition();
	const [done, setDone] = useState<string | null>(null);
	const [banner, setBanner] = useState<string | null>(null);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [ownerName, setOwnerName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [businessName, setBusinessName] = useState("");
	const [type, setType] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [rooms, setRooms] = useState("");
	const [sales, setSales] = useState("");
	const [heard, setHeard] = useState(referralCode ? "MARKETER" : "");
	const [time, setTime] = useState("");
	const [message, setMessage] = useState("");
	const [website, setWebsite] = useState("");
	const hasRooms = WITH_ROOMS.includes(type);

	const clear = (f: DemoField) =>
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
		const roomsNumber = rooms.trim() === "" ? undefined : Number(rooms);
		const values = {
			ownerName,
			phone,
			email,
			businessName,
			businessType: type,
			city,
			state,
			rooms: hasRooms ? roomsNumber : undefined,
			monthlySales: sales,
			heardFrom: heard,
			preferredTime: time || undefined,
			message: message || undefined,
			referralCode,
			website: website || undefined,
		};
		const checked = DemoRequest.safeParse(values);
		if (!checked.success) {
			setBanner("Please check the highlighted fields.");
			showErrors(fieldErrors(checked.error));
			return;
		}
		setBanner(null);
		setErrors({});
		start(async () => {
			const r = await submitDemoRequest(values);
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
					Request received
				</h2>
				<p className="max-w-[460px] text-[17px] leading-[1.55] text-ink-2">
					{done}
				</p>
				<p className="max-w-[460px] text-sm leading-[1.55] text-ink-3">
					We’ve sent a confirmation to your email. On the call we show you
					Hospio360, agree what you need and set your business up with you;
					your login comes by email once it is ready.
				</p>
				<Link href="/" className={cn(btn.primary, btnLg, "mt-2 inline-flex")}>
					Back to the home page
				</Link>
			</div>
		);

	const invalid = (f: DemoField) =>
		errors[f]
			? { "aria-invalid": true as const, "aria-describedby": `${id(f)}-error` }
			: {};

	const text = (
		f: DemoField,
		value: string,
		set: (v: string) => void,
		props: InputHTMLAttributes<HTMLInputElement> = {},
	) => (
		<input
			id={id(f)}
			data-field={f}
			name={f}
			value={value}
			onChange={(e) => {
				set(e.target.value);
				clear(f);
			}}
			className={cn(field, errors[f] && "border-status-bad")}
			{...props}
			{...invalid(f)}
		/>
	);

	return (
		<form
			ref={formRef}
			onSubmit={onSubmit}
			noValidate
			className="flex flex-col gap-6 rounded-[16px] border border-line bg-card p-5 sm:p-6 md:p-8"
		>
			<div className="flex flex-col gap-1">
				<h2 className="text-[22px] font-bold text-ink">Tell us about your business</h2>
				<p className="text-sm text-ink-2">
					It takes about two minutes. Our team calls you within 1 working day.
				</p>
			</div>

			{referralCode && (
				<p className="flex items-start gap-[10px] rounded-control bg-brand-soft px-4 py-3 text-sm text-brand">
					<UserCheckIcon className="mt-[2px] size-4 shrink-0" />
					<span className="min-w-0">
						Referred by a Hospio360 partner (code{" "}
						<span className="font-semibold">{referralCode}</span>). We’ll let
						them know you got in touch.
					</span>
				</p>
			)}

			{banner && (
				<div
					role="alert"
					className="flex items-start gap-[10px] rounded-control bg-status-bad-soft px-4 py-3 text-sm text-status-bad"
				>
					<CircleAlertIcon className="mt-[2px] size-4 shrink-0" />
					<span className="min-w-0 break-words">{banner}</span>
				</div>
			)}

			<Labelled id={id("ownerName")} label="Your full name" error={errors.ownerName}>
				{text("ownerName", ownerName, setOwnerName, { autoComplete: "name", maxLength: 150 })}
			</Labelled>

			<div className="grid gap-6 sm:grid-cols-2">
				<Labelled
					id={id("phone")}
					label="Phone"
					error={errors.phone}
					hint="A Nigerian number, e.g. 0803 555 0192"
				>
					{text("phone", phone, setPhone, {
						type: "tel",
						inputMode: "tel",
						autoComplete: "tel",
						maxLength: 20,
					})}
				</Labelled>
				<Labelled id={id("email")} label="Email" error={errors.email}>
					{text("email", email, setEmail, {
						type: "email",
						inputMode: "email",
						autoComplete: "email",
						autoCapitalize: "none",
						spellCheck: false,
						maxLength: 255,
					})}
				</Labelled>
			</div>

			<Labelled id={id("businessName")} label="Business name" error={errors.businessName}>
				{text("businessName", businessName, setBusinessName, {
					autoComplete: "organization",
					maxLength: 150,
				})}
			</Labelled>

			<fieldset
				className="flex min-w-0 flex-col gap-[10px]"
				{...(errors.businessType
					? { "aria-describedby": `${id("businessType")}-error` }
					: {})}
			>
				<legend className="mb-[10px] text-[13px] font-medium text-ink-2">
					What kind of business?{" "}
					<span className="font-normal text-ink-3">
						Mixed: a hotel with a lounge, bar or restaurant
					</span>
				</legend>
				<div className="grid grid-cols-2 gap-[10px] sm:grid-cols-5">
					{BUSINESS_TYPES.map((t, i) => {
						const on = type === t.value;
						return (
							<label
								key={t.value}
								className={cn(
									"flex cursor-pointer items-center justify-center rounded-control border px-2 py-[11px] text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
									on
										? "border-brand bg-brand text-white"
										: "border-line bg-card text-ink hover:bg-subtle",
								)}
							>
								<input
									type="radio"
									name="businessType"
									value={t.value}
									checked={on}
									data-field={i === 0 ? "businessType" : undefined}
									onChange={() => {
										setType(t.value);
										clear("businessType");
										clear("rooms");
									}}
									className="sr-only"
								/>
								{t.label}
							</label>
						);
					})}
				</div>
				{errors.businessType && (
					<p id={`${id("businessType")}-error`} className="text-xs text-status-bad">
						{errors.businessType}
					</p>
				)}
			</fieldset>

			<div className="grid gap-6 sm:grid-cols-2">
				<Labelled id={id("city")} label="City" error={errors.city}>
					{text("city", city, setCity, { autoComplete: "address-level2", maxLength: 100 })}
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
							selectCls,
							!state && "text-ink-3",
							errors.state && "border-status-bad",
						)}
						style={chevron}
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

			{hasRooms && (
				<Labelled
					id={id("rooms")}
					label="Number of rooms"
					optional
					error={errors.rooms}
					hint="Roughly is fine"
				>
					{text("rooms", rooms, (v) => setRooms(v.replace(/\D/g, "").slice(0, 4)), {
						type: "text",
						inputMode: "numeric",
						maxLength: 4,
						placeholder: `1 to ${MAX_ROOMS}`,
						className: cn(field, "sm:max-w-[200px]", errors.rooms && "border-status-bad"),
					})}
				</Labelled>
			)}

			<fieldset
				className="flex min-w-0 flex-col gap-[10px]"
				aria-describedby={
					errors.monthlySales ? `${id("monthlySales")}-error` : `${id("monthlySales")}-hint`
				}
			>
				<legend className="mb-[10px] text-[13px] font-medium text-ink-2">Average monthly sales</legend>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{MONTHLY_SALES.filter((m) => m.value !== "PREFER_NOT").map((m, i) => (
						<SalesOption
							key={m.value}
							value={m.value}
							label={m.label}
							on={sales === m.value}
							invalid={Boolean(errors.monthlySales)}
							first={i === 0}
							onPick={() => {
								setSales(m.value);
								clear("monthlySales");
							}}
						/>
					))}
				</div>
				<SalesOption
					value="PREFER_NOT"
					label="Prefer not to say"
					quiet
					on={sales === "PREFER_NOT"}
					invalid={Boolean(errors.monthlySales)}
					onPick={() => {
						setSales("PREFER_NOT");
						clear("monthlySales");
					}}
				/>
				{errors.monthlySales ? (
					<p id={`${id("monthlySales")}-error`} className="text-xs text-status-bad">
						{errors.monthlySales}
					</p>
				) : (
					<p id={`${id("monthlySales")}-hint`} className="text-xs text-ink-3">
						An estimate is fine. It helps us prepare for your call.
					</p>
				)}
			</fieldset>

			<Labelled id={id("heardFrom")} label="How did you hear about us?" error={errors.heardFrom}>
				<select
					id={id("heardFrom")}
					data-field="heardFrom"
					name="heardFrom"
					value={heard}
					onChange={(e) => {
						setHeard(e.target.value);
						clear("heardFrom");
					}}
					className={cn(
						field,
						selectCls,
						!heard && "text-ink-3",
						errors.heardFrom && "border-status-bad",
					)}
					style={chevron}
					{...invalid("heardFrom")}
				>
					<option value="">Choose…</option>
					{HEARD_FROM.map((h) => (
						<option key={h.value} value={h.value}>
							{h.label}
						</option>
					))}
				</select>
			</Labelled>

			<fieldset className="flex min-w-0 flex-col gap-[10px]">
				<legend className="mb-[10px] text-[13px] font-medium text-ink-2">
					Best time to call you <span className="font-normal text-ink-3">(optional)</span>
				</legend>
				<div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
					{CALL_TIMES.map((t, i) => {
						const on = time === t.value;
						return (
							<label
								key={t.value}
								className={cn(
									"flex cursor-pointer items-center justify-center rounded-control border px-2 py-[11px] text-center text-[13px] font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
									on
										? "border-brand bg-brand-soft text-brand"
										: "border-line bg-card text-ink hover:bg-subtle",
								)}
							>
								<input
									type="radio"
									name="preferredTime"
									value={t.value}
									checked={on}
									data-field={i === 0 ? "preferredTime" : undefined}
									onClick={() => {
										// A second tap on the chosen time clears it: the question is optional.
										if (on) setTime("");
									}}
									onChange={() => {
										setTime(t.value);
										clear("preferredTime");
									}}
									className="sr-only"
								/>
								{t.label}
							</label>
						);
					})}
				</div>
			</fieldset>

			<Labelled
				id={id("message")}
				label="Anything we should know?"
				optional
				error={errors.message}
				hint={`${message.length}/${MESSAGE_MAX} · e.g. how many locations, or what you use today`}
			>
				<textarea
					id={id("message")}
					data-field="message"
					name="message"
					rows={4}
					maxLength={MESSAGE_MAX}
					value={message}
					onChange={(e) => {
						setMessage(e.target.value.slice(0, MESSAGE_MAX));
						clear("message");
					}}
					className={cn(field, "min-h-[104px] resize-y", errors.message && "border-status-bad")}
					{...invalid("message")}
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

			<p className="text-xs leading-[1.5] text-ink-3">
				We use these details only to arrange your demo and set your business up. See our{" "}
				<Link
					href="/legal/privacy"
					target="_blank"
					className="font-semibold text-brand underline underline-offset-2"
				>
					Privacy Policy
				</Link>
				.
			</p>

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
				{pending ? "Sending…" : "Book my demo"}
			</button>
		</form>
	);
}

/** One "Average monthly sales" choice: a radio dot and the band, a soft maroon tint when picked. `quiet` is the plain
 * "Prefer not to say" line under the bands. */
function SalesOption({
	value,
	label,
	on,
	invalid,
	first,
	quiet,
	onPick,
}: {
	value: string;
	label: string;
	on: boolean;
	invalid: boolean;
	first?: boolean;
	quiet?: boolean;
	onPick: () => void;
}) {
	return (
		<label
			className={cn(
				"flex cursor-pointer items-center gap-[10px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
				quiet
					? "w-fit rounded-control px-1 py-1 text-[13px] text-ink-2 hover:text-ink"
					: cn(
							"rounded-control border px-[14px] py-[11px] text-[13.5px] font-medium",
							on
								? "border-brand bg-brand/[0.06] text-brand"
								: invalid
									? "border-status-bad bg-card text-ink hover:border-brand/40"
									: "border-line bg-card text-ink hover:border-brand/40 hover:bg-subtle",
						),
			)}
		>
			<input
				type="radio"
				name="monthlySales"
				value={value}
				checked={on}
				data-field={first ? "monthlySales" : undefined}
				onChange={onPick}
				className="sr-only"
			/>
			<span
				aria-hidden
				className={cn(
					"flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
					on ? "border-brand" : "border-line-strong bg-card",
				)}
			>
				{on && <span className="size-2 rounded-full bg-brand" />}
			</span>
			<span className="leading-tight">{label}</span>
		</label>
	);
}
