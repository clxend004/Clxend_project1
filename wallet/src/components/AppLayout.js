import { useLocation } from "react-router-dom";
import Navbar from "./navigation/Navbar";
import Sidebar from "./navigation/Sidebar";
import MobileNav from "./navigation/MobileNav";

export default function AppLayout({ children }) {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/";

  return (
    <div className="vectro-app">

      {/* TOP NAVBAR */}
      {!isAuthPage && <Navbar />}

      {/* MAIN AREA */}
      <div
        className={
          isAuthPage
            ? "vectro-body vectro-auth-body"
            : "vectro-body"
        }
      >

        {/* DESKTOP SIDEBAR */}
        {!isAuthPage && <Sidebar />}

        {/* PAGE CONTENT */}
        <main className="vectro-main-content">
          {children}
        </main>

      </div>

      {/* MOBILE NAVIGATION */}
      {!isAuthPage && <MobileNav />}

    </div>
  );
}