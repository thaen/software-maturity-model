# Maturity model and analysis

## The implementation sequence was revised on 2026-10-11.

Ethan defined the next work as a webapp that holds the model and makes it possible to review its
tree. The first implemented surface is a catalog of software change with three columns:
categories, subcategories, and kinds of change. Parent selection controls the children in the
next column, while the categories remain available. Each item has a description, CRUD controls,
text editing by double-click, and drag-and-drop support for ordering and parent membership.

The sequence after that catalog is a generic mitigation catalog, assessment scaffolding, an
organization-specific approved-practice catalog, aggregation across systems, and opportunity
analysis. The assessment work unit has a product boundary, one defined source of change, and
its potential mitigations with maturity descriptions. Its evidence needs review before the
later analysis can rank opportunities.

The public repository can hold the change and mitigation catalogs, generic assessment workflow,
and aggregation structure. Airbnb-specific practices and assessment material belong in a work
repository. Opportunity analysis comes last because both individual protection gaps and patterns
across teams need the preceding data; the earlier phases have uses on their own.

The conceptual model below remains background for the sequence. Its original four-step process
does not determine the order of implementation.

## The UI owns the catalog definitions.

Ethan specified on 2026-10-11 that the UI is the authority for definitions and hierarchy changes.
The skill is migration material. The change catalog has its nine source definitions, all 52
vector definitions, and the scope guidance in full. It also has 104 proposed kinds of change.
Descriptions, guidance, and the catalog scope are editable, and the app has no profile links.
The migration check is recorded in `web/CATALOG-AUDIT.md`.

The assessment workflow will read a snapshot or export of the catalog and record its revision.
Stable IDs are identities; their spelling is not a path. Current `parentId` relationships define
the hierarchy after a move. A change to a definition can require a review of existing mitigation
links and assessments, while a change to display order alone does not change applicability.

## Mitigations can have a hierarchy and a view beside changes.

The following design is a proposal for the next phase. Ethan has not yet chosen its layout.

The recommendation is to give mitigations their own hierarchy in the sidebar and use an optional
fourth column in Sources of change to show links to those same mitigation records. A mitigation
can apply to several changes, and a change can have several mitigations. Admission control can
limit demand growth, costly request work, internal overload, and the effects of dependency quotas.
One definition should serve all of those links. Editing that definition from either view changes
the same record.

| View | The view has this purpose. | The view owns this operation. |
| --- | --- | --- |
| The Mitigations sidebar view has a hierarchy. | You can author and review all protection definitions, including ones with no links yet. | You can create, edit, delete, reorder, and reparent mitigation records. |
| The Sources of change view can have a fourth column. | You can review the protections that apply to the selected change and understand their conditions. | You can add or remove a link, edit its reason or condition, and edit its shared mitigation definition. |

The fourth column should be a toggle because four columns can leave little room for definitions.
It follows the selected category, vector, or kind and uses page scrolling. On a narrow screen, it
can be a section below the selected branch. Selecting a mitigation can show every change linked
to it and the source of each link.

### The catalog has families and independently assessable mitigations.

The skill supplies 106 controls in eight families: testing, review, validation, rollout,
detection, automatic mitigation, operator mitigation, and architecture. Those families can seed
the top level of the mitigation hierarchy. Each atomic control is a leaf. Another grouping level
can be introduced when it has a purpose; the initial model does not need an empty level to match
the three columns of the change catalog.

Each mitigation needs a stable ID, parent, order, title, definition, applicability guidance,
evidence expectations, and editable maturity descriptions. The definition states the protection
that can be assessed on its own. A family is an organization of definitions, not an assessment
unit. Generic mechanisms and organization-approved implementations have separate records, linked
by mitigation ID. Airbnb-specific implementations belong in a work repository.

The existing IDs such as A04 should remain stable during import and later moves. A conceptual
group such as traffic protection can contain admission limits, load shedding, fairness, and
backpressure, because those protections can each have different evidence and coverage.

### Each change-to-mitigation link has its own context.

A link has a stable ID, change ID, mitigation ID, selection reason, and an applicability condition
when needed. Links can attach at any change level. A kind can receive its vector's baseline links
and show them as inherited, with the ancestor named. Its direct additions and exceptions are
visible beside those inherited links. Removing a link from one change does not delete the
mitigation definition or its other links.

