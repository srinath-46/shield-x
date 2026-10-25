import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const pages = [
  '/',
  '/pricing',
  '/products',
  '/downloads',
  '/contact',
  '/login',
  '/register',
  '/forgot-password',
  '/activate',
  '/invite',
  '/success',
  '/dashboard',
  '/admin',
  '/admin/license',
  '/admin/profile',
  '/admin/settings',
  '/admin/sites',
  '/admin/subscription',
  '/admin/supervisors',
];

const apiEndpoints = [
  { url: '/api/attendance', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/organization', method: 'PATCH', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/sites', method: 'GET', expectedStatus: [200, 401, 403] },
  { url: '/api/zones', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/invitations', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/payments/order', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/payments/verify', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/payments/webhook', method: 'POST', body: {}, expectedStatus: [400, 401, 403, 503] },
  { url: '/api/subscriptions/renew/order', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/subscriptions/renew/verify', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
  { url: '/api/auth/session', method: 'POST', body: {}, expectedStatus: [400, 401, 403] },
];

async function run() {
  console.log('====================================================');
  console.log('       SHIELD X - COMPREHENSIVE ROUTE AUDIT         ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  console.log('--- Testing Web Pages ---');
  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`, {
        headers: { 'Accept': 'text/html' },
        redirect: 'manual'
      });
      const text = await res.text();
      const is500 = res.status >= 500;
      const hasErrorText = text.includes('Internal Server Error') || text.includes('Application error');

      if (!is500 && !hasErrorText && (res.status === 200 || res.status === 307 || res.status === 308 || res.status === 302)) {
        console.log(`  [PASS] ${page.padEnd(25)} -> HTTP ${res.status} (${text.length} bytes)`);
        passed++;
      } else {
        console.error(`  [FAIL] ${page.padEnd(25)} -> HTTP ${res.status} (Internal error detected)`);
        failed++;
      }
    } catch (err) {
      console.error(`  [FAIL] ${page.padEnd(25)} -> Network error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n--- Testing API Endpoints ---');
  for (const api of apiEndpoints) {
    try {
      const opts = {
        method: api.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      if (api.body) {
        opts.body = JSON.stringify(api.body);
      }
      const res = await fetch(`${BASE_URL}${api.url}`, opts);
      const is500 = res.status >= 500;

      if (!is500 && api.expectedStatus.includes(res.status)) {
        console.log(`  [PASS] ${api.method.padEnd(6)} ${api.url.padEnd(32)} -> HTTP ${res.status} (Handled properly)`);
        passed++;
      } else {
        console.error(`  [FAIL] ${api.method.padEnd(6)} ${api.url.padEnd(32)} -> HTTP ${res.status} (Expected ${api.expectedStatus.join('/')})`);
        failed++;
      }
    } catch (err) {
      console.error(`  [FAIL] ${api.method.padEnd(6)} ${api.url.padEnd(32)} -> Network error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
