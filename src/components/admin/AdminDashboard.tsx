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

type SortField = 'bookingId' | 'checkinDate' | 'status' | 'none';
type SortDirection = 'asc' | 'desc';

export default function AdminDashboard({ reservations }: { reservations: ReservationRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<ReservationRow['status'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [checkinFilter, setCheckinFilter] = useState(''); // yyyy-mm-dd
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewingResponse, setViewingResponse] = useState<ReservationRow | null>(null);
  const [emailPreview, setEmailPreview] = useState<{ reservation: ReservationRow; language: 'ja' | 'en'; type: 'initial' | 'reception'; editableSubject?: string; editableBody?: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [perPage, setPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const today = useMemo(() => new Date(), []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const handleSendEmail = async (to: string, subject: string, bodyText: string, bookingId: string) => {
    setSendingEmail(true);
    try {
      const res = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, bodyText }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to send email: ${err.error || 'Unknown error'}`);
      } else {
        // Update status to email_sent
        await handleStatusChange(bookingId, 'email_sent');
        setEmailPreview(null);
        alert('メールを送信しました');
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const counts = useMemo(() => {
    const c = { pending: 0, email_sent: 0, responded: 0, questioning: 0, completed: 0 } as Record<ReservationRow['status'], number>;
    reservations.forEach(r => { c[r.status] += 1; });
    const urgentUnsent = c.pending;
    const todayNotCompleted = reservations.filter(r => isSameDateIso(r.checkinDate, today) && r.status !== 'completed').length;
    
    // Calculate reminder due (email_sent status with check-in within 30 days)
    const reminderThresholds = [30, 21, 14, 7];
    const reminderDue = reservations.filter(r => {
      if (r.status !== 'email_sent') return false;
      const checkin = new Date(r.checkinDate);
      checkin.setHours(0, 0, 0, 0);
      const todayCopy = new Date(today);
      todayCopy.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((checkin.getTime() - todayCopy.getTime()) / (1000 * 60 * 60 * 24));
      return reminderThresholds.includes(daysUntil);
    }).length;
    
    return { c, urgentUnsent, reminderDue, todayNotCompleted };
  }, [reservations, today]);

  const filtered = useMemo(() => {
    let result = reservations.filter(r => {
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

    // Apply sorting
    if (sortField !== 'none') {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        if (sortField === 'bookingId') {
          comparison = a.bookingId.localeCompare(b.bookingId);
        } else if (sortField === 'checkinDate') {
          comparison = a.checkinDate.localeCompare(b.checkinDate);
        } else if (sortField === 'status') {
          const statusOrder = ['pending', 'email_sent', 'responded', 'questioning', 'completed'];
          comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [reservations, statusFilter, search, checkinFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginatedData = useMemo(() => {
    if (perPage === 0) return filtered; // Show all
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, perPage]);

  // Reset to page 1 when filters change
  const resetPage = () => setCurrentPage(1);

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
        <SummaryCard label="未送信" count={counts.c.pending} sublabel="要メール送信" color="red" onClick={() => { setStatusFilter('pending'); resetPage(); }} />
        <SummaryCard label="回答待ち" count={counts.c.email_sent} sublabel={`催促対象: ${counts.reminderDue}件`} color="blue" onClick={() => { setStatusFilter('email_sent'); resetPage(); }} />
        <SummaryCard label="質問中" count={counts.c.questioning} sublabel="個別対応中" color="orange" onClick={() => { setStatusFilter('questioning'); resetPage(); }} />
        <SummaryCard label="受付完了" count={counts.c.completed} sublabel="本日チェックイン:" color="green" onClick={() => { setStatusFilter('completed'); resetPage(); }} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {((['all','pending','responded','questioning','email_sent','completed'] as const) as Array<ReservationRow['status'] | 'all'>).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); resetPage(); }}
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
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          placeholder="予約ID・氏名・メール・OTAで検索"
          className="flex-1 border rounded px-3 py-2"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">チェックイン</span>
          <input type="date" value={checkinFilter} onChange={(e)=>{ setCheckinFilter(e.target.value); resetPage(); }} className="border rounded px-2 py-2" />
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">表示件数:</span>
          {[10, 20, 50, 0].map((n) => (
            <button
              key={n}
              onClick={() => { setPerPage(n); setCurrentPage(1); }}
              className={`px-3 py-1 rounded border ${perPage === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {n === 0 ? '全件' : n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">
            {filtered.length}件中 {perPage === 0 ? filtered.length : Math.min((currentPage - 1) * perPage + 1, filtered.length)}-{perPage === 0 ? filtered.length : Math.min(currentPage * perPage, filtered.length)}件を表示
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <ThSortable field="bookingId" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                予約番号
              </ThSortable>
              <Th>氏名</Th>
              <Th>Email</Th>
              <ThSortable field="checkinDate" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                チェックイン日
              </ThSortable>
              <Th>宿泊日数</Th>
              <Th>OTA</Th>
              <Th>夕食</Th>
              <ThSortable field="status" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                ステータス
              </ThSortable>
              <Th>メール送信</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">該当データがありません</td>
              </tr>
            )}
            {paginatedData.map((r: ReservationRow) => (
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
                <Td className="text-gray-800">
                  {r.dinnerIncluded === 'Yes' ? 'あり' : r.dinnerIncluded === 'No' ? 'なし' : '不明'}
                </Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <StatusBadge 
                    status={r.status} 
                    onChange={(newStatus) => handleStatusChange(r.bookingId, newStatus)}
                    disabled={updating === r.bookingId}
                  />
                </Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-1">
                    {r.status === 'pending' ? (
                      <button 
                        onClick={() => setEmailPreview({ reservation: r, language: 'ja', type: 'initial' })}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                      >
                        回答依頼
                      </button>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded whitespace-nowrap">
                        送信済み
                      </span>
                    )}
                    {(r.status === 'responded' || r.status === 'questioning') && (
                      <button 
                        onClick={() => setEmailPreview({ reservation: r, language: 'ja', type: 'reception' })}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                      >
                        受付完了
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Page navigation */}
      {perPage > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            前へ
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>

    {/* Email Preview Modal */}
    {emailPreview && (() => {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const formUrl = `${baseUrl}/form?bookingId=${emailPreview.reservation.bookingId}`;
      
      const defaultSubject = emailPreview.type === 'initial'
        ? (emailPreview.language === 'ja'
          ? `【夢殿】ご予約確認とご質問 - ${emailPreview.reservation.checkinDate}ご宿泊`
          : `【Yumedono】Reservation Confirmation & Questions - Check-in ${emailPreview.reservation.checkinDate}`)
        : (emailPreview.language === 'ja'
          ? `【夢殿】ご予約受付完了 - ${emailPreview.reservation.checkinDate}ご宿泊`
          : `【Yumedono】Reception Completed - Check-in ${emailPreview.reservation.checkinDate}`);
      
      const defaultBody = emailPreview.type === 'initial'
        ? (emailPreview.language === 'ja'
        ? `${emailPreview.reservation.guestName} 様

いつもありがとうございます。
${emailPreview.reservation.checkinDate}より${emailPreview.reservation.nights}泊のご予約をいただき、誠にありがとうございます。

ご宿泊に際しまして、いくつかご質問がございます。
お決まりになりましたら、下記のフォームよりご回答をお願いいたします。

【ご回答フォーム】
${formUrl}

上記フォームよりご回答をお待ちしております。
ご不明な点がございましたら、お気軽にお問い合わせください。

夢殿
予約ID: ${emailPreview.reservation.bookingId}`
        : `Dear Mr./Ms. ${emailPreview.reservation.guestName}

Hello,
Thank you for your reservation on ${emailPreview.reservation.checkinDate} for ${emailPreview.reservation.nights} night stay.

We have some questions for you.
Please inform us your details after you decided.

【Response Form】
${formUrl}

Please submit your response through the form above.
If you have any questions, please feel free to contact us.

Best regards,
Yumedono
Booking ID: ${emailPreview.reservation.bookingId}`)
        : (emailPreview.language === 'ja'
          ? `${emailPreview.reservation.guestName} 様

いつもありがとうございます。

${emailPreview.reservation.checkinDate}より${emailPreview.reservation.nights}泊のご予約につきまして、ご回答をいただき誠にありがとうございました。
受付が完了いたしましたことをご報告申し上げます。

当日は心よりお待ちしております。
ご不明な点がございましたら、お気軽にお問い合わせください。

夢殿
予約ID: ${emailPreview.reservation.bookingId}`
          : `Dear Mr./Ms. ${emailPreview.reservation.guestName}

Hello,

Thank you for your response regarding your reservation on ${emailPreview.reservation.checkinDate} for ${emailPreview.reservation.nights} night stay.
We are pleased to inform you that your reception is now complete.

We look forward to welcoming you on the day.
If you have any questions, please feel free to contact us.

Best regards,
Yumedono
Booking ID: ${emailPreview.reservation.bookingId}`);

      const currentSubject = emailPreview.editableSubject ?? defaultSubject;
      const currentBody = emailPreview.editableBody ?? defaultBody;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setEmailPreview(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-semibold">メールプレビュー</h2>
                <button onClick={() => setEmailPreview(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-sm mb-1">言語選択</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmailPreview({ reservation: emailPreview.reservation, type: emailPreview.type, language: 'ja', editableSubject: undefined, editableBody: undefined })}
                      className={`px-4 py-2 rounded ${emailPreview.language === 'ja' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      日本語
                    </button>
                    <button
                      onClick={() => setEmailPreview({ reservation: emailPreview.reservation, type: emailPreview.type, language: 'en', editableSubject: undefined, editableBody: undefined })}
                      className={`px-4 py-2 rounded ${emailPreview.language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-sm mb-1">宛先</label>
                  <div className="text-gray-800">{emailPreview.reservation.email || '（メールアドレス未登録）'}</div>
                </div>

                <div>
                  <label className="block font-semibold text-sm mb-1">件名</label>
                  <input
                    type="text"
                    value={currentSubject}
                    onChange={(e) => setEmailPreview({ ...emailPreview, editableSubject: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-sm mb-1">本文</label>
                  <textarea
                    value={currentBody}
                    onChange={(e) => setEmailPreview({ ...emailPreview, editableBody: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-gray-800 font-sans text-sm"
                    rows={15}
                  />
                </div>
              </div>

              <div className="border-t pt-4 flex gap-3">
                <button onClick={() => setEmailPreview(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                  キャンセル
                </button>
                <button
                  onClick={() => emailPreview.reservation.email && handleSendEmail(emailPreview.reservation.email, currentSubject, currentBody, emailPreview.reservation.bookingId)}
                  disabled={!emailPreview.reservation.email || sendingEmail}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? '送信中...' : 'メール送信'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })()}

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

function SummaryCard({ label, count, sublabel, color = 'gray', onClick }: { label: string; count: number; sublabel?: string; color?: 'red' | 'green' | 'orange' | 'blue' | 'gray'; onClick?: () => void }) {
  const palette: Record<string, { bg: string; border: string; text: string }> = {
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
  };
  const c = palette[color] ?? palette.gray;
  return (
    <div 
      className={`rounded border ${c.bg} ${c.border} p-4 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className={`text-sm ${c.text}`}>{label}</div>
      <div className="text-3xl font-semibold mt-1">{count}</div>
      {sublabel ? <div className="text-xs text-gray-500 mt-1">{sublabel}</div> : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">{children}</th>;
}

function ThSortable({ 
  children, 
  field, 
  currentField, 
  direction, 
  onSort 
}: { 
  children: React.ReactNode; 
  field: SortField; 
  currentField: SortField; 
  direction: SortDirection; 
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <th className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-gray-900"
      >
        {children}
        {isActive && (
          <span className="text-xs">{direction === 'asc' ? '↑' : '↓'}</span>
        )}
        {!isActive && (
          <span className="text-xs text-gray-400">⇅</span>
        )}
      </button>
    </th>
  );
}

function Td({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return <td className={`px-3 py-2 whitespace-nowrap ${className}`} onClick={onClick}>{children}</td>;
}