The migration starts with the 52 vector baseline sets and their conditional additions. The
source-level sets remain available as coverage guidance when a vector is unknown; they must not
be inherited as a requirement for every child. The ten source-independent conditional rules
retain their conditions. Selection reasons and evidence cues also need to be migrated, rather
than leaving the editor dependent on the earlier profile tables. Expected protections are a
starting point for tailoring to a system, not a claim that the system implements them.

Reordering records in the mitigation hierarchy changes display order. Dragging a mitigation
onto a change creates a link; it does not move the mitigation out of its family. A deletion of a
mitigation definition has a dialog that states its linked uses and has an undo path. Deletion of
a change branch includes its links without deleting shared mitigation definitions.

### Maturity descriptions and system findings have different records.

A mitigation can have descriptions of increasing coverage, repeatability, observability, or
exercise evidence, with examples and prerequisites. These descriptions need review before they
become a universal ladder. An operator procedure can be an appropriate protection; automation
alone does not establish better coverage or a successful recovery.

An assessment records present, partial, absent, unknown, or not applicable for a named system
boundary and mitigation. It also has the owner, outcomes, inspected scope, evidence, evidence
date, and the reason for its judgment. Provider guarantees require evidence of that guarantee;
missing access is unknown rather than absent. A documented procedure and an exercised procedure
have different evidence. These findings belong to the system assessment, not to the shared
mitigation definition or generic change link. A numeric maturity total needs calibration.

### The next implementation can have three increments.

1. The first increment has the mitigation hierarchy editor, imports all 106 definitions, and has double-click editing, CRUD, drag ordering, membership changes, persistence, and undo.
2. The second increment has change-to-mitigation links and their reasons, conditions, exceptions, and evidence cues. It imports the vector baselines and conditional rules and has browsing from either side of a link.
3. The third increment has the optional fourth column and a review of coverage, including unlinked changes, unlinked mitigations, and unresolved applicability. Both mitigation views edit the same records.

The checks should establish that a definition edited in one view changes in the other, a shared
mitigation can protect multiple changes, an unlinked mitigation remains available for authoring,
and inherited links retain their reasons and conditions. Reparenting preserves IDs and links.
The migration check must not prevent later edits from changing the seed taxonomy.

This is a skill to help analyze software maturity. It can also assist with other risk and quality analyses, such as failure mode and effects analysis (FMEA).

# Model

We assume software is like a ball moving in a perfect vacuum: It will continue to run unless acted upon by anoutside force. The role of the software engineer is to mitigate or adapt to those sources of change as rapidly as possible, reducing the impact of undesirable user-facing changes as low as possible.

The maturity analysis follows from this: We first catalog the potential sources of change that a running software system might experience, then we catalog potential ways to mitigate the impact of those changes, and then we use the results to estimate how impervious the software is to being altered unexpectedly. Software which is more inert in the face of change is more mature.

Often, it is useful to imagine what happens if we deploy our software directly to production with no tests or monitors at all (aside from an external customer calling our support line). For a given source of change, what would be needed to detect and mitigate a problem that occurred as a result of a particular change? What procedure could have been used to prevent that problem from occurring in the first place?

Throughout this document, we will use the example of a calculator. Our company has both a hosted calculator service, exposing APIs like "sum" and "square root". It also ships a physical calculator that runs the same software offline. Both calculators keep a history of all operators performed. The service stores this history in a database. The physical calculator stores it locally.

TODO: Annotate the sections below with examples from our two hypothetical calculators.

# Scope

The unit under analysis should be the unit of supportability. It is the API a customer sees or the build a customer installs. If a single API is backed by a routing fleet and a storage fleet, monitored with a control plane, backed-up with separate archival software to a separate system, **all of those systems** should be included when assessing maturity. 

# How to use this document

For a given piece of software running in production, we can estimate its maturity level using this document.

1. Define The System: Consider the software as a whole. For a service, include the service (and all its code), any fronting services (routers, load balancers, etc), its control plane, its operational posture, its infrastructure, and its current release process. Include automation and manual processes. The output of this is a descrition of "The System", mostly as a collection of software repositories, deployment resources (such as test environments and deployment pipelines), and infrastructure descriptions.

