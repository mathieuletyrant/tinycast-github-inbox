import { Icon, getPreferenceValues, open } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { listNotifications, markDone, markRead, withoutThread, type Notification } from "./github";

export function iconFor(type: string): Icon {
  switch (type) {
    case "PullRequest":
      return Icon.Code;
    case "Issue":
      return Icon.Circle;
    case "Release":
      return Icon.Tag;
    case "Discussion":
      return Icon.SpeechBubble;
    case "CheckSuite":
    case "WorkflowRun":
      return Icon.Cog;
    default:
      return Icon.Dot;
  }
}

export function useInbox(reportError: (message: string) => Promise<unknown>) {
  const { token } = getPreferenceValues<Preferences>();
  const { data, isLoading, error, mutate } = useCachedPromise(listNotifications, [token], {
    keepPreviousData: true,
    // Both commands render the error themselves; a menu-bar command has no toast to show.
    onError: () => undefined,
  });

  async function removeWith(action: typeof markDone, id: string) {
    try {
      await mutate(action(token, id), { optimisticUpdate: (inbox) => withoutThread(inbox, id) });
    } catch (failure) {
      await reportError(failure instanceof Error ? failure.message : String(failure));
    }
  }

  return {
    inbox: data,
    isLoading,
    error,
    done: (item: Notification) => removeWith(markDone, item.id),
    // The list only shows unread threads, so an opened one leaves it but stays in the GitHub inbox until done.
    openItem: async (item: Notification) => {
      await open(item.url);
      await removeWith(markRead, item.id);
    },
  };
}
