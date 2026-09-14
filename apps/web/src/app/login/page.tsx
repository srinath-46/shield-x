'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AuthMethod = 'email' | 'google' | null;
type GoogleProfile = { name: string; email: string; photo: string | null };

function messageFor(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('popup-closed-by-user')) return 'Google sign-in was cancelled.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the Google sign-in window. Allow popups and try again.';
  if (code.includes('account-exists-with-different-credential')) return 'This email already uses password sign-in. Sign in with your password first.';
  if (code.includes('invalid-credential')) return 'The email or password is incorrect.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
  return error instanceof Error ? error.message : 'Sign in failed. Please try again.';
}

async function createShieldSession(user: User) {
  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to create a Shield X session.');
  window.location.assign('/dashboard');
}

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9.1L6.5 14Z"/><path fill="#EA4335" d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.5l3.4 2.6A5.9 5.9 0 0 1 12 6Z"/></svg>;
}

export default function Login() {
  const [error, setError] = useState('');
  const [method, setMethod] = useState<AuthMethod>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<GoogleProfile | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMethod('email');
    setError('');
    setProfile(null);
    const data = new FormData(event.currentTarget);
    try {
      const credential = await signInWithEmailAndPassword(auth, String(data.get('email')), String(data.get('password')));
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        throw new Error('Verify your email before signing in. A new verification link has been sent.');
      }
      await createShieldSession(credential.user);
    } catch (error) {
      setError(messageFor(error));
      setMethod(null);
    }
  }

  async function signInWithGoogle() {
    setMethod('google');
    setError('');
    setProfile(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      setProfile({
        name: credential.user.displayName || 'Google user',
        email: credential.user.email || '',
        photo: credential.user.photoURL,
      });
      await createShieldSession(credential.user);
    } catch (error) {
      setError(messageFor(error));
      setMethod(null);
    }
  }

  const busy = method !== null;
  return <main className="auth-page">
    <section className="auth-story" aria-label="Shield X secure access">
      <Link className="auth-back" href="/"><span aria-hidden="true">←</span> Back to home</Link>
      <div className="auth-story-copy"><div className="eyebrow">Protected access</div><h1>One secure entry.<br/><span>Your authorized workspace.</span></h1><p>Shield X verifies your identity, organization status and assigned role before granting access.</p></div>
      <div className="auth-chain" aria-hidden="true"><span>IDENTITY</span><b>→</b><span>LICENSE</span><b>→</b><span>WORKSPACE</span></div>
    </section>

    <section className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-heading"><div className="eyebrow">Secure portal</div><h2>Welcome back.</h2><p>Sign in with your authorized Shield X account.</p></div>

        <button className="google-button" type="button" onClick={signInWithGoogle} disabled={busy}><GoogleIcon/><span>{method === 'google' ? 'Connecting to Google…' : 'Continue with Google'}</span></button>
        <div className="auth-divider"><span>or sign in with email</span></div>

        <div className="auth-fields">
          <div className="field"><label htmlFor="login-email">Email address</label><input id="login-email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" disabled={busy}/></div>
          <div className="field"><div className="password-label"><label htmlFor="login-password">Password</label><Link href="/forgot-password">Forgot password?</Link></div><div className="password-control"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required autoComplete="current-password" disabled={busy}/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
        </div>

        {profile && <div className="google-profile" aria-live="polite">{profile.photo ? <img src={profile.photo} alt="" referrerPolicy="no-referrer"/> : <span>{profile.name.charAt(0)}</span>}<div><strong>{profile.name}</strong><small>{profile.email}</small></div></div>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <button className="auth-submit" disabled={busy}>{method === 'email' ? 'Verifying account…' : 'Sign in securely'}<span aria-hidden="true">→</span></button>
        <p className="auth-help">New organization? <Link href="/pricing">View plans and get started</Link></p>
        <small className="auth-policy">Google sign-in only grants access to accounts already authorized by your Shield X organization.</small>
      </form>
    </section>
  </main>;
}