import { Router, Request, Response, NextFunction } from 'express';
import { db, schema } from '../db/index.js';
import { desc, sql, and, gte, eq, ilike } from 'drizzle-orm';
import { verifyAdminJwt } from '../middleware/auth.js';

const router = Router();

// Helper: Parse user agent for device, browser, and OS
export function parseUserAgent(ua: string = '') {
  const lower = ua.toLowerCase();

  // Device
  let device_type = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(lower)) {
    device_type = 'mobile';
  } else if (/tablet|ipad/i.test(lower)) {
    device_type = 'tablet';
  } else if (/bot|crawler|spider|googlebot|bingbot|yandex/i.test(lower)) {
    device_type = 'bot';
  }

  // Browser
  let browser = 'Other';
  if (lower.includes('edg/')) browser = 'Edge';
  else if (lower.includes('chrome/')) browser = 'Chrome';
  else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Safari';
  else if (lower.includes('firefox/')) browser = 'Firefox';
  else if (lower.includes('opera/') || lower.includes('opr/')) browser = 'Opera';

  // OS
  let os = 'Other';
  if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('macintosh') || lower.includes('mac os')) os = 'macOS';
  else if (lower.includes('linux') && !lower.includes('android')) os = 'Linux';
  else if (lower.includes('android')) os = 'Android';
  else if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) os = 'iOS';

  return { device_type, browser, os };
}

// Helper: Anonymize IP address (e.g. 192.168.1.50 -> 192.168.1.***)
export function anonymizeIp(ip: string = ''): string {
  if (!ip) return '127.0.0.1';
  const clean = ip.replace(/^::ffff:/, '');
  const parts = clean.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return clean.slice(0, 12) + '***';
}

