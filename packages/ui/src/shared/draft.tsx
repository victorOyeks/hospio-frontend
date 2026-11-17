"use client";

import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { safeAppPath } from "@hospio/api/safe-path";

/**
 * Resume after the lock screen (docs/qa/46-lock-screen-resume.md).
 *
 * - The page someone was on when the device locked (or the session ran out) is remembered in this tab with their user id;
 *   the same person unlocking goes back there, anyone else goes to their own dashboard.
 * - Half-typed forms are kept as drafts: `useDraft` saves the fields a form hands it while the form is open, under
 *   `hms.draft:<userId>:<form key>`, and fills them back in when the same person opens that form again.
 *
 * Everything lives in this tab's sessionStorage only and is never sent to the server. Drafts expire after 4 hours, are
 * deleted when the form is saved, cancelled or closed, at sign-out, and when someone else signs in or unlocks here. Callers
 * never hand it PINs, passwords, card details or payment amounts; Take payment is never drafted.
 */

const DRAFT = "hms.draft:";
const RESUME = "hms.resume";
const TTL_MS = 4 * 60 * 60 * 1000;

type Stored<T> = { u: string; at: number; v: T };

function storage(): Storage | null {
	try {
		return typeof window === "undefined" ? null : window.sessionStorage;
	} catch {
		return null;
	}
}

function read<T>(key: string): Stored<T> | null {
	try {
		const raw = storage()?.getItem(key);
		if (!raw) return null;
		const s = JSON.parse(raw) as Stored<T>;
		if (!s || typeof s.u !== "string" || typeof s.at !== "number") return null;
		if (Date.now() - s.at > TTL_MS) {
			storage()?.removeItem(key);
			return null;
		}
		return s;
	} catch {
		return null;
	}
}

function write(key: string, value: unknown) {
	try {
		storage()?.setItem(key, JSON.stringify(value));
	} catch {
		// Full or blocked storage: the form just isn't kept.
	}
}

function remove(key: string) {
	try {
		storage()?.removeItem(key);
	} catch {
		// nothing to do
	}
}

/** Deletes every draft not owned by `keep` (all of them without it), and any that ran out. */
export function clearDrafts(keep?: string) {
	try {
		const s = storage();
		if (!s) return;
		const keys: string[] = [];
		for (let i = 0; i < s.length; i++) {
			const k = s.key(i);
			if (k?.startsWith(DRAFT)) keys.push(k);
		}
		for (const k of keys) {
			const owner = k.slice(DRAFT.length).split(":")[0];
			if (!keep || owner !== keep || !read(k)) s.removeItem(k);
		}
	} catch {
		// nothing to do
	}
}

/** Set at sign-out so the page tracker doesn't remember the page again while the sign-out is on its way. */
let signingOut = false;

/** Sign-out: every draft and the remembered page go. */
export function forgetEverything() {
	signingOut = true;
	clearDrafts();
	remove(RESUME);
}

/** Remembers the page this person is on (path + query), for when the device locks or the session ends. */
export function rememberPage(userId: string, path?: string) {
	if (typeof window === "undefined" || signingOut) return;
	const where =
		path ?? `${window.location.pathname}${window.location.search}`;
	if (!safeAppPath(where)) return;
	write(RESUME, { u: userId, at: Date.now(), v: where });
}

/**
 * Where `userId` goes after unlocking or signing in again: the page they were on when it was this same person, else the
 * dashboard. `from` (the page asked for when the session had ended) wins over the remembered one, only for the same person.
 * Someone else coming in also clears the drafts and page left by the person before.
 */
export function resumeTarget(userId: string, from?: string | null): string {
	const last = read<string>(RESUME);
	if (!last || last.u !== userId) {
		clearDrafts(userId);
		remove(RESUME);
		// The plain sign-in page (no device, nobody remembered in this tab) keeps its `from`, as before.
		return (!last && safeAppPath(from)) || "/dashboard";
	}
	return safeAppPath(from) ?? safeAppPath(last.v) ?? "/dashboard";
}

const DraftUserContext = createContext<string | null>(null);

/**
 * Wraps the dashboard: who owns the drafts, the page remembered on every navigation, and other people's drafts cleared
 * when this person's dashboard opens (a different person signed in on this tab).
 */
