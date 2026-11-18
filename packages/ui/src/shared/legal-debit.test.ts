import { describe, expect, mock, test } from "bun:test";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { acceptItem, type LegalDoc } from "@hospio/api/api/routes-legal";

// legal.tsx imports the server action and the Next router; neither runs here (only the labels are rendered).
mock.module("@hospio/api/actions/legal", () => ({ acceptLegal: async () => ({ ok: true }) }));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
const { boxesFor, DebitLabel, formatRatePct } = await import("./legal");

const doc = (key: string, ratePct?: number | null): LegalDoc => ({
	key,
	version: `${key}-2026-11`,
	title: key,
	slug: key.toLowerCase(),
	url: `https://hospio360.com/legal/${key.toLowerCase()}`,
	effectiveFrom: "2026-11-17T23:00:00Z",
	material: false,
	summary: null,
	ratePct,
});

const html = (node: ReactNode) => renderToStaticMarkup(createElement(Fragment, null, node));
const text = (markup: string) => markup.replace(/<[^>]+>/g, "").replace(/&#x27;|&apos;/g, "'");

describe("the owner's debit box states the business's rate", () => {
	test("an addendum rate from the server is the rate in the box", () => {
		expect(text(html(createElement(DebitLabel, { doc: doc("DEBIT", 1.2) })))).toContain(
			"to debit 1.2% of my business's daily sales from my business account each day at 06:00.",
		);
	});

	test("the platform default when the server gives none (sign-up shows the public default)", () => {
		expect(text(html(createElement(DebitLabel, {})))).toContain("to debit 1.5% of my business's daily sales");
		expect(text(html(createElement(DebitLabel, { ratePct: 2 })))).toContain("to debit 2% of my business's daily sales");
		expect(formatRatePct(1.25)).toBe("1.25%");
		expect(formatRatePct(null)).toBe("1.5%");
	});

	test("the boxes of a new-version or first-sign-in modal carry the rate, and the acceptance sends it", () => {
		const pending = [doc("TERMS"), doc("PRIVACY"), doc("DPA"), doc("DEBIT", 1.2)];
		const debitBox = boxesFor(pending).find((b) => b.id === "DEBIT");
		expect(debitBox).toBeDefined();
		expect(text(html(debitBox?.label))).toContain("debit 1.2% of my business's daily sales");
		expect(pending.map(acceptItem)).toEqual([
			{ key: "TERMS", version: "TERMS-2026-11" },
			{ key: "PRIVACY", version: "PRIVACY-2026-11" },
			{ key: "DPA", version: "DPA-2026-11" },
			{ key: "DEBIT", version: "DEBIT-2026-11", ratePct: 1.2 },
		]);
		expect(acceptItem(doc("DEBIT", null))).toEqual({ key: "DEBIT", version: "DEBIT-2026-11" });
	});
});
