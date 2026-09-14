import Link from 'next/link';
import { LogoutButton } from './logout-button';

type Item={label:string;href:string};
export function PortalShell({role,name,items,children}:{role:string;name:string;items:Item[];children:React.ReactNode}){return <main className="portal"><aside className="portal-sidebar"><Link href="/" className="portal-brand">SHIELD X<small>{role} PORTAL</small></Link><nav>{items.map(item=><Link href={item.href} key={item.href}>{item.label}</Link>)}</nav><div className="portal-user"><span>Signed in as</span>{role==='ADMIN'?<Link className="portal-user-profile" href="/admin/profile"><i aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</i><strong>{name}</strong></Link>:<strong>{name}</strong>}<LogoutButton/></div></aside><section className="portal-main">{children}</section></main>}
