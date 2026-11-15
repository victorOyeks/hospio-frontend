import { brandStyle, encodeBrandCookie } from "@hospio/api/brand";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { SelectRoleScreen } from "@hospio/ui/screens/select-role";
import { RememberBrand } from "@hospio/ui/shared/remember-brand";

/**
 * Staff · Shared 1.5 · Choose a role, for people who hold more than one. Straight after sign-in, so it reads the person's own
 * hotel's colours (not whatever this browser remembered from the last hotel) and remembers them.
 */
export default async function SelectRolePage() {
	const [brand, hotel] = await Promise.all([
		data.hotels.brand().catch(() => null),
		getActiveHotel().catch(() => null),
	]);
	return (
		<>
			{brand && (
				<>
					<style
						id="hotel-brand"
						// Built from a validated #rrggbb only (packages/api/src/brand.ts).
						// biome-ignore lint/security/noDangerouslySetInnerHtml: generated CSS, no user text
						dangerouslySetInnerHTML={{ __html: brandStyle(brand) }}
					/>
					<RememberBrand value={encodeBrandCookie(brand, hotel?.name)} />
				</>
			)}
			<SelectRoleScreen />
		</>
	);
}
