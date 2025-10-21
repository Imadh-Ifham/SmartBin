import { Link, useLocation } from "react-router-dom";
import { Home, Camera, ClipboardList, Bell } from "lucide-react";

const NavLink = ({
  to,
  label,
  Icon,
}: {
  to: string;
  label: string;
  Icon: any;
}) => {
  const location = useLocation();
  const active = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 rounded-lg px-6 py-2 transition-colors ${
        active ? "text-emerald-600" : "text-teal-500 hover:bg-white/40"
      }`}
    >
      <Icon
        className={`h-6 w-6 ${active ? "text-emerald-600" : "text-teal-500"}`}
      />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

export default function BottomNavbar() {
  const location = useLocation();
  const isAuth =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");
  if (isAuth) return null; // hide navbars on auth pages

  return (
    <nav className="sticky bottom-0 z-40 w-full border-t border-emerald-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center justify-around px-2 py-3">
        <NavLink to="/home" label="Home" Icon={Home} />
        <NavLink to="/scan" label="Scan" Icon={Camera} />
        <NavLink to="/requests" label="Requests" Icon={ClipboardList} />
        <NavLink to="/notifications" label="Notifications" Icon={Bell} />
      </div>
    </nav>
  );
}
