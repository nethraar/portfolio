import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getFileContent, commitFile, commitBinaryFile } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const session = getSession(request);
  if (!session) return new Response(null, { status: 302, headers: { Location: '/admin?error=1' } });

  const form = await request.formData();
  const section = form.get('section')?.toString();
  const title = form.get('title')?.toString() ?? '';
  const description = form.get('description')?.toString() ?? '';
  const file = form.get('file') as File | null;

  if (!section || !file) return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });

  const safeFilename = `${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, '_')}`;
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  const uploadOk = await commitBinaryFile(
    `public/uploads/${safeFilename}`,
    base64,
    `admin: upload ${safeFilename}`
  );

  if (!uploadOk) return new Response(null, { status: 302, headers: { Location: `/admin/edit/${section}?error=1` } });

  const contentFile = await getFileContent('src/data/content.json');
  if (!contentFile) return new Response(null, { status: 302, headers: { Location: `/admin/edit/${section}?error=1` } });

  const content = JSON.parse(contentFile.content);
  (content[section] as unknown[]).push({
    id: Date.now().toString(),
    title,
    description,
    filename: safeFilename
  });

  const ok = await commitFile('src/data/content.json', JSON.stringify(content, null, 2), `admin: add to ${section}`, contentFile.sha);
  const dest = ok ? `/admin/edit/${section}?saved=1` : `/admin/edit/${section}?error=1`;
  return new Response(null, { status: 302, headers: { Location: dest } });
};
