import { withAuth } from "next-auth/middleware";

/**
 * Protect all /admin routes with NextAuth. Unauthenticated users are
 * redirected to our branded /admin/login page (not the default NextAuth page).
 * The login page and NextAuth API routes are excluded by the matcher.
 */
export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  matcher: [
    // Match /admin and everything under it EXCEPT /admin/login.
    "/admin",
    "/admin/((?!login).*)",
  ],
};
