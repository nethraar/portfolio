import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getFileContent, commitFile, commitBinaryFile } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const session = getSession(request);
  if (!session) return new Response(null, { status: 302, headers: { Location: '/admin?error=1' } });

  const form = await request.formData();
  const section = form.get('section')?.toString();
  if (!section) return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });

  const thumbFile = form.get('thumbnail') as File | null;
  let thumbnail = '';

  if (thumbFile && thumbFile.size > 0) {
    const safeFilename = `thumb-${Date.now()}-${thumbFile.name.replace(/[^a-z0-9._-]/gi, '_')}`;
    const arrayBuffer = await thumbFile.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const ok = await commitBinaryFile(`public/uploads/${safeFilename}`, base64, `admin: upload thumbnail`);
    if (ok) thumbnail = safeFilename;
  }

  const item: Record<string, unknown> = { id: Date.now().toString(), thumbnail };
  for (const [key, val] of form.entries()) {
    if (key !== 'section' && key !== 'thumbnail' && !(val instanceof File)) {
      if (key === 'tags') {
        item[key] = val.toString().split(',').map((t: string) => t.trim()).filter(Boolean);
      } else {
        item[key] = val.toString();
      }
    }
  }

  const contentFile = await getFileContent('src/data/content.json');
  if (!contentFile) return new Response(null, { status: 302, headers: { Location: `/admin/edit/${section}?error=1` } });

  const content = JSON.parse(contentFile.content);
  (content[section] as unknown[]).push(item);

  const ok = await commitFile('src/data/content.json', JSON.stringify(content, null, 2), `admin: add item to ${section}`, contentFile.sha);
  return new Response(null, { status: 302, headers: { Location: ok ? `/admin/edit/${section}?saved=1` : `/admin/edit/${section}?error=1` } });
};
