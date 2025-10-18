import { Link, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";

export default function TopNavbar() {
  const location = useLocation();
  const isAuth =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");
  if (isAuth) return null; // hide on auth pages for full-bleed auth design

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/home" className="text-xl font-semibold text-slate-900">
          SmartBin
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/profile"
            className="text-slate-700 hover:text-slate-900 transition-colors"
          >
            Profile
          </Link>
          <Link
            to="/help"
            className="text-slate-700 hover:text-slate-900 transition-colors"
          >
            Help
          </Link>
          <Link
            to="/payment"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Manage Payment
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </nav>

        {/* Compact menu for small screens (simple) */}
        <div className="md:hidden">
          <Link
            to={isAuth ? "/register" : "/login"}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
          >
            {isAuth ? "Register" : "Login"}
          </Link>
        </div>
      </div>
    </header>
  );
}
