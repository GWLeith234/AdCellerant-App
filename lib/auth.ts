import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedEmails = (process.env.ALLOWED_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email || !allowedEmails.includes(email)) {
        return "/login?error=AccessDenied";
      }
      return true;
    },
    async session({ session }) {
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If coming from sign-in (callbackUrl is /dashboard), redirect to rep view
      if (url === `${baseUrl}/dashboard` || url === "/dashboard") {
        return `${baseUrl}/dashboard`;
      }
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const repMap: Record<string, string> = {
  "george.leith@adcellerant.com": "george",
  "andy.mcnab@adcellerant.com": "andy",
  "alex.kirkley@adcellerant.com": "alex",
};

export function getRepForEmail(email: string): string | null {
  return repMap[email.toLowerCase()] || null;
}
