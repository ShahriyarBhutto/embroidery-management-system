import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Cpu, Users, Clock, ShoppingCart, UserCheck,
  Receipt, Package, BarChart3, Settings, LogOut, ChevronLeft, Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "./ui/button";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/machines", icon: Cpu, label: "Machines" },
  { to: "/labour", icon: Users, label: "Labour" },
  { to: "/shifts", icon: Clock, label: "Shifts" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/clients", icon: UserCheck, label: "Clients" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings", adminOnly: true },
];

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700">
        {isSidebarOpen && (
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-blue-400" />
            <span className="font-bold text-sm leading-tight">Embroidery<br />Manager</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-slate-300 hover:text-white hover:bg-slate-700 ml-auto"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", !isSidebarOpen && "rotate-180")} />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "admin")
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-700 p-4">
        {isSidebarOpen ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-slate-700 shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-slate-700 w-full">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
