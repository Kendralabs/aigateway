# 08 · Provider, Model & Price Management (KAIG Console)

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

The KAIG Provider Console is the single place to register providers, configure models, publish price cards, tune parameters, and govern lifecycle. Every routing decision reads from this registry — the router never decides on hardcoded model names.

## 1. Why it exists

Routing efficiency is only as good as the metadata the router can act on. Without a clean catalog, routing collapses to hardcoded names, stale prices and ad-hoc keys. KAIG consolidates four provider classes behind one OpenAI-compatible interface and exposes one declarative surface for every dimension routing depends on.

## 2. Provider classes

| Class | Examples | Where it runs | Typical use |
| --- | --- | --- | --- |
| Cloud SaaS | OpenAI, Anthropic, Google AI Studio, DeepSeek, Mistral, xAI | Vendor cloud | Frontier capability, elasticity |
| BYO-Cloud | Azure OpenAI, Bedrock, Vertex, Databricks Mosaic | Customer's own cloud | Compliance, PTU/reserved, VPC isolation |
| Local / Edge | Ollama, LM Studio, llama.cpp, vLLM single-node, MLX | Workstation, appliance, edge | Air-gapped prototyping, offline/low-cost dev, demos |
| Customer DC / On-prem | vLLM, SGLang, TGI, NVIDIA NIM, Triton, GKE Inference Gateway | Customer data centre | Data sovereignty, regulated workloads, fixed-cost scale |

## 3. Provider registry (system of record)

Each entry records:

- **Identity** — provider key, display name, class, region(s), endpoint
- **Auth profile** — vault reference, mTLS, OIDC, or no-auth
- **Capabilities** — chat/completion/embeddings/vision/audio/tool-use/structured-output/streaming
- **Networking** — public, VPC-peered, private link, VPN, localhost
- **Status** — `proposed → evaluating → approved → active → deprecated → retired`
- **Owner** — team + on-call

## 4. Model cards (summary blocks)

| Block | Fields |
| --- | --- |
| Technical | Context window, modalities, max output, tool-use, TTFT, TPS, Intelligence Index, eval scores per task suite |
| Commercial | License (open/proprietary), price-card reference, SLA uptime %, support tier, contract anchor |
| Security & residency | Training-data opt-out, ZDR status, region pinning, VPC/private-link, certifications (SOC2/HIPAA/GDPR/FedRAMP) |
| Deployment (self-hosted) | Inference engine, GPU profile, VRAM, quantisation (FP16/FP8/INT4/GGUF), concurrency, batch size |

## 4A. Model card specification (detailed)

A KAIG **model card** is two things at once: the **routing metadata** the router acts on, and the **governance artifact** documenting a model's intended use, limits and evidence. It is authored and owned in the Console (system of record), **versioned and immutable** like a price card, and is the single object the router, FinOps, and governance all read. It aligns the industry model-card lineage (Mitchell et al. 2019; Hugging Face card YAML; Google Model Card Toolkit JSON schema; AWS SageMaker versioned cards; EU AI Act Art. 11/13) with KAIG's routing- and FinOps-specific fields.

### 4A.1 Field groups

