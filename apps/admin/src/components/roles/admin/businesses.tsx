"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BuildingIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { FieldRow, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtAgo, naira } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import {
	checkCity,
	checkEmail,
	checkName,
	checkPhone,
	only,
} from "@hospio/ui/shared/validate";
import { createBusiness } from "@hospio/api/actions/tenant";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import type {
	AdminUserRow,
	BusinessRow,
	MarketerRow,
} from "@hospio/api/data/types";
import type { PageResult } from "@hospio/api/data/paging";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { useListParams } from "@hospio/ui/shared/list-params";
import { cn } from "@hospio/ui/utils";
import {
	FeeLockField,
	feeLockValue,
	showFeeLockError,
	useFeeLock,
} from "./business/fee-lock";
import { can, HealthBar, ReadOnlyNote, StagePill } from "./shared";
import { venueLabel } from "@hospio/api/venue";

const STAGES = [
	"ALL",
	"LEAD",
	"ONBOARDING",
	"HANDED_OVER",
	"LIVE",
	"AT_RISK",
	"SUSPENDED",
] as const;
const stageLabel: Record<string, string> = {
	ALL: "All",
	LEAD: "Leads",
	ONBOARDING: "Onboarding",
	HANDED_OVER: "Handed over",
	LIVE: "Live",
	AT_RISK: "At risk",
	SUSPENDED: "Suspended",
};
/** The page header's fee line only makes sense once platform-service reports MRR; until then show counts. */

/**
 * Admin · Businesses (hotels, lounges, bars, restaurants): one page at a time from tenant-service (`?stage=&q=&page=` in the URL), with the stage
 * counts, hotels and rooms over the search from the server, so every page and tab reads the same totals.
 */
export function BusinessesScreen({
	role,
	result,
	marketers,
	admins = [],
}: {
	role: AdminRole;
	result: PageResult<BusinessRow>;
	marketers: MarketerRow[];
	admins?: AdminUserRow[];
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["stage"] });
	const [isNew, setNew] = useQueryState("new");
	// Set when a business was just created: the panel closes without touching the URL (a nuqs write
	// here would cancel a client-side push) and the browser loads the wizard afresh. A soft push here
	// left the app router's action queue stuck behind the create action's revalidation, so the first
	// save on the wizard never reached the server unless the admin waited several seconds.
	const [createdId, setCreatedId] = useState<string | null>(null);
	useEffect(() => {
		if (createdId)
			window.location.assign(`/dashboard/onboarding/${createdId}?created=1`);
	}, [createdId]);
	const page = result.data;
	const counts = page.counts ?? {};
	const active = (list.params.stage ?? "ALL") as (typeof STAGES)[number];

	const columns: ColumnDef<BusinessRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.name}
					secondary={`${row.original.ownerName} · ${row.original.city}`}
				/>
			),
		},
		{
			accessorKey: "stage",
			header: "Stage",
			cell: ({ row }) => (
				<span className="flex items-center gap-2">
					<StagePill stage={row.original.stage} />
					{row.original.source === "SELF_SERVE" && (
						<span className="text-[11px] text-ink-3">self-serve</span>
					)}
				</span>
			),
		},
		{
			accessorKey: "hotels",
			header: "Locations · rooms",
			cell: ({ row }) => {
				// A lounge, bar or restaurant shows its kind, not "0 rooms" (hospio-backend docs/plan-venue-type.md).
				const kinds = (row.original.venueTypes ?? []).filter((t) => t !== "HOTEL");
				return (
					<span>
						{row.original.hotels} ·{" "}
						{kinds.length > 0 && row.original.rooms === 0
							? kinds.map((k) => venueLabel(k)).join(", ")
							: row.original.rooms}
					</span>
				);
			},
		},
		{ accessorKey: "accountManager", header: "Account manager" },
		{
			accessorKey: "health",
			header: "Health",
			cell: ({ row }) => <HealthBar value={row.original.health} />,
		},
		{
			accessorKey: "mrr",
			header: "Monthly fee",
			cell: ({ row }) => (
				<span className="font-semibold">
					{row.original.mrr ? naira(row.original.mrr) : "—"}
				</span>
			),
		},
		{
			accessorKey: "adoption",
			header: "Adoption",
			cell: ({ row }) => <span>{row.original.adoption}%</span>,
		},
		{
			accessorKey: "openTickets",
			header: "Tickets",
			cell: ({ row }) => (
				<span
					className={cn(
						row.original.openTickets >= 2 && "font-semibold text-warning",
					)}
				>
					{row.original.openTickets}
				</span>
			),
		},
		{
			accessorKey: "dueFees",
			header: "Fees due",
			cell: ({ row }) => (
				<span
					className={cn(
						row.original.dueFees > 0 && "font-semibold text-danger",
					)}
				>
					{row.original.dueFees ? naira(row.original.dueFees) : "—"}
				</span>
			),
		},
		{
			accessorKey: "lastActive",
			header: "Last active",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{row.original.lastActive ? fmtAgo(row.original.lastActive) : "never"}
				</span>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Businesses"
				subtitle={`${counts.all ?? page.total} businesses · ${counts.hotels ?? 0} locations · ${counts.rooms ?? 0} rooms${list.params.q ? ` matching “${list.params.q}”` : ""}`}
			>
				<ExportButton />
				{can.editBusiness(role) && (
					<button
						type="button"
						onClick={() => setNew("1")}
						className={cn(btn.primary, "flex items-center gap-2")}
					>
						<UserPlusIcon className="size-4" /> Set up a business for them
					</button>
				)}
			</PageHeader>
			{!can.editBusiness(role) && (
				<ReadOnlyNote>
					Finance admin sees every business but changes are made by Support or a
					Super admin.
				</ReadOnlyNote>
			)}
			<Toolbar
				left={
					<PillTabs
						tabs={STAGES.map((s) => ({
							key: s,
							label: stageLabel[s],
							count: s === "ALL" ? (counts.all ?? 0) : (counts[s] ?? 0),
						}))}
						value={active}
						onChange={(k) => list.set({ stage: k === "ALL" ? null : k })}
					/>
				}
				right={
					<SearchBox
						value={list.search}
						onChange={list.setSearch}
						placeholder="Search business, owner, email, city…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={page.content}
				server={{
					page,
					onPage: list.goTo,
					sort: list.sort,
					onSort: list.setSort,
					sortKeys: { name: "name", stage: "stage" },
				}}
				filtered={list.filtered}
				onClearFilters={list.clear}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={(b) => router.push(`/dashboard/businesses/${b.id}`)}
				emptyTitle="No businesses here"
				emptyHint="Try another stage or clear the search."
			/>

			<NewBusinessPanel
				open={isNew === "1" && !createdId}
				onOpenChange={(o) => void setNew(o ? "1" : null)}
				onCreated={(business) => setCreatedId(business.id)}
				marketers={marketers}
				admins={admins}
			/>
		</>
	);
}

