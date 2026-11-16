import { redirect } from "next/navigation";

/**
 * The old one-hotel page. A hotel now opens in a side panel on its business's Hotels tab, so saved links and bookmarks
 * land there with the same hotel open.
 */
export default async function BusinessHotelPage({
	params,
}: {
	params: Promise<{ id: string; hotelId: string }>;
}) {
	const { id, hotelId } = await params;
	redirect(
		`/dashboard/businesses/${id}?tab=hotels&hotel=${encodeURIComponent(hotelId)}`,
	);
}
