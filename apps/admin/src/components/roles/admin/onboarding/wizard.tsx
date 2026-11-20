"use client";

import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { saveOnboardingStep } from "@hospio/api/actions/tenant";
import type {
	AdminUserRow,
	BusinessRow,
	HotelSummary,
	OnboardingRow,
	PortalUserRow,
	SetupTemplateRow,
	TerminalRow,
} from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import {
	ADMIN_ONBOARDING_STEPS,
	type AdminOnboardingData,
	type AdminOnboardingStep,
} from "@hospio/api/types";
import { fmtAgo } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { cn } from "@hospio/ui/utils";
import { can, ReadOnlyNote, StagePill } from "../shared";
import { ConnectionsStep } from "./step-connections";
import { BusinessStep, FeeStep, OwnerStep } from "./step-details";
import { GoLiveStep } from "./step-golive";
import { HandoverStep } from "./step-handover";
import { HotelsStep } from "./step-hotels";
import { PeopleStep } from "./step-people";
import { RoomsStep } from "./step-rooms";
import { TemplateStep } from "./step-template";
import {
	isAdminStep,
	mergeDraft,
	stepLabel,
	stepsOf,
	type VenueCtx,
	venueOf,
	type WizardData,
	type WizardHotel,
} from "./shared";

/**
 * Admin — J2–J14 · the 10-step back-office wizard at /dashboard/onboarding/[businessId]. The left
 * rail shows done / current / later from the draft's `completedSteps`; the right column is the step.
 * Each step writes to the real services, then saves its form to the draft (`saveOnboardingStep`).
 */

export type WizardCtx = {
	editable: boolean;
	/** The signed-in admin's role (what money actions they may take). */
	role: AdminRole;
	business: BusinessRow;
	setBusiness: (b: BusinessRow) => void;
	draft: OnboardingRow;
	data: WizardData;
	hotels: WizardHotel[];
	setHotels: (update: (prev: WizardHotel[]) => WizardHotel[]) => void;
	users: PortalUserRow[];
	setUsers: (update: (prev: PortalUserRow[]) => PortalUserRow[]) => void;
	terminals: Record<string, TerminalRow[]>;
	setTerminals: (hotelId: string, rows: TerminalRow[]) => void;
	templates: SetupTemplateRow[];
	admins: AdminUserRow[];
	/** Saves one step's form to the draft and marks it complete. Null when the save failed (already toasted). */
	saveStep: <K extends AdminOnboardingStep>(
		step: K,
		data: NonNullable<WizardData[K]>,
		nextAction?: string,
	) => Promise<OnboardingRow | null>;
	goTo: (step: AdminOnboardingStep) => void;
	/** Venue words (hospio-backend docs/plan-venue-type.md): "Locations" for a non-hotel business, no rooms where none. */
	venue: VenueCtx;
};

function emptyDraft(b: BusinessRow): OnboardingRow {
	const o = b.onboarding;
	return {
		id: b.id,
		businessId: b.id,
		businessName: b.name,
		source: b.source ?? "BACK_OFFICE",
		step: o?.step ?? 1,
		totalSteps: ADMIN_ONBOARDING_STEPS.length,
		completedSteps: o?.completedSteps ?? [],
		assignedTo: b.accountManager,
		assignedToId: b.accountManagerId,
		startedAt: b.since,
		status: o?.status ?? (b.stage === "ONBOARDING" ? "IN_PROGRESS" : "DONE"),
		nextAction: `Step ${o?.step ?? 1} of ${ADMIN_ONBOARDING_STEPS.length}`,
		data: {},
	};
}

