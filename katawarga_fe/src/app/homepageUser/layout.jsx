import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import MobileTopBar from "@/components/layout/MobileTopBar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export const metadata = {
  title: "Beranda | KataWarga",
  description: "Pantau laporan warga dan perkembangan kota Anda.",
};

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Mobile Top Bar - Sticky at top for small screens */}
      <MobileTopBar />

      {/* Main 3-column layout container */}
      <div className="max-w-screen-xl mx-auto flex gap-0 min-h-screen">
        
        {/* LEFT SIDEBAR (Desktop) - Sticky and fixed height */}
        <LeftSidebar />

        {/* MAIN FEED / CONTENT COLUMN */}
        {/* We use flex-1 to take available space, min-w-0 to prevent flex shrinkage issues */}
        <main className="flex-1 min-w-0 border-r border-[#E8E2D9] pb-24 md:pb-0">
          {children}
        </main>

        {/* RIGHT SIDEBAR (Desktop) - Hidden on medium/mobile */}
        <div className="hidden lg:block px-4 py-4 w-72 xl:w-80 flex-shrink-0">
          <div className="sticky top-4">
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Fixed at bottom for small screens */}
      <MobileBottomNav />
    </div>
  );
}
