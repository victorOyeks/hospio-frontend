"use client";

import {
	ArrowRightIcon,
	PencilIcon,
	ShieldAlertIcon,
	UserCog2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import type {
	AdminUserRow,
	BusinessRow,
	HotelSummary,
	PortalUserRow,
} from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { EditAsHmsPanel, EditBusinessPanel } from "./business/edit-business";
import { HotelsTab } from "./business/hotels-tab";
import { ChangeManagerModal, ChangeStageModal } from "./business/modals";
import { OverviewTab } from "./business/overview-tab";
import { PeopleTab } from "./business/people-tab";
import { type BusinessLocalTab, BusinessTabStrip } from "./business-tabs/nav";
import { Crumbs, can, ReadOnlyNote, StagePill } from "./shared";
import { SupportAccessButton } from "./support-access-button";

/**
 * Admin — C2 · one business: a header with who and where it is and what can be done to it, then one strip for everything
 * about it. Overview, Hotels and People are tabs here (`?tab=`); a hotel opens in a side panel (`?hotel=`). Usage, Money,
 * Support and Contract & activity are their own pages. Change stage (C11), Change account manager (C10) and Edit business
 * write to tenant; Edit as Hospio360 does the same edit and records the change with its reason; View as owner opens the hotel
 * app read only. The forms and tabs live in ./business/.
 */

/** Tabs this page used to draw itself, now pages of their own: old links land on the page that has the same list. */
const MOVED: Record<string, string> = {
	fees: "money",
	tickets: "support",
	changes: "activity",
};

export function BusinessPage({
	role,
	business: initial,
	hotels,
	users,
	admins,
}: {
	role: AdminRole;
	business: BusinessRow;
	hotels: HotelSummary[];
	users: PortalUserRow[];
	admins: AdminUserRow[];
}) {
	const router = useRouter();
	const [business, setBusiness] = useState(initial);
	useEffect(() => setBusiness(initial), [initial]);
	const [action, setAction] = useQueryState("action");
	const [tab, setTab] = useQueryState(
		"tab",
		parseAsString.withOptions({ history: "push", scroll: false }),
	);
	const close = () => void setAction(null);
	const editable = can.editBusiness(role);
	const moved = tab ? MOVED[tab] : undefined;
	useEffect(() => {
		if (moved) router.replace(`/dashboard/businesses/${business.id}/${moved}`);
	}, [moved, business.id, router]);
	const current: BusinessLocalTab =
		tab === "hotels" || tab === "users" ? tab : "overview";
	const saved = (b: BusinessRow) => {
		setBusiness(b);
		close();
	};

	return (
		<>
			<Crumbs
				items={[
					{ label: "Businesses", href: "/dashboard/businesses" },
					{ label: business.name },
				]}
			/>
			<PageHeader
				title={business.name}
				subtitle={
					<span className="flex flex-wrap items-center gap-2">
						<StagePill stage={business.stage} />
						<span>
							Owner {business.ownerName} · {business.city || "—"} · since{" "}
							{fmtLongDate(business.since)}
						</span>
						{business.source && (
							<StatusPill tone="grey" dot={false}>
								{business.source === "SELF_SERVE"
									? "self-serve"
									: "back office"}
							</StatusPill>
						)}
						<span className="text-ink-3">
							Account manager: {business.accountManager}
						</span>
					</span>
				}
			>
				<SupportAccessButton
					businessId={business.id}
					businessName={business.name}
				/>
				{editable && (
					<button
						type="button"
						onClick={() => setAction("stage")}
						className={btn.secondary}
					>
						Change stage
					</button>
				)}
				{editable &&
					business.stage === "ONBOARDING" &&
					business.source !== "SELF_SERVE" && (
						<Link
							href={`/dashboard/onboarding/${business.id}`}
							className={cn(btn.primary, "flex items-center gap-2")}
						>
							Continue onboarding <ArrowRightIcon className="size-4" />
						</Link>
					)}
				{editable && (
					<RowActions
						actions={[
							{
								label: "Edit business",
								icon: PencilIcon,
								onClick: () => setAction("edit"),
							},
							{
								label: "Change account manager",
								icon: UserCog2Icon,
								onClick: () => setAction("manager"),
							},
							{
								label: "Edit as Hospio360",
								icon: ShieldAlertIcon,
								separatorBefore: true,
								onClick: () => setAction("hms"),
							},
						]}
					/>
				)}
			</PageHeader>
			{!editable && (
				<ReadOnlyNote>
					You can see everything about this business. Edits, stage changes and
					people actions are done by Support or a Super admin.
				</ReadOnlyNote>
			)}

			<BusinessTabStrip
				businessId={business.id}
				active={current}
				onLocal={(k) => void setTab(k === "overview" ? null : k)}
				counts={{ hotels: hotels.length, users: users.length }}
			/>

			{current === "overview" && (
				<OverviewTab business={business} hotels={hotels} />
			)}
			{current === "hotels" && (
				<HotelsTab business={business} hotels={hotels} role={role} />
			)}
			{current === "users" && (
				<PeopleTab business={business} users={users} editable={editable} />
			)}

			<EditBusinessPanel
				open={action === "edit"}
				onOpenChange={(o) => (o ? setAction("edit") : close())}
				business={business}
				onSaved={saved}
			/>
			<ChangeStageModal
				open={action === "stage"}
				onOpenChange={(o) => (o ? setAction("stage") : close())}
				business={business}
				onSaved={saved}
			/>
			<ChangeManagerModal
				open={action === "manager"}
				onOpenChange={(o) => (o ? setAction("manager") : close())}
				business={business}
				admins={admins}
				onSaved={saved}
			/>
			<EditAsHmsPanel
				open={action === "hms"}
				onOpenChange={(o) => (o ? setAction("hms") : close())}
				business={business}
				onSaved={(b) => saved(b)}
			/>
		</>
	);
}
