# Goal bulk resume

Adds a **Review goals to resume** action to the composer's goal strip and to the left sidebar's **More** menu (beside Settings and Plugins).

## What it does

1. The action scans all persisted sessions and lists every unfinished goal:
   - an `active` goal that is disarmed after a session start or a DSH restart;
   - a `paused` or `blocked` goal.
2. The confirmation dialog shows the target sessions (abbreviated ID), goal phase, and objective before anything is resumed.
3. Only after confirmation are those goals resumed. `complete` goals and already-armed active goals are skipped.

Cold sessions are resolved through the same Remote lookups the goal strip already uses, so a session does not have to be opened in the UI first. The action reports how many goals were resumed, skipped, or failed, with a failure-details list when needed.

## Usage

1. Restart DSH and open any session that has a goal, or use the sidebar **More** menu.
2. Select **Review goals to resume** and inspect the listed goals.
3. Select **Resume N** to confirm, or **Cancel** to dismiss.

## Limitations

- A goal whose round budget is exhausted cannot be resumed; the failure is counted and shown in the details list.
- Sessions that the current principal may not read are skipped by the session list Remote.
- The operation resumes goals only; it does not send a prompt or start a new turn.
