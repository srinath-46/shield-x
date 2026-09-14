'use client';

export const dynamic = 'force-dynamic';

import Script from 'next/script';
import { FormEvent, useState } from 'react';

type RazorpayInstance = { open(): void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

function selectedPlan() {
  if (typeof window === 'undefined') return 'professional';
  return new URLSearchParams(window.location.search).get('plan') ?? 'professional';
}

export default function Register() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);

  function markCheckoutReady() {
    const ready = typeof window.Razorpay === 'function';
    setCheckoutReady(ready);
    if (!ready) setError('Razorpay checkout loaded incorrectly. Refresh the page and try again.');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const RazorpayCheckout = window.Razorpay;
    if (!checkoutReady || typeof RazorpayCheckout !== 'function') {
      setError('Secure checkout is still loading. Check your internet connection and try again.');
      return;
    }

    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const orderResponse = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId: data.planId }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || 'Could not create a payment order.');
      if (!order.keyId || !order.orderId || !order.amount) throw new Error('The payment order response is incomplete.');

      const checkout = new RazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Shield X',
        description: 'Annual organization license',
        order_id: order.orderId,
        prefill: { name: data.adminName, email: data.adminEmail, contact: data.adminPhone },
        theme: { color: '#183e33' },
        handler: async (payment: Record<string, string>) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ ...payment, ...data, orderId: order.orderId }),
            });
            const result = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(result.error || 'Payment verification failed.');
            window.location.assign('/login');
          } catch (verificationError) {
            setError(verificationError instanceof Error ? verificationError.message : 'Payment verification failed.');
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to begin payment.');
      setBusy(false);
    }
  }

  return <main className="form-shell">
    <Script
      id="razorpay-checkout"
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="afterInteractive"
      onLoad={markCheckoutReady}
      onReady={markCheckoutReady}
      onError={() => { setCheckoutReady(false); setError('Razorpay could not load. Disable blocking extensions or check your network, then refresh.'); }}
    />
    <form className="form-card" onSubmit={submit}>
      <div className="eyebrow">Organization onboarding</div><h1>Put safety in motion.</h1>
      <div className="form-grid">
        <div className="field"><label>Organization name</label><input name="orgName" required/></div>
        <div className="field"><label>Legal company name</label><input name="companyName" required/></div>
        <div className="field"><label>Industry</label><input name="industry" required/></div>
        <div className="field"><label>Country</label><input name="country" defaultValue="India" required/></div>
        <div className="field full"><label>Primary site</label><input name="primarySite" required/></div>
        <div className="field"><label>Admin full name</label><input name="adminName" required/></div>
        <div className="field"><label>Admin phone</label><input name="adminPhone" type="tel" required/></div>
        <div className="field"><label>Admin email</label><input name="adminEmail" type="email" required/></div>
        <div className="field"><label>Create password</label><input name="password" type="password" minLength={10} required/></div>
        <div className="field full"><label>Annual plan</label><select name="planId" defaultValue={selectedPlan()}><option value="basic">Foundation — ₹4,999</option><option value="professional">Operations — ₹12,999</option><option value="enterprise">Enterprise — ₹29,999</option></select></div>
      </div>
      <div className="notice">Your organization, subscription and signed license are created only after Razorpay verifies the payment signature.</div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button" disabled={busy || !checkoutReady}>{busy ? 'Opening secure checkout…' : checkoutReady ? 'Continue to UPI payment →' : 'Loading secure checkout…'}</button>
    </form>
  </main>;
}