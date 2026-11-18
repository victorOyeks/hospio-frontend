"use client";

import { whatsAppKinds } from "@hospio/api/actions/messaging";
import { useEffect, useState } from "react";

/** One read per page load: the list only changes when Meta approves a template. */
let pending: Promise<string[]> | null = null;

/**
 * The kinds of message that go on WhatsApp right now (hospio-backend docs/sms-whatsapp.md: booking confirmation, change,
 * cancellation, arrival reminder, receipt), from GET /messaging/channels. The screens offer WhatsApp only for a kind in this list:
 * a stay summary, folio, typed guest message or staff message has no approved template, so it is never offered. Empty until it loads.
 */
export function useWhatsAppKinds(): string[] {
	const [kinds, setKinds] = useState<string[]>([]);
	useEffect(() => {
		let on = true;
		if (!pending) {
			pending = whatsAppKinds().catch(() => {
				pending = null;
				return [];
			});
		}
		void pending.then((k) => {
			if (on) setKinds(k);
		});
		return () => {
			on = false;
		};
	}, []);
	return kinds;
}
