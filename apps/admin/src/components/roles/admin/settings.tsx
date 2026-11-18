"use client";

import { PlugIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { DeviceCatalogueSettings } from "./devices/devices-admin";
import { useState } from "react";
import { saveSettings } from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	PlatformSettingsData,
	SettingsGroup,
} from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import {
	FieldRow,
	SelectField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { can, ReadOnlyNote } from "./shared";

const str = (v: unknown, d = "") => (v == null ? d : String(v));
const num = (v: unknown, d = 0) =>
	v == null || v === "" || Number.isNaN(Number(v)) ? d : Number(v);
const bool = (v: unknown) => v === true || v === "true";

/** Admin — I2 · Platform settings: GET/PUT /platform/admin/settings/{group}. Provider keys are on Platform → Integrations. */
export function SettingsScreen({
	role,
	settings: initial,
}: {
	role: AdminRole;
	settings: PlatformSettingsData;
}) {
	const [tab, setTab] = useQueryState("tab");
	const [s, setS] = useState(initial);
	const [dirty, setDirty] = useState<Partial<Record<SettingsGroup, boolean>>>(
		{},
	);
	const { run, pending } = useAction();
	const editable = can.settings(role);
	const active = tab ?? "general";
	const set = (group: SettingsGroup, key: string, value: unknown) => {
		setS((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
		setDirty((d) => ({ ...d, [group]: true }));
	};
	const save = (group: SettingsGroup) =>
		editable ? (
			<div className="flex justify-end">
				<button
					type="button"
					disabled={pending || !dirty[group]}
					className={btn.primary}
					onClick={() =>
						run(
							() => saveSettings(group, s[group]),
							"Settings saved",
							(saved) => {
								setS((prev) => ({ ...prev, [group]: saved }));
								setDirty((d) => ({ ...d, [group]: false }));
							},
						)
					}
				>
					Save changes
				</button>
			</div>
		) : null;
	const g = s.general;
	const f = s.fees;
	const sec = s.security;

	return (
		<>
			<PageHeader
				title="Platform settings"
				subtitle="How Hospio360 itself runs: company details, default fees and security"
			>
				{editable && (
					<Link
						href="/dashboard/integrations"
						className={cn(btn.secondary, "flex items-center gap-2")}
					>
						<PlugIcon className="size-4" /> Provider keys are in Integrations
					</Link>
				)}
			</PageHeader>
			{!editable && (
				<ReadOnlyNote>
					Only a Super admin changes platform settings.
				</ReadOnlyNote>
			)}
			<PillTabs
				tabs={[
					{ key: "general", label: "General" },
					{ key: "fees", label: "Fee defaults" },
					{ key: "devices", label: "Device catalogue" },
					{ key: "security", label: "Security" },
				]}
				value={active}
				onChange={(k) => void setTab(k === "general" ? null : k)}
			/>

			{active === "general" && (
				<SectionCard
					title="Company"
					subtitle="Shown on statements, emails and the sign-in page"
					bodyClassName="gap-4 pt-2"
				>
					<TextField
						label="Company name"
						value={str(g.company)}
						onChange={(v) => set("general", "company", v)}
						disabled={!editable}
					/>
					<FieldRow>
						<TextField
							label="Support email"
							value={str(g.supportEmail)}
							onChange={(v) => set("general", "supportEmail", v)}
							disabled={!editable}
						/>
						<TextField
							label="Support WhatsApp"
							value={str(g.supportWhatsApp)}
							onChange={(v) => set("general", "supportWhatsApp", v)}
							disabled={!editable}
						/>
					</FieldRow>
					<FieldRow>
						<TextField
							label="Website"
							value={str(g.website)}
							onChange={(v) => set("general", "website", v)}
							disabled={!editable}
						/>
						<SelectField
							label="Time zone"
							value={str(g.timezone, "Africa/Lagos")}
							onChange={(v) => set("general", "timezone", v)}
							options={["Africa/Lagos", "Africa/Accra", "Africa/Nairobi"]}
							disabled={!editable}
						/>
					</FieldRow>
					{save("general")}
				</SectionCard>
			)}

			{active === "devices" && <DeviceCatalogueSettings editable={editable} />}

			{active === "fees" && (
				<div className="grid gap-4 xl:grid-cols-2">
					<SectionCard
						title="Default fee"
						subtitle="A share of daily sales, billed monthly · applied to new businesses"
						bodyClassName="gap-4 pt-2"
					>
						<p className="text-[13px] text-ink-2">
							One fee model: a share of each day's sales, billed on one Hospio360 invoice each month (issued on the 1st, due 7 days
							later). Nothing is debited. New businesses start at this rate; each one's rate can be changed in Fees &amp; billing.
						</p>
						<TextField
							label="Default share of daily sales (%)"
							value={str(f.revenuePct)}
							onChange={(v) => set("fees", "revenuePct", num(v))}
							disabled={!editable}
						/>
						<FieldRow>
							<TextField
								label="Free trial (days)"
								value={str(f.trialDays)}
								onChange={(v) => set("fees", "trialDays", num(v))}
								disabled={!editable}
							/>
							<TextField
								label="Statement due on day"
								value={str(f.dueDay)}
								onChange={(v) => set("fees", "dueDay", num(v))}
								disabled={!editable}
							/>
						</FieldRow>
						<FieldRow>
							<TextField
								label="Grace days before overdue"
								value={str(f.graceDays)}
								onChange={(v) => set("fees", "graceDays", num(v))}
								disabled={!editable}
							/>
							<TextField
								label="Provider fee (%)"
								value={str(f.providerFeePct)}
								onChange={(v) => set("fees", "providerFeePct", num(v))}
								disabled={!editable}
								hint="Taken by the POS provider on each settlement"
							/>
						</FieldRow>
						<TextField
							label="Hospio360 share of card and transfer (%)"
							value={str(f.hmsSharePct)}
							onChange={(v) => set("fees", "hmsSharePct", num(v))}
							disabled={!editable}
						/>
						<FieldRow>
							<TextField
								label="Invoice VAT (%)"
								value={str(f.invoiceVatPct ?? 0)}
								onChange={(v) => set("fees", "invoiceVatPct", num(v))}
								disabled={!editable}
								hint="VAT on Hospio360 invoices; 0 = not charged — confirm with the accountant"
							/>
							<TextField
								label="Invoice minimum (₦)"
								value={str(f.invoiceMinimum ?? 1000)}
								onChange={(v) => set("fees", "invoiceMinimum", num(v))}
								disabled={!editable}
								hint="A month whose total is under this is carried into the next month's invoice"
							/>
						</FieldRow>
						{save("fees")}
					</SectionCard>
					<SectionCard
						title="Marketer commissions"
						subtitle="The money model from the developer handoff"
						bodyClassName="gap-4 pt-2"
					>
						<FieldRow>
							<TextField
								label="Share of the platform fee collected (%)"
								value={str(f.marketerSharePct)}
								onChange={(v) => set("fees", "marketerSharePct", num(v))}
								disabled={!editable}
							/>
							<TextField
								label="Months paid"
								value={str(f.marketerMonths)}
								onChange={(v) => set("fees", "marketerMonths", num(v))}
								disabled={!editable}
							/>
						</FieldRow>
						<TextField
							label="Withholding tax (%)"
							value={str(f.whtPct)}
							onChange={(v) => set("fees", "whtPct", num(v))}
							disabled={!editable}
							hint="Deducted on every marketer statement and remitted to FIRS."
						/>
						{save("fees")}
					</SectionCard>
				</div>
			)}

			{active === "security" && (
				<SectionCard
					title="Security"
					subtitle="For the Hospio360 team; hotels set their own rules in Hotel setup"
					bodyClassName="gap-3 pt-2"
				>
					<ToggleField
						label="Require 2-step sign-in for every admin"
						hint="Authenticator app"
						checked={bool(sec.require2Step)}
						onChange={(v) => editable && set("security", "require2Step", v)}
					/>
					<ToggleField
						label="Only allow admin sign-in from office IPs"
						hint="Off · remote team"
						checked={bool(sec.adminIpAllowlist)}
						onChange={(v) => editable && set("security", "adminIpAllowlist", v)}
					/>
					<FieldRow>
						<SelectField
							label="Session length"
							value={str(sec.sessionHours, "12")}
							onChange={(v) => set("security", "sessionHours", num(v))}
							options={[
								{ value: "4", label: "4 hours" },
								{ value: "12", label: "12 hours" },
								{ value: "24", label: "24 hours" },
							]}
							disabled={!editable}
						/>
						<SelectField
							label="Keep activity logs for"
							value={str(sec.auditRetentionDays, "183")}
							onChange={(v) => set("security", "auditRetentionDays", num(v))}
							options={[
								{ value: "90", label: "90 days" },
								{ value: "183", label: "6 months" },
								{ value: "365", label: "1 year" },
								{ value: "1825", label: "5 years" },
							]}
							disabled={!editable}
						/>
					</FieldRow>
					{save("security")}
				</SectionCard>
			)}

		</>
	);
}
