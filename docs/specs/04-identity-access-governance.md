# 04 · Identity, Access & Governance (KIAM)

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

Raw provider keys must never reach end-users or app code. KAIG centralizes authentication as an impenetrable proxy firewall, deeply integrated with the Keycloak-based Kendra Identity & Access Management (KIAM) system.

## 1. The seven-level hierarchy

Every incoming inference request is evaluated against a universally applied seven-level data contract:

| Level | Identifier | Purpose |
| --- | --- | --- |
| 1 · Platform | — | Global system context; resources accessible enterprise-wide |
| 2 · Organization | `organizationId` | Primary tenant; absolute boundary for isolation and billing |
| 3 · Data Domain | `dept_id` | Functional business unit owning the AI initiative |
| 4 · Workspace | `workspaceId` | Localized execution context (the former "Project") |
| 5 · Asset | `stack_id` | Specific programmatic resource (e.g. an AgentStack) |
| 6 · Identity | `sub` / `agent_id` | Principal requester — human `sub` or `kiam:agent_id` |
| 7 · Scope | `requested_scope` | Granular permission, e.g. `ai:inference` or `ai:admin` |

## 2. Token validation handshake

- KAIG intercepts each request, parses the JWT, and verifies the signature against the KIAM JWKS discovery endpoint.
- The full verification lifecycle must execute in **under 50 ms** to hold performance SLAs.
- KIAM exposes a validation endpoint (`/api/v1/hierarchy/validate`) returning an evaluated `HierarchyContext` plus a definitive authorization boolean, and an OIDC discovery endpoint for key rotation.
- KAIG caches validation results in memory with a **60-second TTL**.
- A request lacking the `ai:inference` scope is rejected with **HTTP 403**; a workspace mismatch against the requested model's assigned workspace is blocked unless the model carries a global Platform classification.

## 3. Authorization model

- **RBAC** — roles map to scopes (developer, operator, FinOps, security admin).
- **ReBAC** — relationship-based checks via OpenFGA for fine-grained resource isolation.
- **Policy-as-code** — OPA/Rego sidecars co-located with the proxy enforce attribute-based policies at request time.
- **ABAC** — attribute-based conditions (project context, device security posture, data classification, network zone) further gate model and route access.
- **Scope attenuation** — tokens produced by On-Behalf-Of exchange must never exceed the permissions of either the source human or the proxy agent; the narrower permission set always wins.
- **Context-aware policy** — decisions weigh real-time signals such as time of day, agent risk score, and anomaly detection, enabling step-up or review outcomes.

## 4. Virtual keys

Gateway-issued credentials that proxy real provider secrets so app code never sees them.

- Bound to a specific KIAM workspace; carry immutable budgets and rate limits.
- Backed by a hardened, encrypted vault for the underlying provider secrets.
- A fast mapping engine correlates an incoming virtual key to the correct backend secret using Tier 2 config.
- A global **kill switch** instantly revokes any compromised key.
- Short-lived where possible; rotation is a Tier 2 console operation.

## 5. Just-in-time & human-in-the-loop

- High-risk configuration changes or access to restricted/unreleased models trigger formal **HITL** workflows that pause execution until managerial approval is logged.
- **JIT** access issues temporary, ephemeral inference credentials with full approval logging, then expires them automatically.

## 6. Audit lineage

Every change (who, when, before/after) and every inference (actor, workspace, model, wallet, outcome) is recorded for SOC2 / ISO 27001 evidence. Provider credential management, multi-tenant key issuance, and audit logging are first-class duties of the gateway, not the calling app.

## 7. Governance as configuration

Policies, model allowlists, budgets and routes are declarative GitOps artifacts. Decentralized consumption (many calling apps) sits under one centralized control plane, so a single policy change propagates everywhere within seconds.

## 8. Reconciliation — KAIG as PEP, KACP as PDP

KAIG adopts the same Policy-Enforcement/Policy-Decision split that KMCP establishes for the tool plane. KAIG authorises nothing locally: each inference request issues a synchronous decision call to the **KACP Policy Decision Point (L5.b)**, which returns `{allow | deny | review | step_up | redact | escalate}`. The PDP call is **fail-closed** (a timeout denies), and the decision id + rule-package version + explanation hash propagate to the L5.d Audit Vault. KAIG is the inference-plane PEP peer to KMCP's tool-plane PEP.

## 9. On-Behalf-Of delegation & Token Vault

- **OBO delegation** — agent chains carry KIAM On-Behalf-Of tokens, so an inference call made "on behalf of" a user preserves both the human principal and the agent principal for authorization and attribution.
- **Token Vault (owned by KACP L5.c)** — virtual keys are the gateway *projection* of Token Vault credentials; KAIG never stores raw provider secrets, it references the Vault. The per-agent FinOps wallet id rides the same token, so identity, secret, and cost attribution stay bound together (doc 05).

## 10. Governance seam (KAGP)

KAIG enforces the risk decisions that KAGP owns rather than defining its own: **model allowlists and HITL / JIT gates are keyed to the artefact's RiskAssessment tier**, and KAIG emits usage and decision evidence that becomes KAGP Evaluation and AI-BOM aspects. Division of labour: KIAM issues identities, OPA + OpenFGA evaluate policy, SHIELD detects threats, the Audit Vault is the ledger; KAIG **consumes all, owns none** of these primitives.

## 11. Version history (set-wide)

| Version | Date | Status | Changes |
| --- | --- | --- | --- |
| 1.2.0 | 2026-07-18 | Active | Minor release: set-wide incorporation of the LLM Gateway Playbook (Parts 0–5) and the InfoQ "AI Gateway" presentation as first-class sources. Material landed in docs 02, 03, 07, 08, 09. |
| 1.1.0 | 2026-07-10 | Active | Minor release: expanded requirements across the set. This doc added ABAC attributes, OBO scope-attenuation, and context-aware policy factors. |
| 1.0.0 | 2026-07-04 | Superseded | First cross-plane-aligned governed release: version headers, cross-plane boundary map, regulatory drivers, provenance, per-document deepening absorbing gateway-owned elements from KME, FinOps for Agentic Systems, KOrchestrator, KMCP, KAGP, KDP, KCG, Regula. |
