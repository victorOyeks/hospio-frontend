"use client";

import { LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { loadPlatformFeePct } from "@hospio/api/actions/platform-admin";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import {
	Field,
	FieldRow,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { checkPercent } from "@hospio/ui/shared/validate";

/**
 * Fee lock (hospio-backend docs/plan-daily-fees.md): every business pays the platform default share of daily sales. A different
 * rate needs a signed addendum: its reference is required, stored with the fee and recorded in the audit trail. The server enforces
 * it (400 "The platform fee is 1.5% for everyone…"); this is the form side, shared by every place a rate can be entered.
 */

/** The default until platform settings are read (FeeSettings.DEFAULTS.revenuePct). */
export const FALLBACK_FEE_PCT = 1.5;
export const MAX_ADDENDUM = 120;

/** The platform default share (settings fees.revenuePct), read once; 1.5 until it is known. */
export function usePlatformFeePct(): number {
	const [pct, setPct] = useState(FALLBACK_FEE_PCT);
	useEffect(() => {
		let live = true;
		loadPlatformFeePct()
			.then((r) => {
				if (live && r.ok) setPct(r.data);
			})
			.catch(() => {});
		return () => {
			live = false;
		};
	}, []);
	return pct;
}

export type FeeLockErrors = { pct?: string; addendum?: string };

export type FeeLock = {
	defaultPct: number;
	/** The rate the business has now (null when none), and its addendum. */
	currentValue: number | null;
	currentRef: string | null;
	different: boolean;
	pct: string;
	addendum: string;
	errors: FeeLockErrors;
	setDifferent: (v: boolean) => void;
	setPct: (v: string) => void;
	setAddendum: (v: string) => void;
	setErrors: (e: FeeLockErrors) => void;
	/** Starts again from another business's rate and addendum (the fee rate modal's business picker). */
	reset: (
		value: number | null | undefined,
		addendumRef: string | null | undefined,
	) => void;
};

/**
 * The fee lock's form state, from the rate and addendum the business has now. A business on another rate (or with an addendum)
 * opens with "Different rate" on; otherwise the rate is the platform default and only the toggle can change it.
 */
export function useFeeLock(
	value: number | null | undefined,
	addendumRef: string | null | undefined,
): FeeLock {
	const defaultPct = usePlatformFeePct();
	const [current, setCurrent] = useState({
		value: value ?? null,
		ref: addendumRef ?? null,
	});
	const offDefault = (
		d: number,
		c: { value: number | null; ref: string | null } = current,
	) => !!c.ref || (c.value != null && c.value > 0 && c.value !== d);
	const [touched, setTouched] = useState(false);
	const [different, setDifferentState] = useState(() =>
		offDefault(FALLBACK_FEE_PCT),
	);
	const [pct, setPctState] = useState(() =>
		String(offDefault(FALLBACK_FEE_PCT) ? value : FALLBACK_FEE_PCT),
	);
	const [addendum, setAddendumState] = useState(addendumRef ?? "");
	const [errors, setErrors] = useState<FeeLockErrors>({});
	// The default arrives after the first render: until the form is touched, read the business's rate against it again.
	useEffect(() => {
		if (touched) return;
		const off = offDefault(defaultPct);
		setDifferentState(off);
		setPctState(String(off ? current.value : defaultPct));
	}, [defaultPct]);
	return {
		defaultPct,
		currentValue: current.value,
		currentRef: current.ref,
		different,
		pct,
		addendum,
		errors,
		setDifferent: (v) => {
			setTouched(true);
			setDifferentState(v);
			setErrors({});
			if (!v) setPctState(String(defaultPct));
		},
		setPct: (v) => {
			setTouched(true);
			setPctState(v);
			setErrors({ ...errors, pct: undefined });
		},
		setAddendum: (v) => {
			setTouched(true);
			setAddendumState(v);
			setErrors({ ...errors, addendum: undefined });
		},
		setErrors,
		reset: (v, ref) => {
			const c = { value: v ?? null, ref: ref ?? null };
			const off = offDefault(defaultPct, c);
			setCurrent(c);
			setTouched(false);
			setDifferentState(off);
			setPctState(String(off ? c.value : defaultPct));
			setAddendumState(c.ref ?? "");
			setErrors({});
		},
	};
}

/**
 * What to send: the default with no addendum, or the rate typed and its addendum reference. Null (and the errors shown under the
 * fields) when the different rate or its reference is missing or wrong.
 */
export function feeLockValue(
	lock: FeeLock,
): { feeValue: number; feeAddendumRef: string | null } | null {
	if (!lock.different)
		return { feeValue: lock.defaultPct, feeAddendumRef: null };
	const pctError = checkPercent(lock.pct);
	const ref = lock.addendum.trim();
	const unchangedOld =
		!lock.currentRef &&
		lock.currentValue != null &&
		Number(lock.pct.trim().replace(",", ".")) === lock.currentValue;
	const addendumError =
		!ref && !unchangedOld
			? "Enter the signed addendum's reference"
			: ref.length > MAX_ADDENDUM
				? `At most ${MAX_ADDENDUM} characters`
				: undefined;
	if (pctError || addendumError) {
		lock.setErrors({ pct: pctError, addendum: addendumError });
		return null;
	}
	const feeValue = Number(lock.pct.trim().replace(",", "."));
	// A rate from before the fee lock, sent back unchanged, is left alone by the server: it needs no reference until it changes.
	if (!ref && !lock.currentRef && feeValue === lock.currentValue)
		return { feeValue, feeAddendumRef: null };
	return {
		feeValue,
		feeAddendumRef: feeValue === lock.defaultPct ? null : ref,
	};
}

/** Puts a server message about the fee under its field; false when it is about something else. */
export function showFeeLockError(lock: FeeLock, message: string): boolean {
	if (/addendum/i.test(message)) {
		lock.setErrors({ addendum: message });
		return true;
	}
	if (/share|fee|percent/i.test(message)) {
		if (lock.different) lock.setErrors({ pct: message });
		else lock.setErrors({ addendum: message });
		return true;
	}
	return false;
}

const pctText = (v: number) => `${Number(v.toFixed(2))}%`;

/** The fee fixed at the platform default, with "Different rate (signed addendum)" to enter another rate and its addendum. */
export function FeeLockField({
	lock,
	disabled,
}: {
	lock: FeeLock;
	disabled?: boolean;
}) {
	return (
		<div className="flex flex-col gap-3">
			{!lock.different && (
				<Field
					label="Share of daily sales"
					hint={`${feeModelLabels.PERCENT_OF_SALES} from the hotel's Moniepoint or OPay account`}
					error={lock.errors.addendum ?? lock.errors.pct}
				>
					<div className="flex items-center gap-2 rounded-control border border-line bg-subtle px-4 py-3 text-sm text-ink">
						<LockIcon className="size-4 shrink-0 text-brand" aria-hidden />
						<span>
							<span className="font-semibold">{pctText(lock.defaultPct)}</span>{" "}
							of daily sales · platform default
						</span>
					</div>
				</Field>
			)}
			<ToggleField
				label="Different rate (signed addendum)"
				hint="Only with a signed addendum to the agreement. The reference is kept with the fee and in the audit trail."
				checked={lock.different}
				onChange={lock.setDifferent}
				disabled={disabled}
			/>
			{lock.different && (
				<FieldRow>
					<TextField
						label="Share of daily sales (%)"
						value={lock.pct}
						onChange={lock.setPct}
						placeholder={String(lock.defaultPct)}
						required
						disabled={disabled}
						hint={`Platform default ${pctText(lock.defaultPct)} · 0 to 100, up to two decimals`}
						error={lock.errors.pct}
					/>
					<TextField
						label="Addendum reference"
						value={lock.addendum}
						onChange={lock.setAddendum}
						placeholder="e.g. ADD-2026-014 signed 18 Nov"
						required
						disabled={disabled}
						hint="The signed addendum that allows this rate"
						error={lock.errors.addendum}
					/>
				</FieldRow>
			)}
		</div>
	);
}
