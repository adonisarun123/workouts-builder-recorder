import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { AppHeader } from "@/components/app-shell/app-header";
import { MobileBottomNav } from "@/components/app-shell/mobile-bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-mesh-bg min-h-screen">
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">{children}</main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
