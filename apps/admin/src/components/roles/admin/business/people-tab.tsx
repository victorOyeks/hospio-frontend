"use client";

import { KeyRoundIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
	pauseAll,
	resendInvite,
	resetPassword,
} from "@hospio/api/actions/identity";
import { useAction } from "@hospio/api/actions/use-action";
import type { UserCreated } from "@hospio/api/api/schema";
import type { BusinessRow, PortalUserRow } from "@hospio/api/data/types";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { fmtAgo } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { CopyButton, inviteLink } from "../onboarding/shared";

/** Business · People: everyone with a login at the business; Support and Super admin can reset, re-invite or pause them. */
export function PeopleTab({
	business,
	users: initialUsers,
	editable,
}: {
	business: BusinessRow;
	users: PortalUserRow[];
	editable: boolean;
}) {
	const { run } = useAction();
	const [users, setUsers] = useState(initialUsers);
	useEffect(() => setUsers(initialUsers), [initialUsers]);
	const [secret, setSecret] = useState<{
		user: PortalUserRow;
		created: UserCreated;
		what: "password" | "invite";
	} | null>(null);
	const patchUser = (u: PortalUserRow) =>
		setUsers((list) => list.map((x) => (x.userId === u.userId ? u : x)));

	return (
		<>
			<DataTable
				data={users}
				columns={[
					{
						accessorKey: "fullName",
						header: "Person",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.fullName}
								secondary={row.original.email}
							/>
						),
					},
					{
						accessorKey: "role",
						header: "Role",
						cell: ({ row }) => (
							<span>
								{isHotelRole(row.original.role)
									? roleLabels[row.original.role]
									: row.original.role}
								{row.original.hotel ? ` · ${row.original.hotel}` : ""}
							</span>
						),
					},
					{
						accessorKey: "status",
						header: "Status",
						cell: ({ row }) => (
							<StatusPill
								tone={
									row.original.status === "ACTIVE"
										? "success"
										: row.original.status === "INVITED"
											? "info"
											: row.original.status === "SUSPENDED"
												? "danger"
												: "grey"
								}
							>
								{row.original.status === "INVITED" &&
								row.original.inviteStatus === "EXPIRED"
									? "invite expired"
									: row.original.status.toLowerCase()}
							</StatusPill>
						),
					},
					{
						accessorKey: "lastSignIn",
						header: "Last sign-in",
						cell: ({ row }) => (
							<span className="text-ink-3">
								{row.original.lastSignIn
									? fmtAgo(row.original.lastSignIn)
									: "never"}
							</span>
						),
					},
					{
						id: "actions",
						header: "",
						cell: ({ row }) =>
							editable ? (
								<RowActions
									actions={[
										{
											label: "Reset password",
											icon: KeyRoundIcon,
											onClick: () =>
												run(
													() =>
														resetPassword(row.original.userId, business.id),
													`Temporary password for ${row.original.fullName}`,
													(created) =>
														setSecret({
															user: row.original,
															created,
															what: "password",
														}),
												),
										},
										{
											label: "Resend invite",
											onClick: () =>
												run(
													() =>
														resendInvite(row.original.userId, business.id),
													`New invite for ${row.original.fullName}`,
													(created) =>
														setSecret({
															user: row.original,
															created,
															what: "invite",
														}),
												),
											disabled: row.original.status === "ACTIVE",
										},
										{
											label:
												row.original.status === "PAUSED"
													? "Resume access"
													: "Pause access",
											tone:
												row.original.status === "PAUSED"
													? "default"
													: "danger",
											separatorBefore: true,
											onClick: () =>
												run(
													() =>
														pauseAll(
															row.original.userId,
															row.original.status !== "PAUSED",
															business.id,
														),
													`${row.original.fullName} ${row.original.status === "PAUSED" ? "resumed" : "paused"}`,
													() =>
														patchUser({
															...row.original,
															status:
																row.original.status === "PAUSED"
																	? "ACTIVE"
																	: "PAUSED",
														}),
												),
										},
									]}
								/>
							) : null,
					},
				]}
				emptyTitle="Nobody yet"
				emptyHint="The owner's login is made at handover; managers and staff during onboarding."
			/>
			<Modal
				open={!!secret}
				onOpenChange={(o) => !o && setSecret(null)}
				title={secret?.what === "invite" ? "New invite" : "Temporary password"}
				subtitle={
					secret
						? `${secret.user.fullName} · ${secret.user.email} · shown once`
						: undefined
				}
				icon={KeyRoundIcon}
				size="confirm"
				footer={
					<button
						type="button"
						className={btn.primary}
						onClick={() => setSecret(null)}
					>
						Done
					</button>
				}
			>
				{secret && (
					<div className="flex flex-col gap-3">
						<Note tone="warning">
							Share this with {secret.user.fullName.split(" ")[0]} yourself; no
							email is sent yet. The password expires in 72 hours and must be
							changed at sign-in.
						</Note>
						{secret.created.temporaryPassword && (
							<div className="flex items-center gap-2 rounded-xl bg-subtle/70 px-4 py-3">
								<span className="min-w-0 flex-1 font-mono text-sm font-semibold text-brand">
									{secret.created.temporaryPassword}
								</span>
								<CopyButton text={secret.created.temporaryPassword} />
							</div>
						)}
						{secret.created.inviteToken && (
							<div className="flex items-center gap-2 rounded-xl bg-subtle/70 px-4 py-3">
								<span className="min-w-0 flex-1 break-all text-[13px] text-ink">
									{inviteLink(secret.created.inviteToken)}
								</span>
								<CopyButton
									text={inviteLink(secret.created.inviteToken)}
									label="Copy link"
								/>
							</div>
						)}
					</div>
				)}
			</Modal>
		</>
	);
}
