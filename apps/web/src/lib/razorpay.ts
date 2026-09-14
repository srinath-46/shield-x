import { request } from 'node:https';

type OrderInput = { amount: number; receipt: string; notes: Record<string, string> };
type RazorpayOrder = { id: string; amount: number; currency: string };
type RazorpayError = { error?: { description?: string; code?: string } };

function connectionMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'EACCES' || code === 'EPERM') return 'The Shield X server is blocked from accessing Razorpay. Allow outbound HTTPS access and restart the server.';
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'Razorpay could not be resolved. Check the server DNS and internet connection.';
  if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') return 'Razorpay could not be reached within 20 seconds. Check the network, proxy or firewall.';
  if (code === 'ECONNRESET') return 'The Razorpay connection was interrupted. Please try again.';
  return error instanceof Error ? `Razorpay connection failed: ${error.message}` : 'The Shield X server could not connect to Razorpay.';
}

function postOrder(body: string, authorization: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const outgoing = request({
      protocol: 'https:',
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/orders',
      method: 'POST',
      family: 4,
      headers: {
        authorization,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
      timeout: 20_000,
    }, response => {
      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      response.on('end', () => resolve({ status: response.statusCode ?? 500, text: Buffer.concat(chunks).toString('utf8') }));
    });
    outgoing.on('timeout', () => outgoing.destroy(Object.assign(new Error('Request timed out'), { code: 'ETIMEDOUT' })));
    outgoing.on('error', reject);
    outgoing.end(body);
  });
}

export async function createRazorpayOrder(input: OrderInput): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured.');

  const body = JSON.stringify({ amount: input.amount, currency: 'INR', receipt: input.receipt, notes: input.notes });
  const authorization = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

  try {
    const response = await postOrder(body, authorization);
    let result: RazorpayOrder & RazorpayError;
    try {
      result = JSON.parse(response.text) as RazorpayOrder & RazorpayError;
    } catch {
      throw new Error(`Razorpay returned an invalid response (HTTP ${response.status}).`);
    }
    if (response.status < 200 || response.status >= 300) {
      throw new Error(result.error?.description ?? result.error?.code ?? `Razorpay returned HTTP ${response.status}.`);
    }
    if (!result.id) throw new Error('Razorpay did not return an order ID.');
    return result;
  } catch (error) {
    if (error instanceof Error && !('code' in error)) throw error;
    throw new Error(connectionMessage(error));
  }
}