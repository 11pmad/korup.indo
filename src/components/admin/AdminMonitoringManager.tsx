import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Eye, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  Filter, 
  Search, 
  Download, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Globe, 
  Server, 
  ShieldAlert, 
  Terminal, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Layers,
  XCircle,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { sound } from '../../utils/audio.js';

interface AdminMonitoringManagerProps {
  authToken: string;
}

export interface VisitorLogItem {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  referrer: string;
  session_id: string;
}

export const AdminMonitoringManager: React.FC<AdminMonitoringManagerProps> = ({ authToken }) => {
  // Stats & KPIs state
  const [statsData, setStatsData] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  // Logs stream table state
  const [logs, setLogs] = useState<VisitorLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-refresh state (Live polling every 5s)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Log Inspector Modal
  const [selectedLog, setSelectedLog] = useState<VisitorLogItem | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Stats Data
  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/monitoring/stats?timeframe=${timeframe}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Error fetching monitoring stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Logs Table
  const fetchLogs = async (targetPage = page) => {
    setLogsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(targetPage),
        limit: '25',
        method: methodFilter,
        status: statusFilter,
        search: searchQuery
      });

      const res = await fetch(`/api/admin/monitoring/logs?${queryParams.toString()}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages || 1);
          setTotalItems(data.pagination.total_items || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching monitoring logs:', err);
    } finally {
      setLogsLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Initial and timeframe effect
  useEffect(() => {
    fetchStats();
  }, [timeframe, authToken]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, methodFilter, statusFilter, authToken]);

  // Auto-refresh polling effect (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchLogs(page);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, timeframe, methodFilter, statusFilter, searchQuery]);

  // Purge old logs
  const handlePurgeLogs = async () => {
    if (!confirm('Apakah Anda yakin ingin membersihkan log trafik pengunjung yang lebih lama dari 7 hari?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/monitoring/logs?days=7', {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membersihkan log');

      sound.playCheer();
      setNotification({ type: 'success', message: data.message });
      setTimeout(() => setNotification(null), 4000);
      fetchStats();
      fetchLogs(1);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Export logs to JSON
  const handleExportJson = () => {
    sound.playPop();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lki-traffic-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getMethodBadgeStyle = (m: string) => {
    switch (m) {
      case 'GET': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POST': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PAGEVIEW': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PUT': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeStyle = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    if (code >= 300 && code < 400) return 'bg-sky-50 text-sky-700 border-sky-300';
    if (code >= 400 && code < 500) return 'bg-amber-50 text-amber-800 border-amber-300';
    return 'bg-rose-50 text-rose-800 border-rose-300';
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 50) return 'text-emerald-600 font-bold';
    if (ms < 200) return 'text-amber-600 font-bold';
    return 'text-rose-600 font-bold';
  };

  const kpi = statsData?.kpi || {
    total_visits: 0,
    unique_visitors: 0,
    avg_latency_ms: 0,
    error_count: 0,
    error_rate_pct: 0
  };

  const system = statsData?.system_health || {
    status: 'healthy',
    database: 'PostgreSQL Connected',
    uptime_formatted: '0j 0m',
    memory_rss_mb: 0,
    memory_heap_mb: 0
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Monitoring &amp; Observabilitas Trafik Pengunjung</span>
              {autoRefresh && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Live Stream 5s</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Pemantauan real-time kunjungan publik, performa latensi server, jejak rute, dan integritas request API.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => {
                sound.playPop();
                setTimeframe('24h');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '24h' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              24 Jam
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setTimeframe('7d');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '7d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setTimeframe('30d');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '30d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              30 Hari
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => {
              sound.playPop();
              setAutoRefresh(!autoRefresh);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              autoRefresh 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto: ON' : 'Auto: OFF'}</span>
          </button>

          {/* Purge Old Logs */}
          <button
            onClick={handlePurgeLogs}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Bersihkan log lebih dari 7 hari"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Bersihkan Log</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Unduh log saat ini dalam format JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ekspor</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* System Health Status Ribbon */}
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Infrastruktur LKI: Normal</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">DB: {system.database}</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>Uptime: <strong className="text-slate-200">{system.uptime_formatted}</strong></span>
          <span>RAM RSS: <strong className="text-slate-200">{system.memory_rss_mb} MB</strong></span>
          <span>Heap: <strong className="text-slate-200">{system.memory_heap_mb} MB</strong></span>
        </div>
      </div>

      {/* 4 Main Observability KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Kunjungan</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpi.total_visits}</div>
          <span className="text-[10px] text-slate-400 block font-medium">
            Hits &amp; Pageviews dalam {timeframe}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pengunjung Unik</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpi.unique_visitors}</div>
          <span className="text-[10px] text-slate-400 block font-medium">
            Sesi IP unik terdistribusi
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rata-rata Latensi</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-black ${getLatencyColor(kpi.avg_latency_ms)}`}>
            {kpi.avg_latency_ms} <span className="text-sm font-normal text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">
            Waktu respons server rata-rata
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tingkat Error</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl font-black ${kpi.error_count > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {kpi.error_rate_pct}%
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">
            {kpi.error_count} request bermasalah (4xx/5xx)
          </span>
        </div>
      </div>

      {/* Traffic Trend Chart & Device Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Volume Trafik Jam-ke-Jam</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Fluktuasi beban request per jam dalam rentang waktu yang dipilih
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Update: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            {statsData?.hourly_traffic && statsData.hourly_traffic.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsData.hourly_traffic}>
                  <defs>
                    <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                  />
                  <Area type="monotone" dataKey="hits" name="Total Hits" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorHits)" />
                  <Area type="monotone" dataKey="errors" name="Errors (4xx/5xx)" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Belum ada data visualisasi jam-ke-jam
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Device & Browser Distribution (1 col) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
          <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Perangkat &amp; Browser Warga</span>
          </h4>

          {/* Device Type List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Tipe Perangkat:
            </span>
            {statsData?.devices && statsData.devices.map((d: any, idx: number) => {
              const totalDev = statsData.devices.reduce((acc: number, cur: any) => acc + cur.value, 0) || 1;
              const pct = Math.round((d.value / totalDev) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {d.name.toLowerCase().includes('mobile') ? <Smartphone className="w-3.5 h-3.5 text-blue-500" /> : <Laptop className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{d.name}</span>
                    </span>
                    <span>{pct}% ({d.value})</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Browser List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Peramban (Browser):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {statsData?.browsers && statsData.browsers.map((b: any, idx: number) => (
                <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <span className="text-slate-500 text-[10px] block">{b.name}</span>
                  <span className="font-bold text-slate-800">{b.value} req</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Top Visited Endpoints Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Halaman &amp; Endpoint Paling Populer (Top Routes)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {statsData?.top_paths && statsData.top_paths.map((tp: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="font-mono text-xs font-bold text-slate-800 truncate block" title={tp.path}>
                {tp.path}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{tp.hits} kunjungan</span>
                <span className={getLatencyColor(tp.avg_latency)}>{tp.avg_latency} ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Logs Feed Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Table Filter & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Jejak Log Trafik Masuk (Live Request Stream)</span>
              <span className="text-xs font-semibold text-slate-400 font-mono">({totalItems} entri)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Setiap panggilan API dan kunjungan halaman dicatat secara transparan dengan latensi dan status code.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Path/IP */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchLogs(1);
                  }
                }}
                placeholder="Cari path atau IP..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={e => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Method</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PAGEVIEW">PAGEVIEW</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="2xx">2xx Sukses</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <th className="pb-3 pl-2">Waktu</th>
                <th className="pb-3">Metode</th>
                <th className="pb-3">Path / Rute</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Latensi</th>
                <th className="pb-3">Perangkat / Browser</th>
                <th className="pb-3">IP Samaran</th>
                <th className="pb-3 pr-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logsLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Memperbarui log aktivitas...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Tidak ada log trafik yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-2.5 pl-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getMethodBadgeStyle(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-semibold text-slate-800 max-w-xs truncate" title={log.path}>
                      {log.path}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getStatusBadgeStyle(log.status_code)}`}>
                        {log.status_code}
                      </span>
                    </td>
                    <td className={`py-2.5 font-mono text-[11px] ${getLatencyColor(log.duration_ms)}`}>
                      {log.duration_ms} ms
                    </td>
                    <td className="py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                      {log.browser} • {log.device_type}
                    </td>
                    <td className="py-2.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.ip_address}
                    </td>
                    <td className="py-2.5 pr-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2 py-1 bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Inspeksi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> ({totalItems} total log)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playPop();
                setPage(Math.max(1, page - 1));
              }}
              disabled={page <= 1 || logsLoading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setPage(Math.min(totalPages, page + 1));
              }}
              disabled={page >= totalPages || logsLoading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Log Detail Inspector Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getMethodBadgeStyle(selectedLog.method)}`}>
                  {selectedLog.method}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getStatusBadgeStyle(selectedLog.status_code)}`}>
                  {selectedLog.status_code}
                </span>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Inspeksi Permintaan HTTP
                </h4>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl font-mono text-slate-800 break-all border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase mb-1">Rute / Path:</span>
                {selectedLog.path}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Waktu:</span>
                  <span className="font-mono text-slate-800">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Latensi:</span>
                  <span className={getLatencyColor(selectedLog.duration_ms)}>{selectedLog.duration_ms} ms</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">IP Klien (Anonymized):</span>
                  <span className="font-mono text-slate-800">{selectedLog.ip_address}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Perangkat &amp; OS:</span>
                  <span className="text-slate-800">{selectedLog.device_type} • {selectedLog.os}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Referrer:</span>
                <span className="text-slate-700 font-mono break-all">{selectedLog.referrer || 'Direct'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">User-Agent Lengkap:</span>
                <span className="text-slate-600 font-mono text-[11px] leading-relaxed break-all block">
                  {selectedLog.user_agent}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
