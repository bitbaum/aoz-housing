# Integration Research Framework

created_date: 2026-08-19
last_modified_date: 2026-08-19
last_modified_summary: Initial framework linking housing science with broader integration research, product domains, and measurable outcomes.

## Purpose

This product no longer sits only in the domain of housing operations. It now spans
housing stability, language progress, work readiness, participation, and coordinated
staff guidance.

The research base must therefore expand as well. We keep the original housing and
cohabitation science, but treat it as one pillar inside a broader, evidence-based
integration framework.

This document defines:

- which research pillars should guide the product
- how those pillars map to workflows and data
- which outcomes are appropriate to measure
- which data we deliberately do **not** collect

## Working Thesis

The product should be understood as an **integration operations system for
Fachpersonen**, with housing as the stabilising base layer.

That means:

- housing is necessary but not sufficient
- integration is a process, not a single event
- staff need continuity, prioritisation, and explainable next steps
- residents need clarity, trust, language access, and visible progress

## Evidence Pillars

### 1. Cohabitation and housing stability

This is the existing scientific core and stays central.

Questions:

- who can live together with lower conflict risk
- what increases relocation risk
- how incidents, rules, chores, and communication affect stability

Product implications:

- compatibility and matching
- placement, transfer, and vacancy workflows
- incidents, mediation, agreements, and house rules
- chores, expenses, and practical cohabitation coordination

Primary outcomes:

- incidents per resident / unit
- relocations, especially conflict-driven relocations
- mediation time
- overdue maintenance / unresolved problems
- check-in trends over time

### 2. Language and orientation

Swiss integration policy treats language and orientation as foundational. The
Integrationsagenda Schweiz explicitly emphasises early information, language
learning, and familiarity with life in Switzerland.

Questions:

- does the person know what applies to them and where to go next
- are language steps visible, documented, and actionable
- can staff quickly see whether language progress is blocked

Product implications:

- language tests and course evidence
- learning plans, course offers, and next-step prompts
- translated portal chrome and translated key workflows
- orientation content, appointments, and follow-up reminders

Primary outcomes:

- first orientation completed
- language baseline captured
- course participation
- language level progression where relevant
- missed appointments / stalled follow-ups

### 3. Capability and labour-market readiness

The product now serves Jobcoach workflows directly. That requires a research base
around employability, qualifications, and progression rather than only placement.

Questions:

- what capabilities, qualifications, and barriers are visible
- what progress matters before and after employment
- how can staff distinguish activity from real progression

Product implications:

- qualifications, certificates, and course completion
- jobcoach boards and filters
- employability-related notes and milestones
- integration evidence linked to next actions, not just archived records

Primary outcomes:

- qualification status
- participation in work-readiness measures
- evidence of labour-market preparation
- time from intake to first concrete job-related step

### 4. Participation and social integration

Housing without participation produces a narrow product. The broader integration
research and Swiss policy context both point to social participation and contact
with the surrounding society as important, even if measurement is imperfect.

Questions:

- is the person participating in community, volunteering, or social offers
- do staff see meaningful engagement, not only housing calm
- can residents document participation in a way staff can work with

Product implications:

- volunteering and community-service evidence
- activities, events, and marketplace/community flows
- social participation surfaced on staff boards
- resident self-logged evidence with staff visibility

Primary outcomes:

- participation in offers / activities
- volunteering or community-service hours
- continuity of engagement over time
- attendance vs dropout patterns

### 5. Coordinated guidance and staff continuity

This is the operational pillar that turns fragmented functions into a useful system.
The Integrationsagenda Schweiz emphasises continuous, specialist support. Our
product must support that explicitly.

Questions:

- does each role know what they own next
- are handoffs between housing, Sozialarbeit, Jobcoach, and volunteering visible
- does communication close loops instead of creating parallel shadow work

Product implications:

- care team assignment
- role-shaped boards
- reminders, follow-ups, appointments
- messaging with visible read / unread / reply loops
- explicit success states and recoverable empty states

Primary outcomes:

- overdue follow-ups
- unanswered resident messages
- time-to-response
- number of actions completed without reopening
- staff workflow completion confidence

## Product Domain Map

| Research pillar | Resident-facing product | Staff-facing product |
|---|---|---|
| Cohabitation and housing stability | chores, rules, reports, help, housing info | matching, placements, incidents, transfer requests, housing management |
| Language and orientation | portal language access, learning, appointments, help | learning queue, check-ins, follow-ups, progress boards |
| Capability and labour readiness | self-logged evidence, offers, achievements | Jobcoach board, qualifications, course evidence, AI-assisted drafting |
| Participation and social integration | activities, events, volunteering evidence | volunteering board, activity planning, participation tracking |
| Coordinated guidance | message thread, clear next steps | care workspace, inboxes, boards, reminders, permissions |

## Measurement Principles

We should measure things that are:

- actionable by staff
- understandable to residents
- explainable in UI
- defensible in front of AOZ
- possible without collecting sensitive surplus data

We should avoid turning the product into a vague “integration score”.

Recommended measurement model:

1. **State metrics**  
   Example: housed / unhoused, active placement, active learning step, open follow-up.

2. **Progress metrics**  
   Example: first language course joined, qualification uploaded, volunteering started.

3. **Flow metrics**  
   Example: response time, overdue reminders, completion of planned next step.

4. **Outcome metrics**  
   Example: fewer conflict relocations, more completed integration measures, lower dropout from offers.

## Data Boundaries

The broader scope must **not** become a licence to collect more sensitive data.

Still out of bounds:

- diagnoses
- immigration-case details beyond what is operationally necessary
- religion, politics, ideology
- black-box risk scores that cannot be explained
- normative “integration ratings” of a person

Allowed when operationally relevant:

- language level evidence
- course / qualification / volunteering participation
- staff-owned follow-ups and appointments
- resident-reported progress evidence
- housing, incident, and transfer history

## Suggested Research Inputs

### Swiss anchors

- Federal Statistical Office integration indicators
- Integrationsagenda Schweiz
- KIP / IAS monitoring concepts and target grids
- FNIA / AIG integration principles

### Broader comparative anchors

- Zaragoza-style migrant integration indicators
- Eurostat migrant integration domains
- practice-oriented service design for case management and coordinated support

## What this means for the product now

Near-term product decisions should follow this rule:

If a feature helps only housing administration, that is acceptable.
If a feature claims to support integration, it should map clearly to at least one of:

- language / orientation
- capability / work readiness
- participation
- coordinated guidance

That means future additions should prefer:

- evidence with next steps
- staff boards shaped by role and intent
- communication loops with visible completion
- resident progress surfaces that are understandable and multilingual

And should avoid:

- dead storage of records with no workflow consequence
- vague dashboards without actionability
- labels that imply judgement without evidence or operational use

## Immediate Research Backlog

1. Review the FSO integration indicator areas and map which ones are relevant,
   out of scope, or explicitly excluded for AOZ.
2. Read the IAS target logic and identify which goals can be supported directly
   in product workflows and which are only reporting context.
3. Review literature on social participation and volunteering as integration
   evidence, so those boards are not only intuitive but evidence-grounded.
4. Refine the metric set for AOZ demos and pilot reporting:
   - housing stability
   - language / learning progression
   - participation signals
   - staff responsiveness and follow-through

## Decision

Keep the science angle.

Expand it from **housing science only** to a **multi-pillar integration framework**
with housing as the base layer, and with language, capability, participation, and
coordinated guidance as first-class research-backed domains.
