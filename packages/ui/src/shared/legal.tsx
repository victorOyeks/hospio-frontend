"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { acceptLegal } from "@hospio/api/actions/legal";
import { acceptItem, type LegalDoc } from "@hospio/api/api/routes-legal";
import { Button } from "@hospio/ui/primitives/button";
import { Checkbox } from "@hospio/ui/primitives/checkbox";

/**
 * The tick boxes for the legal documents (hospio-backend docs/legal-acceptance.md). One box for the Terms, Privacy Policy and Data
 * Processing Terms, one for the monthly invoice agreement (document key DEBIT), one for each other document (Staff terms, Referral partner terms, Devices).
 */

export const LEGAL_SITE = "https://hospio360.com";

/** The landing site's page for a document (fallback when the server's link is missing). */
export const legalUrl = (slug: string) => `${LEGAL_SITE}/legal/${slug}`;

const OWNER_GROUP = ["TERMS", "PRIVACY", "DPA"];

export type LegalBox = { id: string; docs: LegalDoc[]; label: ReactNode };

function DocLink({ doc, children }: { doc: Pick<LegalDoc, "url" | "slug" | "title">; children?: ReactNode }) {
	return (
		<a
			href={doc.url || legalUrl(doc.slug)}
			target="_blank"
			rel="noopener noreferrer"
			className="font-medium text-primary underline underline-offset-2"
			onClick={(e) => e.stopPropagation()}
		>
			{children ?? doc.title}
		</a>
	);
}

/** The owner's first box, with each document a link (the three always named; their links follow the server's versions when known). */
export function OwnerTermsLabel({ docs }: { docs: Pick<LegalDoc, "key" | "url" | "slug" | "title">[] }) {
	const by = (key: string, slug: string, title: string) => docs.find((d) => d.key === key) ?? { key, url: legalUrl(slug), slug, title };
	return (
		<>
			I agree to the <DocLink doc={by("TERMS", "terms", "Terms of Service")} />,{" "}
			<DocLink doc={by("PRIVACY", "privacy", "Privacy Policy")} /> and{" "}
			<DocLink doc={by("DPA", "data-processing", "Data Processing Terms")} /> on behalf of my business.
		</>
	);
}

/** The platform default share of daily sales, when the server didn't say (docs/plan-daily-fees.md, Fee lock). */
export const DEFAULT_DEBIT_PCT = 1.5;

/** 1.2 → "1.2%", 2 → "2%". */
export function formatRatePct(rate: number | null | undefined): string {
	return `${Number((rate ?? DEFAULT_DEBIT_PCT).toFixed(3))}%`;
}

/**
 * The monthly invoice box (document key DEBIT). It states the rate this business's monthly invoice charges: `doc.ratePct` from the
 * server (the owner's agreed rate under a signed addendum, else the platform default); the acceptance records the same rate (acceptItem).
 */
export function DebitLabel({ doc, ratePct }: { doc?: Pick<LegalDoc, "url" | "slug" | "title" | "ratePct">; ratePct?: number | null }) {
	return (
		<>
			I agree to pay Hospio360&apos;s monthly invoice —{" "}
			<span data-testid="debit-rate">{formatRatePct(doc?.ratePct ?? ratePct)}</span> of my business&apos;s daily sales — within 7 days of
			issue.{" "}
			<DocLink doc={doc ?? { url: legalUrl("fees"), slug: "fees", title: "Fees and monthly invoice" }}>How the fee works</DocLink>
		</>
	);
}

/** Groups pending documents into the boxes to tick. */
export function boxesFor(docs: LegalDoc[]): LegalBox[] {
	const boxes: LegalBox[] = [];
	const owner = docs.filter((d) => OWNER_GROUP.includes(d.key));
	if (owner.length) boxes.push({ id: "owner", docs: owner, label: <OwnerTermsLabel docs={owner} /> });
	for (const d of docs) {
		if (OWNER_GROUP.includes(d.key)) continue;
		if (d.key === "DEBIT") boxes.push({ id: d.key, docs: [d], label: <DebitLabel doc={d} /> });
		else
			boxes.push({
				id: d.key,
				docs: [d],
				label: (
					<>
						I agree to the <DocLink doc={d} />.
					</>
				),
			});
	}
	return boxes;
}

export function TickBox({
	id,
	checked,
	onChange,
	children,
	disabled,
}: {
	id: string;
	checked: boolean;
	onChange: (v: boolean) => void;
	children: ReactNode;
	disabled?: boolean;
}) {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
			<Checkbox
				id={`legal-${id}`}
				checked={checked}
				disabled={disabled}
				onCheckedChange={(v) => onChange(v === true)}
				className="mt-0.5"
				aria-describedby={`legal-${id}-label`}
			/>
			<label htmlFor={`legal-${id}`} id={`legal-${id}-label`} className="text-sm leading-relaxed text-foreground">
				{children}
			</label>
		</div>
	);
}

/**
 * Shown over every screen while the signed-in person has documents to accept: the first time (owners who signed up before the
 * boxes existed, staff, marketers) or after a new version took effect. It can't be closed; the only ways out are accepting or signing out.
 */
export function LegalGate({
	pending,
	firstTime,
	marketer,
	signOut,
}: {
	pending: LegalDoc[];
	/** Nothing accepted yet: "Before you continue" rather than "We've updated our terms". */
	firstTime: boolean;
	marketer?: boolean;
	signOut: () => Promise<void> | void;
}) {
	const router = useRouter();
	const boxes = boxesFor(pending);
	const [ticked, setTicked] = useState<Record<string, boolean>>({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const all = boxes.every((b) => ticked[b.id]);

	async function accept() {
		setSaving(true);
		setError(null);
		const result = await acceptLegal({
			documents: pending.map(acceptItem),
			method: marketer && firstTime ? "PORTAL" : undefined,
		});
		setSaving(false);
		if (!result.ok) {
			setError(result.error);
			return;
		}
		router.refresh();
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="legal-gate-title"
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
			data-testid="legal-gate"
		>
			<div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl">
				<h2 id="legal-gate-title" className="text-lg font-semibold text-foreground">
					Before you continue
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					{firstTime ? "Please accept to continue." : "We've updated our terms. Please accept to continue."}
				</p>
				<div className="mt-4 space-y-3">
					{boxes.map((b) => (
						<TickBox key={b.id} id={b.id} checked={!!ticked[b.id]} onChange={(v) => setTicked((t) => ({ ...t, [b.id]: v }))}>
							{b.label}
						</TickBox>
					))}
				</div>
				{error && (
					<p role="alert" className="mt-3 text-sm text-destructive">
						{error}
					</p>
				)}
				<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
					<Button type="button" variant="ghost" onClick={() => void signOut()} disabled={saving}>
						Sign out
					</Button>
					<Button type="button" onClick={accept} disabled={!all || saving}>
						{saving ? "Saving…" : "Accept and continue"}
					</Button>
				</div>
			</div>
		</div>
	);
}