export function OnboardingWizard({
	role,
	business: initialBusiness,
	draft: initialDraft,
	hotels: initialHotels,
	users: initialUsers,
	terminals: initialTerminals,
	templates,
	admins,
}: {
	role: AdminRole;
	business: BusinessRow;
	draft: OnboardingRow | null;
	hotels: HotelSummary[];
	users: PortalUserRow[];
	terminals: Record<string, TerminalRow[]>;
	templates: SetupTemplateRow[];
	admins: AdminUserRow[];
}) {
	const editable = can.editBusiness(role);
	const [business, setBusiness] = useState(initialBusiness);
	const [draft, setDraft] = useState<OnboardingRow>(
		initialDraft ?? emptyDraft(initialBusiness),
	);
	const draftRef = useRef(draft);
	draftRef.current = draft;
	const [hotels, setHotelsState] = useState<WizardHotel[]>(initialHotels);
	const [users, setUsersState] = useState(initialUsers);
	const [terminals, setTerminalsState] = useState(initialTerminals);
	// The page can come from the router cache (the browser's Back, the sidebar): ask the server for a fresh copy once
	// on open, and take any draft or hotel list newer than what this page holds. Steps re-read it through `seed`.
	const router = useRouter();
	const refreshed = useRef(false);
	useEffect(() => {
		if (refreshed.current) return;
		refreshed.current = true;
		router.refresh();
	}, [router]);
	const [seed, setSeed] = useState(0);
	// Set by the first keystroke in the open step; a new step starts clean.
	const typed = useRef(false);
	const serverVersion = `${initialDraft?.updatedAt ?? ""}|${initialHotels.map((h) => `${h.id}:${h.rooms}`).join(",")}`;
	const seenVersion = useRef(serverVersion);
	useEffect(() => {
		if (seenVersion.current === serverVersion) return;
		seenVersion.current = serverVersion;
		const held = draftRef.current.updatedAt ?? "";
		const fresh = initialDraft?.updatedAt ?? "";
		const newerDraft = !!initialDraft && fresh > held;
		const newHotels = initialHotels.some(
			(h) => !hotels.some((x) => x.id === h.id),
		);

		if (newHotels)
			setHotelsState((prev) => [
				...prev,
				...initialHotels.filter((h) => !prev.some((x) => x.id === h.id)),
			]);
		// Steps are re-read (remounted) only when the server holds different step data or a hotel this page lacks, so
		// a refresh that brings nothing new never wipes what is being typed.
		const changedData =
			newerDraft &&
			JSON.stringify(stepsOf(initialDraft?.data)) !==
				JSON.stringify(stepsOf(draftRef.current.data));
		if (newerDraft && initialDraft) {
			draftRef.current = initialDraft;
			setDraft(initialDraft);
		}
		// The open step is re-read only while nothing has been typed in it; otherwise the newer copy is used when the next
		// step opens (every step reads the draft when it opens).
		if ((changedData || newHotels) && !typed.current) {
			setBusiness(initialBusiness);
			setSeed((n) => n + 1);
		}
	}, [serverVersion, initialDraft, initialHotels, initialBusiness, hotels]);
	const handedOver =
		business.stage === "HANDED_OVER" ||
		business.stage === "LIVE" ||
		draft.status === "DONE";

	const defaultStep: AdminOnboardingStep = handedOver
		? "handover"
		: (ADMIN_ONBOARDING_STEPS[
				Math.min(ADMIN_ONBOARDING_STEPS.length, Math.max(1, draft.step)) - 1
			] ?? "business");
	const [stepParam, setStepParam] = useQueryState("step");
	// Arriving from "Set up a business for them" (a full navigation, so the list's toast is gone).
	const [created, setCreated] = useQueryState("created");
	useEffect(() => {
		if (created !== "1") return;
		toast.success(`${initialBusiness.name} created · onboarding started`);
		void setCreated(null);
	}, [created, initialBusiness.name, setCreated]);
	const step: AdminOnboardingStep = isAdminStep(stepParam)
		? stepParam
		: defaultStep;
	// Each step is its own history entry, so the browser's Back returns to the step before instead of leaving.
	const goTo = useCallback(
		(s: AdminOnboardingStep) => {
			typed.current = false;
			void setStepParam(s, { history: "push" });
			if (typeof window !== "undefined") window.scrollTo({ top: 0 });
		},
		[setStepParam],
	);

	const saveStep = useCallback<WizardCtx["saveStep"]>(
		async (s, data, nextAction) => {
			try {
				const result = await saveOnboardingStep(
					business.id,
					s,
					data as unknown as NonNullable<AdminOnboardingData[typeof s]>,
					nextAction,
				);
				if (!result.ok) {
					toast.error(result.error, { duration: 8000 });
					return null;
				}
				const merged = mergeDraft(draftRef.current, result.data);
				draftRef.current = merged;
				setDraft(merged);
				return merged;
			} catch (e) {
				toast.error(
					e instanceof Error ? e.message : "The step could not be saved",
					{
						duration: 8000,
					},
				);
				return null;
			}
		},
		[business.id],
	);

	const ctx: WizardCtx = useMemo(
		() => ({
			editable,
			role,
			business,
			setBusiness,
			draft,
			data: stepsOf(draft.data),
			hotels,
			setHotels: (update) => setHotelsState((prev) => update(prev)),
			users,
			setUsers: (update) => setUsersState((prev) => update(prev)),
			terminals,
			setTerminals: (hotelId, rows) =>
				setTerminalsState((prev) => ({ ...prev, [hotelId]: rows })),
			templates,
			admins,
			saveStep,
			goTo,
			venue: venueOf(business, hotels),
		}),
		[
			editable,
			role,
			business,
			draft,
			hotels,
			users,
			terminals,
			templates,
			admins,
			saveStep,
			goTo,
		],
	);

	const steps: Record<AdminOnboardingStep, React.ReactNode> = {
		business: <BusinessStep ctx={ctx} />,
		owner: <OwnerStep ctx={ctx} />,
		fee: <FeeStep ctx={ctx} />,
		hotels: <HotelsStep ctx={ctx} />,
		rooms: <RoomsStep ctx={ctx} />,
		template: <TemplateStep ctx={ctx} />,
		people: <PeopleStep ctx={ctx} />,
		connections: <ConnectionsStep ctx={ctx} />,
		golive: <GoLiveStep ctx={ctx} />,
		handover: <HandoverStep ctx={ctx} />,
	};

	return (
		<>
			<Link
				href="/dashboard/onboarding"
				className="flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink"
			>
				<ArrowLeftIcon className="size-4" /> Onboarding
			</Link>
			<PageHeader
				title={handedOver ? business.name : `Set up ${business.name}`}
				subtitle={
					<span suppressHydrationWarning>
						{`Back-office onboarding · ${draft.assignedTo === "Unassigned" ? "not assigned yet" : `by ${draft.assignedTo}`}${draft.updatedAt ? ` · saved ${fmtAgo(draft.updatedAt)}` : ""}`}
					</span>
				}
			>
				<StagePill stage={business.stage} />
			</PageHeader>
			{!editable && (
				<ReadOnlyNote>
					You can follow this onboarding but only Support or a Super admin can
					change it.
				</ReadOnlyNote>
			)}

			<div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
				<StepRail
					venue={ctx.venue}
					current={step}
					completed={draft.completedSteps}
					done={handedOver}
					onPick={goTo}
				/>
				<div
					className="min-w-0"
					key={`${step}:${seed}`}
					onInputCapture={() => {
						typed.current = true;
					}}
				>
					{steps[step]}
				</div>
			</div>
		</>
	);
}

