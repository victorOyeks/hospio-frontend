"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND_COOKIE, BRAND_COOKIE_MAX_AGE } from "@hospio/api/brand";

const secure = () =>
	typeof location !== "undefined" && location.protocol === "https:"
		? "; secure"
		: "";

/**
 * Writes the signed-in hotel's look to the browser (packages/api/src/brand.ts), so its sign-in screens keep it after logout.
 * Rendered by the dashboard shell with the value already encoded; renders nothing.
 */
export function RememberBrand({ value }: { value: string }) {
	useEffect(() => {
		document.cookie = `${BRAND_COOKIE}=${value}; path=/; max-age=${BRAND_COOKIE_MAX_AGE}; samesite=lax${secure()}`;
	}, [value]);
	return null;
}

/** "Not Ivory Court Ikeja? Use the Hospio360 look": forgets the remembered hotel's look on this browser. */
export function ForgetBrand({ hotelName }: { hotelName: string | null }) {
	const router = useRouter();
	return (
		<p className="mt-8 text-center text-[12px] text-ink-3">
			{hotelName ? `Not ${hotelName}? ` : "Not your hotel? "}
			<button
				type="button"
				className="font-semibold text-ink-2 underline-offset-2 hover:underline"
				onClick={() => {
					document.cookie = `${BRAND_COOKIE}=; path=/; max-age=0; samesite=lax${secure()}`;
					router.refresh();
				}}
			>
				Use the Hospio360 look
			</button>
		</p>
	);
}
