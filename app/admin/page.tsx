import { redirect } from 'next/navigation';
import { adminRole } from '../../lib/server/auth';
import AdminClient from './AdminClient';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const role = await adminRole();
  if (!role) redirect('/admin/login');
  return <AdminClient canDelete={role === 'superadmin'} />;
}
