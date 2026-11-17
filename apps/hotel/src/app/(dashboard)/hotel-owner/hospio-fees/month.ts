/** `?month=YYYY-MM` → that month's first and last day (to today for the current month); anything else → the last 30 days. */
export function monthRange(raw?: string): { month: string | null; from?: string; to?: string } {
	if (!raw || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return { month: null };
	const [y, m] = raw.split("-").map(Number);
	const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
	return { month: raw, from: `${raw}-01`, to: `${raw}-${String(last).padStart(2, "0")}` };
}
