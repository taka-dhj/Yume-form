'use client';

import { useMemo, useState } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<ReservationRow['status'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [checkinFilter, setCheckinFilter] = useState(''); // yyyy-mm-dd

  const today = useMemo(() => new Date(), []);

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
    <div className="space-y-5">
      {/* Header / Alerts */}
      <div className="rounded-lg border bg-rose-50 border-rose-200 p-4">
        <div className="font-semibold text-rose-800 mb-1">緊急対応必要</div>
        <div className="text-sm text-rose-700 space-x-4">
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
        <SummaryCard label="未送信" count={counts.c.pending} sublabel="要メール送信" />
        <SummaryCard label="回答待ち" count={counts.c.responded} sublabel="催促対象: 0件" />
        <SummaryCard label="質問中" count={counts.c.questioning} sublabel="個別対応中" />
        <SummaryCard label="本日チェックイン" count={reservations.filter(r => isSameDateIso(r.checkinDate, today)).length} sublabel={`未完了: ${counts.todayNotCompleted}件`} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all','pending','responded','questioning','email_sent','completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s as any)}
            className={`px-3 py-1 rounded border text-sm ${statusFilter===s? 'bg-blue-600 text-white border-blue-600':'bg-white border-gray-300 text-gray-700'}`}
          >
            {s === 'all' ? 'すべて表示' : s}
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
          <span className="text-sm text-gray-600">チェックイン日</span>
          <input type="date" value={checkinFilter} onChange={(e)=>setCheckinFilter(e.target.value)} className="border rounded px-2 py-2" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
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
              <tr key={r.bookingId} className={`border-t ${rowBg[r.status]}`}>
                <Td className="font-mono">{r.bookingId}</Td>
                <Td>{r.guestName}</Td>
                <Td>{r.email}</Td>
                <Td>{r.checkinDate}</Td>
                <Td>{r.nights}</Td>
                <Td>{r.otaName}</Td>
                <Td>{r.dinnerIncluded}</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td>
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded">メール</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, count, sublabel }: { label: string; count: number; sublabel?: string }) {
  return (
    <div className="rounded border bg-white p-4">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-3xl font-semibold mt-1">{count}</div>
      {sublabel ? <div className="text-xs text-gray-500 mt-1">{sublabel}</div> : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 whitespace-nowrap ${className}`}>{children}</td>;
}