/**
 * Admin — C3 · Onboard a business (POST /tenant/businesses, source BACK_OFFICE). The business lands at
 * stage ONBOARDING with its draft at step 1 and the wizard opens. The backend records the creator as the
 * account manager; the list here is the demo team until identity lists platform staff.
 */
export function NewBusinessPanel({
	open,
	onOpenChange,
	onCreated,
	marketers,
	admins = [],
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	/** Called with the new business; the parent closes the panel and opens the wizard. */
	onCreated?: (business: { id: string }) => void;
	marketers: MarketerRow[];
	admins?: AdminUserRow[];
}) {
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [name, setName] = useState("");
	const [owner, setOwner] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");
	// One fee model: a % of each day's sales, billed on the business's monthly invoice. Only the rate varies.
	// Fee lock: the platform default unless a signed addendum says otherwise.
	const lock = useFeeLock(null, null);
	const [marketer, setMarketer] = useState("");
	const [manager, setManager] = useState("");
	const [errors, setErrors] = useState<NewBusinessErrors>({});
	const adminOptions = admins
		.filter((a) => a.status === "ACTIVE" && a.role !== "FINANCE_ADMIN")
		.map((a) => ({
			value: a.id,
			label: a.fullName,
			hint: a.role === "SUPER_ADMIN" ? "Super admin" : "Support",
		}));

	/** Each field's problem, the same rules the API applies (tenant's Fields.java). */
	const validate = (): NewBusinessErrors =>
		only({
			owner: checkName(owner, "the owner's full name"),
			email: checkEmail(email),
			phone: checkPhone(phone, false),
			name: checkName(name, "the business name"),
			city: checkCity(city),
		});
	// A field fixed after a failed try loses its message as soon as it is right.
	const edit =
		<T,>(set: (v: T) => void, field: keyof NewBusinessErrors) =>
		(v: T) => {
			set(v);
			if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
		};

	const create = async () => {
		const found = validate();
		setErrors(found);
		const fee = feeLockValue(lock);
		if (Object.keys(found).length || !fee) return;
		setPending(true);
		try {
			const result = await createBusiness({
				name: name.trim(),
				city: city.trim(),
				ownerName: owner.trim(),
				ownerEmail: email.trim().toLowerCase(),
				ownerPhone: phone.trim() || null,
				feeModel: "PERCENT_OF_SALES",
				feeValue: fee.feeValue,
				feeAddendumRef: fee.feeAddendumRef,
				marketerId: marketer || null,
				source: "BACK_OFFICE",
			});
			if (!result.ok) {
				// The server's sentence goes under the field it is about (a duplicate email, phone or name).
				const field = fieldOfError(result.error);
				if (field === "fee") showFeeLockError(lock, result.error);
				else if (field) setErrors({ [field]: result.error });
				else toast.error(result.error, { duration: 8000 });
				return;
			}
			toast.success(`${name.trim()} created · onboarding started`);
			// The panel must close before the page changes (an open Sheet leaves `pointer-events: none`
			// on <body> when it unmounts mid-navigation, and nothing on the wizard can be clicked), but
			// not through the URL: clearing `?new=1` with nuqs a moment later cancels the push.
			if (onCreated) onCreated(result.data);
			else {
				onOpenChange(false);
				router.push(`/dashboard/onboarding/${result.data.id}`);
			}
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "The business could not be created",
			);
		} finally {
			setPending(false);
		}
	};

	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Set up a business for them"
			subtitle="Creates the business and starts the 10-step back-office onboarding"
			icon={BuildingIcon}
			width="md"
			footerInfo="The owner's login is made at handover, with a temporary password shown once."
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={pending}
						className={btn.primary}
						onClick={() => void create()}
					>
						Create business
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				{Object.keys(errors).length > 0 && (
					<p className="text-xs font-medium text-danger" role="alert">
						Fix the fields marked in red to create the business.
					</p>
				)}
				<PanelSection title="Owner">
					<TextField
						label="Owner's full name"
						value={owner}
						onChange={edit(setOwner, "owner")}
						placeholder="e.g. Haruna Dauda"
						required
						error={errors.owner}
					/>
					<FieldRow>
						<TextField
							label="Email"
							type="email"
							value={email}
							onChange={edit(setEmail, "email")}
							placeholder="e.g. owner@hotel.com"
							required
							error={errors.email}
						/>
						<TextField
							label="Phone"
							value={phone}
							onChange={edit(setPhone, "phone")}
							placeholder="e.g. +234 803 555 0192"
							error={errors.phone}
							hint="Optional · one business per phone number"
						/>
					</FieldRow>
				</PanelSection>
				<PanelSection title="Business">
					<TextField
						label="Business name"
						value={name}
						onChange={edit(setName, "name")}
						placeholder="e.g. Zuma Heights Hotels Ltd"
						required
						error={errors.name}
					/>
					<FieldRow>
						<TextField
							label="City"
							value={city}
							onChange={edit(setCity, "city")}
							placeholder="e.g. Abuja"
							required
							error={errors.city}
						/>
						<SelectField
							label="Account manager"
							value={manager}
							onChange={setManager}
							options={adminOptions}
							placeholder="You"
							hint="Set to you on create; change it on the business page."
							disabled={adminOptions.length === 0}
						/>
					</FieldRow>
				</PanelSection>
				<PanelSection title="Hospio360 fee">
					<p className="text-[13px] text-ink-2">
						{feeModelLabels.PERCENT_OF_SALES}: a share of each day's sales, billed on one Hospio360 invoice each month (issued on
						the 1st, due 7 days later). Nothing is debited.
					</p>
					<FeeLockField lock={lock} />
				</PanelSection>
				<PanelSection title="Referred by">
					<SelectField
						label="Marketer"
						value={marketer}
						onChange={setMarketer}
						placeholder="Nobody · direct"
						options={marketers
							.filter((m) => m.status !== "ENDED")
							.map((m) => ({
								value: m.id,
								label: m.fullName,
								hint: `${m.sharePct}% for ${m.months} months`,
							}))}
						hint="The marketer earns a share of the platform fee collected from this business, for the agreed months from its first collected fee."
					/>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

type NewBusinessErrors = Partial<
	Record<"owner" | "email" | "phone" | "name" | "city" | "fee", string>
>;

/** Which field a refusal from tenant-service is about, so it shows under that field. */
function fieldOfError(message: string): keyof NewBusinessErrors | null {
	if (/already has an account|email/i.test(message)) return "email";
	if (/phone/i.test(message)) return "phone";
	if (/owner's full name/i.test(message)) return "owner";
	if (/business called|business name/i.test(message)) return "name";
	if (/city/i.test(message)) return "city";
	if (/share|fee|addendum/i.test(message)) return "fee";
	return null;
}
