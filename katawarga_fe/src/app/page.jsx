"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  MapPin, 
  Activity, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  MessageSquare, 
  Heart, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Info, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  ChevronRight, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  Menu,
  ThumbsUp,
  Share2,
  Filter
} from "lucide-react";
import ThreeNetwork from "../components/ThreeNetwork";

// Standard CountUp component using motion.js features
function CountUp({ to, duration = 2, decimals = 0, suffix = "" }) {
  const [val, setVal] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const obj = { value: 0 };
          gsap.to(obj, {
            value: to,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
              if (active) setVal(obj.value);
            }
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [to, duration]);

  return (
    <span ref={elementRef}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      const role = session?.user?.role;
      if (role === 'super_admin') {
        router.push('/dashboardSuper_Admin');
      } else if (role === 'admin') {
        router.push('/dashboardAdmin');
      } else {
        router.push('/homepageUser');
      }
    }
  }, [status, session, router]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // How it works step control
  const [activeStep, setActiveStep] = useState(0);
  const [stepTimer, setStepTimer] = useState(0);
  
  // Recent reports interactive state
  const [reports, setReports] = useState([
    {
      id: 1,
      category: "Jalan Rusak",
      bgBadge: "bg-red-500/10 text-red-500 border border-red-500/20",
      status: "Diproses",
      statusColor: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
      time: "2 jam lalu",
      title: "Jalan Berlubang Parah di Jl. Merdeka No. 47",
      desc: "Lubang besar berdiameter 80cm di tengah jalan utama. Sudah memakan korban 2 pengendara motor jatuh semalam. Butuh penambalan segera.",
      author: "Ahmad Riyadi",
      avatar: "AR",
      likes: 14,
      comments: 6,
      liked: false
    },
    {
      id: 2,
      category: "Penerangan",
      bgBadge: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      status: "Menunggu",
      statusColor: "bg-yellow-600/10 text-yellow-600 border border-yellow-600/20",
      time: "5 jam lalu",
      title: "5 Lampu Jalan Mati di RT 05 Blok B",
      desc: "Lampu jalan mati total selama 3 malam berturut-turut. Area jalan menjadi sangat gelap dan rawan tindakan kriminalitas bagi pejalan kaki.",
      author: "Siti Rahma",
      avatar: "SR",
      likes: 8,
      comments: 3,
      liked: false
    },
    {
      id: 3,
      category: "Lingkungan",
      bgBadge: "bg-green-500/10 text-green-500 border border-green-500/20",
      status: "Selesai",
      statusColor: "bg-green-500/10 text-green-500 border border-green-500/20",
      time: "1 hari lalu",
      title: "Saluran Air Tersumbat Sampah di Gang Mawar C3",
      desc: "Saluran air tertutup tumpukan sampah plastik menyebabkan genangan air setinggi mata kaki saat hujan deras. Sudah dikeruk bersih oleh petugas dinas.",
      author: "Dewi Wulandari",
      avatar: "DW",
      likes: 22,
      comments: 11,
      liked: false
    }
  ]);

  // Live Map preview controls
  const [mapFilter, setMapFilter] = useState("Semua");
  const [activeMarker, setActiveMarker] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([
    { id: 1, cx: 210, cy: 168, r: 7, color: "#EF4444", category: "Jalan Rusak", title: "Amblesan Aspal", loc: "Jl. Sudirman", desc: "Bahaya bagi angkutan berat." },
    { id: 2, cx: 235, cy: 182, r: 6, color: "#EF4444", category: "Jalan Rusak", title: "Lubang Jalan Utama", loc: "Simpang Merdeka", desc: "Lubang dalam 10cm." },
    { id: 3, cx: 415, cy: 205, r: 7, color: "#3B82F6", category: "Fasilitas Umum", title: "Halte Bus Rusak", loc: "Halte Cendrawasih", desc: "Atap halte bolong." },
    { id: 4, cx: 430, cy: 220, r: 6, color: "#3B82F6", category: "Fasilitas Umum", title: "Taman Kota Kotor", loc: "Taman Kencana", desc: "Banyak coretan vandalisme." },
    { id: 5, cx: 95, cy: 278, r: 7, color: "#F59E0B", category: "Penerangan", title: "Merkuri Jalan Padam", loc: "RT 04 Kelurahan Baru", desc: "Jalanan gelap gulita." },
    { id: 6, cx: 500, cy: 130, r: 6, color: "#10B981", category: "Lingkungan", title: "Tumpukan Sampah Liar", loc: "Bahu Jalan Tol Barat", desc: "Menimbulkan bau busuk." },
    { id: 7, cx: 340, cy: 95, r: 6, color: "#8B5CF6", category: "Lainnya", title: "Pohon Tumbang Sebagian", loc: "Gang Dahlia", desc: "Menghalangi kabel listrik." }
  ]);

  // Phone Mockup interactive state
  const [phoneScreen, setPhoneScreen] = useState("feed"); // feed, form, success
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneReportCategory, setPhoneReportCategory] = useState("Jalan Rusak");
  const [phoneReportTitle, setPhoneReportTitle] = useState("");
  const [phoneReportDesc, setPhoneReportDesc] = useState("");
  const [phoneReports, setPhoneReports] = useState([
    { id: 1, title: "Jalan Berlubang Merdeka", category: "Jalan Rusak", status: "Diproses", time: "2j lalu" },
    { id: 2, title: "Lampu Mati RT 05 Blok B", category: "Penerangan", status: "Menunggu", time: "5j lalu" },
    { id: 3, title: "Saluran Tersumbat Gang Mawar", category: "Lingkungan", status: "Selesai", time: "1h lalu" }
  ]);

  // Handle support/like toggle
  const handleLike = (id) => {
    setReports(prev => prev.map(rep => {
      if (rep.id === id) {
        return {
          ...rep,
          likes: rep.liked ? rep.likes - 1 : rep.likes + 1,
          liked: !rep.liked
        };
      }
      return rep;
    }));
  };

  // Step console simulators
  const stepConsoleLogs = [
    [
      "SYSTEM: Citizen camera connection established.",
      "SYSTEM: Uploading report photo: jalan_rusak_04.jpg [3.2 MB]... SUCCESS.",
      "SYSTEM: Fetching EXIF metadata location...",
      "SYSTEM: Latitude: -6.2088 | Longitude: 106.8456",
      "SYSTEM: Reverse Geocoding: Jl. Merdeka No. 47, Kecamatan Gambir.",
      "SYSTEM: AI Classification: [Jalan Rusak] Confidence: 98.4%",
      "SYSTEM: Priority evaluation... Trigger: HIGH PRIORITY (Safety Hazard).",
      "SYSTEM: Report #KW-4091 successfully queued."
    ],
    [
      "SYSTEM: Searching active district operators...",
      "SYSTEM: Matching operator: Admin Budi (Dinas Bina Marga)... ONLINE.",
      "SYSTEM: Assigning ticket #KW-4091 to Admin Budi.",
      "SYSTEM: Dispatching automatic notifications...",
      "SYSTEM: WhatsApp notification dispatched to operator.",
      "SYSTEM: Email confirmation dispatched to reporter: ariyadi@email.com.",
      "SYSTEM: Status updated: [MENUNGGU] -> [DIVERIFIKASI]."
    ],
    [
      "SYSTEM: Work order issued by Admin Budi.",
      "SYSTEM: Field Task Force assigned: Tim Pemeliharaan Jalan Regu 3.",
      "SYSTEM: Tim Regu 3 status updated: DISPATCHED to site.",
      "SYSTEM: Reporter timeline updated in citizen app.",
      "SYSTEM: Progress log: 'Petugas sedang mencampur aspal panas di lokasi.'",
      "SYSTEM: Live comment thread opened between citizen & crew.",
      "SYSTEM: Status updated: [DIVERIFIKASI] -> [DIPROSES]."
    ],
    [
      "SYSTEM: Tim Regu 3 uploaded completion photo: aspal_mulus_04.jpg.",
      "SYSTEM: System requesting verification code from reporter...",
      "SYSTEM: Reporter clicked 'TANDAI SELESAI' in mobile app.",
      "SYSTEM: Citizen feedback received: 'Respons super cepat, aspal mulus kembali! 5 Stars.'",
      "SYSTEM: Archiving ticket #KW-4091.",
      "SYSTEM: Status updated: [DIPROSES] -> [SELESAI].",
      "SYSTEM: Resolution efficiency recorded: 2.4 Hours. Target beat by 21.6 hours."
    ]
  ];

  // Auto-cycle timeline step simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Navbar scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add mock report from phone mockup simulation
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phoneReportTitle) return;

    const newRep = {
      id: Date.now(),
      title: phoneReportTitle,
      category: phoneReportCategory,
      status: "Menunggu",
      time: "Baru saja"
    };

    setPhoneReports([newRep, ...phoneReports]);
    setPhoneScreen("success");
    setPhoneReportTitle("");
    setPhoneReportDesc("");

    // Automatically transition back to feed after showing success
    setTimeout(() => {
      setPhoneScreen("feed");
    }, 2000);
  };

  // Filter map markers
  const filteredMarkers = mapFilter === "Semua" 
    ? mapMarkers 
    : mapMarkers.filter(m => m.category === mapFilter);

  return (
    <ReactLenis root>
      <div className="min-h-screen bg-cream text-ink antialiased selection:bg-primary/20 selection:text-primary">
        
        {/* ══ HEADER / NAVBAR ══ */}
        <header 
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled 
              ? "py-3 bg-cream/80 backdrop-blur-xl border-b border-ink/5 shadow-sm" 
              : "py-5 bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <a href="#" className="flex items-center gap-2.5 font-display font-extrabold text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/25">
                <MapPin size={18} strokeWidth={2.5} />
              </div>
              <span className="bg-gradient-to-r from-ink to-ink-soft bg-clip-text text-transparent">KataWarga</span>
            </a>

            {/* Desktop Nav links */}
            <nav className="hidden md:flex items-center gap-1.5">
              <a href="#features" className="px-4 py-1.5 rounded-full text-sm font-semibold text-ink-soft hover:bg-cream-dark hover:text-ink transition">Fitur</a>
              <a href="#map" className="px-4 py-1.5 rounded-full text-sm font-semibold text-ink-soft hover:bg-cream-dark hover:text-ink transition">Peta</a>
              <a href="#how" className="px-4 py-1.5 rounded-full text-sm font-semibold text-ink-soft hover:bg-cream-dark hover:text-ink transition">Cara Kerja</a>
              <a href="#recent" className="px-4 py-1.5 rounded-full text-sm font-semibold text-ink-soft hover:bg-cream-dark hover:text-ink transition">Laporan</a>
            </nav>

            {/* CTA Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth/login" className="px-5 py-2 text-sm font-semibold border border-cream-darker rounded-full hover:bg-cream-dark transition active:scale-95">
                Masuk
              </Link>
              <Link href="/auth/register" className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-full shadow-lg shadow-primary/25 hover:bg-[#2b2e2f] transition active:scale-95">
                Daftar Gratis
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ink-soft hover:text-ink transition"
              aria-label="Toggle Menu"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Mobile Dropdown Panel */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-cream border-b border-ink/5 overflow-hidden"
              >
                <div className="px-6 py-4 flex flex-col gap-3 font-display">
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-bold text-ink-soft">Fitur</a>
                  <a href="#map" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-bold text-ink-soft">Peta</a>
                  <a href="#how" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-bold text-ink-soft">Cara Kerja</a>
                  <a href="#recent" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-bold text-ink-soft">Laporan</a>
                  <div className="h-px bg-ink/5 my-2"></div>
                  <div className="flex gap-3">
                    <Link href="/auth/login" className="flex-1 py-2.5 text-center text-sm font-bold border border-cream-darker rounded-xl hover:bg-cream-dark transition">Masuk</Link>
                    <Link href="/auth/register" className="flex-1 py-2.5 text-center text-sm font-bold bg-primary text-white rounded-xl shadow-md hover:bg-[#2b2e2f] transition">Daftar</Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ══ HERO SECTION ══ */}
        <section id="hero" className="pt-32 pb-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-cream via-cream to-cream-dark">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Sistem aktif di 24 kecamatan
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.08] tracking-tight mb-6"
              >
                Laporkan Masalah Kota <br />
                <span className="bg-gradient-to-r from-primary via-secondary to-indigo-600 bg-clip-text text-transparent italic">Cepat &amp; Transparan</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-lg mb-8"
              >
                KataWarga membantu masyarakat melaporkan masalah lingkungan, fasilitas umum, dan layanan publik secara realtime — langsung ke tangan dinas pemangku kepentingan kota.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-3.5 w-full sm:w-auto mb-10"
              >
                <a 
                  href="#how"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-full shadow-xl shadow-primary/30 hover:bg-[#2b2e2f] hover:shadow-primary/45 transition active:scale-95"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  Buat Laporan
                </a>
                <a 
                  href="#map"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-cream border border-cream-darker hover:bg-cream-dark font-semibold rounded-full transition active:scale-95"
                >
                  <Activity size={18} />
                  Lihat Peta
                </a>
              </motion.div>

              {/* Citizen trust badge */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex items-center gap-4"
              >
                <div className="flex -space-x-2.5">
                  {["AR", "BS", "SR", "DW"].map((avatar, idx) => (
                    <div 
                      key={idx}
                      className={`w-9 h-9 rounded-full border-2 border-cream flex items-center justify-center text-[10px] font-black text-white ${
                        idx === 0 ? "bg-red-500" : idx === 1 ? "bg-blue-500" : idx === 2 ? "bg-amber-500" : "bg-green-500"
                      }`}
                    >
                      {avatar}
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-cream bg-secondary flex items-center justify-center text-[10px] font-black text-white">
                    +8
                  </div>
                </div>
                <p className="text-xs text-ink-muted">
                  <strong className="text-ink font-bold">1.284 warga</strong> sudah aktif melaporkan bulan ini
                </p>
              </motion.div>
            </div>

            {/* Hero Right: Three.js Interactive constellation */}
            <div className="lg:col-span-6 relative w-full h-[400px] lg:h-[500px]">
              
              {/* Absolute glass mockup dashboard */}
              <div className="absolute inset-0 z-0">
                <ThreeNetwork />
              </div>

              {/* Floating cards for citizen statistics */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute top-2 right-2 w-48 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl pointer-events-none"
              >
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider mb-1">Laporan Selesai Hari Ini</p>
                <p className="font-display font-extrabold text-3xl text-ink">
                  <CountUp to={47} duration={2} />
                </p>
                <p className="text-[10px] text-green-600 font-bold mt-1">↑ 12% dari kemarin</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute bottom-2 left-2 w-44 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl pointer-events-none"
              >
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider mb-1">Rata-rata Respon</p>
                <p className="font-display font-extrabold text-2xl text-primary">2.4 Jam</p>
                <p className="text-[10px] text-primary/80 font-semibold mt-1">Prioritas Tinggi</p>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ══ STATS SECTION ══ */}
        <section id="stats" className="py-16 bg-cream border-y border-ink/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              {[
                { label: "Laporan Diterima", value: 1284, suffix: "", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Selesai Ditangani", value: 842, suffix: "", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Tingkat Kepuasan", value: 95, suffix: "%", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "Kecamatan Terkoneksi", value: 24, suffix: "", icon: MapPin, color: "text-purple-500", bg: "bg-purple-500/10" }
              ].map((stat, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  key={idx} 
                  className="bg-white p-6 rounded-2xl border border-cream-darker hover:-translate-y-1 transition duration-300 flex flex-col items-start gap-4 shadow-sm"
                >
                  <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-3xl text-ink leading-tight">
                      <CountUp to={stat.value} suffix={stat.suffix} />
                    </h3>
                    <p className="text-xs text-ink-muted font-medium mt-1">{stat.label}</p>
                  </div>
                </motion.div>
              ))}

            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Features Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Fitur Unggulan</h2>
              <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight mb-4">
                Dirancang untuk Transparansi Warga &amp; Pemerintah
              </h3>
              <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                Semua instrumen yang dibutuhkan untuk penyampaian aspirasi, pemantauan progress di lapangan, dan penyelesaian masalah yang akuntabel.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {[
                { 
                  title: "Realtime Tracking", 
                  desc: "Pantau status aduan kamu secara langsung. Notifikasi push dikirimkan otomatis saat tim lapangan merespon laporan Anda.",
                  icon: Activity,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10"
                },
                { 
                  title: "Interactive Maps", 
                  desc: "Lihat persebaran laporan secara visual di peta interaktif perkotaan dengan filter kluster dinamis dan indikasi hotspot rawan.",
                  icon: MapPin,
                  color: "text-secondary",
                  bg: "bg-secondary/10"
                },
                { 
                  title: "Quick Response 24h", 
                  desc: "Penentuan skala prioritas otomatis dengan teknologi geo-tagging, menjamin aduan krusial direspon petugas kurang dari 24 jam.",
                  icon: Clock,
                  color: "text-amber-600",
                  bg: "bg-amber-600/10"
                },
                { 
                  title: "Upload Bukti Gambar", 
                  desc: "Gunakan modul kamera bawaan untuk memotret jalan rusak atau sampah menumpuk. Sistem otomatis mendeteksi koordinat GPS.",
                  icon: Camera,
                  color: "text-red-500",
                  bg: "bg-red-500/10"
                },
                { 
                  title: "Community Upvote", 
                  desc: "Dukung laporan yang diajukan tetangga sekitar. Laporan dengan dukungan terbanyak otomatis terangkat ke prioritas operator.",
                  icon: ThumbsUp,
                  color: "text-green-500",
                  bg: "bg-green-500/10"
                },
                { 
                  title: "Dapur Admin Terintegrasi", 
                  desc: "Sistem pendistribusian aduan otomatis ke instansi dinas yang relevan (Bina Marga, Kebersihan, Dishub) berdasarkan kategori.",
                  icon: ShieldAlert,
                  color: "text-purple-500",
                  bg: "bg-purple-500/10"
                }
              ].map((feat, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  key={idx}
                  className="p-8 bg-cream/35 border border-cream-darker hover:border-primary/20 hover:bg-white rounded-3xl transition duration-300 flex flex-col items-start text-left shadow-sm group"
                >
                  <div className={`p-3 rounded-2xl ${feat.bg} ${feat.color} group-hover:scale-110 transition duration-300 mb-6`}>
                    <feat.icon size={22} />
                  </div>
                  <h4 className="font-display font-extrabold text-lg text-ink mb-2">{feat.title}</h4>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}

            </div>

          </div>
        </section>

        {/* ══ INTERACTIVE LIVE MAP PREVIEW ══ */}
        <section id="map" className="py-24 bg-cream">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Info and Interactive Filter */}
              <div className="lg:col-span-5 text-left">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Peta Interaktif</h2>
                <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight mb-4">
                  Visualisasi Realtime Semua Laporan Aktif
                </h3>
                <p className="text-sm sm:text-base text-ink-muted leading-relaxed mb-6">
                  Setiap pengaduan dipetakan otomatis sesuai koordinat GPS. Filter berdasarkan kategori utama di bawah untuk melihat titik aduan di peta:
                </p>

                {/* Filter buttons */}
                <div className="flex flex-col gap-2 mb-6">
                  {[
                    { name: "Semua", color: "bg-ink text-white", border: "border-ink" },
                    { name: "Jalan Rusak", color: "bg-red-500 text-white", border: "border-red-500/20" },
                    { name: "Fasilitas Umum", color: "bg-blue-500 text-white", border: "border-blue-500/20" },
                    { name: "Penerangan", color: "bg-amber-500 text-white", border: "border-amber-500/20" },
                    { name: "Lingkungan", color: "bg-green-500 text-white", border: "border-green-500/20" }
                  ].map((filterItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMapFilter(filterItem.name);
                        setActiveMarker(null);
                      }}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl border flex items-center justify-between transition ${
                        mapFilter === filterItem.name 
                          ? "bg-white border-primary text-primary shadow-sm" 
                          : "bg-white/50 border-cream-darker text-ink-soft hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          filterItem.name === "Semua" ? "bg-ink" 
                          : filterItem.name === "Jalan Rusak" ? "bg-[#EF4444]"
                          : filterItem.name === "Fasilitas Umum" ? "bg-[#3B82F6]"
                          : filterItem.name === "Penerangan" ? "bg-[#F59E0B]"
                          : "bg-[#10B981]"
                        }`}></span>
                        {filterItem.name}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-cream rounded-full text-ink-muted">
                        {filterItem.name === "Semua" ? mapMarkers.length 
                          : mapMarkers.filter(m => m.category === filterItem.name).length} aduan
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Interactive SVG Map Mockup */}
              <div className="lg:col-span-7">
                <div className="relative bg-[#1A2535] rounded-3xl overflow-hidden border border-white/5 shadow-2xl p-4">
                  <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-xs text-white font-bold tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                    Live Preview — {filteredMarkers.length} Laporan Aktif
                  </div>

                  {/* SVG Map Layout */}
                  <svg 
                    viewBox="0 0 600 380" 
                    className="w-full h-auto block select-none"
                  >
                    {/* Dark grid decoration */}
                    <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                      {[76, 152, 228, 304].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} />)}
                      {[120, 240, 360, 480].map(x => <line key={x} x1={x} y1="0" x2={x} y2="380" />)}
                    </g>

                    {/* Simulated city boundaries */}
                    <path d="M50,80 L200,60 L380,90 L520,70 L550,220 L400,320 L220,340 L80,240 Z" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                    
                    {/* Simulated major road networks */}
                    <path d="M0,190 Q150,175 300,190 Q450,205 600,185" stroke="rgba(255,255,255,0.08)" strokeWidth="4.5" fill="none" />
                    <path d="M300,0 Q290,95 300,190 Q308,270 295,380" stroke="rgba(255,255,255,0.07)" strokeWidth="3" fill="none" />
                    <path d="M0,120 Q320,135 600,115" stroke="rgba(255,255,255,0.04)" strokeWidth="2" fill="none" />
                    <path d="M0,290 Q300,285 600,275" stroke="rgba(255,255,255,0.04)" strokeWidth="2" fill="none" />

                    {/* Active report markers mapping */}
                    {filteredMarkers.map((marker) => (
                      <g 
                        key={marker.id} 
                        className="cursor-pointer group"
                        onClick={() => setActiveMarker(marker)}
                      >
                        {/* Dynamic pulsing ring */}
                        <circle 
                          cx={marker.cx} 
                          cy={marker.cy} 
                          r={marker.r * 2.2} 
                          fill="none" 
                          stroke={marker.color} 
                          strokeWidth="1.5" 
                          className="animate-pulse"
                          opacity={0.3}
                        />
                        {/* Solid center node */}
                        <circle 
                          cx={marker.cx} 
                          cy={marker.cy} 
                          r={marker.r} 
                          fill={marker.color}
                          className="transition duration-200 group-hover:scale-125"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* SVG Scale indicator */}
                  <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1 font-mono text-[9px] text-white/40">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                      <span>Skala 1:15.000</span>
                    </div>
                  </div>

                  {/* Dynamic Tooltip details if active marker is clicked */}
                  <AnimatePresence>
                    {activeMarker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-4 right-4 left-4 md:left-auto md:w-80 p-4 bg-ink/95 border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            activeMarker.category === "Jalan Rusak" ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : activeMarker.category === "Fasilitas Umum" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : activeMarker.category === "Penerangan" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}>
                            {activeMarker.category}
                          </span>
                          <button 
                            onClick={() => setActiveMarker(null)}
                            className="p-1 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <h4 className="font-display font-extrabold text-white text-sm mb-0.5">{activeMarker.title}</h4>
                        <p className="text-[10px] text-white/50 flex items-center gap-1 mb-2">
                          <MapPin size={10} />
                          {activeMarker.loc}
                        </p>
                        <p className="text-xs text-white/80 leading-relaxed mb-3">{activeMarker.desc}</p>
                        <a 
                          href="#recent" 
                          onClick={() => setActiveMarker(null)} 
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:text-blue-400 transition"
                        >
                          Selengkapnya
                          <ArrowRight size={12} />
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick helper tag if no marker is selected */}
                  {!activeMarker && (
                    <div className="absolute bottom-4 right-4 bg-ink/50 backdrop-blur-sm border border-white/5 px-3 py-1.5 rounded-full text-[10px] text-white/70">
                      Klik marker di peta untuk melihat detail laporan
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══ CATEGORIES ══ */}
        <section id="categories" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Kategori Laporan</h2>
              <h3 className="font-display font-extrabold text-3xl text-ink leading-tight">
                24 Kategori Pengaduan Terlayani
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Jalan Rusak", count: 312, bg: "bg-red-500/10", color: "text-red-500", icon: AlertTriangle },
                { name: "Penerangan Jalan", count: 198, bg: "bg-amber-500/10", color: "text-amber-500", icon: Sparkles },
                { name: "Sampah &amp; Kebersihan", count: 267, bg: "bg-green-500/10", color: "text-green-500", icon: CheckCircle },
                { name: "Fasilitas Umum", count: 183, bg: "bg-blue-500/10", color: "text-blue-500", icon: Info },
                { name: "Banjir &amp; Drainase", count: 145, bg: "bg-indigo-500/10", color: "text-indigo-500", icon: Activity },
                { name: "Vandalisme", count: 91, bg: "bg-purple-500/10", color: "text-purple-500", icon: ShieldAlert },
                { name: "Kesehatan Publik", count: 88, bg: "bg-pink-500/10", color: "text-pink-500", icon: CheckCircle2 },
                { name: "Lainnya (+16)", count: 72, bg: "bg-ink/5", color: "text-ink-soft", icon: Plus }
              ].map((cat, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  key={idx}
                  className="p-6 bg-cream/40 border border-cream-darker hover:border-primary/20 hover:bg-white hover:-translate-y-1 transition duration-300 rounded-2xl flex flex-col items-start gap-4 text-left cursor-pointer group"
                >
                  <div className={`p-2.5 rounded-xl ${cat.bg} ${cat.color} group-hover:scale-110 transition duration-300`}>
                    <cat.icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-sm text-ink group-hover:text-primary transition" dangerouslySetInnerHTML={{ __html: cat.name }}></h4>
                    <p className="text-[11px] text-ink-muted mt-0.5">{cat.count} aduan aktif</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* ══ HOW IT WORKS & STEP CONSOLE SIMULATOR ══ */}
        <section id="how" className="py-24 bg-cream">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Steps Info left */}
              <div className="lg:col-span-6 text-left">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Alur Kerja</h2>
                <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight mb-6">
                  Dari Laporan Warga hingga Penindakan Selesai
                </h3>

                <div className="flex flex-col gap-4">
                  {[
                    { title: "Upload Laporan", desc: "Foto masalah, jelaskan keluhan, pilih kategori, dan lokasi GPS dipetakan otomatis — tuntas kurang dari 60 detik." },
                    { title: "Diverifikasi Admin", desc: "Sistem mendeteksi dinas terkait yang online dan meneruskan tiket aduan. Aduan darurat diprioritaskan." },
                    { title: "Diproses Lapangan", desc: "Regu dinas terkait ditugaskan turun langsung ke lapangan. Warga bisa terus memantau kemajuan pengerjaan." },
                    { title: "Konfirmasi Warga", desc: "Laporan hanya ditandai selesai jika warga memberikan konfirmasi tanda setuju. Kepuasan warga tolak ukur utama." }
                  ].map((step, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`p-4 rounded-2xl border transition duration-300 flex items-start gap-4 cursor-pointer ${
                        activeStep === idx 
                          ? "bg-white border-primary shadow-md" 
                          : "bg-white/40 border-cream-darker hover:bg-white"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition duration-300 ${
                        activeStep === idx ? "bg-primary text-white" : "bg-cream-darker text-ink-muted"
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-sm text-ink mb-1">{step.title}</h4>
                        <p className="text-xs text-ink-muted leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps Visual simulator terminal right */}
              <div className="lg:col-span-6">
                <div className="bg-[#1A1A2E] rounded-3xl border border-white/5 shadow-2xl p-6 text-left font-mono text-xs overflow-hidden h-[380px] flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                        <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-[10px] text-white/30">Laporan #KW-4091 Terminal Simulator</span>
                    </div>

                    {/* Dynamic Simulated Console Logs */}
                    <div className="flex flex-col gap-2.5 text-green-400 h-[240px] overflow-y-auto select-none scrollbar-thin">
                      <p className="text-white/40">{"// Menyimulasikan Langkah "}{activeStep + 1}:</p>
                      {stepConsoleLogs[activeStep].map((log, logIdx) => (
                        <motion.p
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: logIdx * 0.15 }}
                          key={`${activeStep}-${logIdx}`}
                          className="leading-relaxed"
                        >
                          {log}
                        </motion.p>
                      ))}
                    </div>
                  </div>

                  {/* Indicator footer */}
                  <div className="border-t border-white/10 pt-3 text-[10px] text-white/30 flex items-center justify-between">
                    <span>STATUS: ACTIVE_SIMULATOR</span>
                    <span>TIMELINE STEP {activeStep + 1} / 4</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══ RECENT REPORTS ══ */}
        <section id="recent" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Header recent */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
              <div className="text-left">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Laporan Terbaru</h2>
                <h3 className="font-display font-extrabold text-3xl text-ink leading-tight mb-0">
                  Masalah Kota Sedang Ditangani
                </h3>
              </div>
              <button className="self-start md:self-auto px-6 py-2.5 text-xs font-bold border border-cream-darker rounded-full hover:bg-cream-dark transition">
                Lihat Semua Laporan →
              </button>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div 
                  key={report.id}
                  className="bg-cream/25 border border-cream-darker rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition duration-300"
                >
                  <div>
                    {/* Header card: image / placeholder decoration */}
                    <div className="h-44 bg-cream-dark flex items-center justify-center relative p-6">
                      <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${report.bgBadge}`}>
                          {report.category}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${report.statusColor}`}>
                          ● {report.status}
                        </span>
                      </div>
                      <MapPin size={40} className="text-ink/15" />
                    </div>

                    {/* Card Content body */}
                    <div className="p-6 text-left">
                      <p className="text-[10px] text-ink-muted mb-2 font-medium">{report.time}</p>
                      <h4 className="font-display font-bold text-base text-ink leading-snug mb-2.5 hover:text-primary transition cursor-pointer">
                        {report.title}
                      </h4>
                      <p className="text-xs text-ink-muted leading-relaxed mb-4 line-clamp-3">
                        {report.desc}
                      </p>
                    </div>
                  </div>

                  {/* Footer Card */}
                  <div className="px-6 py-4 border-t border-cream-darker bg-white/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {report.avatar}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-ink">{report.author}</p>
                        <p className="text-[9px] text-ink-muted">Reporter Warga</p>
                      </div>
                    </div>

                    {/* Interactive controls */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleLike(report.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition ${
                          report.liked ? "text-red-500 scale-105" : "text-ink-soft hover:text-red-500"
                        }`}
                      >
                        <Heart size={14} fill={report.liked ? "currentColor" : "none"} />
                        <span>{report.likes}</span>
                      </button>
                      <div className="flex items-center gap-1 text-xs text-ink-muted">
                        <MessageSquare size={14} />
                        <span>{report.comments}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ══ MOBILE PREVIEW & APP SIMULATION FRAME ══ */}
        <section id="mobile" className="py-24 bg-cream border-t border-ink/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Info Column */}
              <div className="lg:col-span-5 text-left">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Aplikasi Mobile</h2>
                <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight mb-4">
                  Pantau &amp; Lapor Langsung dari Genggaman Anda
                </h3>
                <p className="text-sm sm:text-base text-ink-muted leading-relaxed mb-6">
                  Tersedia di iOS dan Android. Nikmati kemudahan pembuatan pengaduan otomatis dengan geotagging GPS, upload foto langsung dari kamera, dan follow-up status dinamis.
                </p>

                {/* Micro bullet features with lucide icons */}
                <div className="flex flex-col gap-4 mb-8">
                  {[
                    { title: "Kirim Aduan 1-Ketuk", desc: "Jepret foto, sistem memetakan lokasi otomatis, submit laporan kurang dari 60 detik." },
                    { title: "Status Tracking Transparan", desc: "Dapatkan push notification berkala saat petugas lapangan bergegas menuju lokasi Anda." },
                    { title: "Deteksi GPS Otomatis", desc: "Akurasi penentuan lokasi aduan berbasis satelit GPS tanpa perlu mengetikkan alamat lengkap." }
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary h-max flex-shrink-0">
                        <CheckCircle size={14} />
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-sm text-ink mb-0.5">{bullet.title}</h4>
                        <p className="text-xs text-ink-muted leading-normal">{bullet.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* App store buttons */}
                <div className="flex flex-wrap gap-3">
                  <button className="px-6 py-3 bg-ink text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-ink-soft transition active:scale-95">
                    <Download size={14} />
                    App Store
                  </button>
                  <button className="px-6 py-3 bg-ink text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-ink-soft transition active:scale-95">
                    <Download size={14} />
                    Google Play
                  </button>
                </div>
              </div>

              {/* Right Phone Emulator Column: AMAZING INTERACTIVE EXPERIENCE */}
              <div className="lg:col-span-7 flex justify-center">
                
                {/* Secondary small mock phone decor */}
                <div className="hidden sm:block w-48 bg-[#1A1A2E] rounded-[36px] overflow-hidden border-4 border-[#252540] shadow-2xl p-2.5 h-[400px] translate-y-8 translate-x-4 opacity-40">
                  <div className="w-16 h-4 bg-[#1A1A2E] mx-auto rounded-b-xl mb-4"></div>
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] font-bold text-white/50">SELESAI BARU-BARU INI</span>
                    <div className="w-full p-2.5 bg-white/5 rounded-xl border border-white/5 text-left">
                      <p className="text-[9px] font-bold text-white/80">Saluran C3 Tersumbat</p>
                      <p className="text-[8px] text-green-400 mt-1">Selesai • 1 hari lalu</p>
                    </div>
                    <div className="w-full p-2.5 bg-white/5 rounded-xl border border-white/5 text-left">
                      <p className="text-[9px] font-bold text-white/80">Aspal Bolong Jl. Merdeka</p>
                      <p className="text-[8px] text-green-400 mt-1">Selesai • 2 hari lalu</p>
                    </div>
                  </div>
                </div>

                {/* Primary functional interactive app mock emulator */}
                <div className="w-[280px] bg-[#1A1A2E] rounded-[42px] overflow-hidden border-8 border-[#252540] shadow-2xl p-3 h-[480px] relative flex flex-col justify-between">
                  
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#1A1A2E] rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="w-12 h-1 bg-[#252540] rounded-full"></div>
                  </div>

                  {/* App Screen container */}
                  <div className="bg-cream h-full rounded-[30px] overflow-hidden flex flex-col justify-between text-left p-3 pt-6 relative select-none">
                    
                    {/* Dynamic App Feed Screen */}
                    {phoneScreen === "feed" && (
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          {/* App Greeting */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-ink font-display flex items-center gap-1.5">
                              Halo, Ahmad
                            </span>
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <Sparkles size={10} />
                            </div>
                          </div>

                          {/* App search box */}
                          <div className="relative mb-3.5">
                            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input 
                              type="text" 
                              placeholder="Cari laporan..." 
                              value={phoneSearch}
                              onChange={(e) => setPhoneSearch(e.target.value)}
                              className="w-full py-1 px-7 bg-white border border-cream-darker rounded-full text-[9px] focus:outline-none focus:border-primary font-medium"
                            />
                          </div>

                          {/* Live search result feedback count */}
                          <span className="text-[8px] font-bold text-ink-muted uppercase tracking-wider mb-2 block">
                            Daftar Pengaduan ({
                              phoneReports.filter(r => r.title.toLowerCase().includes(phoneSearch.toLowerCase())).length
                            })
                          </span>

                          {/* Mini scrolling list */}
                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-none">
                            {phoneReports
                              .filter(r => r.title.toLowerCase().includes(phoneSearch.toLowerCase()))
                              .map((pRep) => (
                                <div key={pRep.id} className="p-2.5 bg-white border border-cream-darker rounded-xl">
                                  <h5 className="text-[9px] font-bold text-ink leading-tight mb-1">{pRep.title}</h5>
                                  <div className="flex items-center justify-between text-[7px] font-medium text-ink-muted">
                                    <span>{pRep.category} • {pRep.time}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full ${
                                      pRep.status === "Selesai" ? "bg-green-500/10 text-green-600 font-bold" 
                                      : pRep.status === "Diproses" ? "bg-blue-500/10 text-blue-600 font-bold" 
                                      : "bg-amber-500/10 text-amber-600 font-bold"
                                    }`}>
                                      {pRep.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Floating Action Button inside app */}
                        <div className="flex justify-end pr-1 pb-1">
                          <button 
                            onClick={() => setPhoneScreen("form")}
                            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Submit Form Screen */}
                    {phoneScreen === "form" && (
                      <form onSubmit={handlePhoneSubmit} className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3 border-b border-cream-darker pb-1.5">
                            <span className="text-[10px] font-bold text-ink font-display">Simulasi Buat Laporan</span>
                            <button 
                              type="button" 
                              onClick={() => setPhoneScreen("feed")}
                              className="text-ink-muted hover:text-ink transition"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <div>
                              <label className="text-[7px] font-bold text-ink-muted uppercase block mb-1">Kategori Aduan</label>
                              <select 
                                value={phoneReportCategory}
                                onChange={(e) => setPhoneReportCategory(e.target.value)}
                                className="w-full p-1.5 bg-white border border-cream-darker rounded-lg text-[9px] focus:outline-none"
                              >
                                <option>Jalan Rusak</option>
                                <option>Penerangan</option>
                                <option>Lingkungan</option>
                                <option>Fasilitas Umum</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-[7px] font-bold text-ink-muted uppercase block mb-1">Judul Laporan</label>
                              <input 
                                type="text"
                                required
                                placeholder="Contoh: Lampu Padam Gang Dahlia"
                                value={phoneReportTitle}
                                onChange={(e) => setPhoneReportTitle(e.target.value)}
                                className="w-full p-1.5 bg-white border border-cream-darker rounded-lg text-[9px] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[7px] font-bold text-ink-muted uppercase block mb-1">Keterangan / Deskripsi</label>
                              <textarea 
                                placeholder="Jelaskan detail masalah..."
                                value={phoneReportDesc}
                                onChange={(e) => setPhoneReportDesc(e.target.value)}
                                rows={2}
                                className="w-full p-1.5 bg-white border border-cream-darker rounded-lg text-[9px] focus:outline-none resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => setPhoneScreen("feed")}
                            className="flex-1 py-1.5 border border-cream-darker text-[9px] font-bold rounded-lg text-ink-soft hover:bg-cream-dark text-center"
                          >
                            Batal
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-1.5 bg-primary text-[9px] font-bold text-white rounded-lg hover:bg-[#2b2e2f] text-center"
                          >
                            Kirim Aduan
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Dynamic Success screen simulation */}
                    {phoneScreen === "success" && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center p-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                          <CheckCircle2 size={24} />
                        </div>
                        <h5 className="text-[10px] font-bold text-ink font-display">Laporan Terkirim!</h5>
                        <p className="text-[8px] text-ink-muted mt-1 leading-normal">Simulasi laporan Anda berhasil diunggah dan otomatis terpetakan di database.</p>
                      </motion.div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ══ CALL TO ACTION (CTA) ══ */}
        <section id="cta" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden p-8 sm:p-16 rounded-[32px] bg-gradient-to-br from-indigo-900 via-primary to-blue-500 shadow-2xl text-center flex flex-col items-center"
            >
              {/* Background abstract overlay grids */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 rounded-full border border-white/5 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col items-center max-w-xl">
                <span className="px-3.5 py-1 bg-white/20 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  Mulai Sekarang — Tanpa Pungutan Biaya
                </span>
                
                <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight mb-4">
                  Ubah Kota Anda Menjadi Lebih Baik Bersama KataWarga
                </h2>
                
                <p className="text-sm text-white/80 leading-relaxed mb-8">
                  Bergabunglah dengan ribuan warga aktif lainnya. Laporan Anda yang berharga adalah kunci menuju tata kelola lingkungan dan fasilitas kota yang asri dan beradab.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <a 
                    href="#how" 
                    className="px-8 py-3.5 bg-white text-primary font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition active:scale-95 text-center flex items-center justify-center gap-1.5"
                  >
                    Kirim Laporan Pertama
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </a>
                  <a 
                    href="#map" 
                    className="px-8 py-3.5 bg-white/10 border border-white/30 text-white font-bold rounded-full hover:bg-white/20 hover:scale-[1.02] transition active:scale-95 text-center flex items-center justify-center gap-1.5"
                  >
                    <Activity size={16} />
                    Lihat Peta Aduan
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="bg-ink text-white/70 py-16 border-t border-white/5 text-left">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
            
            {/* Brand column */}
            <div className="md:col-span-5 flex flex-col items-start gap-4">
              <a href="#" className="flex items-center gap-2.5 font-display font-extrabold text-xl tracking-tight text-white">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                  <MapPin size={16} strokeWidth={2.5} />
                </div>
                <span>KataWarga</span>
              </a>
              <p className="text-xs leading-relaxed text-white/50 max-w-sm">
                Platform aspirasi dan pelaporan pengaduan masyarakat yang menjembatani warga dengan pemangku kepentingan kota secara cepat, transparan, dan akuntabel.
              </p>
              <div className="flex items-center gap-3 mt-2">
                {["instagram", "twitter", "linkedin", "github"].map((soc, idx) => (
                  <a 
                    key={idx} 
                    href="#" 
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-primary hover:text-white transition flex items-center justify-center text-white/70"
                    aria-label={soc}
                  >
                    {soc === "instagram" ? <Activity size={14} /> 
                     : soc === "twitter" ? <Sparkles size={14} /> 
                     : soc === "linkedin" ? <Info size={14} /> 
                     : <ChevronRight size={14} />}
                  </a>
                ))}
              </div>
            </div>

            {/* Links columns */}
            <div className="md:col-span-2 flex flex-col items-start gap-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-display">Layanan</h4>
              {["Buat Laporan", "Lihat Peta", "Lacak Status", "API Integrasi", "Dapur Admin"].map((link, idx) => (
                <a key={idx} href="#" className="text-xs hover:text-white hover:underline transition">{link}</a>
              ))}
            </div>

            <div className="md:col-span-2 flex flex-col items-start gap-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-display">Kategori Populer</h4>
              {["Jalan Rusak", "Penerangan", "Kebersihan", "Banjir", "Fasum"].map((link, idx) => (
                <a key={idx} href="#" className="text-xs hover:text-white hover:underline transition">{link}</a>
              ))}
            </div>

            <div className="md:col-span-3 flex flex-col items-start gap-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-display">Kontak Kami</h4>
              <div className="flex items-center gap-2 text-xs hover:text-white transition cursor-pointer">
                <Mail size={14} />
                <span>hello@katawarga.id</span>
              </div>
              <div className="flex items-center gap-2 text-xs hover:text-white transition cursor-pointer">
                <Phone size={14} />
                <span>(021) 1234-5678</span>
              </div>
              <div className="text-[10px] text-white/30 leading-relaxed mt-2">
                Gedung Balai Kota DKI Jakarta Blok B Lt. 3, Jakarta Pusat, Indonesia.
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-white/40">
              &copy; {new Date().getFullYear()} KataWarga. Dibuat dengan &hearts; untuk masyarakat Indonesia.
            </p>
            <div className="flex items-center gap-4 text-[10px] text-white/40">
              <a href="#" className="hover:text-white transition">Kebijakan Privasi</a>
              <a href="#" className="hover:text-white transition">Syarat &amp; Ketentuan</a>
              <a href="#" className="hover:text-white transition">Aksesibilitas</a>
              <a href="#" className="hover:text-white transition">SLA Response</a>
            </div>
          </div>
        </footer>

      </div>
    </ReactLenis>
  );
}
