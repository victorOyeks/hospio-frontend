/**
 * `?month=YYYY-MM` → that month's first and last day; anything else → this month so far (the 1st to today, Lagos), the days
 * that will go on next month's Hospio360 invoice.
 */
export function monthRange(raw?: string): { month: string | null; from?: string; to?: string } {
	if (!raw || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) {
		const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
		return { month: null, from: `${today.slice(0, 7)}-01`, to: today };
	}
	const [y, m] = raw.split("-").map(Number);
	const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
	return { month: raw, from: `${raw}-01`, to: `${raw}-${String(last).padStart(2, "0")}` };
}
