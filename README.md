# The project has a software change catalog.

The webapp is the first step in a software maturity workspace. Its catalog has three levels:
categories, subcategories, and kinds of change. Selecting a parent shows its children in the next
column. All categories remain in the first column.

## The application runs on the local machine.

The application has no runtime dependencies or build step. Its test dependencies support
Node.js 22.22.2 or later in the 22 series, 24.15.0 or later in the 24 series, and 26 or later.

```sh
cd /Users/ethanjohn/Documents/Projects/software-maturity-model
npm start
```

The browser address is **http://127.0.0.1:4317**. A different port can be selected with
`PORT=4318 npm start`. The server binds to the loopback interface and serves the app and the
catalog API from the same origin.

## The interface edits the tree and its definitions.

- A single click selects an item. A double-click on its title or description opens a text field.
- Enter saves a title. Command/Ctrl+Enter saves a description. Clicking outside a field also
  saves it, and Escape cancels the edit.
- The plus buttons create items at each level. The actions menu has editing, deletion, and
  a move dialog that also supports ordering with a keyboard. F2 opens the focused text field.
- Dragging a dotted handle before or after a sibling changes its order. Dropping a subcategory
  onto a category changes its parent. Dropping a kind onto a subcategory changes its parent.
  Hovering over a parent for half a second opens that branch during a drag.
- A category or subcategory moves with its descendants. Deleting a parent includes its children;
  the dialog states the number of affected items before deletion.
- Undo and redo keep up to 50 edits during the browser session. Command/Ctrl+Z and
  Command/Ctrl+Shift+Z have the same effect as the history buttons.
- Search covers IDs, titles, and descriptions across the tree. Selecting a result opens its
  branch. The search does not remove categories from the first column.
- Export downloads the catalog as JSON. Import validates a JSON catalog, then has a confirmation
  dialog before replacement. Undo can restore the previous tree during the session.

## The catalog has a file format and a source boundary.

The server saves every accepted edit to [web/data/catalog.json](web/data/catalog.json) with an
atomic file replacement. The file belongs in Git. Failed saves leave the previous catalog in
place, and a revision check rejects a stale write from another tab instead of overwriting it.
Reloading the tab obtains the latest catalog after a conflict.

The initial catalog has nine categories and 52 subcategories from the current
[source profiles](software-maturity-analysis/references/source-profiles/README.md). Its 104 kinds
of change are draft examples proposed on 2026-10-11. They require review and do not claim to be
an exhaustive list. Each seeded item has a source reference; its actions menu opens the profile.
Moving or editing an item retains its ID and provenance. New items have a `user` origin.

The JSON object has `schemaVersion: 1`, a `revision`, an `updatedAt` timestamp, and a `nodes` array.
Each node has `id`, `parentId`, `level`, `title`, `description`, and `origin`. A source-derived
node also has `sourceRef`. The array order determines sibling order. A category has a null parent;
a subcategory has a category parent; a kind has a subcategory parent. Stable IDs allow future
mitigation and assessment records to refer to a change definition after it moves.

The first version is a local editor with one shared catalog file. It has no account system or
hosted multi-user service. Undo history ends when the tab reloads; saved edits remain on disk.

## The workspace has a sequence for the remaining work.

The navigation has a plan view for each later phase. These views define intended outputs and
repository boundaries; they are not assessment or mitigation editors yet.

1. The change catalog defines the sources of software change and their scope.
2. The mitigation catalog defines protections and their maturity, linked to change definitions.
3. The assessment workflow defines a product surface and examines one source with its mitigation
   profile at a time, with evidence and a visualization of the work.
4. An organization catalog maps generic mitigations to approved practices. Airbnb-specific
   information belongs in a work repository.
5. The organization view aggregates findings across systems and teams.
6. Opportunity analysis identifies both targeted repairs and initiatives that address patterns
   across teams.

The current skill and its references remain in
[software-maturity-analysis/](software-maturity-analysis/SKILL.md). The `fmea/` prototype is a
separate local artifact and is not part of the webapp.

## The checks cover catalog invariants and persistence.

```sh
npm ci
npm test
```

The tests cover ordering at all three levels, parent changes with descendants, invalid moves,
branch deletion, editing, import validation, skill references, disk persistence, competing
writes, static-file access, and the loopback request boundary. The tests use temporary catalog
files and do not change the working catalog. The interface checks use jsdom and the real local
API to verify branch selection, double-click editing, CRUD, undo, redo, search, and plan views.
These checks do not verify browser layout or native dragging. On 2026-10-11, Chrome blocked the
local preview with `ERR_BLOCKED_BY_CLIENT`, so those browser checks remain incomplete.
