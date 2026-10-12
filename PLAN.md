# The model has a catalog, an investigation, and a review.

The product begins with two editable catalogs and their relationships. A change definition
has a category, subcategory, or kind, with a parent, order, description, and guidance.
A mitigation definition has criteria and evidence expectations. Applicability links retain
why a mitigation is a candidate for a change, including conditions, inheritance, and exceptions.
The UI owns these definitions, and SQLite stores the live catalog.

The connection list, hierarchy matrix, and paired outlines make the same relationships
available for authoring and inspection. The workflow remains in the sidebar. Text is editable
by double-click, hierarchy records have drag ordering and membership changes, and menus have
keyboard equivalents. The page owns vertical scrolling.

The [investigation Skill](software-maturity-analysis/SKILL.md) uses a captured catalog and
a system boundary. It prepares expected work, examines one boundary and change at a time,
and records mechanisms, observations, evidence, findings, and criterion claims. A separate
review checks the sources and the inference for every change, including exclusions and unknowns.
The [README](README.md) has the product process and labeled ERDs.

## Results, organization comparisons, and opportunities have later interfaces.

System and organization data belong in a work repository. An organization can maintain approved
implementations that map to generic mitigations. Assessments can later compare protections
across products and teams, and opportunity analysis can distinguish a targeted system repair
from a repeated practice that warrants an initiative.

The [data model](DATA-MODEL.md) retains those relationships. The
[implementation plan](IMPLEMENTATION-PLAN.md) describes the result and organization interfaces.
Reassessment cadence, invalidation, and deployment hooks are outside the product's current scope.