2. Enumerate the Sources of Change: How does the system change? Use the "Sources of Change" section of this document. Be exhaustive. For services that expose an API intended to be used programmatically, this may require no investigation: we can use the list of Sources of Change that already exist below. The output of this step is a large table describing and categorizing sources of change.

2.1. Quantify the frequency of change: Optionally, quantify how frequently the software experiences each source of change. How often is new software deployed? How often is infrstructure changed? How often does client traffic change? How often does configuration change? The output of this step is numerical frequency in the table of sources of change. This step requires research.

3. Enumerate Mitigation: For each Source of Change, enumerate the ways The System deals with problems that can occur from that source of change. For instance: How does it deal with a failing host? How does it deal with a spike in client traffic traffic? How are new software revisions tested prior to deployment? How are new non-software runtime changes (such as configuration) tested prior to deployment? Once in production, how fast can we detect and mitigate failures for each of these sources of change? The answers here are myriad and require judgment. Most systems try to protect against "Changes to the software that we own" through testing. Other things to consider: if operator action is required to mitigate a problem, maybe a written SOP exists that describes how to perform that work. However, if we can find no evidence that the SOP has ever been executed, that must be noted as part of this step. If systems exist that completely eliminate some kinds of failure, that counts as "mitigation" (for instance, throttling client traffic throughput can eliminate some types of problems with "Changes in inputs".) The output of this step is a list of mitigating factors for every Source of Change.

4. Score: For each source of change, produce a score that describes how well the system is protected against that source of change. 

# Sources of change

For each of these, imagine: A change is deployed (by us or other owners) that impacts our production environment. Two days later, we get a customer support ticket informing us that something is worse. What will we do to mitigate or eliminate this happening in the future?

## Changes to the software that we own

Developers must alter software to expand functionality and fix bugs. The impact of each change cannot be fully quantified, thus it represents a risk. The risk that a software change might cause user-facing behavior change is typically the most well-defended parts of a system. 

## Changes to the software that we consume

Our software uses libraries that we do not control. They are deployed to the same runtime that our software executes in. They are built into the units of software that we deploy to our hosts. 

## Changes to runtime that we do not control

Software we consume is not always a library packaged and deployed with our code. If we make remote service calls, our dependencies can change in production without any action on our part.

## Changes to runtime that we control

We may have runtime software dependencies that we *do* control. One common example is data stored in a database. If our software reads the payloads of records in a database, then altering the **data** could change our system's behavior even if no **software** is altered.

This category also includes configuration: changes to behavior that's done by configuration is typically outside of typical test and release processes.

## Changes to infrastructure

Infrastructure are the resources required for our software to run in production. In the old world, "infrastructure" meant "hardware". In the modern world, the line between "infrastructure" and "software we consume" is blurry, but the distinction is still valuable. We will define "infrastructure" as "resources we consume we which do not specifically invoke". All hardware, virtual or otherwise, still fits this model, as do Cloud-equivalents, such as cloud networks.

Infrastructure is under the control (lifecycle and behavior) of other entities, and thus it can change without our knowledge. In the old world, this meant "hardware can fail". In the new world, the failure mode is similar, but the causes are unknown. 

## Changes to inputs

Customers can change their behavior. For instance, they may start issuing operations more rapidly or increase the amount of data in each operation. Note that in this case, malicious actors attempting DDOS are lumped into "customers". 

# Qualities of changes

Changes from any source can impact:
1. Correctness
2. Performance
3. Resource utilization or efficiency
4. Localization, globalization
5. Security
6. TODO, fill this in more completely.

# Summary of types and qualities of change

TODO, make a table here

# Strategies to mitigate problems

Imagine we deploy a breaking change to our production environment, **assembling** an environment where our software executes. Our customers are using the platform, performing various **actions**. Each time they do this, they **assert** whether their goal was accomplished. If it was not, or if there was a problem or sub-par experience while doing so, we get a ticket. An operator works to mitigate the problem, then fix the root cause, and deploy a new version. The loop is:

```
Assemble -> Act -> Assert -> Notify -> Mitigate -> Repair
    ^                  |                             |
    \--------<-------------<------------<------------/
```

"Assemble, Act, Assert" is the classic test loop. "Notify, Mitigate, Repair" are the primary tasks of operational work.

