import { Button } from "@hospio/ui/primitives/button";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mySuspension } from "@hospio/api/actions/suspension";
import { COOKIES } from "@hospio/api/session";

export default async function NotFound() {
	// A suspended business has one screen, even for an address that doesn't exist (hospio-backend docs/suspension.md).
	if ((await cookies()).get(COOKIES.token)?.value && (await mySuspension()).suspended) redirect("/suspended");
	return (
		<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-md text-center">
				<div className="mx-auto h-12 w-12" />
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					404 - Page Not Found
				</h1>
				<p className="mt-4 text-muted-foreground">
					Oops, the page you are looking for could not be found.
				</p>
				<div className="mt-6">
					<Button asChild>
						<Link href="/">Go back home</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
