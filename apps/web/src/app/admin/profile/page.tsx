import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { evaluateOrganizationAccess } from '@/lib/organization-access';
import { PortalShell } from '@/components/portal/portal-shell';
import { adminNavigation } from '@/lib/portal-navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin profile | Shield X' };

export default async function AdminProfile() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const access = await evaluateOrganizationAccess(user.organizationId);
  const initial = user.name.trim().charAt(0).toUpperCase();

  return <PortalShell role="ADMIN" name={user.name} items={adminNavigation}>
    <header className="portal-header profile-page-header">
      <div><span className="portal-kicker">ADMIN ACCOUNT</span><h1>Profile</h1><p>Your verified identity, organization membership and licensed access in Shield X.</p></div>
      <Link className="button" href="/admin">Go to dashboard →</Link>
    </header>

    <section className="admin-profile-hero">
      <div className="admin-profile-avatar" aria-hidden="true">{initial}</div>
      <div className="admin-profile-identity"><span>ORGANIZATION ADMINISTRATOR</span><h2>{user.name}</h2><p>{user.email}</p></div>
      <div className="admin-profile-status"><span className={`status-pill ${user.status==='ACTIVE'?'active':'inactive'}`}>{user.status}</span><small>{access.active?'Licensed access active':'Subscription action required'}</small></div>
    </section>

    <div className="admin-profile-grid">
      <section className="portal-panel admin-profile-details"><div className="panel-heading"><div><span className="portal-kicker">PERSONAL DETAILS</span><h2>Administrator information</h2></div></div><dl><div><dt>Full name</dt><dd>{user.name}</dd></div><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Phone number</dt><dd>{user.phone}</dd></div><div><dt>Access role</dt><dd>Administrator</dd></div><div><dt>Account created</dt><dd>{user.createdAt.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</dd></div><div><dt>Account status</dt><dd>{user.status}</dd></div></dl></section>

      <section className="portal-panel admin-profile-details"><div className="panel-heading"><div><span className="portal-kicker">ORGANIZATION</span><h2>Licensed company</h2></div><Link className="table-action profile-edit-link" href="/admin/settings">Edit company</Link></div><dl><div><dt>Organization</dt><dd>{user.organization.name}</dd></div><div><dt>Legal company</dt><dd>{user.organization.companyName}</dd></div><div><dt>Industry</dt><dd>{user.organization.industry}</dd></div><div><dt>Primary site</dt><dd>{user.organization.primarySite}</dd></div><div><dt>Country</dt><dd>{user.organization.country}</dd></div><div><dt>License access</dt><dd>{access.active?'Active':'Renewal required'}</dd></div></dl></section>
    </div>
  </PortalShell>;
}
