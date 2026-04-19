import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getFileContent, commitFile } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const session = getSession(request);
  if (!session) return new Response(null, { status: 302, headers: { Location: '/admin?error=1' } });

  const form = await request.formData();
  const section = form.get('section')?.toString();
  const index = parseInt(form.get('index')?.toString() ?? '-1');
  if (!section || index < 0) return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });

  const file = await getFileContent('src/data/content.json');
  if (!file) return new Response(null, { status: 302, headers: { Location: `/admin/edit/${section}?error=1` } });

  const content = JSON.parse(file.content);
  (content[section] as unknown[]).splice(index, 1);

  const ok = await commitFile('src/data/content.json', JSON.stringify(content, null, 2), `admin: remove from ${section}`, file.sha);
  const dest = ok ? `/admin/edit/${section}?saved=1` : `/admin/edit/${section}?error=1`;
  return new Response(null, { status: 302, headers: { Location: dest } });
};
