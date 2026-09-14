import { cookies } from 'next/headers';
import { getAdminAuth } from './firebase-admin';
import { prisma } from './prisma';
import { evaluateOrganizationAccess } from './organization-access';

export async function currentUser() {
  const token = cookies().get('__session')?.value;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    return prisma.user.findUnique({ where: { firebaseUid: decoded.uid }, include: { organization: true } });
  } catch { return null; }
}

export async function requireRole(...roles: Array<'ADMIN'|'SUPERVISOR'|'WORKER'>) {
  const user = await currentUser();
  if (!user || user.status !== 'ACTIVE' || !roles.includes(user.role)) throw new Error('UNAUTHORIZED');
  const access=await evaluateOrganizationAccess(user.organizationId);
  if (!access.active || !access.subscription?.license) throw new Error('LICENSE_INACTIVE');
  const subscription=access.subscription;
  return { user, subscription };
}
