# The change catalog was checked against the skill on 2026-10-11.

This document records the migration check, not another copy of the definitions. The app's
catalog file and its exported revisions own the definitions after this migration. Future edits
do not need to match the earlier skill, and automated checks must not restore its wording.

The audit read the skill, the source-profile index, all nine source profiles, the conditional
control rules, the mitigation catalog, and the assessment method. The scope of the implemented
migration is the change taxonomy and its boundary guidance. Mitigation defaults and assessment
tables belong to the next phases described in `PLAN.md`.

## The definitions have complete coverage of the source profiles.

Every category description matches its source profile's opening definition. Every subcategory
description matches the corresponding vector definition, including every part of a compound
definition. The migration retained titles, stable IDs, membership, order, and the 104 proposed
fine-grained examples. The examples have a draft origin because they were proposed for this
app; the skill defines the 52 vectors rather than those examples.

| Source | The audit checked this number of vector definitions. | The editor received this number of guidance paragraphs. |
| --- | --- | --- |
| S1 covers owned software. | The profile has seven vectors. | The profile has one paragraph. |
| S2 covers consumed software. | The profile has five vectors. | The profile has one paragraph. |
| S3 covers deployment artifacts. | The profile has five vectors. | The profile has one paragraph. |
| S4 covers controlled runtime state. | The profile has five vectors. | The profile has one paragraph. |
| S5 covers infrastructure and platform behavior. | The profile has five vectors. | The profile has one paragraph. |
| S6 covers demand and transport. | The profile has six vectors. | The profile has one paragraph. |
| S7 covers request meaning. | The profile has seven vectors. | The profile has one paragraph. |
| S8 covers internal interactions. | The profile has six vectors. | The profile has one paragraph. |
| S9 covers external dependencies. | The profile has six vectors. | The profile has three paragraphs. |

All 11 guidance paragraphs are present as saved, editable text. They preserve artifact-versus-
runtime classification, the demand-versus-meaning distinction, differing owners and change paths,
workload and fault-domain scope, client controls versus provider guarantees, evidence limits,
and per-caller dependency scope. The catalog scope summarizes the support boundary, user
outcomes, overlapping source classifications, unresolved ownership, and the bounded taxonomy.

## The editor owns the content after migration.

Descriptions and guidance have no line clamp. Scope guidance and the catalog scope use the same
double-click or F2 editing, saving, export, and undo behavior as other definitions. Search includes
node guidance. All nine categories remain in the page, and the browser page owns scrolling.

The actions menu has no source-profile links. The JSON has no `sourceRef` fields, and the server
does not expose a reference route. Older imports have their reference fields discarded. The
earlier skill files remain in the repository as migration material for mitigation and assessment
work; they are not served by the editor or copied back over catalog edits.

The migration checked the working catalog against its Git baseline before writing, verified each
definition, and advanced the revision so that a stale browser cannot overwrite the migration.
The 21 checks passed after the change. Chrome verification covered unclipped text, page scrolling,
the reference-free actions menu, and opening the guidance editor.
