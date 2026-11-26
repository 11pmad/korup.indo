"use client";

import React, { useState, useRef, useEffect } from 'react';
import { sound } from '../../utils/audio';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Check, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface ChatMessage {
  role: 'admin' | 'ai';
  text: string;
}

interface AdminAiCuratorProps {
  authToken: string;
  onRefreshGlobal?: () => void;
  onRefreshAuditLogs?: () => void;
}

export const AdminAiCurator: React.FC<AdminAiCuratorProps> = ({
  authToken,
  onRefreshGlobal,
  onRefreshAuditLogs
}) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Halo Admin Verifikator! Saya asisten AI kurasi data Liga Korupsi Indonesia (LKI). Silakan ketik perintah dalam bahasa alami (misal: "Tambahkan kasus suap pengadaan proyek oleh Bupati X senilai 5 miliar..."). Sesuai SOP integritas hukum, setiap data wajib menyertakan link sumber berita/putusan resmi dan status hukum yang tegas.'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeDraft, setActiveDraft] = useState<any | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendAiCommand = async (textToSend?: string) => {
    const message = textToSend || chatInput;
    if (!message.trim()) return;

    sound.playPop();
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'admin', text: message }
    ];
    setChatHistory(updatedHistory);
    setChatInput('');
    setIsProcessing(true);
    setPublishSuccess(null);

    try {
      const res = await fetch('/api/admin/ai-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          command: message,
          history: updatedHistory
        })
      });

      const data = await res.json();

      setChatHistory([
        ...updatedHistory,
        { role: 'ai', text: data.message }
      ]);

      if (data.is_draft_ready && data.draft) {
        sound.playSticker();
        setActiveDraft(data.draft);
        setActiveLogId(data.log_id);
      } else {
        setActiveDraft(null);
        setActiveLogId(null);
      }
    } catch (err: any) {
      setChatHistory([
        ...updatedHistory,
        { role: 'ai', text: `Terjadi kendala teknis: ${err.message}` }
      ]);
    } finally {
      setIsProcessing(false);
      if (onRefreshAuditLogs) onRefreshAuditLogs();
    }
  };

  const handleConfirmDraft = async () => {
    if (!activeLogId) return;
    sound.playCheer();
    setIsProcessing(true);

    try {
      const res = await fetch('/api/admin/cases/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          log_id: activeLogId,
          catatan_admin: 'Disetujui oleh kurator via AI Assistant'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mempublikasikan kasus');
      }

      setPublishSuccess(`Data kasus berhasil dipublikasikan ke peta & klasemen publik! (ID: ${data.case_id})`);
      setActiveDraft(null);
      setActiveLogId(null);
      if (onRefreshGlobal) onRefreshGlobal();
      if (onRefreshAuditLogs) onRefreshAuditLogs();
    } catch (err: any) {
      alert(`Gagal konfirmasi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chat Pane */}
      <div className="lg:col-span-7 bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 shadow-sm flex flex-col h-[620px]">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE5CF]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-[#1E293B]">Percakapan Perintah &amp; Klarifikasi Fakta</span>
          </div>
          <span className="text-[11px] text-[#64748B] font-mono">Gemini Flash • Strict Legal Rule</span>
        </div>

        {/* Quick Prompt Chips */}
        <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-[#F4EDE0]">
          <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Coba Cepat:</span>
          <button
            onClick={() => handleSendAiCommand('Tambahkan kasus korupsi Bupati X di Jawa Timur, kerugian 4 miliar')}
            className="px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-xl text-[11px] font-semibold whitespace-nowrap hover:bg-[#FDE68A] cursor-pointer"
          >
            1. Tanpa Sumber (Uji Penolakan AI)
          </button>
          <button
            onClick={() => handleSendAiCommand('Di Jawa Timur, tahun 2023, status Terdakwa, link sumber berita https://nasional.kompas.com/read/2023/10/kasus-bupati-x')}
            className="px-2.5 py-1 bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] rounded-xl text-[11px] font-semibold whitespace-nowrap hover:bg-[#BBF7D0] cursor-pointer"
          >
            2. Lengkapi Sumber &amp; Status Hukum
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                  🤖
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  msg.role === 'admin'
                    ? 'bg-[#EA580C] text-white rounded-tr-xs shadow-xs'
                    : 'bg-[#FAF6EC] text-[#1E293B] border border-[#E9DFCB] rounded-tl-xs shadow-2xs'
                }`}
              >
                {msg.text}
              </div>

              {msg.role === 'admin' && (
                <div className="w-7 h-7 rounded-lg bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                  👤
                </div>
              )}
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendAiCommand();
          }}
          className="pt-3 border-t border-[#EFE5CF] flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ketik instruksi data perkara korupsi atau klarifikasi di sini..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 bg-[#FAF6EC] border border-[#E9DFCB] rounded-xl px-3.5 py-2.5 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
          />
          <button
            type="submit"
            disabled={isProcessing || !chatInput.trim()}
            className="p-2.5 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Kirim instruksi ke asisten AI"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Draft Preview & Review Pane */}
      <div className="lg:col-span-5 bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE5CF]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#FEF08A] text-[#854D0E] rounded-lg">📋</span>
              <span className="text-xs font-bold text-[#1E293B]">Pratinjau Draf Data (Human Review)</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              Belum Dipublikasi
            </span>
          </div>

          {publishSuccess && (
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-xs text-[#166534] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Sukses Dipublikasikan!</span>
              </div>
              <p>{publishSuccess}</p>
            </div>
          )}

          {activeDraft ? (
            <div className="space-y-3.5 bg-[#FAF6EC] border border-[#E9DFCB] rounded-2xl p-4 text-xs">
              {/* Official Header */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Profil Pejabat</span>
                <div className="font-bold text-base text-[#1E293B]">
                  {activeDraft.official?.nama}
                </div>
                <div className="text-gray-600">
                  {activeDraft.official?.jabatan} • {activeDraft.official?.partai}
                </div>
                <div className="text-[11px] text-[#0284C7] font-semibold pt-0.5">
                  📍 {activeDraft.official?.provinsi} ({activeDraft.official?.kota_kabupaten || '-'})
                </div>
              </div>

              {/* Legal Status & Loss */}
              <div className="p-3 bg-white border border-[#E2D6BA] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 block">Status Hukum:</span>
                  <span className="font-bold text-[#B91C1C]">
                    ⚖️ {activeDraft.corruption_case?.status_hukum}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Nilai Kerugian Negara:</span>
                  <span className="font-mono font-bold text-[#EA580C]">
                    {formatRupiah(activeDraft.corruption_case?.nilai_kerugian_negara || 0)}
                  </span>
                </div>
              </div>

              {/* Ringkasan */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Ringkasan Kasus</span>
                <p className="text-gray-700 bg-white p-2.5 rounded-xl border border-[#E2D6BA] leading-relaxed">
                  {activeDraft.corruption_case?.ringkasan_kasus}
                </p>
              </div>

              {/* Rujukan Sumber Resmi */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rujukan Sumber Resmi</span>
                <div className="space-y-1">
                  {activeDraft.sources?.map((s: any, i: number) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E2D6BA] text-blue-600 hover:text-blue-800 text-[11px]"
                    >
                      <span className="truncate">{s.nama_media}: {s.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2 text-gray-400">
              <div className="text-3xl">🗂️</div>
              <p className="text-xs font-semibold text-gray-600">Belum ada draft aktif.</p>
              <p className="text-[11px] text-gray-500 font-normal max-w-xs mx-auto">
                Ketik instruksi di sebelah kiri. Setelah data wajib lengkap dengan tautan berita, draft akan muncul di sini untuk ditinjau.
              </p>
            </div>
          )}
        </div>

        {/* Actions for active draft */}
        {activeDraft && (
          <div className="pt-4 border-t border-[#EFE5CF] space-y-2">
            <div className="p-2 bg-[#FEF9C3] rounded-xl text-[11px] text-[#713F12]">
              ⚠️ <strong>Human Review SOP:</strong> Pastikan Anda telah mengklik tautan sumber di atas untuk mengonfirmasi keabsahan dokumen sebelum menyetujui.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playPop();
                  setActiveDraft(null);
                  setActiveLogId(null);
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Tolak Draf
              </button>

              <button
                onClick={handleConfirmDraft}
                disabled={isProcessing}
                className="flex-2 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Menyimpan...' : 'Setujui & Publikasikan ke Database'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
