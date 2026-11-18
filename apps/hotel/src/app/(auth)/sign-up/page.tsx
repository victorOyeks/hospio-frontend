import { loadLegalDocuments } from "@hospio/api/actions/legal";
import { SignUpForm } from "@/components/auth/sign-up-form";

/**
 * Self-serve onboarding, step 0: the owner creates the account and the business (Figma 3163:16114). A marketer's link
 * carries `?ref=<code>`, which prefills the referral code.
 */
export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const ref = (await searchParams).ref;
	const code = (Array.isArray(ref) ? ref[0] : ref)?.trim().toUpperCase();
	const debit = (await loadLegalDocuments()).find((d) => d.key === "DEBIT");
	return <SignUpForm referralCode={code ? code.slice(0, 20) : undefined} debitRatePct={debit?.ratePct} />;
}
