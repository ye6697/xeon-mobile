import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, MessageSquare, Mic, ListTodo, Settings } from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/chat", icon: MessageSquare, label: "Chat" },
  { path: "/voice", icon: Mic, label: "Voice" },
  { path: "/tasks", icon: ListTodo, label: "Aufgaben" },
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
                      background: "radial-gradient(circle at 38% 35%, #ff4458, #751521 72%)",
                      boxShadow: isActive
                        ? "0 0 28px rgba(255, 51, 71, 0.62), 0 0 65px rgba(255, 51, 71, 0.2)"
                        : "0 0 18px rgba(255, 51, 71, 0.28)",
                    }}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    size={20}
                    className={isActive ? "text-[#ff3347]" : "text-[#8d666b]"}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff3347]"
                      style={{ boxShadow: "0 0 10px rgba(255, 51, 71, 0.8)" }}
                    />
                  )}
                </div>
              )}
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  isActive ? "text-[#ff7888]" : "text-[#77565a]"
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
