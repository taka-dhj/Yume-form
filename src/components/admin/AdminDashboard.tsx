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
  emailHistory: string;
};

const rowBg: Record<ReservationRow['status'], string> = {
  pending: '',
  email_sent: '',
  responded: '',
  questioning: '',
  completed: '',
};

const statusLabels: Record<ReservationRow['status'], string> = {
  pending: '未送信',
  email_sent: '回答待ち',
  responded: '回答済み',
  questioning: '質問中',
  completed: '受付完了',
};

function isSameDateIso(iso: string, target: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && d.getDate() === target.getDate();
}

function truncateEmail(email: string, maxLength: number = 25): string {
  if (!email || email.length <= maxLength) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const availableLength = maxLength - domain.length - 4; // -4 for "...@"
  if (availableLength < 3) return `...@${domain}`;
  
  const keepStart = Math.ceil(availableLength / 2);
  const keepEnd = Math.floor(availableLength / 2);
  
  return `${local.slice(0, keepStart)}...${local.slice(-keepEnd)}@${domain}`;
}

function extractResponseSummary(notes: string): string | null {
  try {
    const formData = JSON.parse(notes);
    if (!formData.submittedAt) return null;
    
    const parts: string[] = [];
    
    // 言語
    if (formData.language) {
      parts.push(`言語：${formData.language === 'ja' ? '日本語' : 'English'}`);
    }
    
    // 日本到着日
    if (formData.arrivalCountryDate) {
      parts.push(`日本到着日：${formData.arrivalCountryDate}`);
    }
    
    // 前泊場所
    if (formData.prevNightPlace) {
      parts.push(`前泊場所：${formData.prevNightPlace}`);
    }
    
    // 夕食
    if (formData.dinnerRequest) {
      parts.push(`夕食：${formData.dinnerRequest === 'yes' ? 'はい' : 'いいえ'}`);
    }
    
    // 到着時刻
    if (formData.arrivalTime) {
      parts.push(`到着時刻：${formData.arrivalTime}`);
    }
    
    // その他（冒頭のみ）
    if (formData.otherNotes && formData.otherNotes.trim()) {
      const truncated = formData.otherNotes.length > 30 
        ? formData.otherNotes.substring(0, 30) + '...' 
        : formData.otherNotes;
      parts.push(`その他：${truncated}`);
    }
    
    return parts.join('  ');
  } catch {
    return null;
  }
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
  const [viewingEmailHistory, setViewingEmailHistory] = useState<ReservationRow | null>(null);
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [perPage, setPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [dismissedRevisions, setDismissedRevisions] = useState<Set<string>>(new Set());

  // Email Preview Modal content
  const emailPreviewModal = useMemo(() => {
    if (!emailPreview) return null;
    
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
                onClick={() => emailPreview.reservation.email && handleSendEmail(emailPreview.reservation.email, currentSubject, currentBody, emailPreview.reservation.bookingId, emailPreview.type)}
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
  }, [emailPreview, sendingEmail]);

  // Email History Modal content
  const emailHistoryModal = useMemo(() => {
    if (!viewingEmailHistory) return null;
    
    type EmailHistoryItem = {
      type: 'initial' | 'reception';
      to: string;
      subject: string;
      body: string;
      sentAt: string;
    };
    
    let history: EmailHistoryItem[] = [];
    try {
      history = viewingEmailHistory.emailHistory ? JSON.parse(viewingEmailHistory.emailHistory) : [];
    } catch {
      history = [];
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setViewingEmailHistory(null)}>
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-semibold">メール送信履歴</h2>
              <button onClick={() => setViewingEmailHistory(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-gray-500 text-center py-8">送信履歴がありません</div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'initial' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {item.type === 'initial' ? '初回メール' : '受付完了メール'}
                        </span>
                        <span className="text-sm text-gray-500">{new Date(item.sentAt).toLocaleString('ja-JP')}</span>
                      </div>
                      <div className="space-y-2">
                        <div><strong>宛先:</strong> {item.to}</div>
                        <div><strong>件名:</strong> {item.subject}</div>
                        <div className="mt-2">
                          <strong>本文:</strong>
                          <pre className="mt-1 whitespace-pre-wrap text-xs bg-white p-2 rounded border">{item.body}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <button onClick={() => setViewingEmailHistory(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [viewingEmailHistory]);

  const today = useMemo(() => new Date(), []);

  // Detect revisions
  const revisedReservations = useMemo(() => {
    return reservations.filter(r => {
      if (dismissedRevisions.has(r.bookingId)) return false;
      try {
        const formData = JSON.parse(r.notes);
        return formData.isRevision && formData.revisedAt;
      } catch {
        return false;
      }
    });
  }, [reservations, dismissedRevisions]);

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
        setUpdating(null);
      } else {
        // Wait a moment for spreadsheet to update, then refresh
        await new Promise(resolve => setTimeout(resolve, 500));
        router.refresh();
        // Keep updating state until refresh completes
        setTimeout(() => setUpdating(null), 1000);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setUpdating(null);
    }
  };

  const handleSendEmail = async (to: string, subject: string, bodyText: string, bookingId: string, emailType: 'initial' | 'reception') => {
    setSendingEmail(true);
    try {
      const res = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, bodyText, bookingId, emailType }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to send email: ${err.error || 'Unknown error'}`);
      } else {
        // Refresh to show updated status and email history
        router.refresh();
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
      // Urgent filter
      if (showUrgentOnly) {
        const isPending = r.status === 'pending';
        const isReminderDue = r.status === 'email_sent' && (() => {
          const checkin = new Date(r.checkinDate);
          checkin.setHours(0, 0, 0, 0);
          const todayCopy = new Date(today);
          todayCopy.setHours(0, 0, 0, 0);
          const daysUntil = Math.ceil((checkin.getTime() - todayCopy.getTime()) / (1000 * 60 * 60 * 24));
          return [30, 21, 14, 7].includes(daysUntil);
        })();
        const isTodayNotCompleted = isSameDateIso(r.checkinDate, today) && r.status !== 'completed';
        
        if (!isPending && !isReminderDue && !isTodayNotCompleted) return false;
      }
      
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
  }, [reservations, statusFilter, search, checkinFilter, sortField, sortDirection, showUrgentOnly, today]);

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
    <div className="space-y-6">
      {/* Header / Alerts */}
      <div className="form-card mx-8">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-stretch gap-4">
          <button
            onClick={() => {
              setShowUrgentOnly(!showUrgentOnly);
              setStatusFilter('all');
              setSearch('');
              setCheckinFilter('');
              resetPage();
            }}
            className={`px-4 rounded text-sm whitespace-nowrap self-stretch ${showUrgentOnly ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
          >
            {showUrgentOnly ? '全件表示' : '要対応のみ表示'}
          </button>
          <div className="flex-1">
            <div className="font-semibold text-rose-800 mb-1">要対応</div>
            <div className="text-sm text-rose-700 flex flex-wrap gap-x-6 gap-y-1">
              <button 
                onClick={() => { setStatusFilter('pending'); resetPage(); }}
                className="hover:underline cursor-pointer"
              >
                未送信: {counts.urgentUnsent}件
              </button>
              <button 
                onClick={() => { 
                  setStatusFilter('email_sent'); 
                  // TODO: リマインダー期限でフィルター
                  resetPage(); 
                }}
                className="hover:underline cursor-pointer"
              >
                催促期限: {counts.reminderDue}件
              </button>
              <button 
                onClick={() => { 
                  setStatusFilter('all');
                  setCheckinFilter(new Date().toISOString().split('T')[0]);
                  resetPage(); 
                }}
                className="hover:underline cursor-pointer"
              >
                本日チェックイン未完了: {counts.todayNotCompleted}件
              </button>
              {revisedReservations.length > 0 && (
                <button 
                  onClick={() => { 
                    // Show the first revised reservation
                    if (revisedReservations[0]) {
                      setViewingResponse(revisedReservations[0]);
                    }
                  }}
                  className="hover:underline cursor-pointer font-bold text-red-700 animate-pulse"
                >
                  🔔 修正内容確認: {revisedReservations.length}件
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revision Alert */}
      {revisedReservations.length > 0 && (
        <div className="form-card mx-8 bg-orange-50 border-orange-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-2">📝 回答修正がありました</h3>
              <div className="text-sm text-orange-800">
                {revisedReservations.map(r => {
                  try {
                    const formData = JSON.parse(r.notes);
                    const revisedAt = formData.revisedAt ? new Date(formData.revisedAt).toLocaleString('ja-JP') : '';
                    return (
                      <div key={r.bookingId} className="mb-2">
                        <button
                          onClick={() => setViewingResponse(r)}
                          className="hover:underline font-semibold"
                        >
                          {r.bookingId} ({r.guestName})
                        </button>
                        {' '}が {revisedAt} に回答を修正しました
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })}
              </div>
            </div>
            <button
              onClick={() => {
                const newDismissed = new Set(dismissedRevisions);
                revisedReservations.forEach(r => newDismissed.add(r.bookingId));
                setDismissedRevisions(newDismissed);
              }}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 whitespace-nowrap"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mx-8">
        <SummaryCard label="未送信" count={counts.c.pending} sublabel="要メール送信" color="red" onClick={() => { setStatusFilter('pending'); resetPage(); }} />
        <SummaryCard label="回答待ち" count={counts.c.email_sent} sublabel={`催促対象: ${counts.reminderDue}件`} color="blue" onClick={() => { setStatusFilter('email_sent'); resetPage(); }} />
        <SummaryCard label="質問中" count={counts.c.questioning} sublabel="個別対応中" color="orange" onClick={() => { setStatusFilter('questioning'); resetPage(); }} />
        <SummaryCard label="受付完了" count={counts.c.completed} sublabel="本日チェックイン:" color="green" onClick={() => { setStatusFilter('completed'); resetPage(); }} />
      </div>

      {/* Filters and Pagination */}
      <div className="form-card mx-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {((['all','pending','responded','questioning','email_sent','completed'] as const) as Array<ReservationRow['status'] | 'all'>).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); resetPage(); }}
                className={`px-3 py-1.5 rounded border text-sm transition-colors ${statusFilter===s? 'bg-purple-600 text-white border-purple-600':'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {s === 'all' ? 'すべて' : statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">表示件数:</span>
            {[10, 20, 50, 0].map((n) => (
              <button
                key={n}
                onClick={() => { setPerPage(n); setCurrentPage(1); }}
                className={`px-3 py-1 rounded border text-sm transition-colors ${perPage === n ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {n === 0 ? '全件' : n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and date */}
      <div className="form-card mx-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="予約ID・氏名・メール・OTAで検索"
            className="form-input flex-1"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">チェックイン</span>
            <input type="date" value={checkinFilter} onChange={(e)=>{ setCheckinFilter(e.target.value); resetPage(); }} className="form-input" />
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="form-card mx-8">
        <div className="text-sm text-gray-600 text-center">
          {filtered.length}件中 {perPage === 0 ? filtered.length : Math.min((currentPage - 1) * perPage + 1, filtered.length)}-{perPage === 0 ? filtered.length : Math.min(currentPage * perPage, filtered.length)}件を表示
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="form-card p-0 overflow-hidden mx-8">
        <div className="hidden md:block table-scroll-container">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-gray-50 sticky top-0">
            <tr>
              <ThSortable field="bookingId" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                予約番号
              </ThSortable>
              <ThSortable field="status" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                ステータス
              </ThSortable>
              <Th>回答</Th>
              <Th>氏名</Th>
              <Th>Email</Th>
              <ThSortable field="checkinDate" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                チェックイン日
              </ThSortable>
              <Th>宿泊日数</Th>
              <Th>OTA</Th>
              <Th>夕食</Th>
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
              <>
              <tr key={r.bookingId} className={`border-t ${rowBg[r.status]} text-gray-800 ${r.status === 'responded' ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => {
                if (r.status === 'responded' || r.status === 'questioning' || r.status === 'completed') {
                  setViewingResponse(r);
                }
              }}>
                <Td className="font-mono text-gray-800 w-32 font-semibold">{r.bookingId}</Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <StatusBadge 
                    status={r.status} 
                    onChange={(newStatus) => handleStatusChange(r.bookingId, newStatus)}
                    disabled={updating === r.bookingId}
                  />
                </Td>
                <Td className="w-20 text-center" onClick={(e) => e.stopPropagation()}>
                  {(r.status === 'responded' || r.status === 'questioning' || r.status === 'completed') && r.notes && (() => {
                    try {
                      const formData = JSON.parse(r.notes);
                      if (formData.submittedAt) {
                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <button 
                              className="text-green-600 hover:text-green-700 text-lg leading-none" 
                              title="フォーム回答を確認"
                              onClick={(e) => { e.stopPropagation(); setViewingResponse(r); }}
                            >
                              📋
                            </button>
                            {formData.isRevision && (
                              <span className="text-orange-600 text-[9px] font-bold" title={`修正日時: ${formData.revisedAt ? new Date(formData.revisedAt).toLocaleString('ja-JP') : ''}`}>
                                修正
                              </span>
                            )}
                            {formData.otherNotes && formData.otherNotes.trim() && (
                              <span className="text-red-600 text-[9px] font-bold" title="その他要望あり - 要確認">
                                要確認
                              </span>
                            )}
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                </Td>
                <Td className="text-gray-800 w-36">{r.guestName}</Td>
                <Td className="text-gray-800 w-48" title={r.email}>
                  {truncateEmail(r.email)}
                </Td>
                <Td className="text-gray-800 w-32">{r.checkinDate}</Td>
                <Td className="text-gray-800 w-20 text-center">{r.nights}</Td>
                <Td className="text-gray-800 w-32">{r.otaName}</Td>
                <Td className="text-gray-800 w-20 text-center">
                  {r.dinnerIncluded === 'Yes' ? 'あり' : r.dinnerIncluded === 'No' ? 'なし' : '不明'}
                </Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    {r.status === 'pending' ? (
                      <button 
                        onClick={() => setEmailPreview({ reservation: r, language: 'ja', type: 'initial' })}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                      >
                        回答依頼
                      </button>
                    ) : (
                      <button
                        onClick={() => setViewingEmailHistory(r)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded whitespace-nowrap text-center hover:bg-green-200"
                      >
                        送信済み
                      </button>
                    )}
                    {r.status === 'completed' ? (
                      <button
                        onClick={() => setViewingEmailHistory(r)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded whitespace-nowrap text-center hover:bg-green-200"
                      >
                        送信済み
                      </button>
                    ) : (r.status === 'email_sent' || r.status === 'responded' || r.status === 'questioning') && (
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
              {extractResponseSummary(r.notes) && (
                <tr key={`${r.bookingId}-summary`} className="border-t-0">
                  <td colSpan={10} className="px-3 py-1 text-[10px] text-gray-600 bg-gray-50">
                    {extractResponseSummary(r.notes)}
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Card View - Mobile */}
      <div className="md:hidden space-y-3 mx-4">
        {paginatedData.length === 0 && (
          <div className="form-card text-center text-gray-500">該当データがありません</div>
        )}
        {paginatedData.map((r: ReservationRow) => (
          <div
            key={r.bookingId}
            className={`form-card space-y-3 ${rowBg[r.status]}`}
            onClick={() => {
              if (r.status === 'responded' || r.status === 'questioning' || r.status === 'completed') {
                setViewingResponse(r);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-mono text-sm font-semibold text-gray-800">{r.bookingId}</div>
                {extractResponseSummary(r.notes) && (
                  <div className="text-[10px] text-gray-600 mt-1 leading-tight">
                    {extractResponseSummary(r.notes)}
                  </div>
                )}
                <div className="text-gray-800 mt-1">{r.guestName}</div>
                <div className="text-xs text-gray-600 mt-1">{r.email}</div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <StatusBadge 
                  status={r.status} 
                  onChange={(newStatus) => handleStatusChange(r.bookingId, newStatus)}
                  disabled={updating === r.bookingId}
                />
                {(r.status === 'responded' || r.status === 'questioning' || r.status === 'completed') && r.notes && (() => {
                  try {
                    const formData = JSON.parse(r.notes);
                    if (formData.submittedAt) {
                      return (
                        <div className="flex flex-col items-center gap-1">
                          <span 
                            className="text-green-600 text-lg" 
                            title="フォーム回答あり"
                          >
                            📋
                          </span>
                          {formData.otherNotes && formData.otherNotes.trim() && (
                            <span className="text-red-600 text-[9px] font-bold" title="その他要望あり - 要確認">
                              要確認
                            </span>
                          )}
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div><span className="font-semibold">チェックイン:</span> {r.checkinDate}</div>
              <div><span className="font-semibold">宿泊日数:</span> {r.nights}泊</div>
              <div><span className="font-semibold">OTA:</span> {r.otaName}</div>
              <div><span className="font-semibold">夕食:</span> {r.dinnerIncluded === 'Yes' ? 'あり' : r.dinnerIncluded === 'No' ? 'なし' : '不明'}</div>
            </div>

            <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
              {r.status === 'pending' ? (
                <button 
                  onClick={() => setEmailPreview({ reservation: r, language: 'ja', type: 'initial' })}
                  className="flex-1 px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  回答依頼
                </button>
              ) : (
                <button
                  onClick={() => setViewingEmailHistory(r)}
                  className="flex-1 px-3 py-2 text-xs bg-green-100 text-green-800 border border-green-300 rounded text-center hover:bg-green-200"
                >
                  送信済み
                </button>
              )}
              {r.status === 'completed' ? (
                <button
                  onClick={() => setViewingEmailHistory(r)}
                  className="flex-1 px-3 py-2 text-xs bg-green-100 text-green-800 border border-green-300 rounded text-center hover:bg-green-200"
                >
                  送信済み
                </button>
              ) : (r.status === 'email_sent' || r.status === 'responded' || r.status === 'questioning') && (
                <button 
                  onClick={() => setEmailPreview({ reservation: r, language: 'ja', type: 'reception' })}
                  className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  受付完了
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Page navigation */}
      {perPage > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mx-8">
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
      
      {/* Email Preview Modal */}
      {emailPreviewModal}

      {/* Response Detail Modal */}
      {viewingResponse && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setViewingResponse(null)}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-semibold">フォーム回答詳細</h2>
              <button onClick={() => setViewingResponse(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            {(() => {
              try {
                const formData = JSON.parse(viewingResponse.notes);
                if (formData.isRevision) {
                  return (
                    <div className="bg-orange-100 border border-orange-300 rounded p-3 mb-4">
                      <div className="font-bold text-orange-900">📝 この回答は修正されました</div>
                      <div className="text-sm text-orange-800 mt-1">
                        修正日時: {formData.revisedAt ? new Date(formData.revisedAt).toLocaleString('ja-JP') : '不明'}
                      </div>
                      <button
                        onClick={() => {
                          const newDismissed = new Set(dismissedRevisions);
                          newDismissed.add(viewingResponse.bookingId);
                          setDismissedRevisions(newDismissed);
                          setViewingResponse(null);
                        }}
                        className="mt-2 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        確認済みにする
                      </button>
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}

            <div className="space-y-3">
              <ResponseDetail label="予約ID" value={viewingResponse.bookingId} />
              <ResponseDetail label="ゲスト名" value={viewingResponse.guestName} />
              <ResponseDetail label="チェックイン" value={viewingResponse.checkinDate} />

              {viewingResponse.notes && (() => {
                try {
                  const formData = JSON.parse(viewingResponse.notes);
                  return (
                    <>
                      {formData.submittedAt && <ResponseDetail label="初回回答日時" value={new Date(formData.submittedAt).toLocaleString('ja-JP')} />}
                      {formData.isRevision && formData.revisedAt && <ResponseDetail label="修正日時" value={new Date(formData.revisedAt).toLocaleString('ja-JP')} />}
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

    {/* Email History Modal */}
    {emailHistoryModal}
    </div>
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

function Td({ children, className = '', onClick, title }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void; title?: string }) {
  return <td className={`px-3 py-2 whitespace-nowrap ${className}`} onClick={onClick} title={title}>{children}</td>;
}


