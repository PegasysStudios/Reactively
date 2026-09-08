# Reactively Cloud Sync

## Goal

Reactively should be local-first while providing durable cloud backup, revision history, account portability, and foundations for future collaboration.

## Local-First Principle

The local project document should update immediately. Cloud latency must never block ordinary editing.

```text
User edit
   ↓
Local project state
   ↓
Local autosave
   ↓
Queued cloud operation
```

## Backend Storage Split

### Database

Store structured metadata:

```text
users
projects
project_members
project_revisions
project_operations
assets
builds
deployments
github_connections
backend_connections
```

### Object Storage

Store binary/heavy objects:

```text
images
fonts
videos
uploaded files
export archives
build artifacts
backup packages
```

Do not put large binary data in JSON/project rows.

## Save Model

Use both snapshots and operations.

### Operations

Small project mutations are queued and uploaded.

Example:

```json
{
  "operationId": "...",
  "projectId": "...",
  "baseRevision": 42,
  "type": "updateNodeProperty",
  "payload": {
    "nodeId": "button-1",
    "path": "style.backgroundColor",
    "value": "#3366FF"
  }
}
```

### Snapshots

Periodically save a full canonical project snapshot.

Possible triggers:

- N operations
- N minutes
- app close
- publish
- GitHub push
- explicit checkpoint

## Recovery

Recovery priority:

```text
Current local file
    ↓
Local autosave/recovery file
    ↓
Latest cloud snapshot
    ↓
Cloud snapshot + replay operations
```

## Conflict Strategy

Beta can start with conservative single-editor semantics.

If the same project is edited from two devices:

- detect revision mismatch
- do not silently overwrite
- present clear conflict resolution
- preserve both copies when uncertain

Do not introduce CRDT complexity before collaboration is a real requirement.

## Revision History

Users should eventually be able to:

```text
View revision
Name checkpoint
Restore revision
Duplicate from revision
Compare metadata
```

Restoring should create a new revision rather than destructively deleting history.

## Backups

Provide three independent durability layers:

```text
Local autosave
Cloud revisions
GitHub/export backup
```

## Encryption / Secrets

Never store raw provider credentials or long-lived secrets directly inside the project document.

Use secure backend records or OS credential storage with project references.
