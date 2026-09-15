# Maturity model and analysis

This is a skill to help analyze software maturity. It can also assist with other risk and quality analyses, such as failure mode and effects analysis (FMEA).

# Model

We assume software is like a ball moving in a perfect vacuum: It will continue to run unless acted upon by anoutside force. The role of the software engineer is to mitigate or adapt to those sources of change as rapidly as possible, reducing the impact of undesirable user-facing changes as low as possible.

The maturity analysis follows from this: We first catalog the potential sources of change that a running software system might experience, then we catalog potential ways to mitigate the impact of those changes, and then we use the results to estimate how impervious the software is to being altered unexpectedly. Software which is more inert in the face of change is more mature.

Often, it is useful to imagine what happens if we deploy our software directly to production with no tests or monitors at all (aside from an external customer calling our support line). For a given source of change, what would be needed to detect and mitigate a problem that occurred as a result of a particular change? What procedure could have been used to prevent that problem from occurring in the first place?

Throughout this document, we will use the example of a calculator. Our company has both a hosted calculator service, exposing APIs like "sum" and "square root". It also ships a physical calculator that runs the same software offline. Both calculators keep a history of all operators performed. The service stores this history in a database. The physical calculator stores it locally.

<TODO: Annotate the sections below with examples from our two hypothetical calculators.>

# Scope

The unit under analysis should be the unit of supportability. It is the API a customer sees or the build a customer installs. If a single API is backed by a routing fleet and a storage fleet, monitored with a control plane, backed-up with separate archival software to a separate system, **all of those systems** should be included when assessing maturity. 

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

## Changes to inputs

Customers can change their behavior. For instance, they may start issuing operations more rapidly or increase the amount of data in each operation. Note that in this case, malicious actors attempting DDOS are lumped into "customers". 

# Qualities of changes

Changes from any source can impact:
1. Correctness
2. Performance
3. Resource utilization or efficiency
4. Localization, globalization
5. Security
6. <TODO fill this in>

# Summary of types and qualities of change

<TODO make a table here>

# Strategies to mitigate problems

Imagine we deploy a breaking change to our production environment, **assembling** an environment where our software executes. Our customers are using the platform, performing various **actions**. Each time they do this, they **assert** whether their goal was accomplished. If it was not, or if there was a problem or sub-par experience while doing so, we get a ticket. An operator works to mitigate the problem, then fix the root cause, and deploy a new version. The loop is:

Assemble -> Act -> Assert -> Notify -> Mitigate -> Repair
    ^                  |                             |
    \------------------------------------------------/

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



## Traffic protections

Changes in customer behavior can be problematic and our system should protect itself against them. For instance, malicious actor detection can help protect valid traffic against malicious DDOS behavior. Throttling (which can be manual or automated) can be used to protect software from congestion collapse in the face of malicious or benign DDOS behavior. Hard limits on inputs (such as payload size) can do the same. Note that often, systems which implement these features must themselves be tested in pre-production environemnts.

In general, a service with more such protections is more mature.

## Operator knowledge, instruction, action, and escalation

Operators are part of the 

# Wait, where are the Tests?

A Test is just something that runs in our pre-production environment and gives us data. It's not special and doesn't need to be called out separately in the categories above.

# Consequences

## Test the unit of supportability as a whole

Even if it's lots of separate services or piece of software.

## Test as early as possible

## Limit the amount of software you write, own, and depend on, even if it means less functionality

## 