import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  countLabel,
  groupByRepo,
  launcherSubtitle,
  listNotifications,
  markDone,
  markRead,
  webUrl,
  withoutThread,
  type Notification,
} from "./github.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

type Call = { url: string; init: RequestInit };

function stubFetch(status: number, body: unknown = null, headers: Record<string, string> = {}): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(body === null ? null : JSON.stringify(body), { status, headers });
  }) as typeof fetch;
  return calls;
}

const thread = {
  id: "42",
  reason: "review_requested",
  updated_at: "2026-11-05T10:00:00Z",
  subject: { title: "Fix bug", type: "PullRequest", url: "https://api.github.com/repos/o/r/pulls/7" },
  repository: { full_name: "o/r", html_url: "https://github.com/o/r" },
};

function url(type: string, subjectUrl: string | null) {
  return webUrl({ subject: { title: "", type, url: subjectUrl }, repository: thread.repository });
}

test("webUrl maps each subject to its web page", () => {
  const api = "https://api.github.com/repos/o/r";
  assert.equal(url("PullRequest", `${api}/pulls/7`), "https://github.com/o/r/pull/7");
  assert.equal(url("Issue", `${api}/issues/7`), "https://github.com/o/r/issues/7");
  assert.equal(url("Commit", `${api}/commits/abc`), "https://github.com/o/r/commit/abc");
  assert.equal(url("Release", `${api}/releases/99`), "https://github.com/o/r/releases");
  assert.equal(url("Discussion", null), "https://github.com/o/r/discussions");
  assert.equal(url("CheckSuite", null), "https://github.com/o/r/actions");
  assert.equal(url("RepositoryInvitation", null), "https://github.com/o/r");
});

test("listNotifications asks for unread threads only and maps them", async () => {
  const calls = stubFetch(200, [thread]);
  const inbox = await listNotifications(" tok\n");

  assert.equal(calls[0].url, "https://api.github.com/notifications?per_page=50");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer tok");
  assert.equal(inbox.hasMore, false);
  assert.deepEqual(inbox.items[0], {
    id: "42",
    title: "Fix bug",
    type: "PullRequest",
    repo: "o/r",
    reason: "review_requested",
    updatedAt: "2026-11-05T10:00:00Z",
    url: "https://github.com/o/r/pull/7",
  });
});

test("listNotifications reports a further page", async () => {
  stubFetch(200, [thread], { link: '<https://api.github.com/notifications?page=2>; rel="next"' });
  const inbox = await listNotifications("tok");
  assert.equal(inbox.hasMore, true);
  assert.equal(countLabel(inbox), "1+");
});

test("markDone sends DELETE and accepts 204", async () => {
  const calls = stubFetch(204);
  await markDone("tok", "42");
  assert.equal(calls[0].url, "https://api.github.com/notifications/threads/42");
  assert.equal(calls[0].init.method, "DELETE");
});

test("markRead sends PATCH and accepts 205", async () => {
  const calls = stubFetch(205);
  await markRead("tok", "42");
  assert.equal(calls[0].url, "https://api.github.com/notifications/threads/42");
  assert.equal(calls[0].init.method, "PATCH");
});

test("auth failures explain what to do with the token", async () => {
  stubFetch(401);
  await assert.rejects(listNotifications("tok"), /invalide/);
  stubFetch(403);
  await assert.rejects(listNotifications("tok"), /scope notifications/);
  stubFetch(500);
  await assert.rejects(listNotifications("tok"), /500/);
});

const item = (id: string, repo: string): Notification => ({
  id,
  repo,
  title: `t${id}`,
  type: "Issue",
  reason: "mention",
  updatedAt: "",
  url: "",
});

test("launcherSubtitle shows the count and the latest title", () => {
  assert.equal(launcherSubtitle({ items: [item("1", "a"), item("2", "a")], hasMore: false }), "2 · t1");
  assert.equal(launcherSubtitle({ items: [], hasMore: false }), "Inbox vide");
});

test("groupByRepo keeps the order of first appearance", () => {
  const groups = groupByRepo([item("1", "b"), item("2", "a"), item("3", "b")]);
  assert.deepEqual(
    groups.map(([repo, items]) => [repo, items.map((i) => i.id)]),
    [
      ["b", ["1", "3"]],
      ["a", ["2"]],
    ],
  );
});

test("withoutThread drops one thread and tolerates an empty cache", () => {
  assert.deepEqual(withoutThread({ items: [item("1", "a")], hasMore: true }, "1"), { items: [], hasMore: true });
  assert.deepEqual(withoutThread(undefined, "1"), { items: [], hasMore: false });
});
