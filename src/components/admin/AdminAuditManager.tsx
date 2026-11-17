import React from 'react';
import { AuditLog } from '../../types.js';
import { sound } from '../../utils/audio.js';
import { History, RotateCcw } from 'lucide-react';

interface AdminAuditManagerProps {
  authToken: string;
  auditLogs: AuditLog[];
  loadingLogs: boolean;
  onRefreshLogs: () => void;
  onRefreshGlobal?: () => void;
}

export const AdminAuditManager: React.FC<AdminAuditManagerProps> = ({
  authToken,
  auditLogs,
  loadingLogs,
  onRefreshLogs,
  onRefreshGlobal
}) => {
  const handleRollback = async (logId: string) => {
    if (!confirm('Apakah Anda yakin ingin melakukan ROLLBACK dan mencabut data kasus ini dari database publik?')) {
      return;
    }

    sound.playPop();
    try {
      const res = await fetch(`/api/admin/rollback/${logId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal rollback');
      }
      alert(data.message || 'Rollback berhasil! Data ditarik dari database publik.');
      if (onRefreshGlobal) onRefreshGlobal();
      onRefreshLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#BAE6FD] text-[#0369A1] rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-marker text-2xl text-[#1E293B]">
              Jejak Audit &amp; Fitur Rollback
            </h3>
            <p className="text-xs text-[#64748B]">
              Setiap instruksi perintah admin, riwayat klarifikasi AI, dan hasil verifikasi tercatat secara permanen.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playPop();
            onRefreshLogs();
          }}
          className="px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#475569] hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh Log
        </button>
      </div>

      <div className="divide-y divide-[#EFE5CF] border border-[#E7DECB] rounded-2xl overflow-hidden">
        {loadingLogs ? (
          <div className="p-8 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></span>
            <span>Memuat jejak log audit...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">Belum ada riwayat log audit.</div>
        ) : (
          auditLogs.map(log => {
            const dateVal = log.timestamp || (log as any).created_at;
            const formattedDate = dateVal && !isNaN(new Date(dateVal).getTime())
              ? new Date(dateVal).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Waktu tercatat';

            const rawStatus = (log.status || (log as any).action || 'selesai').toLowerCase();
            const adminName = log.admin_id || (log as any).admin_username || 'Admin';
            const actionType = ((log as any).action || 'create').toUpperCase();
            const entityType = (log as any).entity_type || 'cases';
            const entityId = (log as any).entity_id || log.created_case_id || '-';
            
            const originalCommand = log.perintah_asli || 
              (log as any).diff_snapshot?.title || 
              (log as any).diff_snapshot?.perintah_asli || 
              `Aksi ${actionType} pada ${entityType} (${entityId})`;

            const targetCaseId = log.created_case_id || (entityType === 'cases' && entityId !== 'pending' ? entityId : null);
            const canRollback = (rawStatus === 'disetujui' || (log as any).action === 'create') && targetCaseId && (log as any).action !== 'rollback';

            return (
              <div key={log.id} className="p-4 bg-[#FAF6EC] hover:bg-[#F3EEDB] transition-colors space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-mono text-gray-600 font-bold bg-white px-2 py-0.5 rounded border border-[#E2D8C0]">
                      {log.id}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 font-mono text-[11px]">
                      {formattedDate}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-bold text-[#334155] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      👤 {adminName}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono">
                      {entityType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rawStatus === 'disetujui' || (log as any).action === 'create'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : rawStatus === 'ditolak' || (log as any).action === 'rollback'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {rawStatus.toUpperCase()}
                    </span>

                    {canRollback && (
                      <button
                        onClick={() => handleRollback(log.id)}
                        className="px-2.5 py-1 bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-[#FECACA] shadow-xs"
                        title="Tarik kembali data perkara dari database publik"
                      >
                        <RotateCcw className="w-3 h-3" /> Rollback
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs bg-white p-3 rounded-xl border border-[#E5DCC6] space-y-1">
                  <div className="flex items-center justify-between text-gray-500 text-[11px] font-medium">
                    <span>Aksi: <strong className="text-gray-700">{actionType}</strong></span>
                    {targetCaseId && <span>Target Perkara: <strong className="font-mono text-[#0284C7]">{targetCaseId}</strong></span>}
                  </div>
                  <p className="text-gray-800 font-mono text-xs leading-relaxed">
                    {originalCommand}
                  </p>
                </div>

                {log.catatan_admin && (
                  <div className="text-[11px] text-[#854D0E] bg-[#FEF9C3] px-3 py-1.5 rounded-lg border border-[#FDE047] flex items-center gap-1.5">
                    <span className="font-bold">Catatan:</span>
                    <span>{log.catatan_admin}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
