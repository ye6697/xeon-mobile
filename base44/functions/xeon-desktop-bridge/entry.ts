import { createClientFromRequest } from "npm:@base44/sdk";

const TOKEN_HASH = "2624bbeb9e9b4e0df1c4aae873785cd78751bc368df776b1a4ddf4bd53f47672";
const APP_ID = "6a3f3abef5d6d7690af1cff1";

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getBearer(req: Request): string {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function mergePayload(payload: unknown, bridge: Record<string, unknown>) {
  const safePayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : {};
  const oldBridge =
    safePayload._bridge && typeof safePayload._bridge === "object"
      ? safePayload._bridge as Record<string, unknown>
      : {};
  return {
    ...safePayload,
    _bridge: {
      ...oldBridge,
      ...bridge,
    },
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "POST required" }, 405);
    }

    const token = getBearer(req);
    if (!token || (await sha256(token)) !== TOKEN_HASH) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    if (body.app_id && body.app_id !== APP_ID) {
      return json({ ok: false, error: "App mismatch" }, 403);
    }

    const action = String(body.action || "").toLowerCase();
    const agentId = String(body.agent_id || "unknown");
    const now = new Date().toISOString();
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities.XeonSyncEvent;

    if (action === "heartbeat") {
      return json({
        ok: true,
        state: "online",
        agent_id: agentId,
        server_time: now,
      });
    }

    if (action === "next") {
      const pending = await db.filter(
        { status: "pending" },
        "created_date",
        100,
      );

      const event = pending.find((item: any) => {
        const target = item.target || "desktop";
        return (
          (target === "desktop" || target === "both") &&
          (item.event_type === "pc_action_requested" ||
            item.event_type === "screen_requested")
        );
      });

      if (!event) {
        return json({ ok: true, task: null });
      }

      const claimedPayload = mergePayload(event.payload, {
        agent_id: agentId,
        claimed_at: now,
        state: "claimed",
      });

      const claimed = await db.update(event.id, {
        status: "synced",
        payload: claimedPayload,
        last_synced_at: now,
        updated_at: now,
        version: Number(event.version || 1) + 1,
      });

      return json({
        ok: true,
        task: {
          id: claimed.id,
          event_type: claimed.event_type,
          payload: claimed.payload,
          sync_id: claimed.sync_id,
          created_at: claimed.created_at || claimed.created_date,
        },
      });
    }

    const taskId = String(body.task_id || "");
    if (!taskId) {
      return json({ ok: false, error: "task_id required" }, 400);
    }

    const event = await db.get(taskId);
    if (!event) {
      return json({ ok: false, error: "Task not found" }, 404);
    }

    if (action === "ack") {
      const payload = mergePayload(event.payload, {
        agent_id: agentId,
        acknowledged_at: now,
        state: String(body.state || "in_progress"),
      });

      const updated = await db.update(taskId, {
        status: "synced",
        payload,
        last_synced_at: now,
        updated_at: now,
        version: Number(event.version || 1) + 1,
      });

      return json({ ok: true, status: updated.status });
    }

    if (action === "complete") {
      const payload = mergePayload(event.payload, {
        agent_id: agentId,
        completed_at: now,
        state: String(body.state || "handed_to_computer_use"),
        result: String(body.result || ""),
        completion_scope: "local_handoff",
      });

      const updated = await db.update(taskId, {
        status: "processed",
        payload,
        processed_at: now,
        last_synced_at: now,
        updated_at: now,
        version: Number(event.version || 1) + 1,
      });

      return json({ ok: true, status: updated.status });
    }

    if (action === "fail") {
      const payload = mergePayload(event.payload, {
        agent_id: agentId,
        failed_at: now,
        state: "failed",
        code: String(body.code || "desktop_agent_error"),
        error: String(body.error || "Unknown desktop agent error"),
      });

      const updated = await db.update(taskId, {
        status: "failed",
        payload,
        processed_at: now,
        last_synced_at: now,
        updated_at: now,
        version: Number(event.version || 1) + 1,
      });

      return json({ ok: true, status: updated.status });
    }

    return json({ ok: false, error: "Unknown action" }, 400);
  } catch (error) {
    console.error("xeon-desktop-bridge", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
}
