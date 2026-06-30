import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Package, AlertTriangle, ShoppingCart, MessageSquare,
  BarChart3, CheckSquare, ChevronRight, Plus, TrendingUp,
  TrendingDown, Truck
} from "lucide-react";
import GlassCard from "@/components/xeon/GlassCard";
import StatusBadge from "@/components/xeon/StatusBadge";
import PageHeader from "@/components/xeon/PageHeader";

const tabs = ["Übersicht", "Hersteller", "Bestellungen", "Aktivitäten"];

export default function Supply() {
  const [activeTab, setActiveTab] = useState("Übersicht");
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("mysuppliex", { action: "dashboard" })
      .then((response) => {
        setSuppliers(response.data.suppliers || []);
        setOrders(response.data.orders || []);
        setTasks(response.data.tasks || []);
      })
      .catch(() => setError("MySupplyX API konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const criticalSuppliers = suppliers.filter((s) => s.risk_level === "critical" || s.risk_level === "high");
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const openTasks = tasks.filter((t) => t.status === "open" || t.status === "in_progress");

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-neutral-700 border-t-red-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <PageHeader title="MySupplyX" subtitle="Live API Intelligence" />
      {error && <div className="mb-4 rounded-xl border border-red-900/30 bg-red-950/20 px-3 py-2 text-xs text-red-300">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-red-900/25 text-red-400 border border-red-900/20"
                : "text-neutral-500 border border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Übersicht" && (
        <OverviewTab
          suppliers={suppliers}
          orders={orders}
          tasks={tasks}
          criticalSuppliers={criticalSuppliers}
          pendingOrders={pendingOrders}
          openTasks={openTasks}
        />
      )}
      {activeTab === "Hersteller" && <SuppliersTab suppliers={suppliers} />}
      {activeTab === "Bestellungen" && <OrdersTab orders={orders} />}
      {activeTab === "Aktivitäten" && <TasksTab tasks={tasks} />}
    </div>
  );
}

function OverviewTab({ suppliers, orders, tasks, criticalSuppliers, pendingOrders, openTasks }) {
  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard icon={Package} label="Hersteller" value={suppliers.length} sub={`${criticalSuppliers.length} kritisch`} />
        <KPICard icon={ShoppingCart} label="Bestellungen" value={orders.length} sub={`${pendingOrders.length} offen`} />
        <KPICard icon={AlertTriangle} label="Risiken" value={criticalSuppliers.length} sub="Hoch/Kritisch" alert={criticalSuppliers.length > 0} />
        <KPICard icon={CheckSquare} label="Aufgaben" value={openTasks.length} sub="Offen" />
      </div>

      {/* Risk Alerts */}
      {criticalSuppliers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-2">Risiko-Warnungen</h3>
          <div className="space-y-2">
            {criticalSuppliers.map((s) => (
              <GlassCard key={s.id} className="flex items-center gap-3" animate={false}>
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.name}</p>
                  <p className="text-[10px] text-neutral-500">{s.category || "Lieferant"}</p>
                </div>
                <StatusBadge status={s.risk_level} />
              </GlassCard>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-2">Aktuelle Bestellungen</h3>
          <div className="space-y-2">
            {orders.slice(0, 3).map((o) => (
              <GlassCard key={o.id} className="flex items-center gap-3" animate={false}>
                <Truck size={16} className="text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{o.order_number}</p>
                  <p className="text-[10px] text-neutral-500">{o.supplier_name}</p>
                </div>
                <StatusBadge status={o.status} />
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SuppliersTab({ suppliers }) {
  if (suppliers.length === 0) {
    return <EmptyState icon={Package} text="Keine Hersteller" sub="Live-Daten aus MySupplyX erscheinen hier" />;
  }
  return (
    <div className="space-y-2">
      {suppliers.map((s, i) => (
        <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <GlassCard className="flex items-center gap-3" animate={false}>
            <div className="w-9 h-9 rounded-xl bg-neutral-800/60 flex items-center justify-center flex-shrink-0">
              <Package size={16} className="text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{s.name}</p>
              <p className="text-[10px] text-neutral-500">{s.category || s.location || "—"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={s.status || "active"} />
              <StatusBadge status={s.risk_level || "low"} />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

function OrdersTab({ orders }) {
  if (orders.length === 0) {
    return <EmptyState icon={ShoppingCart} text="Keine Bestellungen" sub="Live-Bestellungen aus MySupplyX erscheinen hier" />;
  }
  return (
    <div className="space-y-2">
      {orders.map((o, i) => (
        <motion.div key={o.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <GlassCard className="flex items-center gap-3" animate={false}>
            <div className="w-9 h-9 rounded-xl bg-neutral-800/60 flex items-center justify-center flex-shrink-0">
              <Truck size={16} className="text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{o.order_number}</p>
              <p className="text-[10px] text-neutral-500">{o.supplier_name} · {o.total_amount ? `${o.total_amount} ${o.currency}` : "—"}</p>
            </div>
            <StatusBadge status={o.status} />
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

function TasksTab({ tasks }) {
  if (tasks.length === 0) {
    return <EmptyState icon={CheckSquare} text="Keine Aktivitäten" sub="Live-Aktivitäten aus MySupplyX erscheinen hier" />;
  }
  return (
    <div className="space-y-2">
      {tasks.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <GlassCard className="flex items-center gap-3" animate={false}>
            <div className="w-9 h-9 rounded-xl bg-neutral-800/60 flex items-center justify-center flex-shrink-0">
              <CheckSquare size={16} className="text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{t.title}</p>
              <p className="text-[10px] text-neutral-500">{t.due_date || "Kein Fälligkeitsdatum"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={t.status} />
              <StatusBadge status={t.priority} />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, alert }) {
  return (
    <GlassCard glow={alert} className="text-center" animate={false}>
      <Icon size={18} className={alert ? "text-red-500 mx-auto mb-1" : "text-neutral-500 mx-auto mb-1"} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-[10px] text-neutral-600 mt-0.5">{sub}</p>
    </GlassCard>
  );
}

function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="text-center py-16">
      <Icon size={28} className="text-neutral-700 mx-auto mb-3" />
      <p className="text-sm text-neutral-500">{text}</p>
      <p className="text-xs text-neutral-600 mt-1">{sub}</p>
    </div>
  );
}