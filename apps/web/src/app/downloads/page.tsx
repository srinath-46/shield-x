import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DownloadsRedirect() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/admin#software-downloads');
  redirect('/');
}