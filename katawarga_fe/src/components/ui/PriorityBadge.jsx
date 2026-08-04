// PriorityBadge — displays report priority
import { useConfig } from "@/hooks/useConfig";

export default function PriorityBadge({ priority }) {
  const { config } = useConfig();
  const priorities = config?.priorities || {};
  const cfg = priorities[priority] || priorities.rendah || { label: priority, className: "bg-slate-100 text-slate-500", dot: "bg-slate-400" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
