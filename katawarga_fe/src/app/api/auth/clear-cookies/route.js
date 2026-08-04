import { NextResponse } from "next/server";

/**
 * GET /api/auth/clear-cookies
 *
 * Menghapus semua cookie NextAuth yang menumpuk (penyebab HTTP 431).
 * Endpoint ini aman dipanggil kapan saja - tidak merusak data apapun.
 *
 * Cookie yang di-expire:
 * - next-auth.session-token (berbagai varian nama)
 * - next-auth.csrf-token
 * - next-auth.callback-url
 * - __Secure-next-auth.* (varian HTTPS)
 */
export async function GET(request) {
  const response = NextResponse.json({ cleared: true });

  // Daftar semua varian nama cookie NextAuth yang mungkin menumpuk
  const nextAuthCookies = [
    "next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.csrf-token",
    "__Secure-next-auth.callback-url",
    "__Host-next-auth.csrf-token",
  ];

  // Tambahkan cookie berpola next-auth.session-token.* dari request
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieNames = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter((name) => name.startsWith("next-auth.session-token"));

  // Gabungkan semua nama cookie yang perlu dihapus
  const allCookiesToClear = [...new Set([...nextAuthCookies, ...cookieNames])];

  // Set setiap cookie ke expired
  allCookiesToClear.forEach((cookieName) => {
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  });

  return response;
}