/** The left rail: a numbered list with done (check), current (filled) and later (outlined) states. */
function StepRail({
	current,
	completed,
	done,
	onPick,
	venue,
}: {
	venue: VenueCtx;
	current: AdminOnboardingStep;
	completed: string[];
	done: boolean;
	onPick: (step: AdminOnboardingStep) => void;
}) {
	const listRef = useRef<HTMLOListElement>(null);
	// Re-centred when the open step changes (`current`).
	useEffect(() => {
		const centre = () => {
			const list = listRef.current;
			const el = list?.querySelector<HTMLElement>('[aria-current="step"]');
			if (!list || !el || list.scrollWidth <= list.clientWidth) return;
			list.scrollLeft = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2;
		};
		centre();
		// A tablet turned between portrait and landscape keeps the open step in view.
		window.addEventListener("resize", centre);
		return () => window.removeEventListener("resize", centre);
	}, [current]);
	return (
		// Below lg the rail is one scrolling row of steps (the open one scrolled into view): as a list it pushed the form
		// about 570 px down on a tablet.
		<nav className="h-fit min-w-0 rounded-card border border-line bg-card p-2 lg:sticky lg:top-6 lg:p-4">
			<ol
				ref={listRef}
				className="relative flex gap-1 overflow-x-auto [scrollbar-width:thin] lg:flex-col lg:overflow-visible"
			>
				{ADMIN_ONBOARDING_STEPS.map((s, i) => {
					const isCurrent = s === current;
					const isDone = done || completed.includes(s);
					return (
						<li key={s} className="shrink-0">
							<button
								type="button"
								onClick={() => onPick(s)}
								className={cn(
									"flex min-h-[44px] w-max items-center gap-2 whitespace-nowrap rounded-[10px] px-3 py-[10px] text-left text-[13px] transition-colors lg:w-full lg:gap-3 lg:whitespace-normal",
									isCurrent
										? "bg-brand-soft font-semibold text-brand"
										: isDone
											? "font-medium text-ink hover:bg-subtle"
											: "font-medium text-ink-3 hover:bg-subtle hover:text-ink",
								)}
								aria-current={isCurrent ? "step" : undefined}
							>
								<span
									className={cn(
										"flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
										isCurrent
											? "border-brand bg-brand text-white"
											: isDone
												? "border-success bg-success text-white"
												: "border-line-strong text-ink-3",
									)}
								>
									{isDone && !isCurrent ? (
										<CheckIcon className="size-3" />
									) : (
										i + 1
									)}
								</span>
								<span className="lg:min-w-0 lg:flex-1">{stepLabel(s, venue)}</span>
								{s === "rooms" && venue.noRooms && (
									<span className="text-[11px] font-medium text-ink-3">
										Not needed
									</span>
								)}
							</button>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
