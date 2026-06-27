import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, MessageSquare, Mic, Package, Settings } from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/chat", icon: MessageSquare, label: "Chat" },
  { path: "/voice", icon: Mic, label: "Voice" },
  { path: "/supply", icon: Package, label: "Supply" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 xeon-glass-strong safe-bottom">
      <nav className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          const isVoice = item.path === "/voice";

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
            >
              {isVoice ? (
                <div className="relative -mt-4 mb-0.5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #8B1A1A 0%, #5a1010 100%)",
                      boxShadow: isActive
                        ? "0 0 25px rgba(139, 26, 26, 0.5), 0 0 60px rgba(139, 26, 26, 0.15)"
                        : "0 0 15px rgba(139, 26, 26, 0.2)",
                    }}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    size={20}
                    className={isActive ? "text-red-600" : "text-neutral-500"}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-700"
                      style={{ boxShadow: "0 0 8px rgba(139, 26, 26, 0.6)" }}
                    />
                  )}
                </div>
              )}
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  isActive ? "text-red-500" : "text-neutral-600"
                } ${isVoice ? "-mt-0.5" : ""}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}