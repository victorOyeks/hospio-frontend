import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/legal";
import { getLegalDocument, LEGAL_DOCUMENTS } from "@/legal/documents";

type Params = Promise<{ slug: string }>;

/** Every document is generated at build time; any other slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
	return LEGAL_DOCUMENTS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const doc = getLegalDocument((await params).slug);
	if (!doc) return {};
	return {
		title: doc.title,
		description: doc.summary,
		alternates: { canonical: `/legal/${doc.slug}` },
		openGraph: { title: `${doc.title} · Hospio360`, description: doc.summary, url: `/legal/${doc.slug}` },
	};
}

export default async function LegalDocumentRoute({ params }: { params: Params }) {
	const doc = getLegalDocument((await params).slug);
	if (!doc) notFound();
	return <LegalDocumentPage doc={doc} />;
}
