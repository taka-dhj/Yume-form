import { headers } from 'next/headers';
import GuestForm from '@/components/form/GuestForm';

export const dynamic = 'force-dynamic';

type ReservationData = {
  bookingId: string;
  guestName: string;
  email: string;
  checkinDate: string;
  nights: number;
  otaName: string;
  dinnerIncluded: 'Yes' | 'No' | 'Unknown';
};

async function fetchReservation(baseUrl: string, bookingId: string): Promise<ReservationData | null> {
  try {
    const url = `${baseUrl}/.netlify/functions/reservations`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const reservation = json.reservations?.find((r: ReservationData) => r.bookingId === bookingId);
    return reservation || null;
  } catch {
    return null;
  }
}

export default async function FormPage({ searchParams }: { searchParams: { bookingId?: string } }) {
  const h = await headers();
  const host = h.get('host') ?? '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseEnv = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '';
  const baseUrl = baseEnv || (host ? `${protocol}://${host}` : '');

  const bookingId = searchParams.bookingId || '';

  if (!bookingId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">予約IDが必要です</h1>
          <p className="text-gray-600">URLに予約ID（?bookingId=xxx）を指定してください。</p>
        </div>
      </main>
    );
  }

  const reservation = baseUrl ? await fetchReservation(baseUrl, bookingId) : null;

  if (!reservation) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">予約が見つかりません</h1>
          <p className="text-gray-600">予約ID「{bookingId}」は存在しません。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <GuestForm reservation={reservation} />
      </div>
    </main>
  );
}

