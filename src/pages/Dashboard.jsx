import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Activity, MessageSquare, Brain, RefreshCw, Bell, Cpu,
  ChevronRight, Zap, Shield, Wifi
} from "lucide-react";
import XeonLogo from "@/components/xeon/XeonLogo";
import GlassCard from "@/components/xeon/GlassCard";
import StatusBadge from "@/components/xeon/StatusBadge";

export default function Dashboard() {
  const [memories, setMemories] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [syncStats, setSyncStats] = useState({ pending: 0, lastSyncedAt: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Memory.list("-created_date", 5),
      base44.entities.Conversation.list("-created_date", 5),
      base44.entities.Notification.list("-created_date", 5),
      base44.entities.XeonSyncEvent.filter({ status: "pending" }, "-updated_date", 100),
      base44.entities.XeonSyncEvent.list("-updated_date", 1),
    ])
      .then(([m, c, n, pendingSync, latestSync]) => {
        setMemories(m);
        setConversations(c);
        setNotifications(n);
        setSyncStats({ pending: pendingSync.length, lastSyncedAt: latestSync[0]?.last_synced_at || latestSync[0]?.updated_at || null });
      })
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="px-4 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-3 pb-5"
      >
        <div className="flex items-center gap-3">
          <XeonLogo size={36} />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">XEON</h1>
            <p className="text-[10px] text-neutral-500 tracking-[0.2em] uppercase">Mobile Command</p>
          </div>
        </div>
        <Link to="/settings" className="relative">
          <Bell size={20} className="text-neutral-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-700 text-[9px] font-bold flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
        </Link>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-4 mb-4 xeon-border-glow"
        style={{
          background: "linear-gradient(135deg, rgba(139,26,26,0.08) 0%, rgba(10,10,10,0.95) 60%)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-red-600" />
            <span className="text-xs font-semibold tracking-wide text-neutral-300">SYSTEM STATUS</span>
          </div>
          <StatusBadge status="online" label="Online" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatusItem icon={Zap} label="Modell" value="GPT-5.5" />
          <StatusItem icon={RefreshCw} label="Sync" value={`${syncStats.pending} pending`} />
          <StatusItem icon={Shield} label="Sicher" value="AES-256" />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link to="/chat">
          <GlassCard glow className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-900/20">
              <MessageSquare size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Chat</p>
              <p className="text-[10px] text-neutral-500">Neues Gespräch</p>
            </div>
          </GlassCard>
        </Link>
        <Link to="/voice">
          <GlassCard glow className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-900/20">
              <Activity size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Voice</p>
              <p className="text-[10px] text-neutral-500">Sprachsteuerung</p>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-neutral-400">
            Letzte Aktivität
          </h2>
          <Link to="/chat" className="text-[10px] text-red-600 font-medium">Alle anzeigen</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-neutral-700 border-t-red-700 rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <GlassCard className="text-center py-6">
            <Brain size={24} className="text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Noch keine Gespräche</p>
            <p className="text-xs text-neutral-600 mt-1">Starte deinen ersten Chat mit XEON</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link to={`/chat/${conv.id}`}>
                  <GlassCard className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={14} className="text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{conv.title}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{conv.last_message || "Kein Inhalt"}</p>
                    </div>
                    <ChevronRight size={14} className="text-neutral-600 flex-shrink-0" />
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Memories */}
      {memories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-neutral-400">
              Erinnerungen
            </h2>
            <Link to="/memories" className="text-[10px] text-red-600 font-medium">Alle anzeigen</Link>
          </div>
          <div className="space-y-2">
            {memories.slice(0, 3).map((mem) => (
              <GlassCard key={mem.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-900/15 flex items-center justify-center flex-shrink-0">
                  <Brain size={14} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{mem.title}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{mem.content}</p>
                </div>
                <StatusBadge status={mem.source === "desktop" ? "online" : "active"} label={mem.source} />
              </GlassCard>
            ))}
          </div>
        </motion.div>
      )}

      {/* Connection Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-5 rounded-xl p-3 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, rgba(139,26,26,0.06) 0%, rgba(17,17,20,0.8) 100%)",
          border: "1px solid rgba(139, 26, 26, 0.1)",
        }}
      >
        <Wifi size={16} className="text-red-700 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium text-neutral-300">Desktop-Verbindung</p>
          <p className="text-[10px] text-neutral-600">{syncStats.lastSyncedAt ? `Letzter Sync: ${new Date(syncStats.lastSyncedAt).toLocaleString("de-DE")}` : "Noch kein Desktop-Sync"}</p>
          <p className="text-[10px] text-neutral-600">Mobile chat sync does not trigger AI/API calls.</p>
        </div>
        <StatusBadge status="syncing" label={`${syncStats.pending} offen`} />
      </motion.div>
    </div>
  );
}

function StatusItem({ icon: Icon, label, value }) {
  return (
    <div className="text-center">
      <Icon size={14} className="text-red-700 mx-auto mb-1" />
      <p className="text-[10px] text-neutral-500">{label}</p>
      <p className="text-xs font-semibold text-white">{value}</p>
    </div>
  );
}