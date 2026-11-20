"use client";

import { CopyIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { Note } from "@hospio/ui/shared/detail-list";
import { TextField } from "@hospio/ui/shared/field";
import { btn } from "@hospio/ui/shared/ui";

/**
 * The 2-step setup pieces shared by My profile → Security and the "Set up 2-step sign-in" screen an admin is sent to when
 * "Require 2-step sign-in for every admin" is on (hospio-backend docs/sign-in.md): the QR code with its key and the code field,
 * and the recovery codes shown once.
 */
export type TwoStepSetup = { secret: string; otpauthUri: string; qrSvg: string };

export function svgSrc(svg: string) {
	return `data:image/svg+xml;base64,${typeof window === "undefined" ? "" : window.btoa(svg)}`;
}

function downloadCodes(codes: string[], email: string) {
	const text = `Hospio360 recovery codes for ${email}\nEach works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`;
	const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = "hospio360-recovery-codes.txt";
	a.click();
	URL.revokeObjectURL(url);
}

export function CodesList({ codes, email }: { codes: string[]; email: string }) {
	return (
		<div className="flex flex-col gap-3">
			<Note tone="warning">
				Shown once. Each code signs you in one time if you lose your phone. Save
				them now.
			</Note>
			<div
				className="grid grid-cols-2 gap-2 rounded-xl bg-subtle p-4 font-mono text-[13px] text-ink"
				data-testid="recovery-codes"
			>
				{codes.map((c) => (
					<span key={c}>{c}</span>
				))}
			</div>
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					className={`${btn.secondary} ${btn.small} flex items-center gap-1`}
					onClick={() =>
						void navigator.clipboard
							?.writeText(codes.join("\n"))
							.then(() => toast.success("Codes copied"))
					}
				>
					<CopyIcon className="size-3" /> Copy
				</button>
				<button
					type="button"
					className={`${btn.secondary} ${btn.small} flex items-center gap-1`}
					onClick={() => downloadCodes(codes, email)}
				>
					<DownloadIcon className="size-3" /> Download
				</button>
			</div>
		</div>
	);
}

/** Scan the QR code (or type the key), then the 6-digit code the app shows. */
export function TwoStepQr({
	setup,
	code,
	onCode,
}: {
	setup: TwoStepSetup;
	code: string;
	onCode: (value: string) => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4">
			<img
				src={svgSrc(setup.qrSvg)}
				alt="QR code for your authenticator app"
				className="size-48 rounded-lg border border-line"
				data-testid="two-step-qr"
			/>
			<div className="w-full text-center">
				<p className="text-xs text-ink-3">
					Can&apos;t scan? Enter this key in the app (time-based):
				</p>
				<p
					className="mt-1 break-all font-mono text-[13px] font-semibold text-ink"
					data-testid="two-step-secret"
				>
					{setup.secret}
				</p>
			</div>
			<TextField
				label="6-digit code from the app"
				value={code}
				onChange={onCode}
				placeholder="123 456"
				className="w-full"
			/>
		</div>
	);
}
