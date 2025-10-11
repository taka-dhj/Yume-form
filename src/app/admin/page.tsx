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
          <div className="page-container">
            <div className="page-content">
              <div className="flex items-center justify-between mb-8">
                <div className="form-card">
                  <div className="form-card-header">
                    <h1 className="text-2xl font-bold text-white text-center">
                      Yumedono 受付管理システム
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshButton />
                  <Link href="/" className="form-button-secondary">ホームに戻る</Link>
                </div>
              </div>
              <AdminDashboard reservations={reservations} />
            </div>
          </div>
        );
}


