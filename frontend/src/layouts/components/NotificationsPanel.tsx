import { Bell } from "lucide-react";

export function NotificationsPanel() {
  return (
    <button
      className="relative grid h-9 w-9 place-items-center rounded-full text-brand-700 hover:bg-brand-50 transition-colors"
      title="Notificações (em breve)"
    >
      <Bell size={18} />
    </button>
  );
}
