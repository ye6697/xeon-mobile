import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const API_BASE = 'https://mysuppliex.base44.app/api';
const API_KEY = 'd5ae1c0929124fb0ac2c7c7a286a5f86';

const ALLOWED_ENTITIES = new Set([
  'Order', 'StatusUpdate', 'Message', 'ActivityLog', 'Changelog', 'PaymentSetting', 'AppSettings',
  'Lead', 'InternalNote', 'PendingInvite', 'SystemHealthReport', 'SecurityReport', 'PerformanceReport',
  'LeadImport', 'SalesGoal', 'LeadStatusHistory', 'SCMGoal', 'ManufacturerQuote', 'ExchangeRate',
  'Calculation', 'ArchivedConversation', 'FunctionExecutionLog', 'PushSubscription', 'Notification',
  'UserActivity', 'EditorChangeLog', 'User'
]);

function toQuery(params) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', JSON.stringify(params.q));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.skip) search.set('skip', String(params.skip));
  if (params.sort_by) search.set('sort_by', params.sort_by);
  return search.toString();
}

async function apiRequest(entity, params = {}, id = null) {
  if (!ALLOWED_ENTITIES.has(entity)) throw new Error('Entity not allowed');
  const query = toQuery(params);
  const url = `${API_BASE}/entities/${entity}${id ? `/${id}` : ''}${query ? `?${query}` : ''}`;
  const response = await fetch(url, { headers: { api_key: API_KEY } });
  if (!response.ok) throw new Error(`MySupplyX API error ${response.status}`);
  return await response.json();
}

function mapOrder(order) {
  return {
    id: order.id,
    order_number: order.order_number,
    supplier_name: order.manufacturer_name || order.supplier_info || order.customer_company_name || order.customer_name || 'MySupplyX',
    status: order.status,
    total_amount: order.total_amount,
    currency: order.best_price_currency || order.target_price_currency || 'EUR',
    expected_delivery: order.expected_delivery || order.desired_delivery_date,
    notes: order.notes,
  };
}

function mapQuoteToSupplier(quote) {
  return {
    id: quote.id,
    name: quote.manufacturer_name,
    category: quote.lead_time || 'Hersteller',
    risk_level: quote.recommended ? 'low' : 'medium',
    status: quote.recommended ? 'active' : 'under_review',
    location: quote.contact_info || '',
    rating: quote.rating,
    notes: quote.internal_notes,
  };
}

function mapActivity(activity) {
  return {
    id: activity.id,
    title: activity.description || activity.activity_type || 'MySupplyX Aktivität',
    description: activity.description,
    status: activity.is_read ? 'completed' : 'open',
    priority: activity.activity_type === 'STATUS_CHANGE' ? 'high' : 'normal',
    due_date: activity.created_date,
    related_supplier: activity.order_id,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'dashboard') {
      const [orders, quotes, activities] = await Promise.all([
        apiRequest('Order', { limit: 50, sort_by: '-updated_date' }),
        apiRequest('ManufacturerQuote', { limit: 50, sort_by: '-updated_date' }),
        apiRequest('ActivityLog', { limit: 50, sort_by: '-created_date' }),
      ]);

      const supplierMap = new Map();
      for (const quote of Array.isArray(quotes) ? quotes : []) {
        if (quote.manufacturer_name && !supplierMap.has(quote.manufacturer_name)) {
          supplierMap.set(quote.manufacturer_name, mapQuoteToSupplier(quote));
        }
      }

      return Response.json({
        suppliers: Array.from(supplierMap.values()),
        orders: (Array.isArray(orders) ? orders : []).map(mapOrder),
        tasks: (Array.isArray(activities) ? activities : []).map(mapActivity),
        source: 'mysuppliex_api',
      });
    }

    const entity = body.entity;
    if (!entity || !ALLOWED_ENTITIES.has(entity)) return Response.json({ error: 'Entity not allowed' }, { status: 400 });

    if (action === 'get') {
      if (!body.id) return Response.json({ error: 'Missing id' }, { status: 400 });
      return Response.json({ record: await apiRequest(entity, {}, body.id) });
    }

    const records = await apiRequest(entity, {
      q: body.q,
      limit: Math.min(Number(body.limit || 20), 100),
      skip: Number(body.skip || 0),
      sort_by: body.sort_by || '-updated_date',
    });
    return Response.json({ records, source: 'mysuppliex_api' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});