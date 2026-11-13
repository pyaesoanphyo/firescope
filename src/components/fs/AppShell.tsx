import { Link } from "@tanstack/react-router";
import { Globe2, CalendarDays, Satellite, BookOpen, Flame } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: Globe2 },
  { to: "/calendar", label: "Fire Calendar", icon: CalendarDays },
  { to: "/sensors", label: "Sensor Analysis", icon: Satellite },
  { to: "/methods", label: "Data & Methods", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 py-5">
          <Flame className="h-5 w-5 text-fire" />
          <div>
            <div className="text-base font-semibold tracking-tight">FireScope</div>
            <div className="label-caps">Burning activity intel</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-foreground" }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 px-5 py-5">
          <div className="label-caps">Pilot dataset</div>
          <div className="font-mono text-xs text-muted-foreground">156,810 obs · 6 dates · 5 sensors</div>
        </div>
      </aside>
      <main className="relative flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
