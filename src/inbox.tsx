import { Action, ActionPanel, Icon, List, Toast, openExtensionPreferences, showToast } from "@raycast/api";
import { INBOX_URL, NEW_TOKEN_URL, groupByRepo } from "./github";
import { iconFor, useInbox } from "./use-inbox";

function reportError(message: string) {
  return showToast({ style: Toast.Style.Failure, title: message });
}

export default function Command() {
  const { inbox, isLoading, error, done, openItem } = useInbox(reportError);
  const items = inbox?.items ?? [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filtrer les notifications">
      {error ? (
        <List.EmptyView
          icon={Icon.Warning}
          title={error.message}
          actions={
            <ActionPanel>
              <Action title="Saisir le token" icon={Icon.Key} onAction={openExtensionPreferences} />
              <Action.OpenInBrowser title="Créer un token" url={NEW_TOKEN_URL} />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView
          icon={Icon.CheckCircle}
          title="Inbox vide"
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Ouvrir sur GitHub" url={INBOX_URL} />
            </ActionPanel>
          }
        />
      )}

      {groupByRepo(items).map(([repo, threads]) => (
        <List.Section key={repo} title={repo}>
          {threads.map((item) => (
            <List.Item
              key={item.id}
              icon={iconFor(item.type)}
              title={item.title}
              keywords={[repo]}
              accessories={[{ text: item.reason.replace(/_/g, " ") }, { date: new Date(item.updatedAt) }]}
              actions={
                <ActionPanel>
                  <Action title="Ouvrir" icon={Icon.Globe} onAction={() => openItem(item)} />
                  <Action
                    title="Done"
                    icon={Icon.Check}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                    onAction={() => done(item)}
                  />
                  <Action.OpenInBrowser
                    title="Ouvrir l'inbox GitHub"
                    url={INBOX_URL}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