| # | Group | Purpose | Representative fields |
| --- | --- | --- | --- |
| 1 | Identity & provenance | Name the model and where it came from | `model_id`, `display_name`, `provider_key`, `provider_class`, `developers`, `funded_by`, `model_type`, `base_model`, `languages`, `sources{repo,paper,card}` |
| 2 | Capabilities & interface | What it can do and how it is called | `modalities_in/out`, `context_window`, `max_output_tokens`, `features[]` (streaming, tool_use, structured_output, vision, audio), `endpoints[]` |
| 3 | Performance & quality (routing signals) | The signals the router ranks on | `intelligence_index`, `eval_scores{}`, `capability_scores{}`, `capability_embedding_ref`, `ttft_ms{p50,p95}`, `tps`, `latency_p99_ms`, `trust_score`, `tier`, `recommendations[]`, `not_recommended_for[]` |
| 4 | Commercial | License and cost binding | `license`, `price_card_ref`, `sla_uptime_pct`, `support_tier`, `contract_anchor` |
| 5 | Security & residency | Data-handling and sovereignty posture | `training_data_opt_out`, `zdr`, `region_pinning[]`, `residency_zone`, `network[]`, `certifications[]` |
| 6 | Deployment (self-hosted) | How a self-hosted model runs (null for SaaS) | `inference_engine`, `gpu_profile`, `vram_gb`, `quantisation`, `tensor_parallel`, `pipeline_parallel`, `max_concurrency`, `batch_size`, `stack_tier`, `measured_tps` |
| 7 | Governance & compliance | Intended use, limits, governed evidence | `intended_use`, `out_of_scope_use`, `known_limitations`, `ethical_considerations`, `risk_tier`, `kagp_aspects[]`, `eu_ai_act_docs[]`, `evaluation_ref` |
| 8 | Lifecycle & versioning | Immutability and routability control | `version`, `immutable`, `status`, `accepts_new_routes`, `last_updated`, `owner{team,on_call}`, `approval{architect,security,finops}` |

### 4A.2 Canonical schema (SaaS example)

```json
{
  "id": "mc_gpt-4o-mini_v7",
  "model_id": "gpt-4o-mini",
  "display_name": "GPT-4o mini",
  "provider_key": "openai",
  "provider_class": "cloud_saas",
  "version": 7,
  "status": "active",
  "immutable": true,
  "accepts_new_routes": true,
  "last_updated": "2026-07-10T00:00:00Z",
  "owner": { "team": "platform-eng", "on_call": "kaig-oncall" },
  "provenance": {
    "developers": "OpenAI",
    "funded_by": "OpenAI",
    "model_type": "transformer-decoder",
    "base_model": null,
    "languages": ["en", "multi"],
    "sources": { "repo": null, "paper": null, "card": "https://platform.openai.com/docs/models" }
  },
  "capabilities": {
    "modalities_in": ["text", "image"],
    "modalities_out": ["text"],
    "context_window": 128000,
    "max_output_tokens": 16384,
    "features": ["streaming", "tool_use", "structured_output", "vision"],
    "endpoints": ["chat.completions", "responses", "embeddings"]
  },
  "performance": {
    "intelligence_index": 36,
    "eval_scores": { "rag": 0.71, "code": 0.68, "summarise": 0.80, "tool_use": 0.74 },
    "capability_scores": { "reasoning": 0.66, "coding": 0.68, "analysis": 0.70, "writing": 0.78, "summarization": 0.80 },
    "capability_embedding_ref": "emb://modelcards/gpt-4o-mini/v7",
    "ttft_ms": { "p50": 380, "p95": 720 },
    "tps": 110,
    "latency_p99_ms": 1400,
    "trust_score": 0.90,
    "tier": 1,
    "recommendations": ["high-volume chat", "summarisation", "classification"],
    "not_recommended_for": ["frontier reasoning", "long-horizon agentic planning"],
    "evaluation_ref": "kagp:eval/gpt-4o-mini/2026-07"
  },
  "commercial": {
    "license": "proprietary",
    "price_card_ref": "pc_gpt-4o-mini_2026-06",
    "sla_uptime_pct": 99.9,
    "support_tier": "standard",
    "contract_anchor": "msa://openai/2026"
  },
  "security_residency": {
    "training_data_opt_out": true,
    "zdr": true,
    "region_pinning": ["us", "eu"],
    "residency_zone": "multi",
    "network": ["public", "private_link"],
    "certifications": ["SOC2", "GDPR"]
  },
  "deployment": null,
  "governance": {
    "intended_use": "High-throughput chat, summarisation and classification at low cost.",
    "out_of_scope_use": "Safety-critical decisions without human review; frontier reasoning.",
    "known_limitations": "Weaker multi-step reasoning than frontier tier; occasional tool-call drift.",
    "ethical_considerations": "Standard LLM bias/toxicity risks; guardrails enforced at gateway (doc 06).",
    "risk_tier": "T2",
    "kagp_aspects": ["ModelCard", "Evaluation", "RiskCard", "Attestation"],
    "eu_ai_act_docs": ["Art.11 technical documentation", "Art.13 transparency"]
  }
}
```

