"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { META_PIXEL_ID } from "@/config/env";
import { trackMeta } from "@/lib/meta-pixel";

/** A PageView for every client-side page change after the first (the base code sends the first). */
function RouteChanges() {
	const pathname = usePathname();
	const search = useSearchParams().toString();
	const first = useRef(true);
	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		trackMeta("PageView");
	}, [pathname, search]);
	return null;
}

/**
 * Meta's standard base code (fbevents.js, init, the first PageView, the noscript image) when NEXT_PUBLIC_META_PIXEL_ID is set,
 * with automatic configuration off (no automatic button-click events carrying page text: only the events we send);
 * nothing at all otherwise (staging and local builds). Privacy Policy: "Measuring our adverts".
 */
export function MetaPixel() {
	if (!META_PIXEL_ID) return null;
	return (
		<>
			<Script id="meta-pixel" strategy="afterInteractive">
				{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${META_PIXEL_ID}');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
			</Script>
			<noscript>
				<img
					height="1"
					width="1"
					style={{ display: "none" }}
					alt=""
					src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
				/>
			</noscript>
			<Suspense fallback={null}>
				<RouteChanges />
			</Suspense>
		</>
	);
}
