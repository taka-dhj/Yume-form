import Link from 'next/link';
import AdminDashboard, { type ReservationRow } from '@/components/admin/AdminDashboard';


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
        <h1 className="text-xl font-semibold">Yumedono 受付管理システム</h1>
        <Link href="/" className="text-sm text-blue-600 underline">Home</Link>
      </div>
      <AdminDashboard reservations={reservations} />
    </main>
  );
}


