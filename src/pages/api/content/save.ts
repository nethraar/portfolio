import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getFileContent, commitFile } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const session = getSession(request);
  if (!session) return new Response(null, { status: 302, headers: { Location: '/admin?error=1' } });

  const form = await request.formData();
  const section = form.get('section')?.toString();
  if (!section) return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });

  const file = await getFileContent('src/data/content.json');
  if (!file) return new Response(null, { status: 302, headers: { Location: `/admin/edit/${section}?error=1` } });

  const content = JSON.parse(file.content);
  const sectionData: Record<string, string> = {};
  for (const [key, val] of form.entries()) {
    if (key !== 'section') sectionData[key] = val.toString();
  }
  content[section] = { ...content[section], ...sectionData };

  const ok = await commitFile('src/data/content.json', JSON.stringify(content, null, 2), `admin: update ${section}`, file.sha);
  const dest = ok ? `/admin/edit/${section}?saved=1` : `/admin/edit/${section}?error=1`;
  return new Response(null, { status: 302, headers: { Location: dest } });
};
