import { NavLink, useLocation } from "react-router-dom";
import { Home, PlusCircle, MessageCircle, Bell, User } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/useProfile";

const navItems = [
  { to: "/", icon: Home, label: "Feed" },
  { to: "/chats", icon: MessageCircle, label: "Chats" },
  { to: "/create", icon: PlusCircle, label: "Geef weg", isCreate: true },
  { to: "/notifications", icon: Bell, label: "Meldingen", badge: true },
  { to: "/profile", icon: User, label: "Profiel" },
];

const BottomNav = () => {
  const location = useLocation();
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center -mt-4 tap-highlight-none"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center droppy-shadow-lg">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-2 tap-highlight-none"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {item.badge && unreadCount && unreadCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
