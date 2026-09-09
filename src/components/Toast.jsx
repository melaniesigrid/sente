import { Medal, Trophy, Flag, Info } from "lucide-react";

/* ----------------------- TOAST ----------------------- */
const TOAST_ICONS = { medal: Medal, trophy: Trophy, flag: Flag, info: Info };

export function Toast({ toast }) {
  if (!toast) return null;
  const Icon = TOAST_ICONS[toast.icon] || Trophy;
  return (
    <div className="toast" role="status">
      <Icon size={16} strokeWidth={2.2} />
      <span>{toast.text}</span>
    </div>
  );
}
