import { Icon, LaunchType, MenuBarExtra, launchCommand, open, openExtensionPreferences, showHUD } from "@raycast/api";
import { INBOX_URL, NEW_TOKEN_URL, countLabel, groupByRepo } from "./github";
import { iconFor, useInbox } from "./use-inbox";

const MAX_TITLE = 60;

function short(title: string) {
  return title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1)}…` : title;
}

export default function Command() {
  const { inbox, isLoading, error, done, openItem } = useInbox(showHUD);
  const items = inbox?.items ?? [];

  return (
    <MenuBarExtra
      icon={Icon.Tray}
      title={items.length > 0 && inbox ? countLabel(inbox) : undefined}
      tooltip="GitHub Inbox"
      isLoading={isLoading}
    >
      {error && (
        <MenuBarExtra.Section>
          <MenuBarExtra.Item title={short(error.message)} icon={Icon.Warning} />
          <MenuBarExtra.Item title="Créer un token" icon={Icon.Key} onAction={() => open(NEW_TOKEN_URL)} />
        </MenuBarExtra.Section>
      )}

      {!error && items.length === 0 && !isLoading && <MenuBarExtra.Item title="Inbox vide" icon={Icon.CheckCircle} />}

      {items.length > 0 && <MenuBarExtra.Item title="Clic : ouvrir · ⌥ clic : done" />}

      {groupByRepo(items).map(([repo, threads]) => (
        <MenuBarExtra.Section key={repo} title={repo}>
          {threads.map((item) => (
            <MenuBarExtra.Item
              key={item.id}
              title={short(item.title)}
              icon={iconFor(item.type)}
              tooltip={item.title}
              onAction={() => openItem(item)}
              alternate={
                <MenuBarExtra.Item title={`Done : ${short(item.title)}`} icon={Icon.Check} onAction={() => done(item)} />
              }
            />
          ))}
        </MenuBarExtra.Section>
      ))}

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Ouvrir la liste"
          icon={Icon.List}
          onAction={() => launchCommand({ name: "inbox", type: LaunchType.UserInitiated })}
        />
        <MenuBarExtra.Item title="Ouvrir sur GitHub" icon={Icon.Globe} onAction={() => open(INBOX_URL)} />
        <MenuBarExtra.Item title="Token…" icon={Icon.Key} onAction={openExtensionPreferences} />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
