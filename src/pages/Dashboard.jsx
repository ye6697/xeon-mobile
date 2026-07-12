import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Cpu, ListTodo, MessageSquare, Mic, RefreshCw, Wifi } from "lucide-react";
import GlassCard from "@/components/xeon/GlassCard";

export default function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sync, setSync] = useState({ pending: 0, latest: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Conversation.list("-updated_date", 3),
      base44.entities.XeonTodo.list("-created_date", 100),
      base44.entities.XeonSyncEvent.filter({ status: "pending" }, "-updated_date", 100),
      base44.entities.XeonSyncEvent.list("-updated_date", 1),
    ]).then(([chatRows, taskRows, pending, latest]) => {
      setConversations(chatRows);
      setTasks(taskRows);
      setSync({ pending: pending.length, latest: latest[0] || null });
    }).finally(() => setLoading(false));
  }, []);

  const openTasks = tasks.filter((task) => task.status !== "completed");
  const criticalTasks = openTasks.filter((task) => task.priority === "critical");
  const lastSync = sync.latest?.processed_at || sync.latest?.last_synced_at || sync.latest?.updated_at;

  return (
    <div className="px-4 pb-6 xeon-grid-bg min-h-[calc(100dvh-5rem)]">
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-5">
        <h1 className="text-5xl font-black tracking-tight text-[#ff3347] xeon-glow-text">XEON</h1>
        <p className="text-[11px] uppercase text-[#ffb3bb] tracking-[.22em] mt-1">Mobile Command Interface</p>
      </motion.header>

      <motion.div initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .08 }} className="flex justify-center my-7">
        <Link to="/voice" className="relative group">
          <div className="w-32 h-32 rounded-full xeon-orb" />
          <Mic size={22} className="absolute inset-0 m-auto text-[#ffd7dc] opacity-80" />
        </Link>
      </motion.div>

      <div className="text-center mb-5">
        <p className="text-sm text-[#ffd7dc] font-semibold">System bereit</p>
        <div className="flex justify-center items-center gap-2 mt-1 text-[10px] text-[#b98289]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3347] shadow-[0_0_10px_#ff3347]" />
          Desktop-Brücke {sync.pending ? `· ${sync.pending} ausstehend` : "bereit"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <SystemMetric icon={Cpu} label="Modell" value="GPT-5.4 mini" />
        <SystemMetric icon={ListTodo} label="Aufgaben" value={openTasks.length} danger={criticalTasks.length > 0} />
        <SystemMetric icon={RefreshCw} label="Sync" value={sync.pending ? `${sync.pending} offen` : "Aktuell"} />
      </div>

      <section className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div><p className="text-[9px] text-[#ff7888] font-black tracking-[.2em]">ACCOUNTABILITY</p><h2 className="text-sm font-bold text-[#ffecef]">AUFGABEN</h2></div>
          <Link to="/tasks" className="text-[10px] text-[#ff7888] flex items-center gap-1">Alle <ArrowRight size={11} /></Link>
        </div>
        <div className="xeon-glass rounded-lg overflow-hidden">
          {loading ? <div className="p-5 text-center text-[#b98289]">Lade Aufgaben…</div> : openTasks.length ? openTasks.slice(0, 3).map((task) => (
            <Link key={task.id} to="/tasks" className="flex items-center gap-3 px-3 py-3 border-b border-[#ff465a]/10 last:border-0">
              <span className={`w-2 h-2 rounded-full ${task.priority === "critical" ? "bg-[#ff243d] shadow-[0_0_12px_#ff3347]" : task.priority === "high" ? "bg-[#ff596b]" : "bg-[#9c7378]"}`} />
              <span className="text-xs text-[#ffd7dc] flex-1 truncate">{task.title}</span>
              <span className="text-[9px] uppercase text-[#8d666b]">{task.priority}</span>
            </Link>
          )) : <Link to="/tasks" className="p-5 flex items-center justify-center gap-2 text-xs text-[#b98289]"><CheckCircle2 size={15} /> Keine offenen Aufgaben</Link>}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link to="/chat"><GlassCard glow className="flex items-center gap-3"><MessageSquare size={19} className="text-[#ff3347]" /><div><p className="text-sm font-bold text-[#ffecef]">Chat</p><p className="text-[9px] text-[#b98289]">Desktop zuerst</p></div></GlassCard></Link>
        <Link to="/voice"><GlassCard glow className="flex items-center gap-3"><Mic size={19} className="text-[#ff3347]" /><div><p className="text-sm font-bold text-[#ffecef]">Voice</p><p className="text-[9px] text-[#b98289]">Sprachbefehl</p></div></GlassCard></Link>
      </div>

      {conversations.length > 0 && <section>
        <div className="flex justify-between mb-2"><h2 className="text-[10px] font-black tracking-[.18em] text-[#ff7888]">LETZTE AKTIVITÄT</h2><Link to="/chat" className="text-[10px] text-[#b98289]">Alle</Link></div>
        <div className="space-y-2">{conversations.map((conversation) => <Link key={conversation.id} to={`/chat/${conversation.id}`}><GlassCard className="flex gap-3 items-center"><MessageSquare size={15} className="text-[#b98289]" /><div className="min-w-0 flex-1"><p className="text-xs text-[#ffecef] truncate">{conversation.title}</p><p className="text-[9px] text-[#8d666b] truncate">{conversation.last_message || "Kein Inhalt"}</p></div><ArrowRight size={13} className="text-[#77565a]" /></GlassCard></Link>)}</div>
      </section>}

      <div className="mt-4 xeon-glass rounded-lg px-3 py-2.5 flex items-center gap-3">
        <Wifi size={14} className="text-[#ff3347]" />
        <div className="flex-1"><p className="text-[10px] font-semibold text-[#ffd7dc]">Desktop-Verbindung</p><p className="text-[9px] text-[#8d666b]">{lastSync ? `Letzte Aktivität: ${new Date(lastSync).toLocaleString("de-DE")}` : "Warte auf ersten Desktop-Sync"}</p></div>
        <span className="text-[9px] text-[#ff7888]">{sync.pending ? "SYNCHRONISIERT" : "BEREIT"}</span>
      </div>
    </div>
  );
}

function SystemMetric({ icon: Icon, label, value, danger = false }) {
  return <div className="xeon-glass rounded-lg p-2.5 text-center"><Icon size={13} className={`${danger ? "text-[#ff243d]" : "text-[#ff7888]"} mx-auto mb-1`} /><p className="text-[8px] uppercase tracking-wider text-[#8d666b]">{label}</p><p className={`text-[11px] font-bold ${danger ? "text-[#ff3347]" : "text-[#ffecef]"}`}>{value}</p></div>;
}
