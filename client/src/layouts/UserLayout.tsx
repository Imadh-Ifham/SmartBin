import type React from "react";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/Navbar/topnavbar";
import BottomNavbar from "../components/Navbar/bottomnavbar";

const UserLayout: React.FC = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <TopNavbar />
      <main className="flex-1 bg-slate-50 p-6 md:p-10">
        <Outlet />
      </main>
      <BottomNavbar />
    </div>
  );
};

export default UserLayout;
