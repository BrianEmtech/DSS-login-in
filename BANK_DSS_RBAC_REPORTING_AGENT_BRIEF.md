# Bank DSS — Governance, RBAC & Reporting Architecture Agent Brief

**Status:** Specification consolidation — normative for authorization and reporting-hierarchy work; **not** evidence of implementation.
**Consolidated:** 2026-10-12
**Domain namespace:** `@pearlbank.ug`
**Security classification of sources:** Strictly Confidential — Internal DSS Security / Highly Confidential Internal Banking Governance.

---

## 0. How to use this document

This file is the single consolidated context for coding agents working on the
Decision Support System's **governance model, identity directory, authorization
engine, and reporting hierarchy**. It merges three source specifications into one
normative reference, adds the canonical identifiers an implementation needs, and
records every conflict and gap found between the sources.

### 0.1 Source provenance and authority order

| Tag | Source document | Covers | Declared version |
|---|---|---|---|
| `[SRC-RBAC]` | `Bank_DSS_Role_Based_Access_Control_Specification.docx` | Roles, responsibilities, module access, permission levels, data visibility, cross-matrix, security mandates | v1.0 (Production Blueprint) |
| `[SRC-MAIL]` | `Bank_Functional_Email_Directory.docx` | Functional email aliases, role→alias→module mapping, IAM provisioning rules | v1.0 (Production Directory Specification) |
| `[SRC-ARCH]` | `Bank_DSS_Reporting_Architecture_Research.docx` | Four-tier data maturity model, governance command chain, data-flow lifecycle, RACI matrix, optimization recommendations | Research report (unversioned) |
| `[DERIVED]` | This file | Canonical codes, enums, data model, check algorithm, test matrix | — |

**Authority order when sources disagree:**

1. `[SRC-RBAC]` **§3 per-position tables** — the most specific statement of a position's rights.
2. `[SRC-RBAC]` **§4 master cross-matrix** — tier-level configuration rules; coarser, and in several places broader than §3.
3. `[SRC-MAIL]` **module mappings** — written for mailbox routing, not authorization; treat as *indicative*, never as a grant.
4. `[SRC-ARCH]` — architectural and governance context; carries no access grants.

