"use client";

import { FileSignatureIcon } from "lucide-react";
import { useState } from "react";
import { acceptMarketerAgreement } from "@hospio/api/actions/marketer";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	MarketerMeData,
	MarketerProfileRow,
} from "@hospio/api/data/admin-types";
import { Checkbox } from "@hospio/ui/primitives/checkbox";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { agreementTerms } from "./shared";

/** The agreement's key terms as a list (the card, and the reminder once accepted). */
export function AgreementTerms({
	me,
	className,
}: {
	me: MarketerMeData;
	className?: string;
}) {
	return (
		<ul
			className={cn(
				"list-disc space-y-1 pl-5 text-[13px] text-ink-2",
				className,
			)}
		>
			{agreementTerms(me).map((t) => (
				<li key={t}>{t}</li>
			))}
		</ul>
	);
}

/**
 * The Referral Partner Agreement gate (POST /platform/marketer/agreement): until it is accepted the portal shows the key
 * terms with a tick box and Accept, and the referral link stays hidden.
 */
export function AgreementCard({
	me,
	onAccepted,
}: {
	me: MarketerMeData;
	onAccepted: (profile: MarketerProfileRow) => void;
}) {
	const [ticked, setTicked] = useState(false);
	const { run, pending } = useAction();
	const version = me.currentAgreementVersion;
	return (
		<SectionCard
			title="Referral Partner Agreement"
			subtitle={`Version ${version} · accept it to get your referral link`}
			bodyClassName="gap-4 pt-2"
			headerRight={<FileSignatureIcon className="size-5 text-brand" />}
		>
			<AgreementTerms me={me} />
			<label
				htmlFor="accept-rpa"
				className="flex items-start gap-3 text-[13px] font-medium text-ink"
			>
				<Checkbox
					id="accept-rpa"
					checked={ticked}
					onCheckedChange={(v) => setTicked(v === true)}
					className="mt-[2px]"
				/>
				<span>
					I have read and accept the Referral Partner Agreement (version{" "}
					{version})
				</span>
			</label>
			<button
				type="button"
				className={cn(btn.primary, "w-fit")}
				disabled={!ticked || pending}
				onClick={() =>
					run(
						() => acceptMarketerAgreement(version, me.profile),
						"Agreement accepted · your referral link is ready",
						onAccepted,
					)
				}
			>
				Accept
			</button>
		</SectionCard>
	);
}

/** "Accepted 2 Nov 2026 (RPA-2026-11)". */
export function acceptedLine(p: MarketerProfileRow, version: string) {
	return `Accepted ${p.agreementAcceptedAt ? fmtLongDate(p.agreementAcceptedAt) : ""} (${p.agreementVersion ?? version})`.replace(
		"Accepted  (",
		"Accepted (",
	);
}
