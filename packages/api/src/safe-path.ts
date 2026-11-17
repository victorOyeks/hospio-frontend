/**
 * Where sign-in, the lock screen and the session refresh may send someone back to: a page of this app only. A path under
 * /dashboard (or the role picker), relative to this origin, never `//host`, `/\host`, a scheme or control characters, so a
 * crafted `?from=` or `?next=` can't become an open redirect. Anything else is null and the caller goes to the dashboard.
 */
export function safeAppPath(from: string | null | undefined): string | null {
	if (typeof from !== "string" || from.length === 0 || from.length > 2000)
		return null;
	// biome-ignore lint/suspicious/noControlCharactersInRegex: refusing control characters is the point
	if (/[\u0000-\u001f\u007f\\]/.test(from)) return null;
	if (from === "/select-role") return from;
	if (!/^\/dashboard(?:[/?#]|$)/.test(from)) return null;
	// "/dashboard//evil.com" is still same-origin, but a doubled slash anywhere in the path is never one of ours.
	const path = from.split(/[?#]/)[0];
	if (path.includes("//") || /\/\.\.?(?:\/|$)/.test(path)) return null;
	return from;
}
