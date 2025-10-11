import Link from 'next/link';
import { headers } from 'next/headers';
import AdminDashboard, { type ReservationRow } from '@/components/admin/AdminDashboard';
import RefreshButton from '@/components/admin/RefreshButton';

export const dynamic = 'force-dynamic';


async function fetchReservations(baseUrl: string): Promise<{ reservations: ReservationRow[] }> {
  const url = `${baseUrl}/.netlify/functions/reservations`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { reservations: [] };
  const json = await res.json();
  return { reservations: json.reservations ?? [] };
}

export default async function AdminPage() {
  const h = await headers();
  const host = h.get('host') ?? '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseEnv = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '';
  const baseUrl = baseEnv || (host ? `${protocol}://${host}` : '');
  const { reservations } = baseUrl ? await fetchReservations(baseUrl) : { reservations: [] };
        return (
          <div className="min-h-screen bg-white">
            <div className="border-b bg-white sticky top-0 z-10 shadow-sm">
              <div className="max-w-full px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Yumedono 受付管理システム
                  </h1>
                  <div className="flex items-center gap-3">
                    <RefreshButton />
                    <Link href="/" className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">ホームに戻る</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <AdminDashboard reservations={reservations} />
            </div>
          </div>
        );
}


