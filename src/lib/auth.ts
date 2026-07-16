import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";

// First-time bootstrap credentials (used only when the DB has NO users yet).
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@steaktown.qa").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
const ADMIN_NAME = process.env.ADMIN_NAME || "Steak Town Admin";

/**
 * NextAuth configuration — Credentials provider (email + password) for admin.
 * JWT sessions (no DB session table needed).
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const { password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        // --- First-time bootstrap ---------------------------------------
        // If the database has no users at all and the supplied credentials
        // match the configured admin defaults, create the admin on the fly.
        // This lets you sign in to the dashboard immediately after deploy,
        // then set up locations/tables from the admin UI.
        if (!user) {
          const totalUsers = await prisma.user.count();
          if (totalUsers === 0 && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            const created = await prisma.user.create({
              data: { email: ADMIN_EMAIL, hashedPassword, name: ADMIN_NAME, role: "ADMIN" },
            });
            return { id: created.id, name: created.name, email: created.email, role: created.role };
          }
          return null;
        }

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "ADMIN";
        token.id = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
