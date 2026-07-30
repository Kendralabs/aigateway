# 07 · Observability, Metering & ModelOps

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

KAIG dismantles the black box of third-party LLM usage. Every call becomes a measurable, traceable, attributable event — one pane of glass across all providers.

## 1. Usage events & metering

Every request emits a usage event carrying: immutable trace id, actor id, workspace id, wallet id, requested model, input/output tokens, computed cost, latency percentiles, cache-hit flag, and HTTP status. Token accounting parses each provider's `usage` object so attribution is consistent across vendors.

## 2. Logging discipline

- All requests logged with a universally unique, immutable **Trace ID**.
- Logs are structured JSON, streamed asynchronously to a warehouse (Elasticsearch / Splunk / BigQuery / Snowflake).
- **Sampling**: 100% of errors logged; successful routine requests may be sampled (e.g. 10%) in extreme-volume environments.
- **Privacy**: prompt text is hashed or aggressively truncated — unredacted prompts are never stored in plaintext.

## 3. Metrics & dashboards

Aggregate views expose requests per provider, token usage over time, error rates, latency percentiles (TTFT P50/P95, P99), cache-hit rate, provider uptime, and spend by model/workspace/wallet. Dashboards in Grafana / Datadog-class tooling; BI feeds forecasting and anomaly detection. Alerting triggers on P99-latency breach, rising TTFT, error-rate spikes, cache-hit-rate collapse, and provider-uptime dips, with the offending provider / model / route surfaced for fast fallback confirmation.

## 4. Tracing

KAIG natively exports **OpenTelemetry** traces for every transaction, enabling distributed tracing across multi-step agent and MCP-tool calls. The OTel collector fans out to the log warehouse and the metering pipeline. Spans follow the **OpenTelemetry GenAI 2026** semantic conventions (`gen_ai.*` attributes), so gateway spans nest inside the agent-run span tree rather than forming orphan traces, and token/cost/latency attributes travel on every span.

## 5. ModelOps integrations

The gateway integrates with **Langfuse, MLflow, Weights & Biases, Helicone** via asynchronous API hooks that push telemetry without adding gateway latency. This provides model lineage, behavioral auditing, and experiment tracking.

## 6. Quality monitoring & drift watch

- Daily eval-replay on a canary slice detects silent quality regressions after vendor model updates.
- Classifiers and models carry versioned eval datasets; drift, hallucination rate and acceptance rate tracked over time.
- Regression beyond threshold gates promotion and can trigger automatic rollback to the last-known-good route.

## 7. Storage tiers for telemetry

| Tier | Store | Retention intent |
| --- | --- | --- |
| Hot | Redis | Live counters, rate limits, reservations |
| Warm | Delta / BigQuery / Snowflake | Queryable usage events, dashboards |
| Cold | Object store (Parquet) | Long-term archive, cost retrospectives |
| Trace/log | OTel collector → warehouse | Forensic debugging, audit |

## 8. Resilience of the metering path

If the metering pipeline fails, reservations continue from a local counter and events are queued and replayed — billing integrity survives transient outages without blocking the hot path.

## 9. Usage events as a governed Agentic Data Product (KDP)

The usage event is formalised as a KDP **entity-aspect** record on the stream-first **MCE / MAE** bus: schema-first, lineage-by-default, per-consumer FinOps attribution, bitemporal where audit requires it, exported via FOCUS. Metering is queryable, governed, and rebuildable from the event log rather than trapped in a warehouse table.

## 10. Decision traces & OpenTelemetry GenAI

KAIG emits routing, guardrail, and cache decisions as KCG **decision-trace nodes** (goal, model chosen, confidence, actor, `parent_trace_id`) with bitemporal validity and an Explanation Packet. OTel export aligns to the OpenTelemetry GenAI 2026 span tree used by KOrchestrator (`agent.run → agent.plan → tool.call → gen_ai.call`), so gateway spans nest correctly inside agent runs.

## 11. Eval & drift wired to FinOps + KAGP

Drift-watch and eval-replay metrics feed **both** the FinOps eval-gated efficiency loop (doc 05) and the KAGP Drift Agent on its per-risk-tier cadence; a regression blocks promotion via the same GitOps gate the router uses (doc 03).

## 12. Langfuse data model & integration paths

- **Data model** — a **trace** is one end-to-end request; it contains **observations** of three kinds: **spans** (durations of work), **generations** (individual LLM calls with model, prompt, completion, token counts, cost), and **events** (point-in-time markers). Traces group into **sessions** for multi-turn conversations and carry **scores** produced by evals.
- **Three integration paths** — (1) native **SDK** instrumentation in application code; (2) **LiteLLM callback** (`callbacks: ["langfuse_otel"]`) so every proxied call is traced with no app change; (3) a **Portkey / OpenAI-compatible client** pointed at Langfuse. KAIG uses the callback path so tracing is a gateway property, not a per-app dependency.
- **OTel scope hygiene** — because Langfuse SDKs are OpenTelemetry-based, unrelated OTel spans can leak into LLM traces (billable-span noise); KAIG filters by instrumentation scope so only `gen_ai.*` spans reach the LLM project.
- **Prompt management** — prompts versioned and fetched by **label** (e.g. `production`), decoupling prompt changes from code deploys and letting the router pin a prompt version per route.
- **Datasets & evaluation** — evaluation **datasets** curated from real production failures; **online** evals (LLM-as-judge on live traffic) and **offline** evals (against datasets) both feed the drift-watch loop; **experiments** compare prompt/model variants on cost-versus-score.
- **Serverless flush** — in short-lived / serverless workers an explicit `flush()` is required before exit or traces are lost; KAIG's async exporter flushes on drain.
