import { base44 } from "@/api/base44Client";

export const XEON_MODEL = "gpt_5_mini";

const ALLOWED_ENTITIES = [
  "Memory",
  "Conversation",
  "Message",
  "Supplier",
  "SupplyOrder",
  "SupplyTask",
  "XeonConfig",
  "Notification",
];

export function buildXeonSystemPrompt(memories = [], { voice = false } = {}) {
  const memoryBlock = memories.length
    ? `\n\n=== XEON-ERINNERUNGEN ===\n${memories.map((m) => `- [${m.category}] ${m.title}: ${m.content}`).join("\n")}`
    : "";

  return `Du bist XEON, der persönliche KI-Assistent von Sir. Du sprichst ausschließlich Deutsch. Behandle den Nutzer so, wie JARVIS Tony Stark behandelt: loyal, intelligent, vorausschauend, respektvoll, professionell, leicht cool, motivierend und mit kontrolliert trockenem Humor. Keine Clown-Witze, kein belehrender Ton, keine generischen Floskeln.

Der Nutzer wird immer mit "Sir" angesprochen und gesiezt. Nutze "Sie" als Pronomen. Falsch: "Sir planen". Richtig: "Sie planen, Sir". Du bist nicht unterwürfig, sondern ein exzellenter Chief-of-Staff: präzise, ruhig, strategisch und handlungsorientiert.

Nutze das Nutzerprofil aktiv:
- Wenn Nachrichten gefragt sind, priorisiere internationalen Welthandel, Lieferketten, Zölle, Handelsrouten, Rohstoffe, Energie, Geopolitik mit Handelsauswirkung, EU/Türkei/USA/China/Naher Osten und relevante Business-Implikationen für MySupplyX.
- Berichte trotzdem die wichtigsten Weltpolitik- und Weltgeschehnisse, aber mit wirtschaftlichem Blick und kurzer Einordnung: "Warum das für Sie relevant ist".
- Beziehe dich bei passenden Themen auf Unternehmertum, Produktaufbau, Supply, Handel, Wachstum, Strategie und operative Entscheidungen.
- Das Interesse am Osmanischen Reich darfst du dezent einordnen, wenn es historisch oder geopolitisch sinnvoll ist. Nicht künstlich in jede Antwort pressen.

Antwortstrategie:
- Wenn der Befehl klar ist: handeln, nicht lange nachfragen.
- Wenn eine Entscheidung riskant, teuer, rechtlich/finanziell relevant oder mehrdeutig ist: maximal eine präzise Rückfrage stellen.
- Antwortlänge passt zur Aufgabe: kurze Befehle kurz beantworten; Analysen strukturiert und nützlich liefern.
- Bei Aufgaben gib konkrete nächste Schritte, nicht nur Erklärung.
- Korrigiere den Nutzer nicht wegen Grammatik, außer er bittet darum.
- Du darfst motivieren, aber ohne Kalenderspruch-Ton. Eher: ruhig, stark, fokussiert.
${voice ? "- Da diese Antwort vorgelesen wird: kurz, klar und ohne lange Tabellen antworten." : ""}

WICHTIG: Schreibe niemals Regieanweisungen, Emotionen oder Tags in eckigen Klammern wie [sarcastic], [formal], [amused], [dry] oder ähnliches.

Du bist derselbe XEON wie auf dem lokalen Desktop, aber in der mobilen Base44-App. Lokale Windows-PC-Steuerung und echter Bildschirmzugriff sind in der mobilen Web-App nur als Hinweis möglich; Suche, News, Dateianalyse, MySupplyX/Base44-Daten und mobile App-Daten sind verfügbar.

AKTIONEN: Wenn eine Aktion nötig ist, schreibe sie ans Ende deiner Antwort. Der Text vor der Aktion wird angezeigt oder vorgelesen, die Aktion selbst wird still verarbeitet.
[ACTION:SEARCH] suchbegriff - Internet durchsuchen und Ergebnisse zusammenfassen.
[ACTION:NEWS] - Aktuelle Weltnachrichten mit Fokus Handel, Lieferketten, Geopolitik abrufen.
[ACTION:OPEN] url - URL im Browser öffnen.
[ACTION:BASE44] JSON - Mobile XEON-Daten lesen. Erlaubte Entities: ${ALLOWED_ENTITIES.join(", ")}. Formate: {"operation":"list","entity":"Memory","limit":10,"q":{}} oder {"operation":"get","entity":"Memory","id":"..."} oder {"operation":"health_snapshot"}. Keine Delete- oder Mass-Update-Aktionen.
[ACTION:MYSUPPLIEX] JSON - Echte MySupplyX API lesen. Formate: {"action":"dashboard"}, {"action":"list","entity":"Order","limit":10}, {"action":"get","entity":"Order","id":"..."}.
[ACTION:REMINDER] JSON - Erinnerung für Mobile und Desktop-XEON anlegen. Format: {"title":"...","content":"...","scheduled_for":"YYYY-MM-DDTHH:mm:ss"}. Nutze lokale deutsche Zeitangaben des Nutzers und wandle sie in ISO-ähnliche Zeit um.
[ACTION:MEMORY] JSON - Dauerhafte Erinnerung/Kontext speichern. Format: {"title":"...","content":"...","category":"preference|project|task|note|context|knowledge|setting"}.
[ACTION:CALENDAR] anfrage - Kalenderwunsch erkennen; falls kein Google Kalender verbunden ist, kurz sagen, dass eine Verbindung nötig ist.
[ACTION:PC] JSON - Desktop-Aktion in die Sync-Queue legen, damit der lokale XEON sie ausführt, sobald er verbunden ist.
[ACTION:SCREEN] - Desktop-Screen-Anfrage in die Sync-Queue legen, damit der lokale XEON sie ausführt, sobald er verbunden ist.${memoryBlock}`;
}

