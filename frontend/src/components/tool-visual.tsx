import {
  AlignLeft,
  BookOpen,
  Calculator,
  Database,
  Flag,
  Globe,
  ListPlus,
  type LucideIcon,
  Mail,
  StickyNote,
  TrendingUp,
  Wrench,
} from "lucide-react";

const MAP: Record<string, { icon: LucideIcon; color: string }> = {
  query_records: { icon: Database, color: "#38bdf8" },
  search_knowledge: { icon: BookOpen, color: "#a78bfa" },
  web_search: { icon: Globe, color: "#22d3ee" },
  create_task: { icon: ListPlus, color: "#4ade80" },
  update_deal: { icon: TrendingUp, color: "#facc15" },
  add_note: { icon: StickyNote, color: "#fb923c" },
  draft_email: { icon: Mail, color: "#f472b6" },
  calculate: { icon: Calculator, color: "#60a5fa" },
  summarize: { icon: AlignLeft, color: "#94a3b8" },
  finish: { icon: Flag, color: "#a3e635" },
};

export function toolVisual(tool: string | null): { icon: LucideIcon; color: string } {
  return (tool && MAP[tool]) || { icon: Wrench, color: "#94a3b8" };
}

export function ToolIcon({ tool, size = 16 }: { tool: string | null; size?: number }) {
  const { icon: Icon, color } = toolVisual(tool);
  return <Icon size={size} style={{ color }} />;
}
