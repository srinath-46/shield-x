import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateOrganizationAccess } from '@/lib/organization-access';
import { PortalShell } from '@/components/portal/portal-shell';
import { adminNavigation } from '@/lib/portal-navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/');

  const access = await evaluateOrganizationAccess(user.organizationId);
  const subscription = access.subscription;
  const desktopDownload = process.env.SUPERVISOR_DESKTOP_DOWNLOAD_URL;
  const mobileDownload = process.env.SHIELDX_MOBILE_DOWNLOAD_URL;
  const [supervisors, sites, pending] = await Promise.all([
    prisma.user.count({ where: { organizationId: user.organizationId, role: 'SUPERVISOR', status: 'ACTIVE' } }),
    prisma.site.count({ where: { organizationId: user.organizationId, active: true } }),
    prisma.invitation.count({ where: { organizationId: user.organizationId, role: 'SUPERVISOR', status: 'PENDING', expiresAt: { gt: new Date() } } }),
  ]);

  return <PortalShell role="ADMIN" name={user.name} items={adminNavigation}>
    <header className="portal-header"><div><span className="portal-kicker">ORGANIZATION OVERVIEW</span><h1>{user.organization.name}</h1><p>Subscription ownership, licensed access and Supervisor authorization in one controlled workspace.</p></div><span className={`status-pill ${access.active?'active':'inactive'}`}>{access.active?'ACTIVE':'RENEWAL REQUIRED'}</span></header>

    <div className="portal-stats"><article><span>Subscription</span><strong>{subscription?.plan.name??'No plan'}</strong><small>{subscription?.status??'NOT ACTIVE'}</small></article><article><span>Supervisors</span><strong>{supervisors} / {subscription?.plan.maxSupervisors??0}</strong><small>{pending} pending invitation{pending===1?'':'s'}</small></article><article><span>Sites</span><strong>{sites} / {subscription?.plan.maxSites??0}</strong><small>Active organization sites</small></article><article><span>License expiry</span><strong>{subscription?.license?.expiresAt.toLocaleDateString('en-IN')??'—'}</strong><small>{subscription?.license?.status??'NO LICENSE'}</small></article></div>

    {!access.active&&<div className="portal-alert critical"><strong>Organization access is inactive.</strong><span>Supervisors and Workers are blocked. Renew the subscription to restore access without recreating accounts.</span></div>}

    <section className="portal-panel"><div className="panel-heading"><div><span className="portal-kicker">QUICK ACTIONS</span><h2>Manage your Shield X organization</h2></div></div><div className="quick-actions"><Link href="/invite"><b>Add Supervisor</b><span>Send a secure site-linked invitation →</span></Link><Link href="/admin/supervisors"><b>Manage Supervisors</b><span>Review access and invitation status →</span></Link><Link href="/admin/sites"><b>Manage Sites</b><span>Create sites and operational zones →</span></Link><Link href="/admin/subscription"><b>View Subscription</b><span>Review plan, dates and renewal →</span></Link></div></section>

    <section id="software-downloads" className="portal-panel admin-downloads-section"><div className="panel-heading"><div><span className="portal-kicker">SOFTWARE DOWNLOADS</span><h2>Distribute authorized Shield X applications</h2><p>Download the installers here and provide them only to people authorized under your organization license.</p></div></div><div className="download-grid admin-download-grid"><article className="download-product-card"><span className="product-label">WINDOWS DESKTOP</span><h3>Supervisor Desktop</h3><p>For authorized Supervisors managing workers, attendance, PPE monitoring, live camera views and safety alerts.</p>{desktopDownload?<a className="button" href={desktopDownload}>Download Desktop →</a>:<span className="release-pending">Desktop release link awaiting configuration</span>}</article><article className="download-product-card"><span className="product-label">MOBILE APPLICATION</span><h3>Shield X Mobile</h3><p>For authorized Supervisors and Workers receiving role-aware safety status, attendance and notifications.</p>{mobileDownload?<a className="button" href={mobileDownload}>Download Mobile →</a>:<span className="release-pending">Mobile release link awaiting configuration</span>}</article></div></section>
  </PortalShell>;
}