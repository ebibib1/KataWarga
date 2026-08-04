import { Roboto, Poppins, Inconsolata } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

const poppins = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const inconsolata = Inconsolata({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "KataWarga — Laporkan Masalah Kota Secara Cepat & Transparan",
  description: "KataWarga membantu masyarakat melaporkan masalah lingkungan, fasilitas umum, dan layanan publik secara realtime dan langsung ke tangan admin kota yang tepat.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${roboto.variable} ${poppins.variable} ${inconsolata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F0E8]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

