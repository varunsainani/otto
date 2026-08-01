import { AppShell } from "@/components/app-shell";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
