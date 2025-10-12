'use client';

import { useState } from 'react';

type Status = 'pending' | 'email_sent' | 'responded' | 'questioning' | 'completed';

const colorByStatus: Record<Status, string> = {
  pending: 'status-pending',
  email_sent: 'status-email-sent',
  responded: 'status-responded',
  questioning: 'status-questioning',
  completed: 'status-completed',
};

const statusLabel: Record<Status, string> = {
  pending: '未送信',
  email_sent: '回答待ち',
  responded: '回答済み',
  questioning: '質問中',
  completed: '受付完了',
};

export function StatusBadge({ 
  status, 
  onChange, 
  disabled 
}: { 
  status: Status; 
  onChange?: (newStatus: Status) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmChange, setConfirmChange] = useState<Status | null>(null);

  if (!onChange) {
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${colorByStatus[status]}`}>
        {statusLabel[status]}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-2 py-1 rounded text-xs font-medium ${colorByStatus[status]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'} flex items-center gap-1`}
      >
        {disabled && <span className="animate-spin">⏳</span>}
        {statusLabel[status]} {!disabled && '▼'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-20 min-w-[140px]">
            {(['pending', 'email_sent', 'responded', 'questioning', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  // If changing from 'completed', show confirmation
                  if (status === 'completed' && s !== 'completed') {
                    setConfirmChange(s);
                    setIsOpen(false);
                  } else {
                    onChange(s);
                    setIsOpen(false);
                  }
                }}
                className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${s === status ? 'font-semibold bg-gray-50' : ''}`}
              >
                <span className={`px-2 py-0.5 rounded ${colorByStatus[s]}`}>{statusLabel[s]}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setConfirmChange(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-semibold text-orange-600">⚠️ ステータス変更の確認</h2>
                <button onClick={() => setConfirmChange(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <div className="text-gray-700">
                <p className="mb-2">
                  受付完了ステータスを変更しようとしています。
                </p>
                <p className="font-semibold">
                  <span className={`px-2 py-1 rounded ${colorByStatus['completed']}`}>{statusLabel['completed']}</span>
                  {' → '}
                  <span className={`px-2 py-1 rounded ${colorByStatus[confirmChange]}`}>{statusLabel[confirmChange]}</span>
                </p>
                <p className="mt-2 text-sm text-orange-700">
                  本当に変更してよろしいですか？
                </p>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button 
                  onClick={() => setConfirmChange(null)} 
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  キャンセル
                </button>
                <button 
                  onClick={() => {
                    onChange(confirmChange);
                    setConfirmChange(null);
                  }} 
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  変更する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


