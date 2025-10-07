import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';

type ReservationRow = {
  bookingId: string;
  guestName: string;
  email: string;
  checkinDate: string;
  nights: number;
  otaName: string;
  dinnerIncluded: 'Yes' | 'No' | 'Unknown';
  initialEmailSent: boolean;
  emailSentAt?: string;
  status: 'pending' | 'email_sent' | 'responded' | 'questioning' | 'completed';
};

async function fetchReservations(): Promise<{ reservations: ReservationRow[] }> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const url = `${base}/.netlify/functions/reservations`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  if (!res.ok) return { reservations: [] };
  const json = await res.json();
  return { reservations: json.reservations ?? [] };
}

export default async function AdminPage() {
  const { reservations } = await fetchReservations();

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reservations</h1>
        <Link href="/" className="text-sm text-blue-600 underline">Home</Link>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Booking ID</th>
              <th className="px-3 py-2 text-left">Guest</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Check-in</th>
              <th className="px-3 py-2 text-left">Nights</th>
              <th className="px-3 py-2 text-left">OTA</th>
              <th className="px-3 py-2 text-left">Dinner</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">No reservations</td>
              </tr>
            )}
            {reservations.map((r) => (
              <tr key={r.bookingId} className="border-t">
                <td className="px-3 py-2 font-mono">{r.bookingId}</td>
                <td className="px-3 py-2">{r.guestName}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.checkinDate}</td>
                <td className="px-3 py-2">{r.nights}</td>
                <td className="px-3 py-2">{r.otaName}</td>
                <td className="px-3 py-2">{r.dinnerIncluded}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2">
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded">メール</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}


