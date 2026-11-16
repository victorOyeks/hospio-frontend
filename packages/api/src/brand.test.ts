import { describe, expect, test } from "bun:test";
import {
	brandStyle,
	contrast,
	decodeBrandCookie,
	encodeBrandCookie,
	navMode,
	normalizeHex,
	onColour,
} from "./brand";

describe("brand", () => {
	test("colours are read leniently and written strictly", () => {
		expect(normalizeHex("#0B4F50")).toBe("#0b4f50");
		expect(normalizeHex("abc")).toBe("#aabbcc");
		expect(normalizeHex("red")).toBeNull();
		expect(normalizeHex("#12345g")).toBeNull();
	});
	test("text on the colour stays readable", () => {
		expect(onColour("#4c091e")).toBe("#ffffff");
		expect(onColour("#87cefa")).toBe("#1a1a1a");
		expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
		expect(navMode({ primary: "#87cefa", darkNav: true })).toBe("light");
		expect(navMode({ primary: "#0b4f50", darkNav: false })).toBe("light");
		expect(navMode({ primary: "#0b4f50", darkNav: true })).toBe("dark");
	});
	test("the style sheet only ever holds a validated colour", () => {
		const css = brandStyle({
			primary: "#0b4f50;}body{display:none",
			darkNav: true,
		});
		expect(css).not.toContain("display:none");
		expect(css).toContain("--brand-primary:#4c091e");
	});
	test("the remembered look survives the cookie and a tampered one is refused", () => {
		const raw = encodeBrandCookie(
			{
				primary: "#0B4F50",
				darkNav: false,
				shortName: "Simpas",
				logoUrl: "https://x.test/l.png",
			},
			"Simpas Ikeja",
		);
		expect(decodeBrandCookie(raw)).toEqual({
			brand: {
				primary: "#0b4f50",
				darkNav: false,
				shortName: "Simpas",
				logoUrl: "https://x.test/l.png",
			},
			hotelName: "Simpas Ikeja",
		});
		expect(
			decodeBrandCookie(encodeURIComponent(JSON.stringify({ c: "#zzzzzz" }))),
		).toBeNull();
		const evil = decodeBrandCookie(
			encodeURIComponent(
				JSON.stringify({
					c: "#0b4f50",
					l: "javascript:alert(1)",
					h: "<script>Hotel</script>",
				}),
			),
		);
		expect(evil?.brand.logoUrl).toBeNull();
		expect(evil?.hotelName).toBe("scriptHotelscript");
		expect(decodeBrandCookie("%%%")).toBeNull();
	});
});

describe("pale colours stay readable", () => {
	test("text on the fill turns dark and text in the colour a deeper shade", () => {
		const css = brandStyle({ primary: "#87cefa", darkNav: true });
		expect(css).toContain("--color-white:#1a1a1a");
		expect(css).toMatch(/\.text-brand[^{]*\{color:#[0-9a-f]{6}\}/);
		expect(brandStyle({ primary: "#0b4f50", darkNav: true })).not.toContain(
			"--color-white:#1a1a1a",
		);
	});
});

describe("no maroon left over", () => {
	test("menus' hover and selected rows take the brand", () => {
		const css = brandStyle({ primary: "#87cefa", darkNav: true });
		expect(css).toContain("--accent:");
		expect(css).not.toMatch(/eb7a9e|4c091e|fceef2|fbf7f8|170511/i);
		expect(css).toMatch(/--accent-foreground:#44677d/);
	});
});
