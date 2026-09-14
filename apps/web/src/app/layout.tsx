import type { Metadata } from 'next';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import '../styles/base/globals.css';
import '../styles/brand/vmv.css';
import '../styles/brand/logo.css';
import '../styles/brand/watermark.css';
import '../styles/marketing/journey.css';
import '../styles/marketing/roles.css';
import '../styles/marketing/pricing.css';
import '../styles/marketing/team.css';
import '../styles/marketing/team-five.css';
import '../styles/marketing/public-pages.css';
import '../styles/portal/portal.css';

export const metadata: Metadata = {
  title: 'Shield X by VMV Nexus | Connected Worksite Safety',
  description: 'A connected industrial PPE and workforce safety platform developed by VMV Nexus Safety Solutions.',
};

function ShieldMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 36"><path d="M16 2.5 28 7v9.2c0 8.1-4.8 14.1-12 17.3C8.8 30.3 4 24.3 4 16.2V7l12-4.5Z"/></svg></span>;
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user=await currentUser();
  return <html lang="en"><body>
    <header className="nav">
      <Link className="product-brand" href="/" aria-label="Shield X home"><ShieldMark/><span><strong>SHIELD X</strong><small>by VMV NEXUS SAFETY SOLUTIONS</small></span></Link>
      <nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#products">Products</Link><Link href="/#process">How it works</Link><Link href="/#about">About</Link><Link href="/pricing">Pricing</Link><Link href="/contact">Contact</Link>{user?.role==='ADMIN'?<Link className="nav-profile" href="/admin/profile" aria-label={`${user.name} admin profile`}><span className="nav-profile-avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span><span className="nav-profile-copy"><strong>{user.name}</strong><small>Admin profile</small></span></Link>:<><Link href="/login">Sign in</Link><Link className="button small" href="/register">Get started</Link></>}</nav>
    </header>
    {children}
    <footer className="site-footer"><div><div className="product-brand footer-brand"><ShieldMark/><span><strong>SHIELD X</strong><small>by VMV NEXUS SAFETY SOLUTIONS</small></span></div><p>Connected protection for every person on site.</p><div className="footer-links"><Link href="/#about">About</Link><Link href="/pricing">Pricing</Link><Link href="/contact">Contact</Link></div></div><div className="footer-company"><strong>Developed by VMV Nexus Safety Solutions</strong><small>Industrial safety technology built for accountable worksites.</small><a href="mailto:vmvnexussafetysolution@gmail.com">Contact: vmvnexussafetysolution@gmail.com</a></div><small>© 2026 VMV Nexus Safety Solutions. All rights reserved.</small></footer>
  </body></html>;
}
