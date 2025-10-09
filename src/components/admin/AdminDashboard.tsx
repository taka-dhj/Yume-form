'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/admin/StatusBadge';

export type ReservationRow = {
  bookingId: string;
  guestName: string;
  email: string;
  checkinDate: string; // ISO date
  nights: number;
  otaName: string;
  dinnerIncluded: 'Yes' | 'No' | 'Unknown';
  initialEmailSent: boolean;
  emailSentAt?: string;
  status: 'pending' | 'email_sent' | 'responded' | 'questioning' | 'completed';
  notes: string;
};

const rowBg: Record<ReservationRow['status'], string> = {
  pending: 'bg-red-50',
  email_sent: 'bg-gray-50',
  responded: 'bg-yellow-50',
  questioning: 'bg-orange-50',
  completed: 'bg-green-50',
};

function isSameDateIso(iso: string, target: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && d.getDate() === target.getDate();
}

export default function AdminDashboard({ reservations }: { reservations: ReservationRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<ReservationRow['status'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [checkinFilter, setCheckinFilter] = useState(''); // yyyy-mm-dd
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewingResponse, setViewingResponse] = useState<ReservationRow | null>(null);

  const today = useMemo(() => new Date(), []);

  const handleStatusChange = async (bookingId: string, newStatus: ReservationRow['status']) => {
    setUpdating(bookingId);
    try {
      const res = await fetch('/.netlify/functions/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to update status: ${err.error || 'Unknown error'}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  const counts = useMemo(() => {
    const c = { pending: 0, email_sent: 0, responded: 0, questioning: 0, completed: 0 } as Record<ReservationRow['status'], number>;
    reservations.forEach(r => { c[r.status] += 1; });
    const urgentUnsent = c.pending;
    const todayNotCompleted = reservations.filter(r => isSameDateIso(r.checkinDate, today) && r.status !== 'completed').length;
    // reminderDue is placeholder (0) until scheduled logic is added
    const reminderDue = 0;
    return { c, urgentUnsent, reminderDue, todayNotCompleted };
  }, [reservations, today]);

  const filtered = useMemo(() => {
    return reservations.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.bookingId} ${r.guestName} ${r.email} ${r.otaName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (checkinFilter) {
        if (r.checkinDate !== checkinFilter) return false;
      }
      return true;
    });
  }, [reservations, statusFilter, search, checkinFilter]);

  return (
    <>
    <div className="space-y-6">
      {/* Header / Alerts */}
      <div className="rounded-lg border bg-rose-50 border-rose-200 p-4">
        <div className="font-semibold text-rose-800 mb-1">緊急対応必要</div>
        <div className="text-sm text-rose-700 flex flex-wrap gap-x-6 gap-y-1">
          <span>未送信: {counts.urgentUnsent}件</span>
          <span>催促期限: {counts.reminderDue}件</span>
          <span>本日チェックイン未完了: {counts.todayNotCompleted}件</span>
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 bg-rose-600 text-white rounded text-sm">一括処理開始</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="未送信" count={counts.c.pending} sublabel="要メール送信" color="red" />
        <SummaryCard label="回答待ち" count={counts.c.email_sent} sublabel="催促対象: 0件" color="blue" />
        <SummaryCard label="質問中" count={counts.c.questioning} sublabel="個別対応中" color="orange" />
        <SummaryCard label="受付完了" count={counts.c.completed} sublabel="本日チェックイン:"
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {((['all','pending','responded','questioning','email_sent','completed'] as const) as Array<ReservationRow['status'] | 'all'>).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded border text-sm ${statusFilter===s? 'bg-blue-600 text-white border-blue-600':'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {s === 'all' ? 'すべて' : s}
          </button>
        ))}
      </div>

      {/* Search and date */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="予約ID・氏名・メール・OTAで検索"
          className="flex-1 border rounded px-3 py-2"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">チェックイン</span>
          <input type="date" value={checkinFilter} onChange={(e)=>setCheckinFilter(e.target.value)} className="border rounded px-2 py-2" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <Th>Booking ID</Th>
              <Th>Guest</Th>
              <Th>Email</Th>
              <Th>Check-in</Th>
              <Th>Nights</Th>
              <Th>OTA</Th>
              <Th>Dinner</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">該当データがありません</td>
              </tr>
            )}
            {filtered.map((r: ReservationRow) => (
              <tr key={r.bookingId} className={`border-t ${rowBg[r.status]} text-gray-800 ${r.status === 'responded' ? 'cursor-pointer hover:bg-yellow-100' : ''}`} onClick={() => {
                if (r.status === 'responded' || r.status === 'questioning' || r.status === 'completed') {
                  setViewingResponse(r);
                }
              }}>
                <Td className="font-mono text-gray-800">{r.bookingId}</Td>
                <Td className="text-gray-800">{r.guestName}</Td>
                <Td className="text-gray-800">{r.email}</Td>
                <Td className="text-gray-800">{r.checkinDate}</Td>
                <Td className="text-gray-800">{r.nights}</Td>
                <Td className="text-gray-800">{r.otaName}</Td>
                <Td className="text-gray-800">{r.dinnerIncluded}</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">メール</button>
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.bookingId, e.target.value as ReservationRow['status'])}
                      disabled={updating === r.bookingId}
                      className="text-xs border rounded px-2 py-1 bg-white text-gray-800 disabled:opacity-50"
                      title="ステータス変更"
                    >
                      <option value="pending">pending</option>
                      <option value="email_sent">email_sent</option>
                      <option value="responded">responded</option>
                      <option value="questioning">questioning</option>
                      <option value="completed">completed</option>
                    </select>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Response Detail Modal */}
    {viewingResponse && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setViewingResponse(null)}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-semibold">フォーム回答詳細</h2>
              <button onClick={() => setViewingResponse(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            <div className="space-y-3">
              <ResponseDetail label="予約ID" value={viewingResponse.bookingId} />
              <ResponseDetail label="ゲスト名" value={viewingResponse.guestName} />
              <ResponseDetail label="チェックイン" value={viewingResponse.checkinDate} />

              {viewingResponse.notes && (() => {
                try {
                  const formData = JSON.parse(viewingResponse.notes);
                  return (
                    <>
                      {formData.submittedAt && <ResponseDetail label="回答日時" value={new Date(formData.submittedAt).toLocaleString('ja-JP')} />}
                      {formData.language && <ResponseDetail label="言語" value={formData.language === 'ja' ? '日本語' : 'English'} />}
                      {formData.hasChildren && <ResponseDetail label="お子様連れ" value={`はい - ${formData.childrenDetails || ''}`} />}
                      {formData.arrivalCountryDate && <ResponseDetail label="日本到着日" value={formData.arrivalCountryDate} />}
                      {formData.prevNightPlace && <ResponseDetail label="前泊場所" value={formData.prevNightPlace} />}
                      {formData.hasPhone && <ResponseDetail label="携帯電話" value={formData.phoneNumber || ''} />}
                      {formData.dinnerRequest && <ResponseDetail label="夕食追加" value={formData.dinnerRequest === 'yes' ? 'はい' : 'いいえ'} />}
                      {formData.dietaryNeeds && <ResponseDetail label="食事配慮" value={formData.dietaryDetails || 'あり'} />}
                      {formData.arrivalTime && <ResponseDetail label="到着時刻" value={formData.arrivalTime} />}
                      {formData.otherNotes && <ResponseDetail label="その他要望" value={formData.otherNotes} />}
                    </>
                  );
                } catch {
                  return <ResponseDetail label="回答内容" value={viewingResponse.notes} />;
                }
              })()}
            </div>

            <div className="border-t pt-4">
              <button onClick={() => setViewingResponse(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function ResponseDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="font-semibold text-gray-600">{label}</div>
      <div className="col-span-2 text-gray-800">{value}</div>
    </div>
  );
}

function SummaryCard({ label, count, sublabel, color = 'gray' }: { label: string; count: number; sublabel?: string; color?: 'red' | 'green' | 'orange' | 'blue' | 'gray' }) {
  const palette: Record<string, { bg: string; border: string; text: string }> = {
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
  };
  const c = palette[color] ?? palette.gray;
  return (
    <div className={`rounded border ${c.bg} ${c.border} p-4`}>
      <div className={`text-sm ${c.text}`}>{label}</div>
      <div className="text-3xl font-semibold mt-1">{count}</div>
      {sublabel ? <div className="text-xs text-gray-500 mt-1">{sublabel}</div> : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">{children}</th>;
}

function Td({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return <td className={`px-3 py-2 whitespace-nowrap ${className}`} onClick={onClick}>{children}</td>;
}


