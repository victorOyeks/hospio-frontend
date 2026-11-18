export { appMiddleware as middleware } from "@hospio/api/middleware";

// Next reads this literal at build time; it cannot be re-exported from the package.
export const config = {
	matcher: ["/((?!api|_next/static|_next/image|icon|sw\\.js|offline\\.html|manifest\\.webmanifest|.*\\.(?:png|svg|ico|jpg|webp)$).*)"],
};
