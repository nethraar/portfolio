import type { APIRoute } from 'astro';
import { createSessionToken, setSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = form.get('email')?.toString().trim() ?? '';
  const password = form.get('password')?.toString() ?? '';

  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (email !== validEmail || password !== validPassword) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin?error=1' }
    });
  }

  const token = createSessionToken(email);
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin/dashboard',
      'Set-Cookie': setSessionCookie(token)
    }
  });
};
