// GitHub notifications API. No Raycast import, so it runs under plain `node --test`.

const API = "https://api.github.com";
export const INBOX_URL = "https://github.com/notifications";
export const NEW_TOKEN_URL =
  "https://github.com/settings/tokens/new?description=GitHub%20Inbox&scopes=notifications";

export type Notification = {
  id: string;
  title: string;
  type: string;
  repo: string;
  reason: string;
  updatedAt: string;
  url: string;
};

export type Inbox = {
  items: Notification[];
  hasMore: boolean;
};

type Thread = {
  id: string;
  reason: string;
  updated_at: string;
  subject: { title: string; type: string; url: string | null };
  repository: { full_name: string; html_url: string };
};

async function request(token: string, path: string, method = "GET"): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.trim()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      // GitHub sends max-age=60: a cached list would bring back a thread just marked as done.
      "Cache-Control": "no-cache",
    },
  });
  if (response.ok) return response;
  if (response.status === 401) throw new Error("Token GitHub invalide ou expiré");
  if (response.status === 403 || response.status === 404) {
    throw new Error("Token refusé : il faut un token classic avec le scope notifications");
  }
  throw new Error(`GitHub a répondu ${response.status}`);
}

// Only unread threads: `all=true` also returns the ones already marked as done,
// and the API has no field to tell them apart.
export async function listNotifications(token: string): Promise<Inbox> {
  const response = await request(token, "/notifications?per_page=50");
  const threads = (await response.json()) as Thread[];
  return {
    items: threads.map(toNotification),
    hasMore: (response.headers.get("link") ?? "").includes('rel="next"'),
  };
}

export async function markDone(token: string, id: string): Promise<void> {
  await request(token, `/notifications/threads/${id}`, "DELETE");
}

export async function markRead(token: string, id: string): Promise<void> {
  await request(token, `/notifications/threads/${id}`, "PATCH");
}

function toNotification(thread: Thread): Notification {
  return {
    id: thread.id,
    title: thread.subject.title,
    type: thread.subject.type,
    repo: thread.repository.full_name,
    reason: thread.reason,
    updatedAt: thread.updated_at,
    url: webUrl(thread),
  };
}

// Derived from the API URL, not fetched: fetching the subject of a private repo would need the
// `repo` scope, and this way the token only needs `notifications`.
export function webUrl(thread: Pick<Thread, "subject" | "repository">): string {
  const repo = thread.repository.html_url;
  const { type, url } = thread.subject;
  const [, kind, id] = url?.match(/\/repos\/[^/]+\/[^/]+\/([^/]+)\/([^/?#]+)/) ?? [];

  if (kind === "pulls") return `${repo}/pull/${id}`;
  if (kind === "issues") return `${repo}/issues/${id}`;
  if (kind === "commits") return `${repo}/commit/${id}`;
  if (type === "Release") return `${repo}/releases`;
  if (type === "Discussion") return `${repo}/discussions`;
  if (type === "CheckSuite" || type === "WorkflowRun") return `${repo}/actions`;
  return repo;
}

export function countLabel({ items, hasMore }: Inbox): string {
  return hasMore ? `${items.length}+` : String(items.length);
}

export function launcherSubtitle(inbox: Inbox): string {
  const [latest] = inbox.items;
  return latest ? `${countLabel(inbox)} · ${latest.title}` : "Inbox vide";
}

export function groupByRepo(items: Notification[]): [string, Notification[]][] {
  const groups = new Map<string, Notification[]>();
  for (const item of items) {
    groups.set(item.repo, [...(groups.get(item.repo) ?? []), item]);
  }
  return [...groups];
}

export function withoutThread(inbox: Inbox | undefined, id: string): Inbox {
  return { items: (inbox?.items ?? []).filter((item) => item.id !== id), hasMore: inbox?.hasMore ?? false };
}
