# recording-segment-comment Specification

## Purpose
TBD - created by archiving change recording-segment-comment. Update Purpose after archive.
## Requirements
### Requirement: Create recording segment comment

The system SHALL allow users with Workspace role Admin or Owner to create a comment on a recording segment. Members and Guests SHALL receive HTTP 403. A comment MUST bind to a specific segment and define a time range `[show_time, hide_time]` (relative to the segment's start, in seconds with millisecond precision). Each comment MUST contain a non-empty `abstract` (≤255 chars) and MAY contain a `content` (≤5000 chars).

#### Scenario: Admin creates comment on paused playback

- **WHEN** a workspace Admin pauses playback at time `t` on a segment and submits a comment with `show_time=t`, `hide_time=t+15`, `abstract="..."`, `content="..."`
- **THEN** system creates the comment, returns its `uid`, and starts playback at `show_time`

#### Scenario: Member or Guest cannot create comment

- **WHEN** a Member or Guest attempts to create a comment
- **THEN** system returns HTTP 403

#### Scenario: Reject invalid time range

- **WHEN** user submits a comment with `hide_time <= show_time`
- **THEN** system returns HTTP 400 with error code 2011 "Invalid Time Range"

#### Scenario: Reject negative show_time

- **WHEN** user submits a comment with `show_time < 0`
- **THEN** system returns HTTP 400 with error code 1001 "Invalid Parameter"

#### Scenario: Reject missing abstract

- **WHEN** user submits a comment without `abstract` or with empty `abstract`
- **THEN** system returns HTTP 400 with error code 1001 "Invalid Parameter"

### Requirement: List comments by recording

The system SHALL return all comments belonging to a given recording, optionally filtered by `segment_uid` or `creator_id`. Results MUST be sortable by `show_time` (default ascending) or `created_at`.

#### Scenario: Load all comments of a recording

- **WHEN** user opens the playback page for a recording
- **THEN** system returns all comments for that recording

#### Scenario: Filter by segment

- **WHEN** user expands a specific segment card
- **THEN** system returns only that segment's comments

### Requirement: Update recording segment comment

The system SHALL allow updates to a comment's `show_time`, `hide_time`, `abstract`, and `content`. Only the comment's creator or the Workspace Owner MAY update a comment. All other users SHALL receive HTTP 403.

#### Scenario: Creator updates own comment

- **WHEN** the comment's `creator_id` matches the current user and submits an update
- **THEN** system persists the update and returns the updated comment

#### Scenario: Workspace Owner updates any comment

- **WHEN** a user with Owner role submits an update to any comment
- **THEN** system persists the update

#### Scenario: Non-creator non-Owner cannot update

- **WHEN** a user other than the creator or Owner attempts to update
- **THEN** system returns HTTP 403

### Requirement: Delete recording segment comment

The system SHALL allow deletion of a single comment or batch deletion of multiple comments. Only the comment's creator or the Workspace Owner MAY delete each comment. All other users SHALL receive HTTP 403 per affected comment.

#### Scenario: Creator deletes own comment

- **WHEN** the comment's creator confirms deletion
- **THEN** system removes the comment and returns HTTP 200

#### Scenario: Workspace Owner deletes any comment

- **WHEN** a Workspace Owner deletes a comment created by another user
- **THEN** system removes the comment

#### Scenario: Non-creator non-Owner cannot delete

- **WHEN** a user other than the creator or Owner attempts to delete
- **THEN** system returns HTTP 403

#### Scenario: Batch delete skips forbidden items

- **WHEN** a user submits a batch delete with mixed permissions
- **THEN** system deletes only the comments the user is allowed to delete and returns a list of skipped items

### Requirement: Cascade delete comments with recording

The system SHALL remove all comments whose `recording_id` matches a deleted recording. The deletion MUST be atomic within the recording's deletion transaction.

#### Scenario: Recording deletion cascades to comments

- **WHEN** a recording is deleted
- **THEN** all comments with `recording_id` equal to the deleted recording's id are also deleted

#### Scenario: Segment deletion cascades to comments

- **WHEN** a segment is deleted
- **THEN** all comments with `segment_id` equal to the deleted segment's id are also deleted

### Requirement: Display comments during playback

The system SHALL mark each comment as **active** when the current playback time `t` satisfies `show_time <= t <= hide_time`, and **inactive** otherwise. Active comments MUST appear as canvas bubbles on the playback canvas and MUST be highlighted in the side-panel list.

#### Scenario: Comment becomes active when entering time range

- **WHEN** current playback time enters a comment's `[show_time, hide_time]` range
- **THEN** system shows the comment's canvas bubble and highlights the side-panel entry

#### Scenario: Comment becomes inactive when leaving time range

- **WHEN** current playback time exits a comment's `[show_time, hide_time]` range
- **THEN** system hides the canvas bubble and removes the side-panel highlight

#### Scenario: Multiple comments in same active range stack

- **WHEN** N ≥ 2 comments are simultaneously active
- **THEN** system stacks their canvas bubbles vertically, displays an N/M counter, and provides up/down arrows to switch focus

#### Scenario: Time range is segment-relative

- **WHEN** a comment is defined with `show_time=12.5` on segment #2
- **THEN** the comment becomes active exactly 12.5 seconds after segment #2's playback starts (not the recording's start)

### Requirement: Jump to comment from side panel

The system SHALL seek playback to a comment's `show_time` and resume playback when the user clicks the side-panel comment's jump control.

#### Scenario: Click jump control

- **WHEN** user clicks "▶ 跳转" on a side-panel comment entry
- **THEN** system seeks playback to `show_time` and starts playback

### Requirement: Side-panel hover highlights canvas bubble

The system SHALL highlight the corresponding canvas bubble when the user hovers a side-panel comment entry, without changing playback position.

#### Scenario: Hover side-panel entry

- **WHEN** user hovers a side-panel comment entry
- **THEN** system visually highlights the corresponding canvas bubble

#### Scenario: Mouse leave clears highlight

- **WHEN** user moves the cursor away from the side-panel entry
- **THEN** system removes the canvas bubble highlight

### Requirement: Comment timeline markers

The system SHALL render colored range markers on the playback progress bar for every comment of the currently-playing segment. Marker color MUST be deterministically derived from `creator_id`.

#### Scenario: Markers rendered for current segment

- **WHEN** the current segment has N comments
- **THEN** system overlays N colored range markers above the progress bar at their respective `[show_time, hide_time]` positions

#### Scenario: Markers switch with segment

- **WHEN** playback switches to a different segment
- **THEN** system replaces the timeline markers with the new segment's comment markers

### Requirement: Comment list embedded in segment card

The system SHALL embed the comment list inside the expanded segment card in the side panel, sharing the card's visual boundary. Collapsed segment cards MUST show a count badge indicating the number of comments.

#### Scenario: Expanding a segment card reveals its comments

- **WHEN** user clicks a collapsed segment card
- **THEN** system expands the card and reveals its comment list immediately below the segment info, within the same visual boundary

#### Scenario: Collapsed card displays comment count

- **WHEN** a segment has N comments and the card is collapsed
- **THEN** system displays a `[N]` badge on the segment card header

#### Scenario: Zero comments

- **WHEN** a segment has 0 comments and the card is collapsed
- **THEN** system displays a `[0]` badge (or no badge if 0 is implied by absence) and reveals an empty-state hint when expanded

