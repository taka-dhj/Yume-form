'use client';

import { useState } from 'react';

type Status = 'pending' | 'email_sent' | 'responded' | 'questioning' | 'completed';

const colorByStatus: Record<Status, string> = {
  pending: 'bg-red-100 text-red-800 border border-red-300',
  email_sent: 'bg-gray-100 text-gray-800 border border-gray-300',
  responded: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  questioning: 'bg-orange-100 text-orange-800 border border-orange-300',
  completed: 'bg-green-100 text-green-800 border border-green-300',
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
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-2 py-1 rounded text-xs font-medium ${colorByStatus[status]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
      >
        {statusLabel[status]} ▼
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-20 min-w-[140px]">
            {(['pending', 'email_sent', 'responded', 'questioning', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(s);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${s === status ? 'font-semibold bg-gray-50' : ''}`}
              >
                <span className={`px-2 py-0.5 rounded ${colorByStatus[s]}`}>{statusLabel[s]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