// Middleware to capture server traffic
export function trafficLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip static Vite assets and hot-reloads
  const p = req.path;
  if (
    p.startsWith('/@') || 
    p.startsWith('/node_modules') || 
    p.startsWith('/src/') || 
    /\.(js|css|map|png|jpg|jpeg|svg|ico|woff|woff2|ttf|webp)$/i.test(p)
  ) {
    return next();
  }

  const startTime = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown';
  const { device_type, browser, os } = parseUserAgent(ua);
  const anonIp = anonymizeIp(ip);

  // Generate lightweight session hash
  const today = new Date().toISOString().slice(0, 10);
  const sessionHash = `sess-${Buffer.from(`${anonIp}-${today}`).toString('base64').slice(0, 16)}`;

  res.on('finish', async () => {
    const duration_ms = Math.max(1, Date.now() - startTime);
    const status_code = res.statusCode;

    // Do not log the monitoring stats API itself to avoid feedback loops
    if (p.startsWith('/api/admin/monitoring')) {
      return;
    }

    try {
      const id = `log-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
      await db.insert(schema.visitorLogs).values({
        id,
        timestamp: new Date(),
        method: req.method,
        path: p.slice(0, 255),
        status_code,
        duration_ms,
        ip_address: anonIp,
        user_agent: ua.slice(0, 500),
        device_type,
        browser,
        os,
        referrer: (req.headers['referer'] || req.headers['referrer'] || 'Direct') as string,
        session_id: sessionHash
      });
    } catch (e) {
      // Ignore logger errors silently
    }
  });

  next();
}

// Client-side SPA Page Transition tracking
router.post('/track', async (req, res) => {
  try {
    const { path: pagePath, referrer } = req.body;
    if (!pagePath) return res.status(400).json({ error: 'Path required' });

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    const { device_type, browser, os } = parseUserAgent(ua);
    const anonIp = anonymizeIp(ip);
    const today = new Date().toISOString().slice(0, 10);
    const sessionHash = `sess-${Buffer.from(`${anonIp}-${today}`).toString('base64').slice(0, 16)}`;

    const id = `log-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    await db.insert(schema.visitorLogs).values({
      id,
      timestamp: new Date(),
      method: 'PAGEVIEW',
      path: String(pagePath).slice(0, 255),
      status_code: 200,
      duration_ms: 1,
      ip_address: anonIp,
      user_agent: ua.slice(0, 500),
      device_type,
      browser,
      os,
      referrer: (referrer || 'Direct').slice(0, 255),
      session_id: sessionHash
    });

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/monitoring/stats (Authenticated admin overview)
router.get('/stats', verifyAdminJwt, async (req, res) => {
  try {
    const hours = req.query.timeframe === '7d' ? 24 * 7 : req.query.timeframe === '30d' ? 24 * 30 : 24;
    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // 1. Total hits and unique visitors
    const totalLogs = await db
      .select({
        total: sql<number>`count(*)::int`,
        uniqueVisitors: sql<number>`count(distinct ${schema.visitorLogs.session_id})::int`,
        avgLatency: sql<number>`coalesce(avg(${schema.visitorLogs.duration_ms}), 0)::int`,
        errorCount: sql<number>`count(case when ${schema.visitorLogs.status_code} >= 400 then 1 end)::int`
      })
      .from(schema.visitorLogs)
      .where(gte(schema.visitorLogs.timestamp, sinceDate));

    const total = totalLogs[0]?.total || 0;
    const unique = totalLogs[0]?.uniqueVisitors || 0;
    const avgLatency = totalLogs[0]?.avgLatency || 0;
    const errorCount = totalLogs[0]?.errorCount || 0;
    const errorRate = total > 0 ? Number(((errorCount / total) * 100).toFixed(2)) : 0;

    // 2. Top visited paths
    const topPaths = await db
      .select({
        path: schema.visitorLogs.path,
        hits: sql<number>`count(*)::int`,
        avg_latency: sql<number>`coalesce(avg(${schema.visitorLogs.duration_ms}), 0)::int`
      })
      .from(schema.visitorLogs)
      .where(gte(schema.visitorLogs.timestamp, sinceDate))
      .groupBy(schema.visitorLogs.path)
      .orderBy(sql`count(*) desc`)
      .limit(8);

    // 3. Device breakdown
    const devices = await db
      .select({
        name: schema.visitorLogs.device_type,
        count: sql<number>`count(*)::int`
      })
      .from(schema.visitorLogs)
      .where(gte(schema.visitorLogs.timestamp, sinceDate))
      .groupBy(schema.visitorLogs.device_type);

    // 4. Browser breakdown
    const browsers = await db
      .select({
        name: schema.visitorLogs.browser,
        count: sql<number>`count(*)::int`
      })
      .from(schema.visitorLogs)
      .where(gte(schema.visitorLogs.timestamp, sinceDate))
      .groupBy(schema.visitorLogs.browser);

    // 5. Status code breakdown
    const statusCodes = await db
      .select({
        status_code: schema.visitorLogs.status_code,
        count: sql<number>`count(*)::int`
      })
      .from(schema.visitorLogs)
      .where(gte(schema.visitorLogs.timestamp, sinceDate))
      .groupBy(schema.visitorLogs.status_code)
      .orderBy(sql`count(*) desc`);

    // 6. Hourly traffic distribution
    const hourlyLogs = await db
      .select({
        hour_bucket: sql<string>`to_char(date_trunc('hour', ${schema.visitorLogs.timestamp}), 'YYYY-MM-DD"T"HH24:00:00')`,
        hits: sql<number>`count(*)::int`,
        errors: sql<number>`count(case when ${schema.visitorLogs.status_code} >= 400 then 1 end)::int`
      })
      .from(schema.visitorLogs)
      .where(gte(schema.visitorLogs.timestamp, sinceDate))
      .groupBy(sql`date_trunc('hour', ${schema.visitorLogs.timestamp})`)
      .orderBy(sql`date_trunc('hour', ${schema.visitorLogs.timestamp}) asc`);

    // 7. System Health stats
    const memUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    res.json({
      timeframe: `${hours} hours`,
      kpi: {
        total_visits: total,
        unique_visitors: unique,
        avg_latency_ms: avgLatency,
        error_count: errorCount,
        error_rate_pct: errorRate
      },
      hourly_traffic: hourlyLogs.map(h => ({
        time: new Date(h.hour_bucket).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        hits: h.hits,
        errors: h.errors
      })),
      top_paths: topPaths,
      devices: devices.map(d => ({ name: d.name ? d.name.toUpperCase() : 'DESKTOP', value: d.count })),
      browsers: browsers.map(b => ({ name: b.name || 'Other', value: b.count })),
      status_codes: statusCodes,
      system_health: {
        status: 'healthy',
        database: 'connected (PostgreSQL)',
        uptime_seconds: uptimeSeconds,
        uptime_formatted: `${Math.floor(uptimeSeconds / 3600)}j ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
        memory_rss_mb: Math.round(memUsage.rss / (1024 * 1024)),
        memory_heap_mb: Math.round(memUsage.heapUsed / (1024 * 1024)),
        node_env: process.env.NODE_ENV || 'production'
      }
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/monitoring/stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/monitoring/logs (Paginated & filtered logs table)
router.get('/logs', verifyAdminJwt, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 30);
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status as string; // 'all' | '2xx' | '4xx' | '5xx'
    const methodFilter = req.query.method as string; // 'all' | 'GET' | 'POST' | etc.
    const search = (req.query.search as string || '').trim().toLowerCase();

    const conditions = [];

    if (statusFilter === '2xx') {
      conditions.push(sql`${schema.visitorLogs.status_code} >= 200 AND ${schema.visitorLogs.status_code} < 300`);
    } else if (statusFilter === '4xx') {
      conditions.push(sql`${schema.visitorLogs.status_code} >= 400 AND ${schema.visitorLogs.status_code} < 500`);
    } else if (statusFilter === '5xx') {
      conditions.push(sql`${schema.visitorLogs.status_code} >= 500`);
    }

    if (methodFilter && methodFilter !== 'all') {
      conditions.push(eq(schema.visitorLogs.method, methodFilter));
    }

    if (search) {
      conditions.push(
        sql`(${schema.visitorLogs.path} ILIKE ${'%' + search + '%'} OR ${schema.visitorLogs.ip_address} ILIKE ${'%' + search + '%'} OR ${schema.visitorLogs.browser} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, totalCountResult] = await Promise.all([
      db
        .select()
        .from(schema.visitorLogs)
        .where(whereClause)
        .orderBy(desc(schema.visitorLogs.timestamp))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.visitorLogs)
        .where(whereClause)
    ]);

    const total = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total_items: total,
        total_pages: totalPages
      }
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/monitoring/logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/monitoring/logs (Purge old logs)
router.delete('/logs', verifyAdminJwt, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const deleted = await db
      .delete(schema.visitorLogs)
      .where(sql`${schema.visitorLogs.timestamp} < ${thresholdDate}`)
      .returning();

    // Log to audit
    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: (req as any).admin?.id,
      entity_type: 'visitor_logs',
      entity_id: 'purge',
      action: 'delete',
      diff_snapshot: {
        purged_count: deleted.length,
        days_retention: days
      },
      created_at: new Date()
    });

    res.json({
      message: `Berhasil membersihkan ${deleted.length} log trafik yang lebih lama dari ${days} hari.`,
      purged_count: deleted.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
