import type { Metadata } from "next";
import { LegalIndex } from "@/components/legal";

export const metadata: Metadata = {
	title: "Legal",
	description:
		"Hospio360 terms of service, privacy policy, data processing terms, fees and monthly invoice, device, support, referral partner and staff terms. Hospio360 is a product of Oyeks Global Limited.",
	alternates: { canonical: "/legal" },
};

export default function LegalIndexPage() {
	return <LegalIndex />;
}
