import { LaunchType, environment, getPreferenceValues, launchCommand, updateCommandMetadata } from "@raycast/api";
import { launcherSubtitle, listNotifications } from "./github";

// The launcher row: its subtitle carries the count, because a command can only publish its own
// subtitle and a view command never runs in the background. Enter opens the list.
export default async function Command() {
  const userInitiated = environment.launchType === LaunchType.UserInitiated;
  if (userInitiated) {
    await launchCommand({ name: "inbox", type: LaunchType.UserInitiated });
  }

  const { token } = getPreferenceValues<Preferences>();
  try {
    await updateCommandMetadata({ subtitle: launcherSubtitle(await listNotifications(token)) });
  } catch (failure) {
    // The list already shows the error. A background run rethrows so the launcher row shows a warning.
    if (!userInitiated) throw failure;
  }
}
