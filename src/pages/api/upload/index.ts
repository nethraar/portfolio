import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getFileContent, commitFile, commitBinaryFile } from '../../../lib/github';

async function uploadFile(file: File, prefix: string): Promise<string | null> {
  const safeFilename = `${prefix}-${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, '_')}`;
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const ok = await commitBinaryFile(`public/uploads/${safeFilename}`, base64, `admin: upload ${safeFilename}`);
  return ok ? safeFilename : null;
}

export const POST: APIRoute = async ({ request }) => {
  const session = getSession(request);
  if (!session) return new Response(null, { status: 302, headers: { Location: '/admin?error=1' } });

  const form = await request.formData();
  const section = form.get('section')?.toString();
  const title = form.get('title')?.toString() ?? '';
  const description = form.get('description')?.toString() ?? '';
  const file = form.get('file') as File | null;
  const thumbFile = form.get('thumbnail') as File | null;

  if (!section || !file) return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });

  const filename = await uploadFile(file, 'file');
  if (!filename) return new Response(null, { status: 302, headers: { Location: `/admin/edit/${section}?error=1` } });

  let thumbnail = '';
  if (thumbFile && thumbFile.size > 0) {
    thumbnail = (await uploadFile(thumbFile, 'thumb')) ?? '';
  }

  const contentFile = await getFileContent('src/data/content.json');
  if (!contentFile) return new Response(null, { status: 302, headers: { Location: `/admin/edit/${section}?error=1` } });

  const content = JSON.parse(contentFile.content);
  (content[section] as unknown[]).push({ id: Date.now().toString(), title, description, filename, thumbnail });

  const ok = await commitFile('src/data/content.json', JSON.stringify(content, null, 2), `admin: add to ${section}`, contentFile.sha);
  return new Response(null, { status: 302, headers: { Location: ok ? `/admin/edit/${section}?saved=1` : `/admin/edit/${section}?error=1` } });
};
