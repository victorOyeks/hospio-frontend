"use client";

import { SHARE_CHANNELS } from "@hospio/api/api/routes-legal";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { CHANNEL_LABELS } from "@hospio/ui/shared/legal-records";

/** How the back office shared the legal links with an owner it onboards (hospio-backend docs/legal-acceptance.md). */
export type LinksShared = { channel: string; sharedOn: string; note: string };

export const lagosToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export const emptyLinksShared = (): LinksShared => ({ channel: "", sharedOn: lagosToday(), note: "" });

export const linksSharedReady = (v: LinksShared) => !!v.channel && !!v.sharedOn && (v.channel !== "OTHER" || v.note.trim().length > 0);

export function LinksSharedFields({ value, onChange }: { value: LinksShared; onChange: (v: LinksShared) => void }) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-line p-3" data-testid="links-shared">
			<p className="text-[13px] text-ink-2">
				Send the owner the links to the Terms of Service, Privacy Policy, Data Processing Terms and Fees (hospio360.com/legal). You don&apos;t
				accept for them: they tick the two boxes themselves at their first sign-in. Record how you shared the links.
			</p>
			<div className="grid gap-3 sm:grid-cols-2">
				<SelectField
					label="Links shared by"
					value={value.channel}
					onChange={(channel) => onChange({ ...value, channel })}
					options={SHARE_CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABELS[c] ?? c }))}
					required
				/>
				<TextField label="On" type="date" value={value.sharedOn} onChange={(sharedOn) => onChange({ ...value, sharedOn })} />
			</div>
			<TextField
				label={value.channel === "OTHER" ? "How (required)" : "Note (optional)"}
				value={value.note}
				onChange={(note) => onChange({ ...value, note })}
				placeholder="e.g. sent to the owner's WhatsApp +234…"
			/>
		</div>
	);
}
