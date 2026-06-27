import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Server, Cpu, Globe, Bell, RefreshCw,
  Shield, ChevronRight, LogOut, User, Wifi, Database
} from "lucide-react";
import GlassCard from "@/components/xeon/GlassCard";
import StatusBadge from "@/components/xeon/StatusBadge";
import XeonLogo from "@/components/xeon/XeonLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MODELS = ["GPT-5.5", "GPT-4o", "Claude Sonnet", "Claude Opus", "Lokal"];

export default function XeonSettings() {
  const [user, setUser] = useState(null);
  const [editDialog, setEditDialog] = useState(null);
  const [settings, setSettings] = useState({
    model: "GPT-5.5",
    language: "Deutsch",
    api_url: "",
    sync_enabled: true,
    notifications: true,
    privacy_mode: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser);
    base44.entities.XeonConfig.list("-created_date", 50).then((configs) => {
      const s = { ...settings };
      configs.forEach((c) => {
        if (c.config_key in s) {
          s[c.config_key] = c.config_value === "true" ? true : c.config_value === "false" ? false : c.config_value;
        }
      });
      setSettings(s);
    });
  }, []);

  const updateSetting = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    const existing = await base44.entities.XeonConfig.filter({ config_key: key });
    if (existing.length > 0) {
      await base44.entities.XeonConfig.update(existing[0].id, { config_value: String(value) });
    } else {
      await base44.entities.XeonConfig.create({ config_key: key, config_value: String(value), category: "model", source: "mobile" });
    }
  };

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-3 pt-3 pb-5">
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft size={20} className="text-neutral-400" />
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">Einstellungen</h1>
      </div>

      {/* Profile */}
      <GlassCard glow className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-red-900/20 flex items-center justify-center">
          <User size={20} className="text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{user?.full_name || "XEON Nutzer"}</p>
          <p className="text-[10px] text-neutral-500">{user?.email || ""}</p>
        </div>
        <StatusBadge status="online" label="Online" />
      </GlassCard>

      {/* System */}
      <SectionTitle label="System" />
      <div className="space-y-1.5 mb-5">
        <SettingRow
          icon={Cpu}
          label="KI-Modell"
          value={settings.model}
          onClick={() => setEditDialog("model")}
        />
        <SettingRow
          icon={Globe}
          label="Sprache"
          value={settings.language}
          onClick={() => setEditDialog("language")}
        />
        <SettingRow
          icon={Server}
          label="API-Adresse"
          value={settings.api_url || "Standard"}
          onClick={() => setEditDialog("api_url")}
        />
      </div>

      {/* Sync & Notifications */}
      <SectionTitle label="Verbindung" />
      <div className="space-y-1.5 mb-5">
        <ToggleRow
          icon={RefreshCw}
          label="Synchronisation"
          value={settings.sync_enabled}
          onChange={(v) => updateSetting("sync_enabled", v)}
        />
        <ToggleRow
          icon={Bell}
          label="Benachrichtigungen"
          value={settings.notifications}
          onChange={(v) => updateSetting("notifications", v)}
        />
        <ToggleRow
          icon={Shield}
          label="Datenschutz-Modus"
          value={settings.privacy_mode}
          onChange={(v) => updateSetting("privacy_mode", v)}
        />
      </div>

      {/* Info */}
      <SectionTitle label="Über" />
      <div className="space-y-1.5 mb-5">
        <GlassCard className="flex items-center gap-3" animate={false}>
          <XeonLogo size={28} animate={false} />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">XEON Mobile</p>
            <p className="text-[10px] text-neutral-500">Version 1.0.0 · Build 2025</p>
          </div>
        </GlassCard>
      </div>

      {/* Logout */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="w-full mt-2 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-center gap-2 text-sm font-medium text-red-500"
      >
        <LogOut size={16} /> Abmelden
      </motion.button>

      {/* Edit Dialogs */}
      <Dialog open={editDialog === "model"} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="bg-[#111114] border border-neutral-800 text-white max-w-sm mx-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-white">KI-Modell wählen</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            {MODELS.map((m) => (
              <button
                key={m}
                onClick={() => { updateSetting("model", m); setEditDialog(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                  settings.model === m
                    ? "bg-red-900/25 border border-red-900/20 text-red-400"
                    : "bg-neutral-900/60 border border-neutral-800 text-neutral-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === "language"} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="bg-[#111114] border border-neutral-800 text-white max-w-sm mx-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-white">Sprache</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            {["Deutsch", "English", "Français", "Español"].map((l) => (
              <button
                key={l}
                onClick={() => { updateSetting("language", l); setEditDialog(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                  settings.language === l
                    ? "bg-red-900/25 border border-red-900/20 text-red-400"
                    : "bg-neutral-900/60 border border-neutral-800 text-neutral-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === "api_url"} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="bg-[#111114] border border-neutral-800 text-white max-w-sm mx-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-white">API-Adresse</DialogTitle></DialogHeader>
          <div className="mt-2 space-y-3">
            <input
              value={settings.api_url}
              onChange={(e) => setSettings((p) => ({ ...p, api_url: e.target.value }))}
              placeholder="https://api.example.com"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 outline-none font-mono"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { updateSetting("api_url", settings.api_url); setEditDialog(null); }}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #8B1A1A, #5a1010)" }}
            >
              Speichern
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionTitle({ label }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-neutral-500 mb-2 px-1">{label}</p>
  );
}

function SettingRow({ icon: Icon, label, value, onClick }) {
  return (
    <GlassCard className="flex items-center gap-3 !py-3" onClick={onClick} animate={false}>
      <Icon size={16} className="text-neutral-500 flex-shrink-0" />
      <span className="text-sm text-white flex-1">{label}</span>
      <span className="text-xs text-neutral-500 mr-1">{value}</span>
      <ChevronRight size={14} className="text-neutral-600" />
    </GlassCard>
  );
}

function ToggleRow({ icon: Icon, label, value, onChange }) {
  return (
    <GlassCard className="flex items-center gap-3 !py-3" animate={false}>
      <Icon size={16} className="text-neutral-500 flex-shrink-0" />
      <span className="text-sm text-white flex-1">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? "bg-red-800" : "bg-neutral-700"}`}
      >
        <motion.div
          className="w-4 h-4 rounded-full bg-white absolute top-0.5"
          animate={{ left: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </GlassCard>
  );
}