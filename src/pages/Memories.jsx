import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  Brain, ArrowLeft, Plus, Trash2, Search, X,
  User, BookOpen, Star, FolderOpen, CheckSquare,
  FileText, Globe, Database, Settings, Shield
} from "lucide-react";
import GlassCard from "@/components/xeon/GlassCard";
import StatusBadge from "@/components/xeon/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const categoryIcons = {
  user_profile: User, rule: Shield, preference: Star,
  project: FolderOpen, task: CheckSquare, note: FileText,
  context: Globe, knowledge: Database, supply_data: BookOpen, setting: Settings,
};

const categoryLabels = {
  user_profile: "Profil", rule: "Regel", preference: "Präferenz",
  project: "Projekt", task: "Aufgabe", note: "Notiz",
  context: "Kontext", knowledge: "Wissen", supply_data: "Supply", setting: "Einstellung",
};

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newMem, setNewMem] = useState({ title: "", content: "", category: "note", priority: "normal" });
  const navigate = useNavigate();

  const load = () => {
    base44.entities.Memory.list("-created_date", 200)
      .then(setMemories)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = memories.filter(
    (m) => m.title.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase())
  );

  const addMemory = async () => {
    if (!newMem.title.trim() || !newMem.content.trim()) return;
    await base44.entities.Memory.create({ ...newMem, source: "mobile", is_active: true });
    setNewMem({ title: "", content: "", category: "note", priority: "normal" });
    setShowAdd(false);
    load();
  };

  const deleteMem = async (id) => {
    await base44.entities.Memory.delete(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-3 pt-3 pb-4">
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft size={20} className="text-neutral-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Erinnerungen</h1>
          <p className="text-[10px] text-neutral-500">{memories.length} gespeichert</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(180deg, #ff4055, #b40f24)" }}
        >
          <Plus size={18} className="text-white" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Erinnerungen durchsuchen..."
          className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-red-900/30"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-neutral-600" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-neutral-700 border-t-red-700 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Brain size={28} className="text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">{search ? "Keine Treffer" : "Keine Erinnerungen"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mem, i) => {
            const Icon = categoryIcons[mem.category] || FileText;
            return (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <GlassCard className="flex items-start gap-3" animate={false}>
                  <div className="w-8 h-8 rounded-lg bg-red-900/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white truncate">{mem.title}</p>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2">{mem.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] text-neutral-600 uppercase tracking-wider">
                        {categoryLabels[mem.category] || mem.category}
                      </span>
                      <StatusBadge status={mem.source === "desktop" ? "online" : "active"} label={mem.source} />
                    </div>
                  </div>
                  <button onClick={() => deleteMem(mem.id)} className="p-1.5 text-neutral-700 active:text-red-500 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#111114] border border-neutral-800 text-white max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Neue Erinnerung</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <input
              value={newMem.title}
              onChange={(e) => setNewMem({ ...newMem, title: e.target.value })}
              placeholder="Titel"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-red-900/30"
            />
            <textarea
              value={newMem.content}
              onChange={(e) => setNewMem({ ...newMem, content: e.target.value })}
              placeholder="Inhalt"
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 outline-none resize-none focus:border-red-900/30"
            />
            <select
              value={newMem.category}
              onChange={(e) => setNewMem({ ...newMem, category: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            >
              {Object.entries(categoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={addMemory}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(180deg, #ff4055, #b40f24)" }}
            >
              Speichern
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