### 4A.3 Deployment block (self-hosted example)

For `provider_class` of `local_edge` or `customer_dc`, `deployment` is required and carries the KME model→stack fields (§10a). SaaS/BYO-Cloud cards set `deployment: null`.

```json
"deployment": {
  "inference_engine": "vLLM",
  "engine_version": ">=0.6",
  "gpu_profile": "2x A100 80G",
  "vram_gb": 160,
  "quantisation": "FP8",
  "quantisation_validated_vs_fp16": true,
  "tensor_parallel": 2,
  "pipeline_parallel": 1,
  "max_concurrency": 32,
  "batch_size": 16,
  "stack_tier": "T3",
  "measured_tps": 900,
  "residency_zone": "customer-dc-eu-west"
}
```

### 4A.4 Routing-signal fields (how the router uses the card)

- **`capability_scores{}`** — per-skill competence in `[0,1]` (reasoning, coding, analysis, writing, summarization); the classifier's task type indexes into these.
- **`capability_embedding_ref`** — pointer to a stored capability embedding for **semantic routing**.
- **`tier`** — coarse cost/capability band (0 = SLM/edge … 4 = frontier/XL) used for intelligence-arbitrage downshifting.
- **`trust_score`** — blended reliability + quality weight applied when candidates tie.
- **`recommendations[]` / `not_recommended_for[]`** — allow/deny hints that pre-filter the candidate set.
- **`ttft_ms`, `tps`, `latency_p99_ms`** — latency-aware balancing inputs.

### 4A.5 Governance & compliance mapping

The card is one of eleven governed evidence aspects in KAGP (ModelCard, DataSheet, RiskCard, AiBom, Evaluation, RedTeamRun, BiasReport, RiskAssessment, Approval, Attestation, AiIncident).

- **Evidence, not prose** — `eval_scores` and `evaluation_ref` MUST resolve to a governed Evaluation run; scores may not be hand-entered.
- **Intended-use fields** implement the Mitchell 2019 core sections and satisfy EU AI Act Art. 11 and Art. 13.
- **Risk tier** drives the authorization allowlist gate in doc 02A §7 and the KAGP risk-tier model.

### 4A.6 Validation invariants

- [ ] **Immutable versioning** — any material field change mints a new `version`; prior versions remain queryable for retrospective routing/cost recompute.
- [ ] **Routability gate** — only `status ∈ {approved, active}` and `accepts_new_routes = true` cards are eligible for routing.
- [ ] **Price binding** — `price_card_ref` MUST resolve to a current price card; a card with no resolvable price is non-routable.
- [ ] **Eval provenance** — every score links to an `evaluation_ref`; ranges constrained to `[0,1]` (capability) and documented scales (Intelligence Index).
- [ ] **Self-hosted completeness** — `local_edge`/`customer_dc` cards require a full `deployment` block with `quantisation_validated_vs_fp16 = true` before activation.
- [ ] **Residency** — `residency_zone` is mandatory when `provider_class ≠ cloud_saas` or when any bound route declares `residency: customer`.
- [ ] **Parameter ranges** — allowed `temperature`/`top_p`/`max_tokens` ranges on the card are the authority validated in doc 02A §8 and doc 03 §9.
- [ ] **Approval quorum** — activation requires Architect + Security + FinOps sign-off recorded in `approval{}`.

### 4A.7 Standards alignment

