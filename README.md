<div align="center">

<img src="assets/icon.png" width="96" alt="GitHub Inbox" />

# GitHub Inbox

**Your GitHub notifications in the macOS menu bar and the Tinycast launcher.**
See what's new, click to open, Option-click to mark as done. Just a token to paste.

![Tinycast](https://img.shields.io/badge/Tinycast-0.12-4a6cf7)
![Raycast API](https://img.shields.io/badge/Raycast_API-2.x-ff6363?logo=raycast&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)

</div>

## ✨ Features

- 📥 **Menu bar**: unread count next to the icon, notifications grouped by repository
- ✅ **Mark as done**: from the menu bar or the list, without opening a browser
- 🔗 **Click to open**: goes straight to the pull request, issue or commit
- 🚀 **Launcher row**: `GitHub Inbox` shows the count and the latest title, refreshed every minute
- ⌨️ **List**: filter as you type, Enter to open, ⌘D to mark as done
- 🔑 **Minimal token**: only the `notifications` scope, private repositories included
- 🪶 **Native**: rendered by Tinycast with SwiftUI and `NSStatusItem`, no browser and no Electron

## 🚀 Install

1. In Tinycast, open **Settings → Extensions** and turn on **Enable extensions**.
2. Click **Install from GitHub** and paste:

   ```text
   mathieuletyrant/tinycast-github-inbox
   ```

   It builds on your Mac, so it needs a package manager (pnpm, Bun, Yarn or npm).
3. [Create a token](https://github.com/settings/tokens/new?description=GitHub%20Inbox&scopes=notifications) and paste it in the extension's preferences.

> [!IMPORTANT]
> Use a **classic** token. The notifications API does not accept fine-grained tokens (`github_pat_…`).

If your organization uses SSO, you may also need **Configure SSO** next to the token.

## ⚙️ Setup

Each command is opt-in, so turn on the ones you want:

| Command | What it does | Turn it on |
|---|---|---|
| **GitHub Inbox Menu Bar** | Icon, count and notifications in the menu bar | **Show in menu bar** in the command's configuration |
| **GitHub Inbox** | Launcher row with the count and the latest title | Run it once, then pin it with ⇧⌘F |
| **GitHub Inbox List** | The full list in the launcher | Give it a global hotkey to open it from anywhere |

## ⌨️ Usage

| | Open | Mark as done |
|---|---|---|
| **Menu bar** | Click | ⌥ Click |
| **List** | Enter | ⌘D |

Opening a notification also marks it as read.

## ⚠️ Good to know

- **Unread only**: an opened notification leaves the list but stays in your GitHub inbox until it's done. Read threads are left out because asking the API for them may bring done ones back too.
- **One row in the launcher**: Tinycast has no way for an extension to add its own rows to the launcher's home, hence the count and the hotkey.
- **50 notifications at most**: past that, the count shows `50+`.
- **Some links are approximate**: releases open the repository's releases page, discussions its discussions page, and CI runs its Actions page. This is what keeps the token down to the `notifications` scope.
- **Raycast**: it's a standard Raycast extension, but it has only been run in Tinycast so far.

## 🛠️ Develop

```sh
npm install
npm test             # unit tests for the GitHub client (Node 22.18+)
npm run build        # builds dist/, to install with Add from folder in Tinycast
```

```
src/github.ts        GitHub API: list, done, read, web URLs. No Raycast import, tested with node --test
src/use-inbox.ts     Shared hook: fetch, optimistic removal, error reporting
src/inbox-menu.tsx   Menu bar command
src/inbox.tsx        List command
src/inbox-status.ts  Launcher row: publishes its subtitle in the background, opens the list on Enter
```
