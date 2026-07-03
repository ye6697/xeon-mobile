import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Trash2 } from "lucide-react";
import GlassCard from "@/components/xeon/GlassCard";

export default function PendingSyncList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    base44.entities.XeonSyncEvent.filter({ status: "pending" }, "-created_date", 50)
      .then(setEvents)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteEvent = async (id) => {
    await base44.entities.XeonSyncEvent.delete(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading || events.length === 0) return null;

  return (
    <div className="mt-5">
      <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-3">
        Pending Syncs
      </h2>
      <div className="space-y-2">
        {events.map((event) => (
          <GlassCard key={event.id} className="flex items-center gap-3" animate={false}>
            <div className="w-8 h-8 rounded-lg bg-red-900/15 flex items-center justify-center flex-shrink-0">
              <RefreshCw size={14} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{event.event_type}</p>
              <p className="text-[10px] text-neutral-500 truncate">
                {event.payload?.text || event.payload?.request || event.payload?.title || event.sync_id}
              </p>
            </div>
            <button
              onClick={() => deleteEvent(event.id)}
              className="p-2 text-neutral-600 active:text-red-500 flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}