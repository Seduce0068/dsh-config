# Goal bulk resume

Adds a **Resume all goals** button to the composer's goal strip.

## What it does

The button lists persisted sessions and resumes every unfinished goal:

- an `active` goal that is disarmed after a session start or a DSH restart;
- a `paused` or `blocked` goal.

`complete` goals and already-armed active goals are skipped. Cold sessions are resolved through the same Remote lookups the goal strip already uses, so a session does not have to be opened in the UI first.

## Usage

1. Restart DSH and open any session that has a goal.
2. Select **Resume all goals** in the goal strip and confirm the dialog.
3. The strip reports how many goals were resumed, skipped, or failed.

## Limitations

- A goal whose round budget is exhausted cannot be resumed; the failure is counted and reported.
- Sessions that the current principal may not read are skipped by the session list Remote.
- The operation resumes goals only; it does not send a prompt or start a new turn.
