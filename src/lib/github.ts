const REPO = 'nethraar/portfolio';
const BRANCH = 'main';

async function githubFetch(path: string, options: RequestInit = {}) {
  const token = import.meta.env.GITHUB_TOKEN;
  return fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

export async function getFileContent(filePath: string): Promise<{ content: string; sha: string } | null> {
  const res = await githubFetch(`contents/${filePath}?ref=${BRANCH}`);
  if (!res.ok) return null;
  const data = await res.json();
  return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha };
}

export async function commitFile(filePath: string, content: string, message: string, sha?: string): Promise<boolean> {
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  const res = await githubFetch(`contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return res.ok;
}

export async function commitBinaryFile(filePath: string, base64Content: string, message: string, sha?: string): Promise<boolean> {
  const body: Record<string, unknown> = {
    message,
    content: base64Content,
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  const res = await githubFetch(`contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return res.ok;
}
