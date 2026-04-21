import { Outlet } from "react-router-dom";

import { useTheme } from "@/hooks/useTheme";

import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export const RootLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="pb-16 pt-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