| KAIG field group | External standard it maps to |
| --- | --- |
| Identity & provenance (1) | Hugging Face card YAML (`license`, `language`, `base_model`, `tags`); Model Card Data Dictionary |
| Capabilities & interface (2) | OpenAI-compatible surface; Google Model Card Toolkit `model_parameters` |
| Performance & quality (3) | Mitchell 2019 "Quantitative Analyses"; Google MCT `quantitative_analysis`; internal LLM Providers benchmark sheet |
| Governance & compliance (7) | Mitchell 2019 intended-use/limitations/ethical sections; EU AI Act Art. 11/13; AWS SageMaker approval status; KAGP evidence aspects |
| Lifecycle & versioning (8) | AWS SageMaker immutable versioned cards; SemVer registry discipline |

## 5. Price cards (versioned, immutable)

New rates create a new card; old cards remain queryable for retrospective recompute.

- **Schema** — input $/MTok, output $/MTok, cached-read $/MTok, cache-write $/MTok, batch-discount %, currency, effective-from/to.
- **Tiered pricing** — context-band pricing stored as multiple bands on one card.
- **Self-hosted** — amortised $/MTok = GPU-hour cost ÷ measured throughput; the routing comparison anchor.
- **PTU / reserved** — flat monthly cost with a fill-rate target; over-spill falls back to pay-as-you-go.
- **Market reference points** — cards capture the full spread from budget to frontier (e.g. Gemini Flash-Lite ~$0.075 / $0.30 per MTok input/output; flagship models publish ~90% prompt-cache discounts and ~50% batch discounts), so the router compares like-for-like effective $/MTok rather than sticker price.

## 6. Parameter management

Three-level resolution — model defaults → route overrides → call overrides — each validated against the model card's allowed ranges before the call leaves the gateway.

## 7. Local-model integration

KAIG treats local stacks as first-class providers: OpenAI-compatible endpoints (Ollama `:11434/v1`, LM Studio `:1234/v1`), shared over Tailscale/ZeroTier/LAN for teams; bearer or no-auth with virtual-key attribution preserved; capability probe on registration (`/api/tags` or `/v1/models`) recording context window, quantisation and function-calling; Ollama flagged `concurrency=1`. Use for dev, demos, low-spend agents and air-gapped pilots — never production default unless a customer-DC profile is engaged.

## 8. Customer DC / on-prem registration

mTLS over private link / VPN / dedicated peering to a KAIG **edge runner** inside the customer perimeter. The runner enumerates serving endpoints, records GPU profile/quantisation/throughput, tags each model with a `residency_zone`, and reports utilisation for amortised-cost attribution. Per-route failover: fail closed, peer-DC, or pre-approved in-region BYO-Cloud — never silent cross-region. Heartbeat every 5s; circuit breaker after 3 consecutive failures; recovery probe every 30s.

## 9. Lifecycle & approvals

`Discover → Evaluate → Approve → Activate → Monitor → Deprecate → Retire`, each transition with named approvers and an audit trail. **Evaluate** runs the evaluation matrix; **Approve** requires Architect + Security + FinOps sign-off (eval scorecard, security review, price card); **Deprecate** sets `accepts_new_routes = false`; **Retire** purges credentials but preserves usage history.

## 10. Evaluation matrix

| Dimension | Signal |
| --- | --- |
| Capability | Intelligence Index, task-suite eval scores (RAG, code, summarise, tool-use) |
| Speed | TTFT P50/P95, sustained TPS, P99 latency |
| Cost | Effective $/MTok blended over real workload mix, cache-amplified $/MTok |
| Reliability | Observed availability vs. SLA, error-class distribution |
| Security | ZDR, opt-out, residency, certifications, key-rotation cadence |
| Operability | API stability, deprecation cadence, SDK quality, observability hooks |

## 10a. Self-hosted model stack cards (KME)