export function DraftUser({
	userId,
	children,
}: PropsWithChildren<{ userId: string | null }>) {
	useEffect(() => {
		if (!userId) return;
		signingOut = false;
		const last = read<string>(RESUME);
		if (last && last.u !== userId) remove(RESUME);
		clearDrafts(userId);
		rememberPage(userId);
		// nuqs and the router change the URL without a page load: keep the remembered page current.
		const track = () => rememberPage(userId);
		const t = window.setInterval(track, 2000);
		window.addEventListener("popstate", track);
		window.addEventListener("pagehide", track);
		return () => {
			window.clearInterval(t);
			window.removeEventListener("popstate", track);
			window.removeEventListener("pagehide", track);
		};
	}, [userId]);
	return (
		<DraftUserContext.Provider value={userId}>
			{children}
		</DraftUserContext.Provider>
	);
}

export function useDraftUser() {
	return useContext(DraftUserContext);
}

/**
 * True once mounted when this person has a draft of `key`: for a form whose open state isn't in the address (a panel
 * opened by a button), so the page can open it again after the lock screen.
 */
export function useHasDraft(key: string | null): boolean {
	const userId = useDraftUser();
	const [has, setHas] = useState(false);
	useEffect(() => {
		if (!userId || !key) return setHas(false);
		const saved = read(`${DRAFT}${userId}:${key}`);
		setHas(!!saved && saved.u === userId);
	}, [userId, key]);
	return has;
}

export type Draft = {
	/** The form was filled back in from a draft (shows the "Restored what you were typing" note). */
	restored: boolean;
	/** Deletes the draft now (the note's Clear, or a success the form stays open after). */
	clear: () => void;
};

/**
 * Keeps a form's fields while it is open. `key` names the form (add the record id where one form serves many records),
 * `active` is true while the form is open and not yet saved, `value` the fields to keep (never PINs, passwords, card data
 * or payment amounts), `restore` fills them back in. Closing the form (active goes false) deletes the draft; leaving the
 * page without closing it (the device locked) keeps it for the same person.
 */
export function useDraft<T>(
	key: string | null,
	active: boolean,
	value: T,
	restore: (v: T) => void,
	/** The form as it opens, when that is set after the first render (a check-in's booked room); else `value` at opening. */
	blank?: T,
): Draft {
	const userId = useDraftUser();
	const storeKey = userId && key ? `${DRAFT}${userId}:${key}` : null;
	const on = active && !!storeKey;
	const [restored, setRestored] = useState(false);
	const json = safeJson(value);
	const baseline = useRef<string | null>(null);
	const skip = useRef(false);
	const wasOn = useRef<string | null>(null);
	const restoreRef = useRef(restore);
	restoreRef.current = restore;

	// Opened: fill in this person's draft, if any; closed: the draft goes. `json` is read as the form opened (the baseline);
	// later changes are the save effect's.
	useEffect(() => {
		if (!on || !storeKey) {
			if (wasOn.current) remove(wasOn.current);
			wasOn.current = null;
			baseline.current = null;
			setRestored(false);
			return;
		}
		if (wasOn.current === storeKey) return;
		wasOn.current = storeKey;
		baseline.current = blank === undefined ? json : safeJson(blank);
		skip.current = true;
		const saved = read<T>(storeKey);
		if (saved && saved.u === userId && safeJson(saved.v) !== baseline.current) {
			try {
				restoreRef.current(saved.v);
				setRestored(true);
			} catch {
				remove(storeKey);
			}
		}
	}, [on, storeKey, userId]);

	// Typed: save; back to how it opened: nothing to keep.
	useEffect(() => {
		if (!on || !storeKey || !userId || wasOn.current !== storeKey) return;
		if (skip.current) {
			skip.current = false;
			return;
		}
		if (json === null) return;
		if (json === baseline.current) remove(storeKey);
		else write(storeKey, { u: userId, at: Date.now(), v: JSON.parse(json) });
	}, [json, on, storeKey, userId]);

	const clear = useCallback(() => {
		if (storeKey) remove(storeKey);
		setRestored(false);
	}, [storeKey]);

	return { restored, clear };
}

function safeJson(v: unknown): string | null {
	try {
		return JSON.stringify(v) ?? null;
	} catch {
		return null;
	}
}

/** The small note at the top of a restored form, with Clear to start again. */
export function DraftNote({
	draft,
	onClear,
}: {
	draft: Draft;
	/** Empties the form's fields; the draft itself is deleted here. */
	onClear: () => void;
}) {
	if (!draft.restored) return null;
	return (
		<p
			className="flex items-center gap-1 text-xs text-ink-3"
			data-draft-note=""
		>
			Restored what you were typing ·{" "}
			<button
				type="button"
				className="font-semibold text-brand hover:underline"
				onClick={() => {
					draft.clear();
					onClear();
				}}
			>
				Clear
			</button>
		</p>
	);
}
