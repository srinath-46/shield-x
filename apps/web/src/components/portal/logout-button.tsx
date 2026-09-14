'use client';
import { useState } from 'react';
export function LogoutButton(){const [busy,setBusy]=useState(false);return <button className="portal-logout" disabled={busy} onClick={async()=>{setBusy(true);await fetch('/api/auth/session',{method:'DELETE'});location.assign('/login')}}>{busy?'Signing out…':'Logout'}</button>}
