"use client";

import { KeyRoundIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { hotelPosConfig, type PosConfigView } from "@hospio/api/actions/daily-fees";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { fmtWhen } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";

/**
 * Hotel setup → POS: the hotel's Moniepoint or OPay keys, as Hospio360 entered them (hospio-backend docs/pos-providers.md).
 * Read only and masked: to change a key, the hotel asks Hospio360 support. The keys are only for taking guests' card and
 * transfer payments; Hospio360's own fees are billed on the monthly invoice, never taken from this account.
 */

const LABELS: Record<string, string> = {
	apiKey: "API key",
	webhookSecret: "Webhook secret",
	clientAuthKey: "Client auth key",
	opayPublicKey: "OPay public key",
	merchantPrivateKey: "Merchant private key",
	headMerchantId: "Head merchant ID",
	merchantId: "Merchant ID",
};

export function PosKeysCard() {
	const [pos, setPos] = useState<PosConfigView | null>(null);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		hotelPosConfig().then((r) => (r.ok ? setPos(r.data) : setError(r.error)));
	}, []);
	return (
		<SectionCard title="POS provider keys" subtitle="Set by Hospio360 · shown masked; ask Hospio360 support to change them">
			{error ? (
				<Note tone="danger">{error}</Note>
			) : !pos ? (
				<p className="text-[13px] text-ink-3">Loading…</p>
			) : pos.providers.length === 0 ? (
				<div className="flex items-center gap-2 text-[13px] text-ink-2">
					<KeyRoundIcon className="size-4 text-ink-3" /> Not connected yet. Hospio360 adds your Moniepoint or OPay keys when your POS is set up.
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{pos.posPaused && (
						<Note tone="danger">
							POS payments are paused until the Hospio360 invoice is paid. Cash still works. They resume within a minute of the owner paying it
							under Billing &amp; invoices.
						</Note>
					)}
					{pos.providers.map((p) => (
						<div key={p.provider} className="rounded-card border border-line p-4">
							<DetailList
								columns={2}
								items={[
									{ label: "Provider", value: p.provider === "OPAY" ? "OPay" : "Moniepoint" },
									{ label: "Status", value: p.complete ? <StatusPill tone="success">Connected</StatusPill> : <StatusPill tone="warning">Keys incomplete</StatusPill> },
									...Object.entries(p.fields).map(([k, v]) => ({ label: LABELS[k] ?? k, value: v ?? "—" })),
									{ label: "Last changed", value: p.updatedAt ? `${fmtWhen(p.updatedAt)} by ${p.updatedByName ?? "Hospio360"}` : "—" },
								]}
							/>
						</div>
					))}
					<p className="text-[12px] text-ink-3">
						These keys are only for taking guest payments: each card payment goes through the provider of the terminal it's sent to. Hospio360
						never takes its fees from this account.
					</p>
				</div>
			)}
		</SectionCard>
	);
}
