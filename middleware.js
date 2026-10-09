import { next } from '@vercel/functions';

// Private admin area: deny by default unless credentials are configured.
// This runs before static content is served.
export const config = { matcher: ['/admin/overview', '/admin/overview/:path*', '/api/admin/analytics'] };
export default async function middleware(request) {
  const user = process.env.COMMAND_CENTER_USER;
  const password = process.env.COMMAND_CENTER_PASSWORD;
  const headers = new Headers({
    'Cache-Control': 'no-store, private',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Referrer-Policy': 'no-referrer'
  });
  if (!user || !password) {
    return new Response('Private dashboard is not configured.', { status: 503, headers });
  }
  const auth = request.headers.get('authorization') || '';
  const expected = 'Basic ' + btoa(user + ':' + password);
  // Compare all characters to avoid early-exit timing behavior.
  let mismatch = auth.length ^ expected.length;
  const count = Math.max(auth.length, expected.length);
  for (let i = 0; i < count; i++) mismatch |= (auth.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  if (mismatch !== 0) {
    headers.set('WWW-Authenticate', 'Basic realm="3bkarino Private Admin", charset="UTF-8"');
    return new Response('Authentication required.', { status: 401, headers });
  }
  return next();
}
