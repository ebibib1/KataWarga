import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const loginUrl = `${apiUrl}/auth/login`;
        
        console.log("[NextAuth] Attempting login to:", loginUrl);

        try {
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log("[NextAuth] Response status:", res.status);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error("[NextAuth] API error response:", errorText);
            return null;
          }

          const user = await res.json();
          console.log("[NextAuth] Login successful for user:", user.user?.email);

          if (user && user.token) {
            return {
              id: user.user.id.toString(),
              name: user.user.name,
              email: user.user.email,
              role: user.user.role,
              token: user.token,
            };
          }

          return null;
        } catch (error) {
          console.error("[NextAuth] Fetch error:", error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Simpan hanya field esensial di JWT agar ukuran cookie tetap kecil
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Hanya simpan field yang benar-benar dibutuhkan
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.token;
        token.name = user.name;
        // Hapus field bawaan NextAuth yang tidak dipakai (mengurangi ukuran token)
        delete token.email;
        delete token.picture;
        delete token.sub;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.avatar !== undefined) token.avatar = session.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
        session.user.name = token.name;
        if (token.avatar !== undefined) session.user.image = token.avatar;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 hari (cegah cookie lama menumpuk)
    updateAge: 60 * 60,   // Perbarui session setiap 1 jam
  },
  cookies: {
    // Pastikan hanya ada SATU nama cookie session yang konsisten
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  trustHost: true,
  useSecureCookies: false,
  secret: process.env.NEXTAUTH_SECRET || "KataWargaSecretKeyNextAuth123!",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

