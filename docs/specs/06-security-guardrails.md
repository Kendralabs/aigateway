# 06 · Security & Guardrails

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

KAIG is a deep-inspection firewall for LLM traffic. It defends the perimeter against prompt injection, data exfiltration and non-compliant output — inspecting both the prompt before it leaves and the response before it returns.

## 1. Threat surface

LLM traffic introduces risks traditional API security misses: prompt-injection and jailbreaks, sensitive-data leakage in prompts, toxic or non-compliant generations, and credential exposure when raw keys live in client code. The gateway is the single enforcement point for all four.

## 2. PII detection & redaction

- Outgoing prompts are scanned and sensitive elements (SSNs, primary account numbers, emails, other targeted PII) are detected and redacted **before** the payload reaches any external provider.
- Targets: detect/redact >99% of targeted PII at a <0.5% false-positive rate.
- Detected data is replaced with synthetic cryptographic tokens, then **rehydrated** in the response before it returns to the user, via a short-lived, encrypted in-memory lookup table — no plaintext PII is persisted.
- Implementation integrates fast NLP classifiers (e.g. Presidio-class) into the synchronous prompt-processing middleware.
- **Coverage** — 20+ PII types detected via configurable RegEx patterns plus a detection library; matches replaced with structured placeholders such as `<EMAIL_REDACTED>`.
- **Rehydration is optional and policy-gated** — re-insertion of the original value happens only when explicitly permitted and safe.

## 3. Prompt-injection & jailbreak defense

- Incoming text passes sequentially through structural validation → semantic injection scanning → policy formatting before dispatch.
- Enterprise screening (e.g. Model Armor-class tooling) blocks known jailbreak patterns, role-play bypasses and malicious instructions.
- **System-prompt injection** — immutable corporate policy instructions are prepended to every user query immediately before transmission.
- **Threat modeling** — every production route is threat-modeled against OWASP LLM Top 10, MITRE ATLAS, and NCSC prompt-injection guidance, covering insecure output handling, model abuse, and sensitive-information disclosure.
- **RAG exfiltration (OWASP GenAI 2026)** — retrieval is constrained so overly permissive similarity search cannot surface passages never intended for a caller; data overshared into RAG sources is treated as a first-class leakage risk even without model manipulation.

## 4. Output filtering

Generated content deemed off-topic, toxic, harmful or policy-violating is filtered or blocked before reaching the downstream application. Output moderation runs as a post-processing guardrail attached to the route.

## 5. Guardrails as versioned policy

Guardrails are versioned policies attached to routes (doc 03), orchestrated by KAIG with integrations such as Presidio, NeMo Guardrails and cloud provider safety services. Coverage and thresholds are configuration, not code.

## 6. Secrets & transport security

- All provider secrets live in a hardened vault and are never returned to clients.
- Virtual keys are short-lived where possible (doc 04).
- mTLS between KAIG and providers where supported, and **mandatory** for Customer DC edge runners.
- Customer DC runners are signed binaries pulling only signed configs; tamper detection bricks the runner.
- Region-pinning is enforced by route; cross-region calls require an explicit policy grant.

## 7. Compliance posture

- PII detection runs before the provider call and after the response.
- Logs hash or truncate prompts so unredacted text is never stored in plaintext (doc 07).
- Model cards record ZDR status, training-data opt-out, residency, and certifications (SOC2, HIPAA, GDPR, FedRAMP).
- Audit lineage and immutable change history provide SOC2 / ISO 27001 evidence.

## 8. FS regulatory overlays (Regula / KCG-FS)

For financial-services traffic, guardrail and residency policy attach per route as **OPA bundles** whose obligations are owned by Kendra Regula and KCG for Financial Services. KAIG enforces the runtime controls those obligations bind to; it does not author the obligations.

- **Overlay catalogue** — SR 11-7 (model risk), EU AI Act, DORA (ICT / operational resilience + 72h incident), BCBS 239 (lineage), MAS FEAT, FCA Consumer Duty / agentic evaluation.
- **Residency zones** map to KME Customer-DC endpoints; cross-border routing requires a transfer-impact gate (never silent).

## 9. Governance-agent enforcement hooks (KAGP)

KAIG guardrail telemetry feeds KAGP's continuous assurance: the **Red-Team, Bias, Drift, and Incident** agents consume gateway signals, and coverage of **OWASP LLM Top 10 + MITRE ATLAS** (plus MAESTRO / LPCI / DIRF / QSAF classes) is recorded as signed RedTeamRun aspects. Guardrails stay versioned route policy governed by KAGP — never buried in application code.

## 10. Provenance of guardrail decisions (KCG)

Every redaction, injection-block, or output-filter decision emits a **bitemporal decision-trace node** to the Kendra Context Graph with an Explanation Packet (PROV-O lineage), giving EU AI Act Article-22 and SR 11-7 replayability of *why* a call was blocked or transformed.