| Tier | Representative models | Default engine | GPU profile (typical) |
| --- | --- | --- | --- |
| T0 · SLM / edge (≤3B) | Phi-3-mini, Llama-3.2-3B | Ollama / llama.cpp / MLX | CPU / 1× consumer GPU |
| T1 · small (7–9B) | Llama-3.1-8B, Qwen2.5-7B | vLLM | 1× A10 / L4 |
| T2 · mid (13–34B) | Qwen2.5-32B, Gemma-2-27B | vLLM / SGLang | 1–2× A100 40G |
| T3 · large (70B) | Llama-3.1-70B | vLLM / TensorRT-LLM | 2–4× A100/H100 80G (TP) |
| T4 · MoE / XL (up to 405B) | Llama-3.1-405B, DeepSeek-V3 | SGLang / vLLM (TP+PP) | 8× H100 node(s) |

- **Memory rule:** provision **1.2–1.5× FP16 weight** in VRAM plus KV-cache headroom; decode is memory-bandwidth bound.
- **Engine decision:** vLLM (default high-concurrency), SGLang (MoE / heavy prefix reuse), TensorRT-LLM (latency-critical NVIDIA), NIM / Triton (vendor-supported), Ollama / llama.cpp / MLX (edge).
- **Quantisation:** FP16 → FP8 → INT4 / GGUF trade accuracy for VRAM and throughput; recorded on the card for eval comparison.
- **Parallelism:** tensor-parallel within a node, pipeline-parallel across nodes for T3–T4; reference stack layers L0–L5 and deployment target travel with the card.

## 10b. Deployment lifecycle integration (KME)

KME's **Design → Deploy → Manage → Scale** lifecycle feeds the Console: *Deploy* registers the endpoint (via the §8 enrolment token), *Manage* reports health and drift into §9 lifecycle state, and *Scale* reports utilisation for the amortised $/MTok price card (§5). Model-card eval scores link to KAGP Evaluation aspects so a self-hosted model's quality evidence is governed, not local.

## 11. Console surfaces & APIs

Surfaces: Catalog (filter by class/capability/region/status), Model detail (cards, price history, eval scorecards, health), Routes preview (which routes would pick a candidate model per mode), and Audit (who/when/before/after).

Representative APIs:

```
POST   /providers
PATCH  /providers/{id}
DELETE /providers/{id}
POST   /providers/{id}/models
PATCH  /models/{id}
POST   /models/{id}/price-cards          # new version
GET    /models/{id}/price-cards?at=<ISO8601>
POST   /providers/{id}/health
GET    /providers/{id}/health
POST   /customer-dc/runners              # issues a one-time enrolment token
```

## 12. Reference-gateway configuration mechanics

- **LiteLLM (self-hosted)** — models declared in a versioned `config.yaml` `model_list`, each entry mapping a user-facing `model_name` alias to `litellm_params` (real provider model string plus an `os.environ/` key reference); `router_settings` holds strategy, fallbacks and Redis state; `general_settings` holds the master key and the Postgres `database_url`. Postgres persists keys and spend, Redis shares routing state, `drop_params: true` silences unsupported-parameter errors, and `enable_pre_call_checks` must be enabled for context-window fallbacks. Licensing splits an MIT core from an Enterprise tier (SSO, RBAC, audit); measured proxy overhead ~15 ms at 1,000+ req/s with no token markup. **Supply-chain note:** pin the image by tag (a March 2026 incident affected 1.82.7–1.82.8; pin 1.83.0 or later), never `latest`.
- **Portkey (managed)** — models addressed through a **Model Catalog** as `@provider-slug/model` (per-request virtual keys deprecated), policy in versioned **Config IDs**, data plane self-hostable (`npx @portkey-ai/gateway`; 250+ providers). Semantic-cache entries carry `max_age`; `on_status_codes` scopes which upstream errors trigger a fallback.

These map onto the KAIG Console: `model_name` aliases correspond to ModelCards (§4A), `price_card_ref` to price cards (§5), and Config IDs to the GitOps route policy (doc 02 §5).
