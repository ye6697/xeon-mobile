import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Clock3, LockKeyhole, Plus, RefreshCw, X } from "lucide-react";
import { createSyncEvent, createSyncId, nowIso } from "@/lib/xeonCore";

const PRIORITIES = {
  low: { label: "Niedrig", color: "#9c7378", rank: 1 },
  normal: { label: "Normal", color: "#ff9aa5", rank: 2 },
  high: { label: "Wichtig", color: "#ff596b", rank: 3 },
  critical: { label: "Kritisch", color: "#ff243d", rank: 4 },
};

function taskSnapshot(tasks = []) {
  return JSON.stringify(tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_at: task.due_at,
    desktop_sync_status: task.desktop_sync_status,
    sync_event_id: task.sync_event_id,
    updated_at: task.updated_at,
  })));
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "normal", due_at: "" });

  const loadTasks = async () => {
    const [rows, syncEvents] = await Promise.all([
      base44.entities.XeonTodo.list("-created_date", 200),
      base44.entities.XeonSyncEvent.list("-updated_date", 200),
    ]);
    const syncStatusById = new Map(syncEvents.map((event) => [event.id, event.status]));
    const nextTasks = rows.map((task) => ({
      ...task,
      desktop_sync_status: syncStatusById.get(task.sync_event_id) === "processed"
        ? "synced"
        : task.desktop_sync_status,
    }));
    setTasks((current) => taskSnapshot(current) === taskSnapshot(nextTasks) ? current : nextTasks);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
    const timer = window.setInterval(loadTasks, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const orderedTasks = useMemo(() => [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    return PRIORITIES[b.priority]?.rank - PRIORITIES[a.priority]?.rank;
  }), [tasks]);

  const createTask = async () => {
    if (!form.title.trim()) return;
    const timestamp = nowIso();
    const syncId = createSyncId("todo");
    const task = await base44.entities.XeonTodo.create({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      source: "mobile",
      status: "open",
      desktop_sync_status: "pending",
      sync_id: syncId,
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
    });
    const conversation = await base44.entities.Conversation.create({ title: `Aufgabe: ${task.title}`, source: "mobile" });
    const priorityLabel = PRIORITIES[task.priority].label;
    const command = `Setze folgende Aufgabe auf meine Aufgabenliste: ${task.title}. Priorität: ${priorityLabel}.${task.description ? ` Details: ${task.description}.` : ""}${task.due_at ? ` Fällig: ${task.due_at}.` : ""}`;
    const message = await base44.entities.Message.create({
      conversation_id: conversation.id,
      role: "user",
      content: command,
      source: "mobile",
      ai_processing_mode: "none",
    });
    const event = await createSyncEvent({
      event_type: "mobile_message",
      target: "desktop",
      payload: { conversation_id: conversation.id, message_id: message.id, role: "user", text: command, action_type: "TODO", sync_id: syncId },
    });
    await base44.entities.XeonTodo.update(task.id, { sync_event_id: event.id, updated_at: nowIso() });
    setTasks((current) => [{ ...task, sync_event_id: event.id }, ...current]);
    setForm({ title: "", description: "", priority: "normal", due_at: "" });
    setShowForm(false);
  };

  return (
    <div className="px-4 pb-6 xeon-grid-bg min-h-[calc(100dvh-5rem)]">
      <header className="pt-4 pb-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[.24em] text-[#ff7888]">ACCOUNTABILITY</p>
          <h1 className="text-3xl font-black text-[#ffecef] xeon-glow-text">AUFGABEN</h1>
          <p className="text-xs text-[#b98289] mt-1">Erstellen und von XEON verwalten lassen</p>
        </div>
        <motion.button whileTap={{ scale: .9 }} onClick={() => setShowForm(true)} className="w-11 h-11 rounded-lg bg-[#c9132a] border border-[#ff596b]/50 grid place-items-center shadow-[0_0_28px_rgba(255,51,71,.3)]">
          <Plus size={21} />
        </motion.button>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Metric label="Offen" value={tasks.filter((t) => t.status !== "completed").length} />
        <Metric label="Kritisch" value={tasks.filter((t) => t.priority === "critical" && t.status !== "completed").length} danger />
        <Metric label="Erledigt" value={tasks.filter((t) => t.status === "completed").length} />
      </div>

      {loading ? <div className="py-16 grid place-items-center"><RefreshCw className="animate-spin text-[#ff3347]" /></div> : (
        <div className="space-y-2">
          <AnimatePresence>
            {orderedTasks.map((task) => <TaskRow key={task.id} task={task} />)}
          </AnimatePresence>
          {!orderedTasks.length && <div className="xeon-glass rounded-lg p-8 text-center text-[#b98289] text-sm">Keine offenen Befehle. Erstellen Sie Ihre erste Aufgabe.</div>}
        </div>
      )}

      <AnimatePresence>{showForm && <TaskForm form={form} setForm={setForm} onClose={() => setShowForm(false)} onCreate={createTask} />}</AnimatePresence>
    </div>
  );
}

