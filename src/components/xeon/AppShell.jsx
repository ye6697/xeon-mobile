import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppShell() {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex flex-col">
      <div className="flex-1 pb-20 overflow-y-auto">
        <div className="safe-top" />
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

export function FullScreenWithNav({ children }) {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="safe-top" />
        {children}
      </div>
      <BottomNav />
    </div>
  );
}