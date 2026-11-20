import { redirect } from "next/navigation";
import { bookDemoUrl } from "@hospio/api/app";

/**
 * Self sign-up is off (hospio-backend docs/onboarding.md, "Applications"): businesses book a demo on the landing site and the team
 * onboards them, and the owner gets the usual invite. Old links (a marketer's `?ref=<code>` link, bookmarks) land on the Book a demo
 * form with the code kept. The form this page used to show (components/auth/sign-up-form.tsx) is kept for the day the server's
 * SELF_SIGNUP_ENABLED switch is turned back on. Owners already part-way through their own setup sign in and carry on at /onboarding.
 */
export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const ref = (await searchParams).ref;
	redirect(bookDemoUrl(Array.isArray(ref) ? ref[0] : ref));
}