**Rule for agents:** where §3 and §4 disagree, implement the **narrower grant**
(Principle of Least Privilege, mandated by `[SRC-RBAC]` §1) and record the
divergence against the open question in [§11](#11-open-questions--unresolved-conflicts).
Do not silently pick the broader grant, and do not derive a grant from `[SRC-MAIL]` alone.

### 0.2 What this document does not contain

- No implementation status. Nothing here has been verified against running code.
- No schema for the analytical content of M1–M6 — only the authorization surface.
- No named individuals. The directory is role-based by design (see [§8.1](#81-why-functional-aliases)).
- No Level 0 role definitions. `[SRC-ARCH]` names Level 0 roles; `[SRC-RBAC]` gives them no entries (see [§11](#11-open-questions--unresolved-conflicts), gap G-7).

---

## 1. System purpose and governing principles

`[SRC-ARCH]` Executive Summary, §1

The DSS is an integrated information-management environment that synthesizes
quantitative financial metrics, qualitative risk indicators, operational
telemetry, and macro-economic models. Unlike OLTP systems optimized for
record-keeping and execution, the DSS is optimized for **analytical query
processing (OLAP)**, scenario modeling, trend forecasting, and executive
reporting.

> **Core research finding `[SRC-ARCH]`:** the primary purpose of a banking DSS is
> to bridge the operational–strategic divide, ensuring ground-level operational
> data undergoes continuous filtering, aggregation, correlation, and strategic
> distillation as it ascends the corporate reporting chain.

### 1.1 Architectural objectives

| Objective | Requirement |
|---|---|
| **Data maturity evolution** | Transition raw, unstructured operational telemetry into refined, decision-ready executive intelligence. |
| **Hierarchical alignment** | Report granularity must correspond precisely with organizational decision-making authority. |
| **Cross-functional correlation** | Eliminate silos by integrating risk, finance, technology, treasury, and operational data into unified scorecards. |
| **Fiduciary & regulatory compliance** | Enable rigorous auditability, capital adequacy monitoring (Basel III/IV), and risk-appetite alignment for board oversight. |

### 1.2 Security authorization policy — non-negotiable invariants

`[SRC-RBAC]` §1

The RBAC architecture is written against **ISO 27001** security guidelines,
**Basel III/IV** risk-management standards, and national financial privacy
regulations. Four invariants follow, and every authorization code path must
preserve them:

- **INV-1 — Principle of Least Privilege (PoLP).** Privileges are mapped to
  organizational positions, never to convenience.
- **INV-2 — No global access.** *"No user receives global read/write access."*
  The only system-wide grant permitted anywhere in the sources is the Chief
  Internal Auditor's **read-only** audit scope.
- **INV-3 — Separation of Duties (SoD).** Executive officers obtain aggregated
  strategic visibility; functional leads manage domain modules; operational
  units interact strictly with localized transactional datasets.
- **INV-4 — Graduated visibility.** A position's data visibility scope is part
  of its grant, not a UI preference. Scope is enforced server-side.

---

## 2. The four-tier data maturity architecture

`[SRC-ARCH]` §2, §2.1

Information flows upward from Level 0 to Level 3. **Volume decreases while
strategic density and decision value increase.** Each level is a distinct data
maturity classification, and the DSS must not present a level's artifacts to a
tier that is not its audience.

| Level | Tier name | Maturity classification | Primary actors | Characteristics |
|---|---|---|---|---|
| **L0** | Operational Field Data (Base Layer) | Low maturity / raw data | Branch offices, core IT transaction processors, digital loan application portals, omnichannel customer support | High volume, sub-second latency, raw detail. Initial logging, real-time transaction execution, immediate noise filtering before ETL ingestion. |
| **L1** | Tactical Consolidation (SMT Layer) | Moderately mature information | Regional Managers, Head of Operations, Credit Directors, IT Leads | Initial aggregation node. Raw transactional logs → domain-specific KPIs, categorized by region, product line, functional domain. Operational performance, credit approval volumes, SLA compliance, localized risk exposure. |
| **L2** | Cross-Functional Integration & Strategic Synthesis (ExCo Layer) | High maturity intelligence | CEO, CFO, CRO, CTO, CISO, Legal, Strategy, Treasury | Siloed tactical reports → enterprise-wide strategic intelligence. Financial performance integrated with risk exposure, IT security posture, market capital forecasts. Advanced analytics, predictive modeling, stress testing, balance-sheet simulation → holistic corporate scorecards. |
| **L3** | Fiduciary Oversight & Macro-Strategy (Board Layer) | Maximum maturity insight | Board of Directors, Chairman, INEDs/NEDs, Audit & Risk Committees | Maximum strategic concentration. Distilled executive packs. Focus shifts from operational telemetry to capital adequacy, long-term shareholder value, regulatory compliance, macro-economic resilience, executive governance. |

### 2.1 Governance tier → reporting focus → DSS artifacts

`[SRC-ARCH]` §3.1

| Level | Key organizational roles | Primary reporting focus | DSS output & artifacts |
|---|---|---|---|
| **L3 — Board** | Board of Directors, Chairman, INEDs/NEDs, Audit/Risk Committees | Macro strategy, capital adequacy, risk appetite, statutory compliance | Quarterly Board Packs, Statutory Risk Briefs, Governance Seals |
| **L2 — Executive** | CEO, CFO, CRO, CTO, CISO, Legal, Strategy, Treasury | Cross-functional strategy, financial health, risk-return alignment, cybersecurity | Enterprise Risk Dashboards, Capital Allocator, Balanced Scorecards |
| **L1 — Senior Management** | Operations & Services, Regional Management (5 regions), Strategy, Credit, Tech | Domain KPIs, operational SLAs, regional credit quality, system uptime | Tactical KPI Dashboards, Monthly Performance Reviews, Regional Summaries |
| **L0 — Operational Base** | Branch Managers, IT System Admins, Loan Officers, Customer Support Leads | Transaction execution, customer ticket resolution, data capture | Raw Activity Logs, Real-Time Exception Alerts, Queue Status Metrics |

### 2.2 End-to-end data flow mechanics

`[SRC-ARCH]` §4 — an automated multi-stage pipeline enforcing data integrity,
context preservation, and security control **at every transition point**.

| Stage | Transition | Mechanics |
|---|---|---|
| **Stage 1 — Ingestion, hygiene, vetting** | L0 → L1 | Raw transactional records enter automated ETL pipelines. Validation engines verify field completeness, remove duplicate entries, run anomaly-detection scripts. Operational data cleansed and categorized before reaching regional aggregation servers. |
| **Stage 2 — Tactical aggregation & KPI standardization** | within L1 | Cleansed data rolled up into functional domains. Transaction counts → branch performance scores; individual loan approvals → credit risk metrics. **Standardized definitions applied across all 5 operating regions** to ensure comparative consistency. |
| **Stage 3 — Cross-functional correlation & predictive analytics** | L1 → L2 | Tactical metrics enter the enterprise data lake. Analytical engines cross-reference credit risk against market liquidity, IT security incidents against operational uptime, customer churn against product yield. ML models simulate stress scenarios and project 12-month capital trajectories. |
| **Stage 4 — Strategic distillation & executive briefing** | L2 → L3 | High-maturity intelligence distilled into executive dashboards and governance briefs. Multi-variate analysis synthesized into key strategic metrics (CET1 ratio, net interest margin sensitivity, enterprise risk score). |

**Implementation consequence `[DERIVED]`:** the four stages are the natural
boundaries for lineage records and for security control checkpoints. A metric
surfaced at L3 must be traceable back through Stages 4→1 to its L0 inputs, and
each transition must re-assert the caller's authorization rather than inheriting
trust from the stage below.

### 2.3 RACI responsibility matrix

`[SRC-ARCH]` §5 — authoritative for data ownership, report generation,
validation, and strategic decision-making.

| Reporting phase / task | Branch / IT | SMT Leads | C-Suite / ExCo | CEO | Board / Committees |
|---|---|---|---|---|---|
| Raw data capture & logging | **Responsible** | Accountable | Informed | Informed | Informed |
| ETL cleansing & noise filtering | **Responsible** | Accountable | Informed | Informed | Informed |
| Regional KPI roll-up & verification | Consulted | **Responsible** | Accountable | Informed | Informed |
| Cross-functional integration & modeling | Informed | Consulted | **Responsible** | Accountable | Informed |
| Strategic scenario & risk correlation | Informed | Consulted | **Responsible** | Accountable | Consulted |
| Fiduciary briefing & macro-strategy approval | Informed | Informed | Consulted | **Responsible** | Accountable |

---

## 3. DSS modules M1–M6

`[SRC-RBAC]` §2 — the DSS is structured into six core analytical and operational
modules. Authorization rules are expressed per module.

| Code | Module name | Content |
|---|---|---|
| **M1** | Executive & Board Governance Portal | Macro financial performance, capital adequacy (CET1), board meeting packs, bank-wide solvency analytics, high-level governance summaries. |
| **M2** | Enterprise Risk & Compliance Engine | Credit scoring models, Non-Performing Loans (NPL) analytics, stress-testing algorithms, AML/CFT indicators, regulatory capital compliance reports. |
| **M3** | Financial Management & Treasury Analytics | General Ledger (GL) variance models, balance-sheet forecasting, Asset-Liability Management (ALM), FX market exposure, liquidity ratio alerts. |
| **M4** | Operational & Regional Performance Hub | Branch turnaround times (TAT), regional credit/deposit growth, cards/POS/ATM operational metrics, procurement audit trails, service SLAs. |
| **M5** | Tech, Digital & Customer Analytics | Core banking infrastructure telemetry, digital channel UX analytics, fintech API latency logs, customer lifetime value (CLV) models, predictive cross-sell algorithms. |
| **M6** | System Administration & Audit Trail Vault | RBAC user configuration, system security logs, immutable transaction audit trails, SIEM security alerts. |

### 3.1 Sub-modules named across the sources

Sub-modules are referenced inconsistently between `[SRC-RBAC]` §3 and
`[SRC-MAIL]` §2. The union below is the full set of named sub-module surfaces;
each is a candidate authorization scope, and **none of them widens the parent
module grant**.

| Parent | Sub-module | Named by |
|---|---|---|
| M1 | Secretarial Sub-Module | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M1 | ExCo Dashboard | `[SRC-MAIL]` |
| M2 | Credit Evaluation Engine & Scoring Models | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M2 | Credit Collateral & Disbursement Vault | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M2 | Legal Risk & Litigation Sub-Module | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M2 | SME Credit | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M2 | Institutional Risk | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M2 | Regional Credit | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M2 | Cyber Risk | `[SRC-RBAC]` §4 |
| M3 | Financial Management & Ledger Engine | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M3 | Treasury Analytics / ALM / FX | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | Bancassurance Sales & Revenue Sub-Module | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | HR Learning Management Sub-Module / HR Learning Hub | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | HR Analytics & Strategic Project Modules / HR & Strategy | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | Project Management & PMO Dashboard | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | Operations & Service TAT Metrics | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | Procurement & Vendor Management Sub-Module / Procurement Hub | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | Commercial Business Hub / CIB | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | Institutional Banking Hub | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | Regional Operational Performance Hub | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | SME Commercial Hub | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4 | IT Ops | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4/M5 | Cards & Payment Analytics Engine | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M4/M5 | Marketing Campaign ROI Analytics | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M5 | Business Technology & Systems Sub-Module | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M5 | Data Analytics & Retail Customer Engine | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M5 | Fintech API & Partner Gateway Analytics | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M5 | Digital Channels & UX Analytics Sub-Module | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M5 | Tech — Security Logs | `[SRC-RBAC]` |
| M6 | Audit Vault (WORM) | `[SRC-RBAC]`, `[SRC-MAIL]` |
| M6 | System Telemetry | `[SRC-RBAC]` §4 |

---

## 4. Permission model

`[SRC-RBAC]` §2.1 — access levels codified for the DSS IAM Authorization Engine.

| Code | Name | Semantics |
|---|---|---|
| **R** | Read | View aggregated metrics, reports, dashboards, and analytics. |
| **D** | Drill-Down | Inspect underlying granular transactions and regional/branch-level details. |
| **C/E** | Create/Edit | Input data, modify models, run scenario simulations, configure parameters. |
| **A** | Approve | Authorize financial allocations, credit limits, system policy changes, report escalations. |
| **AU** | Audit | Read-only immutable access to system logs, user activity, and compliance tracking. |

### 4.1 Normative reading of the permission codes `[DERIVED]`

The sources use the codes without defining their algebra. The following is the
minimal consistent interpretation; it is **derived**, and if a source clarification
arrives it supersedes this.

- **R is the floor.** Any of D, C/E, A, or AU on a module implies R on that module.
  No source grants D, C/E, A, or AU without also granting R.
- **D is not implied by R.** Read grants aggregates only. Drill-down to granular
  transactions is a separate grant, because it is the boundary at which
  customer-level data becomes reachable.
- **C/E does not imply A.** Editing a model and approving its output are
  separated by INV-3 (SoD). Several positions hold C/E without A
  (e.g. Financial Controller, Head Talent and Learning).
- **A does not imply C/E.** Several positions approve without authoring
  (e.g. Head SME, Head Institutional Banking, Head Credit Administration).
- **AU is read-only and immutable-scope.** AU never implies C/E on the audited
  records. The CISO's C/E on M6 is scoped to *security policy configuration*,
  explicitly not to the audit records themselves.
- **Approve carries a threshold.** The MD/CEO's A is qualified *"High Thresholds"*;
  approval limits are an attribute of the grant, and the threshold values are
  **not specified in any source** (see gap G-4).
- **Permissions are per-module.** A position holding C/E on M3 and R on M2 holds
  no C/E on M2. There is no cross-module escalation.

---

## 5. Data visibility scopes

`[SRC-RBAC]` §3 "Data Visibility Scope" column — enforced server-side per INV-4.
The distinct scope families across all positions:

| Scope family | Meaning | Example holders |
|---|---|---|
| **Bank-wide, highest macro aggregation** | Top-level aggregates only; no granular rows | Chairman |
| **Bank-wide aggregated governance & audit reports** | Aggregates plus risk/audit report drill-down | INED |
| **Bank-wide macro metrics & financial statements** | Statements and macro metrics | NED |
| **Bank-wide full strategic & operational visibility** | All business modules, drill-down permitted | MD/CEO |
| **Bank-wide operational & divisional** | Divisional and regional operations | Executive Director |
| **Bank-wide full system read (unrestricted audit scope)** | The only unrestricted scope in the sources; **read-only** | Chief Internal Auditor |
| **Enterprise domain** | One functional domain bank-wide (financials, risk models, technology, legal, HR, treasury) | CFO, CRO, CTO, CLO, CPSO, CTMO |
| **Bank-wide system security logs, user access, SIEM telemetry** | Security and access telemetry | CISO |
| **Portfolio / product domain** | A specific portfolio, product line, or functional queue | SMT functional heads |
| **Board filings, legal compliance logs, statutory records** | Secretarial record set | Ag. Company Secretary |
| **Geographic region specific** | Branches, regional NPLs, regional SLAs for one region only | Regional Heads (5) |

---

## 6. Position catalog — responsibilities, modules, permissions, scope

`[SRC-RBAC]` §3, reproduced in full. This is the primary authority for grants.

### 6.1 Board of Directors / Governance tier (L3)

| Position | Core responsibilities | Accessible modules | Permissions | Data visibility scope |
|---|---|---|---|---|
| **Chairman** | Leads the Board of Directors, oversees bank-wide governance, aligns corporate strategy, evaluates executive leadership performance. | M1 (Executive & Board Governance Portal) | R, Executive Summary View | Bank-wide (highest macro aggregation) |
| **Independent Non-Executive Director (INED)** | Provides independent objective oversight, monitors internal audit findings, evaluates risk-appetite compliance, chairs audit/risk committees. | M1 (Governance), M2 (Risk & Compliance — read only) | R, D on risk/audit reports | Bank-wide aggregated governance & audit reports |
| **Non-Executive Director (NED)** | Represents shareholder interests, evaluates strategic business growth proposals, reviews long-term capital allocation policies. | M1 (Governance Portal) | R | Bank-wide macro metrics & financial statements |
| **Ag. Company Secretary** | Ensures legal compliance with corporate laws, manages board secretarial functions, records statutory minutes, maintains governance filings. | M1 (Governance Portal — Secretarial Sub-Module) | R, C/E on board documents | Board filings, legal compliance logs, statutory records |

### 6.2 Executive Leadership tier (L2)

| Position | Core responsibilities | Accessible modules | Permissions | Data visibility scope |
|---|---|---|---|---|
| **Managing Director / CEO** | Drives enterprise-wide strategy execution, financial profitability, stakeholder trust, overall operational alignment across all divisions. | M1, M2, M3, M4, M5 (all business modules) | R, D, A (high thresholds) | Bank-wide full strategic & operational visibility |
| **Executive Director** | Supports CEO in executive leadership, oversees regional management and operational business lines, drives key strategic initiatives. | M1, M2, M3, M4, M5 | R, D, A | Bank-wide operational & divisional scope |

### 6.3 Executive Committee (ExCo) tier (L2)

| Position | Core responsibilities | Accessible modules | Permissions | Data visibility scope |
|---|---|---|---|---|
| **Chief Financial Officer (CFO)** | Oversees financial planning, capital structure, regulatory capital reporting, GL integrity, taxation strategies. | M1, M3 (Financial & Treasury), M2 (Risk — financial) | R, D, C/E models, A | Enterprise financials, balance sheet, treasury & tax data |
| **Chief Risk Officer (CRO)** | Governs enterprise risk management frameworks (credit, market, operational, liquidity) and enforces risk-appetite boundaries. | M1, M2 (Enterprise Risk & Compliance), M3 (ALM/Treasury risk) | R, D, C/E models, A | Enterprise-wide risk models, credit portfolios & compliance |
| **Chief Technology Officer (CTO)** | Directs core banking systems, IT infrastructure reliability, digital product software architecture, technology spend optimization. | M1, M5 (Tech, Digital & Customer Analytics), M4 (IT Ops) | R, D, C/E, A | Bank-wide technology, systems, digital rails & infrastructure |
| **Chief Information Security Officer (CISO)** | Protects bank systems and customer data against cyber threats, data breaches, regulatory security violations, unauthorized system access. | M6 (Admin & Audit Vault), M5 (Tech — security logs), M2 (cyber risk) | R, AU, security policy config (C/E) | Bank-wide system security logs, user access, SIEM telemetry |
| **Chief Internal Auditor** | Provides independent assurance on internal controls, risk management, and regulatory compliance to the Board Audit Committee. | M1, M2, M3, M4, M5, M6 (system-wide read-only) | R (read-only), full D, AU | Bank-wide full system read access (unrestricted audit scope) |
| **Chief Legal Officer** | Manages legal risk exposure, litigation defense, corporate contract execution, regulatory compliance law, intellectual property. | M1, M2 (Legal Risk & Litigation Sub-Module) | R, D, C/E legal cases | Enterprise legal cases, regulatory disputes & contracts |
| **Chief People & Strategy Officer** | Directs strategic corporate growth plans, workforce productivity analytics, talent management, culture, organizational design. | M1, M4 (HR Analytics & Strategic Project Modules) | R, D, C/E strategy | Bank-wide HR metrics, headcount costs, strategic goals |
| **Chief Corporate & Institutional Banking Officer** | Leads corporate banking relationships, large commercial lending, deposit growth, institutional trade finance products. | M1, M2 (Corporate Credit Risk), M4 (Commercial Business Hub) | R, D, A corporate credit | Corporate & institutional client portfolios & commercial credit |
| **Chief Treasury & Markets Officer** | Controls bank liquidity management, ALM, foreign exchange trading, interbank investments. | M1, M3 (Financial Management & Treasury Analytics) | R, D, C/E FX/ALM models, A | Treasury operations, money markets, FX exposure & liquidity |

### 6.4 Senior Management Team (SMT) tier (L1)

| Position | Core responsibilities | Accessible modules | Permissions | Data visibility scope |
|---|---|---|---|---|
| **Head Bancassurance** | Manages distribution of insurance products, third-party insurer partner ties, insurance commission revenue streams. | M4 (Bancassurance Sales & Revenue) | R, D, C/E targets | Bancassurance sales, commissions & partner policy data |
| **Head of Credit Evaluation** | Directs credit risk underwriting, debt-capacity assessment models, loan rating evaluations, credit approval queues. | M2 (Credit Evaluation Engine & Scoring Models) | R, D, C/E risk ratings, A credit | Retail, SME & commercial credit underwriting applications |
| **Head Talent and Learning** | Oversees staff competency development, training programs, leadership pipelines, employee performance reviews. | M4 (HR Learning Management) | R, C/E training plans | Bank-wide staff competency, training costs & performance ratings |
| **Head Change and Project Management** | Directs project portfolio management (PMO), strategic change implementation, digital transformation milestones. | M4 (Project Management & PMO Dashboard) | R, D, C/E project plans | Bank-wide project spend, milestones & change deliverables |
| **Head Marketing and Communications** | Drives corporate brand communications, customer acquisition campaigns, media relations, market research. | M4, M5 (Marketing Campaign ROI Analytics) | R, C/E campaign models | Marketing spend, brand sentiment, campaign ROI & CAC data |
| **Head SME** | Drives loan portfolio growth, deposit acquisition, relationship manager performance, credit quality for SME clients. | M2 (SME Credit), M4 (SME Commercial Hub) | R, D, A SME credit | Small & medium enterprise client portfolios & sector analytics |
| **Head Operations and Services** | Manages centralized clearing, branch operations standards, cash handling limits, operational service TAT. | M4 (Operations & Service TAT Metrics) | R, D, C/E operational workflows | Branch operations, clearing analytics, cash limits & TAT SLAs |
| **Head Procurement and Administration** | Directs vendor procurement processes, facility management, fixed-asset tracking, administrative expenditure. | M4 (Procurement & Vendor Management) | R, D, create POs / A vendor contracts | Procurement purchase orders, vendor contracts & fixed-asset data |
| **Head Cards & Payments** | Oversees card issuing (debit/credit), ATM/POS acquiring networks, interchange revenue, payment gateway infrastructure. | M4, M5 (Cards & Payment Analytics Engine) | R, D, C/E product schemes | Card transaction volumes, POS/ATM uptime & acquiring revenue |
| **Head Institutional Banking** | Manages commercial banking relationships for government bodies, public-sector institutions, NGOs, foreign missions. | M2 (Institutional Risk), M4 (Institutional Banking Hub) | R, D, A institutional accounts | Public sector & institutional client accounts & yield metrics |
| **Head Business Technology** | Bridges core business needs with IT software delivery, core banking custom modifications, enterprise business software. | M5 (Business Technology & Systems) | R, D, configure business systems (C/E) | Core banking module configurations & software request queues |
| **Head Credit Administration** | Oversees loan perfection, legal collateral documentation, title deed verification, post-approval loan disbursement execution. | M2 (Credit Collateral & Disbursement Vault) | R, D, A loan disbursement release | Collateral verification data, legal deeds & disbursement limits |
| **Financial Controller** | Manages day-to-day GL reconciliations, tax returns, monthly financial accounts, budget variance accounting. | M3 (Financial Management & Ledger Engine) | R, D, C/E GL entries | General ledger accounts, trial balance, tax & reconciliation data |
| **Head Data Analytics and Retail Products** | Develops analytics models for retail banking products, customer segmentation, predictive cross-selling, churn reduction. | M5 (Data Analytics & Retail Customer Engine) | R, D, build data models (C/E) | Retail customer analytics, CLV algorithms & product profitability |
| **Head Fintech Partnerships** | Oversees API integrations with mobile money operators, fintech aggregators, digital payment rails, third-party tech partners. | M5 (Fintech API & Partner Gateway Analytics) | R, D, configure API partner rules (C/E) | Fintech API traffic, revenue shares, latency & error telemetry |
| **Head Digitisation and Innovation** | Drives adoption of digital mobile/internet banking channels, UX journey optimization, automation of manual workflows. | M5 (Digital Channels & UX Analytics) | R, D, create digital workflows (C/E) | Mobile/internet banking traffic, UX drop-offs & automation metrics |
| **Regional Heads** (Kampala, CBD, Western, Eastern, Northern) | Direct branch networks, regional deposit mobilization, localized loan portfolio growth, operational compliance within their geographic region. | M2 (Regional Credit), M4 (Regional Operational Performance Hub) | R, **D — regional scope only**, A regional operations | Geographic-region-specific data (branches, regional NPLs, regional SLAs) |

---

## 7. Master authorization cross-matrix

`[SRC-RBAC]` §4 — *"configuration rules for the IAM Security Rule Engine,"*
mapping position tiers against M1–M6. **Reproduced verbatim.** Note that several
cells are broader than the §6 per-position tables; see
[§11](#11-open-questions--unresolved-conflicts) C-1…C-5 before implementing.

| Position / role tier | M1: Board | M2: Risk | M3: Fin/Treasury | M4: Ops/Reg | M5: Tech/Digital | M6: Admin/Audit |
|---|---|---|---|---|---|---|
| Board Chairman / INEDs | R | R | R | No Access | No Access | No Access |
| MD / CEO | Full (R/D/A) | Full (R/D/A) | Full (R/D/A) | Full (R/D/A) | Full (R/D/A) | Read Logs |
| Chief Risk Officer (CRO) | Executive (R) | Full (R/D/C/A) | Risk View (R/D) | Credit Ops (R) | No Access | No Access |
| Chief Financial Officer (CFO) | Executive (R) | Fin Risk (R) | Full (R/D/C/A) | Procurement (R) | No Access | No Access |
| Chief Tech Officer (CTO) | Executive (R) | No Access | No Access | IT Ops (R/D) | Full (R/D/C/A) | Sys Telemetry |
| Chief Info Security Officer | No Access | Cyber Risk (R) | No Access | No Access | Sec Logs (R) | Full Audit (AU) |
| Chief Internal Auditor | Audit (R/D) | Audit (R/D) | Audit (R/D) | Audit (R/D) | Audit (R/D) | Full Audit (AU) |
| Regional Heads (5 regions) | No Access | Reg Risk (R/D) | No Access | Regional (R/D/A) | No Access | No Access |
| Functional SMT Heads | No Access | Domain specific | Domain specific | Domain specific | Domain specific | No Access |

**"Domain specific" is not a grant.** For Functional SMT Heads the cross-matrix
defers to §6.4. Resolve every SMT head's modules from [§6.4](#64-senior-management-team-smt-tier-l1), never from this row.

---

## 8. Functional email directory & IAM alignment

`[SRC-MAIL]` §1, §2 — the official enterprise directory of role-based functional
email aliases for all governance bodies, executive offices, and senior management
positions, configured in the bank's IAM system and synchronized with the DSS
authorization framework.

### 8.1 Why functional aliases

> **Role-based continuity & IAM security `[SRC-MAIL]`:** functional email aliases
> are assigned to specific governance roles, executive offices, and departmental
> divisions rather than personal individual accounts. This ensures seamless
> continuity of communication, historical audit trails, and strict role-based
> access control during personnel transitions.

**Implementation consequence `[DERIVED]`:** the alias — not a person — is the
stable identity key. Authorization records bind to the role/alias; person records
bind to the role by assignment with a validity period. Never store a grant against
a personal account.

### 8.2 Governance & Board tier

| Position / role title | Functional alias | Mapped modules `[SRC-MAIL]` | Primary functional scope |
|---|---|---|---|
| Chairman | `chairman.office@pearlbank.ug` | M1 (Governance Portal) | Board governance & oversight |
| Board of Directors | `board.directors@pearlbank.ug` | M1 (Governance Portal) | Collective board matters |
| Independent Non-Executive Director (INED) | `ined.pool@pearlbank.ug` | M1 (Gov), M2 (Risk) | Independent oversight & committees |
| Non-Executive Director (NED) | `ned.pool@pearlbank.ug` | M1 (Governance Portal) | Shareholder & strategy oversight |
| Ag. Company Secretary | `board.secretary@pearlbank.ug` | M1 (Secretarial Sub-Module) | Statutory secretarial & filings |

### 8.3 Executive Leadership tier

| Position / role title | Functional alias | Mapped modules `[SRC-MAIL]` | Primary functional scope |
|---|---|---|---|
| Managing Director / CEO | `ceo.office@pearlbank.ug` | M1, M2, M3, M4, M5 | Enterprise executive steering |
| Executive Director | `executive.directors@pearlbank.ug` | M1, M2, M3, M4, M5 | Executive operations & leadership |

### 8.4 Executive Committee (ExCo) tier

| Position / role title | Functional alias | Mapped modules `[SRC-MAIL]` | Primary functional scope |
|---|---|---|---|
| ExCo Secretariat | `exco.secretariat@pearlbank.ug` | M1, M4 (ExCo Dashboard) | Executive committee matters |
| Chief Technology Officer | `cto.office@pearlbank.ug` | M1, M5 (Tech), M4 (IT Ops) | Technology & systems infrastructure |
| Chief Financial Officer | `cfo.office@pearlbank.ug` | M1, M3 (Financials), M2 (Risk) | Financial management & capital |
| Chief People & Strategy Officer | `strategy.hr@pearlbank.ug` | M1, M4 (HR & Strategy) | HR analytics & corporate strategy |
| Chief Internal Auditor | `internal.audit@pearlbank.ug` | M1–M6 (read-only) | Independent audit & controls |
| Chief Legal Officer | `legal.department@pearlbank.ug` | M1, M2 (Legal Risk) | Legal affairs & litigation |
| Chief Risk Officer | `risk.management@pearlbank.ug` | M1, M2 (Risk), M3 (Treasury) | Enterprise risk management |
| Chief Corporate & Institutional Officer | `cib.division@pearlbank.ug` | M1, M2 (Credit), M4 (CIB) | Corporate banking division |
| Chief Information Security Officer | `ciso.security@pearlbank.ug` | M6 (Audit/Admin), M5 (Tech) | Cyber security & access vault |
| Chief Treasury & Markets Officer | `treasury.markets@pearlbank.ug` | M1, M3 (Treasury Analytics) | Treasury, FX & liquidity |

### 8.5 SMT tier — functional heads

| Position / role title | Functional alias | Mapped modules `[SRC-MAIL]` | Primary functional scope |
|---|---|---|---|
| Head Bancassurance | `bancassurance@pearlbank.ug` | M4 (Bancassurance Hub) | Insurance products & partners |
| Head of Credit Evaluation | `credit.evaluation@pearlbank.ug` | M2 (Credit Scoring/Evaluation) | Credit risk underwriting |
| Head Talent and Learning | `talent.learning@pearlbank.ug` | M4 (HR Learning Hub) | Talent development & LMS |
| Head Change and Project Management | `pmo.change@pearlbank.ug` | M4 (Project PMO) | Project management office |
| Head Marketing and Communications | `marketing.comm@pearlbank.ug` | M4, M5 (Marketing ROI) | Brand, PR & marketing campaigns |
| Head SME | `sme.banking@pearlbank.ug` | M2 (SME Credit), M4 (SME Hub) | SME portfolio & growth |
| Head Operations and Services | `operations.services@pearlbank.ug` | M4 (Operations & Service TAT) | Branch operations & clearing |
| Head Procurement and Administration | `procurement.admin@pearlbank.ug` | M4 (Procurement Hub) | Procurement & fixed assets |
| Head Cards & Payments | `cards.payments@pearlbank.ug` | M4, M5 (Cards & Payments) | Cards, POS & payment rails |
| Head Institutional Banking | `institutional.banking@pearlbank.ug` | M2 (Risk), M4 (Inst Hub) | Public sector & institutional clients |
| Head Business Technology | `business.tech@pearlbank.ug` | M5 (Business Systems) | Core banking customizations |
| Head Credit Administration | `credit.admin@pearlbank.ug` | M2 (Credit Collateral) | Collateral & loan perfection |
| Financial Controller | `financial.control@pearlbank.ug` | M3 (Financial Management) | General ledger & reconciliations |
| Head Data Analytics and Retail Products | `data.retail@pearlbank.ug` | M5 (Retail Data Analytics) | Retail analytics & churn models |
| Head Fintech Partnerships | `fintech.partnerships@pearlbank.ug` | M5 (Fintech Gateway) | API integrations & payment rails |
| Head Digitisation and Innovation | `digitisation.innovation@pearlbank.ug` | M5 (Digital Channels) | Digital banking & automation |

### 8.6 SMT tier — regional management

| Position / role title | Functional alias | Mapped modules `[SRC-MAIL]` | Primary functional scope |
|---|---|---|---|
| Regional Head (Greater Kampala) | `regional.kampala@pearlbank.ug` | M2 (Risk), M4 (Regional Hub) | Greater Kampala branch network |
| Regional Head (CBD) | `regional.cbd@pearlbank.ug` | M2 (Risk), M4 (Regional Hub) | Central business district network |
| Regional Head (Western) | `regional.western@pearlbank.ug` | M2 (Risk), M4 (Regional Hub) | Western region branch network |
| Regional Head (Eastern) | `regional.eastern@pearlbank.ug` | M2 (Risk), M4 (Regional Hub) | Eastern region branch network |
| Regional Head (Northern) | `regional.northern@pearlbank.ug` | M2 (Risk), M4 (Regional Hub) | Northern region branch network |

### 8.7 Directory reconciliation `[DERIVED]`

38 aliases across the directory; 36 positions carry grants in `[SRC-RBAC]` §3
(31 individual rows + 5 regional heads folded into one row). The two aliases with
**no corresponding RBAC entry**:

- `board.directors@pearlbank.ug` — Board of Directors as a collective body.
- `exco.secretariat@pearlbank.ug` — ExCo Secretariat.

Both are gaps, not grants: see G-1 and G-2. An alias existing in the directory is
**not** authority to provision DSS access.

### 8.8 IAM provisioning & security rules

`[SRC-MAIL]` §3

- **Single Sign-On (SSO) integration.** Functional email aliases are mapped to
  Active Directory / Entra ID security groups. When an individual is assigned to
  a role, their primary account **inherits** the functional mailbox and the
  associated DSS RBAC rights.
- **Multi-Factor Authentication (MFA).** All functional accounts mandate hardware
  token or authenticator-app MFA before grant of access to DSS reporting modules.
- **Audit vault logging.** Messages and authorization actions executed under
  functional aliases are logged immutably in **M6**.

---

## 9. Technical implementation & security mandates

`[SRC-RBAC]` §5 — mandatory, and each one is a testable control.

| ID | Mandate | Requirement |
|---|---|---|
| **SEC-1** | Multi-Factor Authentication | Mandatory hardware/software MFA token enforcement for all positions accessing **M1, M2, M3, and M6**. (`[SRC-MAIL]` §3 states MFA before access to *any* DSS reporting module — see C-6.) |
| **SEC-2** | ABAC extension | Beyond role, every access request must validate **user location, IP subnet, and branch device security posture**. RBAC alone is insufficient to authorize a request. |
| **SEC-3** | Data masking & PII protection | PII such as customer account numbers and personal identity numbers is **dynamically masked for all SMT and ExCo levels**, unmaskable only by authorized Credit Admin / Branch Leads. |
| **SEC-4** | Immutable security logging | All module accesses, query executions, drill-down actions, and report exports are logged to a tamper-proof **WORM** audit vault under CISO oversight. |

### 9.1 What these mandates imply for code `[DERIVED]`

- **SEC-2 makes the authorization decision multi-factor.** The check signature is
  `(role, module, action, resource_scope, location, ip_subnet, device_posture)`.
  A role-only check is non-compliant. Design the policy decision point to take
  the full request context from the start.
- **SEC-3 inverts the usual seniority assumption.** Seniority *reduces* PII
  visibility. An ExCo or SMT view must mask account numbers and identity numbers
  by default; the unmask path belongs to specific operational roles, which the
  sources do not fully define (gap G-7). Never implement unmask as an admin or
  superuser capability.
- **SEC-4 makes logging part of the read path.** Drill-downs and report exports
  are logged events, not just data responses. A read that cannot be logged must
  fail closed.
- **SEC-1 + SEC-4 + INV-2 together** mean M6 is the control plane: it holds RBAC
  configuration *and* the audit record of that configuration changing. Treat M6
  writes as the most sensitive operation in the system.

---

## 10. Canonical identifiers and data model `[DERIVED]`

Everything in this section is derived for implementation consistency. The sources
define no identifiers. Agents should use these exact codes so that independently
written modules agree; if a source assigns official codes later, migrate.

### 10.1 Enums

```
Module        := M1 | M2 | M3 | M4 | M5 | M6
Permission    := READ | DRILL_DOWN | CREATE_EDIT | APPROVE | AUDIT
GovernanceTier:= L0_OPERATIONAL | L1_SMT | L2_EXCO | L3_BOARD
ScopeKind     := BANK_WIDE_MACRO | BANK_WIDE_FULL | AUDIT_UNRESTRICTED
               | ENTERPRISE_DOMAIN | PORTFOLIO_DOMAIN | REGIONAL | BOARD_FILINGS
Region        := GREATER_KAMPALA | CBD | WESTERN | EASTERN | NORTHERN
RaciRole      := RESPONSIBLE | ACCOUNTABLE | CONSULTED | INFORMED
```

### 10.2 Role codes

Derived from the alias local-part so that code, alias, and AD group stay in step.

| Role code | Alias local-part | Tier |
|---|---|---|
| `GOV_CHAIRMAN` | `chairman.office` | L3_BOARD |
| `GOV_BOARD_DIRECTORS` | `board.directors` | L3_BOARD |
| `GOV_INED` | `ined.pool` | L3_BOARD |
| `GOV_NED` | `ned.pool` | L3_BOARD |
| `GOV_COMPANY_SECRETARY` | `board.secretary` | L3_BOARD |
| `EXE_MD_CEO` | `ceo.office` | L2_EXCO |
| `EXE_EXECUTIVE_DIRECTOR` | `executive.directors` | L2_EXCO |
| `EXC_SECRETARIAT` | `exco.secretariat` | L2_EXCO |
| `EXC_CTO` | `cto.office` | L2_EXCO |
| `EXC_CFO` | `cfo.office` | L2_EXCO |
| `EXC_CPSO` | `strategy.hr` | L2_EXCO |
| `EXC_CIA` (Chief Internal Auditor) | `internal.audit` | L2_EXCO |
| `EXC_CLO` | `legal.department` | L2_EXCO |
| `EXC_CRO` | `risk.management` | L2_EXCO |
| `EXC_CCIBO` | `cib.division` | L2_EXCO |
| `EXC_CISO` | `ciso.security` | L2_EXCO |
| `EXC_CTMO` | `treasury.markets` | L2_EXCO |
| `SMT_BANCASSURANCE` | `bancassurance` | L1_SMT |
| `SMT_CREDIT_EVALUATION` | `credit.evaluation` | L1_SMT |
| `SMT_TALENT_LEARNING` | `talent.learning` | L1_SMT |
| `SMT_PMO_CHANGE` | `pmo.change` | L1_SMT |
| `SMT_MARKETING_COMM` | `marketing.comm` | L1_SMT |
| `SMT_SME` | `sme.banking` | L1_SMT |
| `SMT_OPERATIONS_SERVICES` | `operations.services` | L1_SMT |
| `SMT_PROCUREMENT_ADMIN` | `procurement.admin` | L1_SMT |
| `SMT_CARDS_PAYMENTS` | `cards.payments` | L1_SMT |
| `SMT_INSTITUTIONAL_BANKING` | `institutional.banking` | L1_SMT |
| `SMT_BUSINESS_TECH` | `business.tech` | L1_SMT |
| `SMT_CREDIT_ADMIN` | `credit.admin` | L1_SMT |
| `SMT_FINANCIAL_CONTROLLER` | `financial.control` | L1_SMT |
| `SMT_DATA_RETAIL` | `data.retail` | L1_SMT |
| `SMT_FINTECH_PARTNERSHIPS` | `fintech.partnerships` | L1_SMT |
| `SMT_DIGITISATION_INNOVATION` | `digitisation.innovation` | L1_SMT |
| `REG_KAMPALA` | `regional.kampala` | L1_SMT |
| `REG_CBD` | `regional.cbd` | L1_SMT |
| `REG_WESTERN` | `regional.western` | L1_SMT |
| `REG_EASTERN` | `regional.eastern` | L1_SMT |
| `REG_NORTHERN` | `regional.northern` | L1_SMT |

### 10.3 Core entities

```
Role
  role_code            Role codes above (PK)
  title                Official position title from [SRC-RBAC] §3 / [SRC-MAIL] §2
  functional_alias     <local-part>@pearlbank.ug  (unique)
  governance_tier      GovernanceTier
  ad_group             Entra ID / AD security group  -- SSO mapping, [SRC-MAIL] §3
  responsibilities     Text, verbatim from [SRC-RBAC] §3
  provisioned          Boolean -- false for roles with an alias but no RBAC grant (G-1, G-2)

Grant                                  -- the authorization record; one row per (role, module)
  role_code            -> Role
  module               Module
  permissions          Set<Permission>
  sub_module_scope     Set<String> | NULL   -- NULL = whole module; never widens the module grant
  scope_kind           ScopeKind
  scope_qualifier      e.g. Region for REG_*; NULL otherwise
  approval_threshold   Numeric | NULL       -- unspecified in sources, see G-4
  source_ref           '[SRC-RBAC] §3' | '[SRC-RBAC] §4'   -- provenance of this grant
  conflict_note        Text | NULL          -- set when §3 and §4 disagree

Assignment                             -- person -> role, time-bounded
  person_id, role_code, valid_from, valid_to, assigned_by

AccessDecision                         -- SEC-4; written for every attempt, allow or deny
  ts, person_id, role_code, module, sub_module, action,
  resource_ref, scope_evaluated,
  location, ip_subnet, device_posture,          -- SEC-2 inputs
  mfa_satisfied, pii_masked, decision, deny_reason
  -- destination: M6 WORM vault; append-only, no UPDATE, no DELETE
```

### 10.4 Authorization check algorithm

The policy decision point must evaluate **in this order** and fail closed at
every step. Short-circuiting an earlier step on the basis of seniority is a
defect, not an optimization.

```
authorize(person, module, sub_module, action, resource):
  1. role        := active_assignment(person).role_code         else DENY no_active_role
  2. grant       := Grant[role, module]                         else DENY module_not_granted
  3. if sub_module and grant.sub_module_scope is not NULL
         and sub_module not in grant.sub_module_scope           -> DENY sub_module_out_of_scope
  4. if action not in grant.permissions                         -> DENY permission_not_held
  5. if module in {M1, M2, M3, M6} and not mfa_satisfied(person)-> DENY mfa_required   # SEC-1
  6. abac := validate(location, ip_subnet, device_posture)      # SEC-2
     if not abac.ok                                             -> DENY abac_failed
  7. if not in_scope(resource, grant.scope_kind,
                     grant.scope_qualifier)                     -> DENY out_of_data_scope
  8. if action == APPROVE and grant.approval_threshold is not NULL
         and resource.amount > grant.approval_threshold         -> DENY above_threshold
  9. mask := pii_policy(role.governance_tier, grant)            # SEC-3
 10. log AccessDecision(...)                                    # SEC-4, fail closed if unloggable
 11. ALLOW with masking = mask
```

**Notes for implementers:**

- Step 7 is where the regional constraint bites: `REG_*` roles hold `DRILL_DOWN`
  but only within `scope_qualifier`, per `[SRC-RBAC]` §3 *"D — Regional Scope Only."*
- Step 9: `pii_policy` masks for `L1_SMT` and `L2_EXCO` per SEC-3. The unmask
  path is **not** a tier escalation; it is a separate grant held by operational
  roles that the sources do not enumerate (G-7).
- Step 10 must execute for denials too. A denial is itself audit evidence.
- `EXC_CIA` (Chief Internal Auditor) passes step 2 on all six modules but holds
  no `CREATE_EDIT` or `APPROVE` anywhere — enforce that at the grant level, not
  by convention.

### 10.5 Grant seed — the narrow reading

Seed data below implements the authority order in §0.1: §6 per-position tables
first, cross-matrix cells applied only where §6 is silent **and** the cell does
not contradict §6. Rows that the cross-matrix would widen are marked so the
conflict stays visible in the data.

| role_code | module | permissions | scope_kind | conflict_note |
|---|---|---|---|---|
| `GOV_CHAIRMAN` | M1 | READ | BANK_WIDE_MACRO | — |
| `GOV_CHAIRMAN` | M2, M3 | *not granted* | — | **C-1:** §4 grants READ; §6 omits. Narrow reading applied. |
| `GOV_INED` | M1 | READ | BANK_WIDE_MACRO | — |
| `GOV_INED` | M2 | READ, DRILL_DOWN (risk/audit reports) | BANK_WIDE_MACRO | — |
| `GOV_INED` | M3 | *not granted* | — | **C-2:** §4 grants READ; §6 omits. |
| `GOV_NED` | M1 | READ | BANK_WIDE_MACRO | — |
| `GOV_COMPANY_SECRETARY` | M1 (Secretarial) | READ, CREATE_EDIT | BOARD_FILINGS | — |
| `EXE_MD_CEO` | M1–M5 | READ, DRILL_DOWN, APPROVE | BANK_WIDE_FULL | threshold unspecified (G-4) |
| `EXE_MD_CEO` | M6 | *not granted* | — | **C-3:** §4 grants "Read Logs"; §6 and `[SRC-MAIL]` omit M6. |
| `EXE_EXECUTIVE_DIRECTOR` | M1–M5 | READ, DRILL_DOWN, APPROVE | BANK_WIDE_FULL | — |
| `EXC_CFO` | M1 | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CFO` | M2 (financial risk) | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CFO` | M3 | READ, DRILL_DOWN, CREATE_EDIT, APPROVE | ENTERPRISE_DOMAIN | — |
| `EXC_CFO` | M4 | *not granted* | — | **C-4:** §4 grants Procurement (R); §6 and `[SRC-MAIL]` omit. |
| `EXC_CRO` | M1 | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CRO` | M2 | READ, DRILL_DOWN, CREATE_EDIT, APPROVE | ENTERPRISE_DOMAIN | — |
| `EXC_CRO` | M3 (ALM/treasury risk) | READ, DRILL_DOWN | ENTERPRISE_DOMAIN | — |
| `EXC_CRO` | M4 | *not granted* | — | **C-5:** §4 grants Credit Ops (R); §6 and `[SRC-MAIL]` omit. |
| `EXC_CTO` | M1 | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CTO` | M4 (IT Ops) | READ, DRILL_DOWN | ENTERPRISE_DOMAIN | — |
| `EXC_CTO` | M5 | READ, DRILL_DOWN, CREATE_EDIT, APPROVE | ENTERPRISE_DOMAIN | — |
| `EXC_CTO` | M6 | *not granted* | — | **C-3:** §4 grants "Sys Telemetry"; §6 and `[SRC-MAIL]` omit. |
| `EXC_CISO` | M2 (cyber risk) | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CISO` | M5 (security logs) | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CISO` | M6 | READ, AUDIT, CREATE_EDIT *(security policy config only)* | ENTERPRISE_DOMAIN | SoD concern S-1 |
| `EXC_CIA` | M1–M5 | READ, DRILL_DOWN, AUDIT | AUDIT_UNRESTRICTED | read-only; never C/E or A |
| `EXC_CIA` | M6 | READ, AUDIT | AUDIT_UNRESTRICTED | — |
| `EXC_CLO` | M1 | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CLO` | M2 (Legal Risk & Litigation) | READ, DRILL_DOWN, CREATE_EDIT | ENTERPRISE_DOMAIN | — |
| `EXC_CPSO` | M1 | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CPSO` | M4 (HR Analytics, Strategic Projects) | READ, DRILL_DOWN, CREATE_EDIT | ENTERPRISE_DOMAIN | — |
| `EXC_CCIBO` | M1 | READ | PORTFOLIO_DOMAIN | — |
| `EXC_CCIBO` | M2 (Corporate Credit Risk) | READ, DRILL_DOWN, APPROVE | PORTFOLIO_DOMAIN | — |
| `EXC_CCIBO` | M4 (Commercial Business Hub) | READ, DRILL_DOWN | PORTFOLIO_DOMAIN | — |
| `EXC_CTMO` | M1 | READ | ENTERPRISE_DOMAIN | — |
| `EXC_CTMO` | M3 | READ, DRILL_DOWN, CREATE_EDIT, APPROVE | ENTERPRISE_DOMAIN | — |
| `EXC_SECRETARIAT` | — | *not provisioned* | — | **G-2:** alias exists, no RBAC entry. |
| `GOV_BOARD_DIRECTORS` | — | *not provisioned* | — | **G-1:** collective alias, no RBAC entry. |
| `SMT_BANCASSURANCE` | M4 (Bancassurance) | READ, DRILL_DOWN, CREATE_EDIT | PORTFOLIO_DOMAIN | — |
| `SMT_CREDIT_EVALUATION` | M2 (Credit Evaluation) | READ, DRILL_DOWN, CREATE_EDIT, APPROVE | PORTFOLIO_DOMAIN | SoD concern S-2 |
| `SMT_TALENT_LEARNING` | M4 (HR LMS) | READ, CREATE_EDIT | PORTFOLIO_DOMAIN | no DRILL_DOWN in §6.4 |
| `SMT_PMO_CHANGE` | M4 (PMO) | READ, DRILL_DOWN, CREATE_EDIT | PORTFOLIO_DOMAIN | — |
| `SMT_MARKETING_COMM` | M4, M5 (Campaign ROI) | READ, CREATE_EDIT | PORTFOLIO_DOMAIN | no DRILL_DOWN in §6.4 |
| `SMT_SME` | M2 (SME Credit), M4 (SME Hub) | READ, DRILL_DOWN, APPROVE | PORTFOLIO_DOMAIN | — |
| `SMT_OPERATIONS_SERVICES` | M4 (Ops & TAT) | READ, DRILL_DOWN, CREATE_EDIT | PORTFOLIO_DOMAIN | — |
| `SMT_PROCUREMENT_ADMIN` | M4 (Procurement) | READ, DRILL_DOWN, CREATE_EDIT *(POs)*, APPROVE *(vendor contracts)* | PORTFOLIO_DOMAIN | — |
| `SMT_CARDS_PAYMENTS` | M4, M5 (Cards & Payments) | READ, DRILL_DOWN, CREATE_EDIT | PORTFOLIO_DOMAIN | — |
| `SMT_INSTITUTIONAL_BANKING` | M2 (Institutional Risk), M4 (Inst Hub) | READ, DRILL_DOWN, APPROVE | PORTFOLIO_DOMAIN | — |
| `SMT_BUSINESS_TECH` | M5 (Business Tech & Systems) | READ, DRILL_DOWN, CREATE_EDIT | PORTFOLIO_DOMAIN | — |
| `SMT_CREDIT_ADMIN` | M2 (Collateral & Disbursement) | READ, DRILL_DOWN, APPROVE *(disbursement release)* | PORTFOLIO_DOMAIN | holds PII unmask? see G-7 |
| `SMT_FINANCIAL_CONTROLLER` | M3 (Ledger Engine) | READ, DRILL_DOWN, CREATE_EDIT *(GL entries)* | PORTFOLIO_DOMAIN | no APPROVE — SoD |
| `SMT_DATA_RETAIL` | M5 (Retail Analytics) | READ, DRILL_DOWN, CREATE_EDIT *(models)* | PORTFOLIO_DOMAIN | — |
| `SMT_FINTECH_PARTNERSHIPS` | M5 (Fintech Gateway) | READ, DRILL_DOWN, CREATE_EDIT *(API partner rules)* | PORTFOLIO_DOMAIN | — |
| `SMT_DIGITISATION_INNOVATION` | M5 (Digital Channels & UX) | READ, DRILL_DOWN, CREATE_EDIT *(workflows)* | PORTFOLIO_DOMAIN | — |
| `REG_*` (5 roles) | M2 (Regional Credit) | READ, DRILL_DOWN | REGIONAL | `scope_qualifier` = own region |
| `REG_*` (5 roles) | M4 (Regional Hub) | READ, DRILL_DOWN, APPROVE | REGIONAL | `scope_qualifier` = own region |

### 10.6 Test matrix — minimum cases before any grant code ships

| # | Case | Expected |
|---|---|---|
| T-1 | `REG_WESTERN` drills into an Eastern-region branch NPL | DENY `out_of_data_scope` |
| T-2 | `REG_WESTERN` drills into own-region branch NPL | ALLOW |
| T-3 | `EXC_CIA` attempts `CREATE_EDIT` on an M3 GL model | DENY `permission_not_held` |
| T-4 | `EXC_CIA` reads and drills M1–M6 | ALLOW, all six |
| T-5 | `EXC_CTO` reads M2 risk dashboard | DENY `module_not_granted` |
| T-6 | `EXC_CFO` approves in M3 | ALLOW |
| T-7 | `EXC_CFO` approves in M2 | DENY `permission_not_held` (READ only) |
| T-8 | `GOV_CHAIRMAN` requests granular transaction drill-down in M1 | DENY `permission_not_held` (no D) |
| T-9 | Any role reads M1 without MFA | DENY `mfa_required` |
| T-10 | Valid role, valid module, untrusted device posture | DENY `abac_failed` |
| T-11 | `EXC_CFO` views a customer account number in an M3 report | ALLOW with PII masked |
| T-12 | `SMT_FINANCIAL_CONTROLLER` attempts APPROVE on own GL entry | DENY `permission_not_held` (SoD) |
| T-13 | `GOV_BOARD_DIRECTORS` or `EXC_SECRETARIAT` attempts any module | DENY `module_not_granted` (unprovisioned, G-1/G-2) |
| T-14 | Every denial above | an `AccessDecision` row exists in M6 |
| T-15 | Audit vault write attempt of UPDATE or DELETE on `AccessDecision` | rejected — WORM, SEC-4 |
| T-16 | `EXC_CISO` attempts to edit an existing audit record in M6 | DENY — C/E is security-policy-config scoped only |
| T-17 | Logging subsystem unavailable during an authorized read | DENY — fail closed, SEC-4 |

---

## 11. Open questions & unresolved conflicts

These are **not** for an agent to resolve by inference. Each needs a decision from
the specification owners (Enterprise Architecture & Analytics Division; CISO for
security items). Until resolved, implement the narrow reading and keep the
`conflict_note` populated.

### Conflicts between sources

| ID | Conflict | Narrow reading applied | Needs |
|---|---|---|---|
| **C-1** | Chairman: §6.1 grants M1 only; §7 cross-matrix grants M1+M2+M3 (R). | M1 only. | Decision: does the Chairman hold read on M2/M3? |
| **C-2** | INED: §6.1 grants M1+M2; §7 adds M3 (R) and omits the drill-down §6.1 grants. | M1+M2 with risk/audit drill-down. | Decision on M3; confirm D on risk/audit reports. |
| **C-3** | MD/CEO and CTO: §7 grants M6 ("Read Logs", "Sys Telemetry"); §6.2/§6.3 and `[SRC-MAIL]` omit M6 entirely. | No M6. | Decision — M6 is the control plane; this matters. |
| **C-4** | CFO: §7 grants M4 Procurement (R); §6.3 and `[SRC-MAIL]` omit M4. | No M4. | Decision. |
| **C-5** | CRO: §7 grants M4 Credit Ops (R); §6.3 and `[SRC-MAIL]` omit M4. | No M4. | Decision. |
| **C-6** | MFA scope: `[SRC-RBAC]` SEC-1 mandates MFA for M1, M2, M3, M6. `[SRC-MAIL]` §3 mandates MFA before access to **any** DSS reporting module. | Enforce MFA on all six modules — the stricter control. | Confirm; if M4/M5 are genuinely exempt, say so explicitly. |
| **C-7** | CISO module set: §6.3 lists M6+M5+M2; `[SRC-MAIL]` lists only M6+M5 (omits M2 cyber risk). | §6.3 governs: M2 cyber risk read included. | Correct the directory entry. |
| **C-8** | `[SRC-MAIL]` alias `executive.directors@` (plural) maps to the singular position "Executive Director". | Treat as one role with one alias. | Confirm whether multiple Executive Directors share the alias. |
| **C-9** | NED has no row in the §7 cross-matrix; the row reads "Board Chairman / INEDs". | §6.1 governs: M1 read only. | Confirm NED is intentionally outside the cross-matrix row. |
| **C-10** | §7 has no rows for CLO, CPSO, CCIBO, CTMO, Company Secretary, Executive Director, ExCo Secretariat. They are neither "Functional SMT Heads" nor any listed tier. | §6 governs for all of them. | Extend the cross-matrix, or state that §6 is sole authority for these positions. |

### Gaps — specified nowhere

| ID | Gap | Impact |
|---|---|---|
| **G-1** | `board.directors@pearlbank.ug` has an alias and an M1 mapping but no RBAC entry, no responsibilities, no permissions, no scope. | Cannot provision. Collective-body access to M1 is undefined. |
| **G-2** | `exco.secretariat@pearlbank.ug` (M1, M4 per directory) has no RBAC entry. | Cannot provision. |
| **G-3** | Audit & Risk Committees appear in `[SRC-ARCH]` §3.1 as L3 actors but have no aliases and no RBAC entries. | Committee-level access to board packs and statutory risk briefs is undefined. |
| **G-4** | Approval thresholds are referenced ("A — High Thresholds" for MD/CEO) but **no numeric limits are given for any role**. | `APPROVE` cannot be correctly enforced. Blocks step 8 of the check algorithm. |
| **G-5** | Sub-module boundaries are named inconsistently across sources (see §3.1) and no sub-module registry exists. | `sub_module_scope` cannot be validated. Risk of over-grant at the sub-module level. |
| **G-6** | No delegation, acting-capacity, or break-glass model. "Ag. Company Secretary" implies acting appointments exist, but temporary elevation is unspecified. | Personnel transitions and emergencies have no defined path; teams will improvise one. |
| **G-7** | Level 0 roles (Branch Managers, IT System Admins, Loan Officers, Customer Support Leads) appear in `[SRC-ARCH]` §3.1 with no aliases and no RBAC entries — yet SEC-3 names "Credit Admin / Branch Leads" as the **only** holders of the PII unmask right. | The unmask right cannot be granted to anyone, because its holders are not defined roles. Blocks step 9. |
| **G-8** | `[SRC-ARCH]` §6 recommends streaming ingestion (Kafka / Event Hubs), a unified Data Governance Glossary across all 5 regions, and ML anomaly detection at the SMT layer. These are **recommendations, not decisions** — no technology is selected. | Do not treat any named product as chosen. Candidates are not decisions. |
| **G-9** | No data retention or audit-vault retention period is stated for M6. | WORM retention policy undefined. |
| **G-10** | No definition of "Executive Summary View" (Chairman's permission alongside R) as distinct from plain READ. | Either a view-type or a redundant label; affects the Chairman's UI surface. |

### Separation-of-duties concerns `[DERIVED]`

| ID | Concern |
|---|---|
| **S-1** | The CISO holds `CREATE_EDIT` on M6 (security policy config) **and** `AUDIT` over M6's records, while SEC-4 places the WORM vault under CISO oversight. One role configures access and oversees the log of access configuration. The Chief Internal Auditor's independent `AUDIT` on M6 is the counterweight; ensure it cannot be revoked by an M6 configuration change made by the CISO. Recommend four-eyes approval on M6 RBAC writes. |
| **S-2** | `SMT_CREDIT_EVALUATION` holds both `CREATE_EDIT` on risk ratings and `APPROVE` on credit in M2 — authoring the rating that drives the approval. Flag for the specification owners; if intentional, document the compensating control. |
| **S-3** | SEC-3 masks PII for ExCo and SMT but says nothing about the Chief Internal Auditor's "unrestricted audit scope" (§6.3). Unrestricted read plus unmasked PII would be the broadest exposure in the system, and it is unaddressed. |

---

## 12. Working rules for coding agents

1. **Cite or declare.** Every authorization decision you implement traces to
   `[SRC-RBAC]` §3, `[SRC-RBAC]` §4, or this file's `[DERIVED]` sections. If it
   traces to none of them, you are guessing — say so in the PR, and do not ship
   the guess as a grant.
2. **Narrow over broad, always.** PoLP (INV-1) is a hard constraint, and "no user
   receives global read/write access" (INV-2) has exactly one exception: the Chief
   Internal Auditor, read-only.
3. **Never derive a grant from the email directory.** `[SRC-MAIL]` routes mail.
   Its module column is indicative. A grant comes from `[SRC-RBAC]`.
4. **Role is the identity, not the person.** Bind grants to `role_code`; bind
   people to roles through time-bounded `Assignment` rows.
5. **The check is multi-factor from the first line of code.** SEC-2 is not a
   later hardening pass. A function signature that takes only `(role, resource)`
   will have to be rewritten.
6. **Every access attempt is an audit event.** Allows and denies alike, to the M6
   WORM vault, append-only, fail closed (SEC-4).
7. **Seniority reduces PII visibility.** SEC-3 is counter-intuitive and easy to
   get backwards. Default to masked for ExCo and SMT.
8. **Specified ≠ implemented ≠ verified.** This file is specification. Reading it
   is not evidence that any of it runs. Do not describe a control as in place
   because it is written here.
9. **Open questions stay open and visible.** Do not close C-1…C-10 or G-1…G-10 by
   choosing a plausible answer. Carry the `conflict_note` into the data and
   surface it in the admin UI.
10. **Candidates are not decisions.** `[SRC-ARCH]` §6's technology suggestions
    (Kafka, Event Hubs, ML anomaly detection) are recommendations only (G-8).

---

## 13. Source glossary

| Term | Meaning |
|---|---|
| **ABAC** | Attribute-Based Access Control — the SEC-2 extension validating location, IP subnet, device posture |
| **ALM** | Asset-Liability Management |
| **AML/CFT** | Anti-Money Laundering / Combating the Financing of Terrorism |
| **AU** | Audit permission — read-only immutable log access |
| **CAC** | Customer Acquisition Cost |
| **CBD** | Central Business District (a region) |
| **CET1** | Common Equity Tier 1 capital ratio |
| **CLV** | Customer Lifetime Value |
| **DSS** | Decision Support System |
| **ExCo** | Executive Committee (L2) |
| **GL** | General Ledger |
| **IAM** | Identity & Access Management |
| **INED** | Independent Non-Executive Director |
| **NED** | Non-Executive Director |
| **NPL** | Non-Performing Loan |
| **OLAP / OLTP** | Analytical / transactional processing |
| **PoLP** | Principle of Least Privilege |
| **PII** | Personally Identifiable Information |
| **PMO** | Project Management Office |
| **RACI** | Responsible, Accountable, Consulted, Informed |
| **RBAC** | Role-Based Access Control |
| **SIEM** | Security Information & Event Management |
| **SMT** | Senior Management Team (L1) |
| **SoD** | Separation of Duties |
| **TAT** | Turnaround Time |
| **WORM** | Write-Once-Read-Many (immutable audit storage) |

---

## Appendix A — Figures referenced but not reproducible

`[SRC-ARCH]` contains two diagrams that are images in the source and are not
reproduced here. Their content is captured textually in the sections noted.

| Figure | Title | Captured in |
|---|---|---|
| Figure 1 | Bank DSS — Architectural Reporting & Data Maturity Flow | [§2](#2-the-four-tier-data-maturity-architecture), [§2.2](#22-end-to-end-data-flow-mechanics) |
| Figure 2 | Banking Governance & Executive Reporting Chain Command Structure | [§2.1](#21-governance-tier--reporting-focus--dss-artifacts), [§6](#6-position-catalog--responsibilities-modules-permissions-scope) |

## Appendix B — Strategic recommendations from `[SRC-ARCH]` §6

Recorded for completeness. **Recommendations, not decisions** (G-8).

- **Automate real-time ingestion protocols.** Upgrade legacy ETL batching to a
  streaming data architecture (e.g. Apache Kafka / Event Hubs) at Level 0 to
  minimize latency between field occurrences and Level 1 KPI dashboards.
- **Standardize enterprise KPI definitions.** Enforce a unified Data Governance
  Glossary across all 5 operating regions to prevent conflicting operational
  metrics during Level 2 ExCo synthesis.
- **Implement RBAC.** Under CISO supervision, enforce strict encryption,
  field-level masking, and granular access permissions to protect sensitive
  operational data during reporting ascension.
- **Incorporate AI-driven anomaly detection.** Deploy predictive ML models at the
  SMT layer to automatically highlight operational outliers before reports are
  escalated to executive leadership.
