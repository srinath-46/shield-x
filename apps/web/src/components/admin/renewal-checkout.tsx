'use client';

import Script from 'next/script';
import { useState } from 'react';

type RazorpayInstance = { open(): void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

export function RenewalCheckout({ planId, name, email, phone }: { planId: string; name: string; email: string; phone: string }) {
  const [state, setState] = useState('');
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [busy, setBusy] = useState(false);

  function markCheckoutReady() {
    const ready = typeof window.Razorpay === 'function';
    setCheckoutReady(ready);
    if (!ready) setState('Razorpay checkout loaded incorrectly. Refresh and try again.');
  }

  async function renew() {
    const RazorpayCheckout = window.Razorpay;
    if (!checkoutReady || typeof RazorpayCheckout !== 'function') {
      setState('Secure checkout is still loading. Check your connection and try again.');
      return;
    }

    setBusy(true);
    setState('Creating secure renewal…');
    try {
      const response = await fetch('/api/subscriptions/renew/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error || 'Could not create a renewal order.');
      if (!order.keyId || !order.orderId || !order.amount) throw new Error('The renewal order response is incomplete.');

      const checkout = new RazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Shield X',
        description: `${order.planName} subscription renewal`,
        order_id: order.orderId,
        prefill: { name, email, contact: phone },
        theme: { color: '#ff6710' },
        handler: async (payment: Record<string, string>) => {
          try {
            const verify = await fetch('/api/subscriptions/renew/verify', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ ...payment, orderId: order.orderId, planId }),
            });
            const result = await verify.json();
            if (!verify.ok) throw new Error(result.error || 'Renewal verification failed.');
            setState('Subscription renewed successfully. Reloading…');
            window.location.reload();
          } catch (verificationError) {
            setState(verificationError instanceof Error ? verificationError.message : 'Renewal verification failed.');
            setBusy(false);
          }
        },
        modal: { ondismiss: () => { setState('Renewal checkout closed.'); setBusy(false); } },
      });
      checkout.open();
    } catch (renewalError) {
      setState(renewalError instanceof Error ? renewalError.message : 'Could not begin renewal.');
      setBusy(false);
    }
  }

  return <>
    <Script id="razorpay-checkout" src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={markCheckoutReady} onReady={markCheckoutReady} onError={() => { setCheckoutReady(false); setState('Razorpay could not load. Check your network or browser extensions, then refresh.'); }}/>
    <button className="button" onClick={renew} disabled={busy || !checkoutReady}>{busy ? 'Opening checkout…' : checkoutReady ? 'Renew with UPI →' : 'Loading secure checkout…'}</button>
    {state && <div className="notice" role="status">{state}</div>}
  </>;
}