Our hypothetical producton systems are very slow to resolve these operations today! Our test loop can take days or months to execute, depending on customers executing specific operations and assessing the outputs. Our assertions are noisy, since customers may under-report or report conflicting information. Notifications through customer support requests are very slow. Mitigation and repair times might be very fast, but without other inputs, we have to assume they are also likely to cause other failures.

The strategies below seek to gradually improve on all of this. How can we reduce the time it takes to run a test? How can we improve the signal-to-noise ratio in our assertions and notifications? How can we measure and improve our mitigation and repair times?

## Metrics and monitors (aka alarms), paging operators

First we want to reduce the amount of time it takes us to respond to a breaking change. Instead of waiting for customers to tell us something is wrong, we can add our own monitors. Our system will emit metrics about its quality of service. We will create alarms based on those metrics. Operators will respond to investigate and mitigate.

Pass/fail criteria for some types of breaking changes can be difficult. It's easy to have an alarm for "my service is returning 500-class errors". It's harder to have an alarm for "my service gradually gets slower the longer it runs without a reboot". The latter remains important.

In general, systems with more comprehensive metrics, monitors, alarms, and paging systems are more mature. 

### Synthetic traffic or tests against production-deployed binaries

Our monitors only fire based on **production** traffic. For high-throughput systems, this may be the best we can do. For low-througput serviecs, we can create synthetic traffic. Some companies call this a "canary", other call it "probes". Combined with metrics and monitors, this minimizes the time it takes to detect many production problems.

Non-service software (such as installed binaries or shrink-wrapped software) benefit immensely from this because there is no "production" environment that is owned by the deploying team. Deploying the built software to sample environments and testing the production version of the software is often the only way to verify that it works. Thus for non-service software, there is crossover here with some of the strategies below.

In general, systems with steady throughput are more mature. 

## Gradual deployment

We can avoid deploying broken environments to production by creating them first and gradually switching over to them. "One region at a time" is a typical first step here. Blue/Green deployments to production are another. Another is to use an A/B test system to gradually expose a change, either via software flags (worse) or routing to Blue/Green fleets (better).

In general, systems with more gradual deployments across all change types are more mature.

## Pre-production environments

Many problems can be detected prior to production if we deploy to an identical environment and then test there prior to a full production deployment. Higher fidelity environments are more likely we can detect production problems. Unit-level tests run in a low-fidelity environment but can still provide valuable data. 

In general, systems with more pre-production environments are more mature.

### Pre-production environment fidelity

Production environments are often large, created with many hosts and the most capable hardware we can justify paying for. This can cause its own problems, as our software may behave differently when exposed to high-performance hardware, large fleets, or other differences between pre-production environments and production.

How well pre-production matches production is called "fidelity". Fidelity can be measured across all the axes described in the **Sources of Change** section, above. For instance, a pre-production environment which replicates "changes to infrastructure" accurately must also replicate the production infrastructure itself: The same hosts, the same network configuration, the same hardware. Similarly, a pre-production environment which replicates "Changes to inputs" accurately probably does so with real production traffic shadowed to the pre-prod environment; or, it has a sophisticated traffic-generation framework that uses production metrics to create production-like traffic.

While perfect fidelity is almost never possible or desirable, in general, systems with higher-fidelity are more mature.

## Traffic protections

Changes in customer behavior can be problematic and our system should protect itself against them. For instance, malicious actor detection can help protect valid traffic against malicious DDOS behavior. Throttling (which can be manual or automated) can be used to protect software from congestion collapse in the face of malicious or benign DDOS behavior. Hard limits on inputs (such as payload size) can do the same. Note that often, systems which implement these features must themselves be tested in pre-production environemnts.

In general, systems with more such protections are more mature.

## Operator knowledge, instruction, action, and escalation

Operators are part of the mitigation story, as are the control planes and manual Standard Operating Procedures (SOPs). In general, systems with more sophisticated control plans and more comprehensive SOPs are more mature. 

# Wait, where are the Tests?

A Test is just something that runs in our pre-production environment and gives us data. It's not special and doesn't need to be called out separately in the categories above.

# Consequences

## Test the unit of supportability as a whole

Even if it's lots of separate services or piece of software.

## Test as early as possible

## Limit the amount of software you write, own, and depend on, even if it means less functionality

## 