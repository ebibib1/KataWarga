// StatusBadge — displays report status with icon
import { useConfig } from "@/hooks/useConfig";
import { STATUS_ICONS } from "@/lib/configIcons";

export default function StatusBadge({ status }) {
  const { config } = useConfig();
  const statuses = config?.statuses || {};
  const cfg = statuses[status] || statuses.menunggu || { label: status, className: "bg-gray-50 text-gray-600 border-gray-200", spin: false };
  const Icon = STATUS_ICONS[status] || STATUS_ICONS.menunggu;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.className}`}
    >
      {Icon && <Icon size={10} className={cfg.spin ? "animate-spin" : ""} />}
      {cfg.label}
    </span>
  );
}
