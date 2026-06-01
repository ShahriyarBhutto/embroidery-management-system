import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useUIStore } from "@/store/uiStore";

export default function Layout() {
  const { isDarkMode, toggleDarkMode } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b flex items-center justify-end px-6 bg-background shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
