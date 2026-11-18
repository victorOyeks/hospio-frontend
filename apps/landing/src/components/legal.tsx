import { ArrowRightIcon, FileTextIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@hospio/ui/utils";
import { container, SiteFooter, SiteHeader } from "@/components/site";
import {
	formatLegalDate,
	LEGAL_DOCUMENTS,
	LEGAL_EMAIL,
	LEGAL_ENTITY,
	type LegalDocument,
	sectionId,
} from "@/legal/documents";

/**
 * Rendering for the public legal pages (/legal and /legal/<slug>). The document text is data: it is only ever rendered
 * as React text nodes, with **double asterisks** turned into <strong> by splitting the string.
 */

/** Plain text with **bold** runs. Never parsed as HTML. */
export function RichText({ text }: { text: string }) {
	const parts = text.split(/\*\*(.+?)\*\*/g);
	return (
		<>
			{parts.map((part, i) =>
				i % 2 === 1 ? (
					<strong key={i} className="font-semibold text-ink">
						{part}
					</strong>
				) : (
					part
				),
			)}
		</>
	);
}

/** "**Name** · Label: value · Label: value" — a row of a table written out as one paragraph. */
const TABLE_ROW = /^\*\*([^*]+)\*\* · (.+)$/;
/** "(a) …" — a lettered item under a clause. */
const LIST_ITEM = /^\(([a-z])\)\s+(.*)$/;
/** "– …" — a bullet. */
const BULLET = /^–\s+(.*)$/;
/** "5.3 …" — a numbered clause. */
const CLAUSE = /^(\d+\.\d+)\s+(.*)$/;

function LegalParagraph({ text }: { text: string }) {
	const row = TABLE_ROW.exec(text);
	if (row) {
		const fields = row[2].split(" · ").map((f) => {
			const at = f.indexOf(": ");
			return at > 0
				? { label: f.slice(0, at), value: f.slice(at + 2) }
				: { label: "", value: f };
		});
		return (
			<div className="rounded-card border border-line bg-card px-4 py-3 sm:px-5 sm:py-4">
				<p className="font-semibold text-ink">{row[1]}</p>
				<dl className="mt-2 flex flex-col gap-1.5 text-[14px]">
					{fields.map((f, i) => (
						<div key={i} className="sm:grid sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-3">
							{f.label && <dt className="text-ink-3">{f.label}</dt>}
							<dd className={cn("text-ink-2", !f.label && "sm:col-span-2")}>
								<RichText text={f.value} />
							</dd>
						</div>
					))}
				</dl>
			</div>
		);
	}
	const item = LIST_ITEM.exec(text);
	if (item) {
		return (
			<p className="flex gap-3 pl-4 sm:pl-10">
				<span className="w-6 shrink-0 text-ink-3">({item[1]})</span>
				<span className="min-w-0">
					<RichText text={item[2]} />
				</span>
			</p>
		);
	}
	const bullet = BULLET.exec(text);
	if (bullet) {
		return (
			<p className="flex gap-3 pl-1">
				<span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-brand" />
				<span className="min-w-0">
					<RichText text={bullet[1]} />
				</span>
			</p>
		);
	}
	const clause = CLAUSE.exec(text);
	if (clause) {
		return (
			<p className="sm:flex sm:gap-3">
				<span className="mr-2 font-semibold text-brand sm:mr-0 sm:w-9 sm:shrink-0">
					{clause[1]}
				</span>
				<span className="min-w-0">
					<RichText text={clause[2]} />
				</span>
			</p>
		);
	}
	return (
		<p>
			<RichText text={text} />
		</p>
	);
}

function VersionLine({ doc }: { doc: LegalDocument }) {
	return (
		<>
			Version {doc.version} · effective {formatLegalDate(doc.effectiveDate)}
		</>
	);
}

/** Header, page body and footer shared by the legal pages. */
function LegalFrame({ children }: { children: ReactNode }) {
	return (
		<>
			<SiteHeader />
			<main className="bg-page">{children}</main>
			<SiteFooter />
		</>
	);
}

function EntityLine() {
	return (
		<p className="text-[14px] leading-[1.6] text-ink-2">
			{LEGAL_ENTITY} ·{" "}
			<a href={`mailto:${LEGAL_EMAIL}`} className="font-semibold text-brand hover:underline">
				{LEGAL_EMAIL}
			</a>{" "}
			· Hospio360 is a product of Oyeks Global Limited
		</p>
	);
}

/** /legal — every published document with its summary, version and effective date. */
export function LegalIndex() {
	return (
		<LegalFrame>
			<div className={cn(container, "flex flex-col gap-10 py-14 md:py-20")}>
				<div className="flex max-w-[760px] flex-col gap-4">
					<p className="text-[13px] font-bold uppercase tracking-[0.1em] text-brand">Legal</p>
					<h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px]">
						Hospio360 legal documents
					</h1>
					<p className="text-[17px] leading-[1.55] text-ink-2">
						The terms, policies and authorisations that apply when a business, its staff or a referral partner
						uses Hospio360. Each document shows its version and the date it takes effect.
					</p>
					<EntityLine />
				</div>
				<ul className="grid gap-4 md:grid-cols-2">
					{LEGAL_DOCUMENTS.map((doc) => (
						<li key={doc.slug}>
							<Link
								href={`/legal/${doc.slug}`}
								className="group flex h-full flex-col gap-3 rounded-card border border-line bg-card p-5 transition-colors hover:border-brand/40 md:p-6"
							>
								<div className="flex items-start gap-3">
									<span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
										<FileTextIcon className="size-[18px]" />
									</span>
									<div className="min-w-0">
										<h2 className="text-[18px] font-bold leading-snug text-ink group-hover:text-brand">
											{doc.title}
										</h2>
										<p className="mt-1 text-[13px] text-ink-3">
											<VersionLine doc={doc} />
										</p>
									</div>
								</div>
								<p className="text-[15px] leading-[1.55] text-ink-2">{doc.summary}</p>
								<span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand">
									Read the document
									<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</LegalFrame>
	);
}

function TocLinks({ doc }: { doc: LegalDocument }) {
	return (
		<ol className="flex flex-col gap-0.5 text-[14px]">
			{doc.sections.map((s) => (
				<li key={s.heading}>
					<a
						href={`#${sectionId(s.heading)}`}
						className="block rounded-control px-2 py-1.5 leading-snug text-ink-2 hover:bg-subtle hover:text-ink"
					>
						{s.heading}
					</a>
				</li>
			))}
		</ol>
	);
}

/** /legal/<slug> — one document: title, version, contents, sections, contact and the other documents. */
export function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
	const others = LEGAL_DOCUMENTS.filter((d) => d.slug !== doc.slug);
	return (
		<LegalFrame>
			<div className={cn(container, "py-12 md:py-16")}>
				<nav aria-label="Breadcrumb" className="text-[13px] text-ink-3">
					<Link href="/legal" className="hover:text-ink">
						Legal
					</Link>
					<span className="mx-2">/</span>
					<span className="text-ink-2">{doc.title}</span>
				</nav>
				<header className="mt-4 flex max-w-[760px] flex-col gap-3">
					<h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[44px]">
						{doc.title}
					</h1>
					<p className="text-[14px] font-medium text-ink-3">
						<VersionLine doc={doc} />
					</p>
					<p className="text-[17px] leading-[1.55] text-ink-2">{doc.summary}</p>
				</header>

				<div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
					<aside className="lg:order-none">
						<details className="rounded-card border border-line bg-card lg:hidden">
							<summary className="cursor-pointer px-4 py-3 text-[15px] font-semibold text-ink">
								Contents ({doc.sections.length} sections)
							</summary>
							<div className="border-t border-line p-2">
								<TocLinks doc={doc} />
							</div>
						</details>
						<nav
							aria-label="Contents"
							className="sticky top-[104px] hidden max-h-[calc(100vh-128px)] overflow-y-auto lg:block"
						>
							<p className="px-2 pb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-ink-3">
								Contents
							</p>
							<TocLinks doc={doc} />
						</nav>
					</aside>

					<article className="flex min-w-0 max-w-[760px] flex-col gap-10">
						{doc.sections.map((s) => (
							<section key={s.heading} id={sectionId(s.heading)} className="scroll-mt-[100px]">
								<h2 className="text-[20px] font-bold leading-snug text-ink md:text-[22px]">
									{s.heading}
								</h2>
								<div className="mt-4 flex flex-col gap-3 text-[15px] leading-[1.65] text-ink-2 [overflow-wrap:anywhere] md:text-[16px]">
									{s.paragraphs.map((p, i) => (
										<LegalParagraph key={i} text={p} />
									))}
								</div>
							</section>
						))}

						<div className="flex flex-col gap-3 rounded-card border border-line bg-card p-5 md:p-6">
							<p className="flex items-center gap-2 font-semibold text-ink">
								<MailIcon className="size-[18px] text-brand" />
								Questions about this document
							</p>
							<EntityLine />
						</div>

						<div className="flex flex-col gap-4 border-t border-line pt-8">
							<h2 className="text-[18px] font-bold text-ink">Other legal documents</h2>
							<ul className="grid gap-2 sm:grid-cols-2">
								{others.map((d) => (
									<li key={d.slug}>
										<Link
											href={`/legal/${d.slug}`}
											className="flex items-center justify-between gap-3 rounded-control border border-line bg-card px-4 py-3 text-[15px] font-medium text-ink-2 hover:border-brand/40 hover:text-brand"
										>
											{d.title}
											<ArrowRightIcon className="size-4 shrink-0" />
										</Link>
									</li>
								))}
							</ul>
							<Link href="/legal" className="text-[14px] font-semibold text-brand hover:underline">
								All legal documents
							</Link>
						</div>
					</article>
				</div>
			</div>
		</LegalFrame>
	);
}
