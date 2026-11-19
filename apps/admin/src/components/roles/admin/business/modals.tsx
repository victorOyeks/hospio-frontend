"use client";

import { ShieldAlertIcon, UserCog2Icon } from "lucide-react";
import { useState } from "react";
import {
	assignAccountManager,
	changeBusinessStage,
} from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { BusinessStage } from "@hospio/api/api/schema";
import type { AdminUserRow, BusinessRow } from "@hospio/api/data/types";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { refreshBusiness } from "../onboarding/shared";
import { stageMeta } from "../shared";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { SuspendModal } from "./suspension";

const STAGES: BusinessStage[] = [
	"LEAD",
	"ONBOARDING",
	"HANDED_OVER",
	"LIVE",
	"AT_RISK",
	"SUSPENDED",
	"CHURNED",
];
const stageHint: Record<BusinessStage, string> = {
	LEAD: "Talking, nothing set up yet",
	ONBOARDING: "Hospio360 or the owner is setting it up",
	HANDED_OVER: "Waiting for the owner to accept",
	LIVE: "Hotels in daily use",
	AT_RISK: "Fees overdue or usage dropping",
	SUSPENDED: "Everyone at the business is locked out until reactivated",
	CHURNED: "Left Hospio360",
};

/**
 * C11 · Change stage (PUT /tenant/businesses/{id}/stage). Choosing Suspended opens the suspension step (reason type, note, the
 * 7 days' notice; hospio-backend docs/suspension.md). A suspended business is reactivated from its suspension card, not here.
 */
export function ChangeStageModal({
	open,
	onOpenChange,
	business,
	onSaved,
	role,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	onSaved: (b: BusinessRow) => void;
	role: AdminRole;
}) {
	const { run, pending } = useAction();
	const [stage, setStage] = useState<BusinessStage>(business.stage);
	const [reason, setReason] = useState("");
	const suspending = stage === "SUSPENDED";
	const valid = stage !== business.stage && !suspending;
	if (open && suspending && business.stage !== "SUSPENDED")
		return (
			<SuspendModal
				open
				onOpenChange={onOpenChange}
				businessId={business.id}
				businessName={business.name}
				role={role}
				onBack={() => setStage(business.stage)}
				onDone={() => onSaved({ ...business, stage: "SUSPENDED" })}
			/>
		);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Change stage"
			subtitle={`${business.name} · now ${stageMeta[business.stage]?.label ?? business.stage}`}
			icon={suspending ? ShieldAlertIcon : undefined}
			tone={suspending ? "danger" : "default"}
			size="confirm"
			footerInfo="To suspend, choose Suspended: it asks for the reason type and the notice date, and locks everyone at the business out."
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
						className={suspending ? btn.danger : btn.primary}
						disabled={!valid || pending}
						onClick={() =>
							run(
								() =>
									changeBusinessStage(
										business.id,
										stage,
										reason.trim() || undefined,
									),
								`${business.name} is now ${stageMeta[stage]?.label ?? stage}`,
								(b) => onSaved(refreshBusiness(business, b)),
							)
						}
					>
						{suspending ? "Suspend business" : "Change stage"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="New stage"
					value={stage}
					onChange={(v) => setStage(v as BusinessStage)}
					options={STAGES.filter((s) => s !== "SUSPENDED" || business.stage === "LIVE" || business.stage === "AT_RISK").map((s) => ({
						value: s,
						label: stageMeta[s]?.label ?? s,
						hint: stageHint[s],
					}))}
				/>
				{suspending && (
					<WhatHappens
						tone="danger"
						items={[
							"All owner, manager and staff sessions end now",
							"Guest data and money records stay intact",
							"Reactivate by changing the stage back to Live",
						]}
					/>
				)}
				<TextareaField
					label={suspending ? "Reason (required)" : "Reason (optional)"}
					value={reason}
					onChange={setReason}
					rows={2}
					placeholder={
						suspending
							? "Fees overdue 90 days · ticket #4412"
							: "Why the stage is changing"
					}
					hint={
						suspending
							? "At least 8 characters. Goes in the log and to the owner."
							: undefined
					}
					error={
						suspending && reason.length > 0 && reason.trim().length < 8
							? "Say a little more"
							: undefined
					}
				/>
			</div>
		</Modal>
	);
}

/** C10 · Change account manager (PUT /tenant/businesses/{id}/account-manager?adminId=). */
export function ChangeManagerModal({
	open,
	onOpenChange,
	business,
	admins,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	admins: AdminUserRow[];
	onSaved: (b: BusinessRow) => void;
}) {
	const { run, pending } = useAction();
	const [adminId, setAdminId] = useState(business.accountManagerId ?? "");
	const options = admins
		.filter((a) => a.status === "ACTIVE" && a.role !== "FINANCE_ADMIN")
		.map((a) => ({
			value: a.id,
			label: a.fullName,
			hint: a.role === "SUPER_ADMIN" ? "Super admin" : "Support",
		}));
	const chosen = admins.find((a) => a.id === adminId);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Change account manager"
			subtitle={`${business.name} · now ${business.accountManager}`}
			icon={UserCog2Icon}
			size="confirm"
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
						className={btn.primary}
						disabled={
							!adminId || adminId === business.accountManagerId || pending
						}
						onClick={() =>
							run(
								() => assignAccountManager(business.id, adminId),
								`${chosen?.fullName ?? "New manager"} now looks after ${business.name}`,
								(b) =>
									onSaved({
										...refreshBusiness(business, b),
										accountManager: chosen?.fullName ?? business.accountManager,
										accountManagerId: adminId,
									}),
							)
						}
					>
						Change
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Account manager"
					value={adminId}
					onChange={setAdminId}
					options={options}
					placeholder="Choose an admin"
					hint="Platform staff are listed from the team page until identity lists them."
				/>
				<WhatHappens
					items={[
						"The new manager sees this business on their dashboard",
						"Open tickets and onboarding stay as they are",
						"The owner sees the new name on their Company page",
					]}
				/>
			</div>
		</Modal>
	);
}