function Metric({ label, value, danger = false }) {
  return <div className="xeon-glass rounded-lg p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#b98289]">{label}</p><p className={`text-xl font-black ${danger ? "text-[#ff3347] xeon-glow-text" : "text-[#ffecef]"}`}>{value}</p></div>;
}

function TaskRow({ task }) {
  const priority = PRIORITIES[task.priority] || PRIORITIES.normal;
  const done = task.status === "completed";
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="xeon-glass rounded-lg p-3.5 flex gap-3" style={{ borderLeft: `3px solid ${priority.color}` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2"><p className={`text-sm font-semibold ${done ? "line-through text-[#77565a]" : "text-[#ffecef]"}`}>{task.title}</p><span className="text-[8px] uppercase font-black tracking-wider" style={{ color: priority.color }}>{priority.label}</span></div>
        {task.description && <p className="text-[11px] text-[#b98289] mt-1">{task.description}</p>}
        <div className="flex items-center gap-3 mt-2 text-[9px] text-[#8d666b]">
          {task.due_at && <span className="flex gap-1 items-center"><Clock3 size={10} />{new Date(task.due_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>}
          <span className="flex gap-1 items-center"><RefreshCw size={9} />{task.desktop_sync_status === "synced" ? "Desktop synchron" : "Sync gesendet"}</span>
          <span className="flex gap-1 items-center"><LockKeyhole size={9} />{done ? "Von XEON erledigt" : "XEON verwaltet"}</span>
        </div>
      </div>
    </motion.div>
  );
}

function TaskForm({ form, setForm, onClose, onCreate }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center" onClick={onClose}>
    <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md xeon-glass-strong rounded-t-xl sm:rounded-lg p-5 safe-bottom">
      <div className="flex justify-between items-center mb-5"><div><p className="text-[9px] tracking-[.22em] text-[#ff7888] font-black">NEUER BEFEHL</p><h2 className="text-xl font-black text-[#ffecef]">Aufgabe erstellen</h2></div><button onClick={onClose}><X className="text-[#b98289]" /></button></div>
      <div className="space-y-3">
        <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Was muss erledigt werden?" className="xeon-input" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details (optional)" rows={3} className="xeon-input resize-none" />
        <label className="block text-[10px] uppercase tracking-wider text-[#b98289]">Wichtigkeit</label>
        <div className="grid grid-cols-4 gap-2">{Object.entries(PRIORITIES).map(([key, value]) => <button key={key} onClick={() => setForm({ ...form, priority: key })} className="rounded-lg py-2 text-[10px] font-bold border" style={{ color: value.color, borderColor: form.priority === key ? value.color : "rgba(255,70,90,.18)", background: form.priority === key ? `${value.color}18` : "rgba(18,3,7,.5)" }}>{value.label}</button>)}</div>
        <label className="block text-[10px] uppercase tracking-wider text-[#b98289]">Fällig (optional)</label>
        <input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className="xeon-input" />
        <button onClick={onCreate} disabled={!form.title.trim()} className="w-full h-12 rounded-lg mt-2 bg-gradient-to-b from-[#ff4055] to-[#b40f24] font-bold disabled:opacity-40 shadow-[0_0_28px_rgba(255,51,71,.25)]">An XEON übergeben</button>
      </div>
    </motion.div>
  </motion.div>;
}