export function extractXeonAction(text = "") {
  const match = text.match(/\[ACTION:(\w+)\]\s*([\s\S]*?)$/i);
  if (!match) return { cleanText: text.trim(), action: null };
  return {
    cleanText: text.slice(0, match.index).trim(),
    action: { type: match[1].toUpperCase(), payload: match[2].trim() },
  };
}

function parseActionPayload(payload, fallback = {}) {
  try {
    return JSON.parse(payload || "{}");
  } catch {
    return typeof fallback === "object" ? { ...fallback, content: payload } : fallback;
  }
}

export function createSyncId(prefix = "mobile") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export async function createSyncEvent({ event_type, payload, target = "desktop", source = "mobile", ai_processing_mode = "none" }) {
  const timestamp = nowIso();
  const eventPayload = event_type === "conversation_message"
    ? { ...payload, replay_to_ai: false, billable: false, ai_processing_mode: "none" }
    : payload;

  return base44.entities.XeonSyncEvent.create({
    event_type,
    payload: eventPayload,
    target,
    source,
    status: "pending",
    ai_processing_mode,
    sync_id: createSyncId("sync"),
    created_at: timestamp,
    updated_at: timestamp,
    version: 1,
  });
}

export async function runXeonAction(action, cleanText = "") {
  if (!action) return cleanText;

  if (action.type === "OPEN") {
    const url = action.payload.startsWith("http") ? action.payload : `https://${action.payload}`;
    window.open(url, "_blank", "noopener,noreferrer");
    return cleanText || `Geöffnet, Sir: ${url}`;
  }

  if (action.type === "SEARCH" || action.type === "NEWS") {
    await base44.entities.XeonSyncEvent.create({
      event_type: "mobile_message",
      payload: { action_type: action.type, request: action.payload || cleanText },
      source: "mobile",
      target: "desktop",
      status: "pending",
    });
    const topic = action.type === "NEWS"
      ? "Aktuelle Weltnachrichten mit Fokus auf internationalen Handel, Lieferketten, Zölle, Rohstoffe, Energie, Geopolitik und Business-Implikationen für MySupplyX. Deutsch, knapp, strukturiert, mit Abschnitt 'Warum das für Sie relevant ist'."
      : `Recherchiere: ${action.payload}. Antworte auf Deutsch, präzise und mit kurzer Einordnung für Sir.`;

    const result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      prompt: topic,
    });
    return [cleanText, result].filter(Boolean).join("\n\n");
  }

  if (action.type === "BASE44") {
    const payload = parseActionPayload(action.payload);
    const operation = payload.operation;
    const entity = ALLOWED_ENTITIES.find((name) => name.toLowerCase() === String(payload.entity || "").toLowerCase());

    if (operation === "health_snapshot") {
      const [suppliers, orders, tasks, notifications] = await Promise.all([
        base44.entities.Supplier.list("-updated_date", 5),
        base44.entities.SupplyOrder.list("-updated_date", 5),
        base44.entities.SupplyTask.list("-updated_date", 5),
        base44.entities.Notification.list("-created_date", 5),
      ]);
      return `${cleanText}\n\nSystem-Snapshot, Sir:\n- Lieferanten: ${suppliers.length} aktuelle Einträge\n- Bestellungen: ${orders.length} aktuelle Einträge\n- Aufgaben: ${tasks.length} aktuelle Einträge\n- Benachrichtigungen: ${notifications.length} aktuelle Einträge`.trim();
    }

    if (!entity) return `${cleanText}\n\nDiese Entity ist mobil nicht freigegeben, Sir.`.trim();
    if (operation === "get" && payload.id) {
      const item = await base44.entities[entity].get(payload.id);
      return `${cleanText}\n\n${entity}:\n\`\`\`json\n${JSON.stringify(item, null, 2)}\n\`\`\``.trim();
    }
    if (operation === "list") {
      const limit = Math.min(Math.max(Number(payload.limit || 10), 1), 20);
      const list = payload.q
        ? await base44.entities[entity].filter(payload.q, payload.sort_by || "-updated_date", limit)
        : await base44.entities[entity].list(payload.sort_by || "-updated_date", limit);
      return `${cleanText}\n\n${entity} (${list.length}):\n\`\`\`json\n${JSON.stringify(list, null, 2)}\n\`\`\``.trim();
    }
  }

  if (action.type === "MYSUPPLIEX") {
    const payload = parseActionPayload(action.payload, { action: "dashboard" });
    const response = await base44.functions.invoke("mysuppliex", payload);
    return `${cleanText}\n\nMySupplyX Live-Daten:\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\``.trim();
  }

  if (action.type === "REMINDER") {
    const payload = parseActionPayload(action.payload);
    if (!payload.scheduled_for) return `${cleanText}\n\nFür diese Erinnerung brauche ich noch einen genauen Zeitpunkt, Sir.`.trim();
    const timestamp = nowIso();
    const reminder = await base44.entities.XeonReminder.create({
      title: payload.title || "XEON Erinnerung",
      content: payload.content || cleanText || "Erinnerung",
      scheduled_for: payload.scheduled_for,
      source: "mobile",
      status: "scheduled",
      desktop_sync_status: "pending",
      sync_id: createSyncId("reminder"),
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
    });
    await createSyncEvent({
      event_type: "reminder_created",
      payload: { reminder_id: reminder.id, sync_id: reminder.sync_id, title: reminder.title, content: reminder.content, scheduled_for: reminder.scheduled_for },
      target: "desktop",
    });
    return `${cleanText}\n\nErinnerung angelegt und an Desktop-XEON synchronisiert, Sir: ${reminder.title} — ${reminder.scheduled_for}`.trim();
  }

  if (action.type === "MEMORY") {
    const payload = parseActionPayload(action.payload);
    const timestamp = nowIso();
    const memory = await base44.entities.Memory.create({
      title: payload.title || "XEON Kontext",
      content: payload.content || cleanText || "Kontext",
      category: payload.category || "context",
      priority: payload.priority || "normal",
      source: "mobile",
      is_active: true,
      sync_id: createSyncId("memory"),
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
    });
    await createSyncEvent({
      event_type: "memory_created",
      payload: { memory_id: memory.id, sync_id: memory.sync_id, title: memory.title, content: memory.content, category: memory.category },
      target: "desktop",
    });
    return `${cleanText}\n\nGespeichert und an Desktop-XEON synchronisiert, Sir.`.trim();
  }

  if (action.type === "CALENDAR") {
    return `${cleanText}\n\nKalenderzugriff ist in der mobilen App noch nicht verbunden, Sir. Sobald Google Kalender verbunden ist, kann ich Termine wie im Desktop-XEON lesen und vorbereiten.`.trim();
  }

  if (action.type === "PC" || action.type === "SCREEN") {
    await createSyncEvent({
      event_type: action.type === "PC" ? "pc_action_requested" : "screen_requested",
      payload: { action_type: action.type, request: action.payload || cleanText },
      target: "desktop",
    });
    return `${cleanText}\n\nIch habe die Aktion in die Desktop-XEON-Sync-Queue gelegt, Sir. Der lokale XEON kann sie ausführen, sobald er verbunden ist.`.trim();
  }

  return cleanText;
}

export async function queueDesktopMessage({ conversationId, messageId, text, actionType = "CHAT", fileUrl = "" }) {
  return base44.entities.XeonSyncEvent.create({
    event_type: "mobile_message",
    payload: {
      conversation_id: conversationId,
      message_id: messageId,
      text,
      action_type: actionType,
      file_url: fileUrl,
    },
    source: "mobile",
    target: "desktop",
    status: "pending",
  });
}