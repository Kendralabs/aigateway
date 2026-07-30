---
name: 'step-07-instruction-style-check'
description: 'Check instruction style - intent-based vs prescriptive, appropriate for domain'

nextStepFile: './step-08-collaborative-experience-check.md'
targetWorkflowPath: '{kbb_creations_output_folder}/workflows/{new_workflow_name}'
validationReportFile: '{targetWorkflowPath}/validation-report-{new_workflow_name}.md'
intentVsPrescriptive: '../data/intent-vs-prescriptive-spectrum.md'
workflowPlanFile: '{targetWorkflowPath}/workflow-plan-{new_workflow_name}.md'
---

# Validation Step 7: Instruction Style Check

## STEP GOAL:

To validate that workflow instructions use appropriate style - intent-based for creative/facilitative workflows, prescriptive only where absolutely required (compliance, legal).

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 DO NOT BE LAZY - LOAD AND REVIEW EVERY FILE
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ✅ Validation does NOT stop for user input - auto-proceed through all validation steps

### Step-Specific Rules:

- 🎯 Review EVERY step's instruction style
- 🚫 DO NOT skip any files or style checks
- 💬 Append findings to report, then auto-load next step
- 🚪 This is validation - systematic and thorough

## EXECUTION PROTOCOLS:

- 🎯 Load intent vs prescriptive standards
- 💾 Check EACH step's instruction style
- 📖 Validate style is appropriate for domain
- 🚫 DO NOT halt for user input - validation runs to completion

## CONTEXT BOUNDARIES:

- Instruction style should match domain
- Creative/facilitative → Intent-based (default)
- Compliance/legal → Prescriptive (exception)
- Check EVERY step for style consistency

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip or shortcut.

### 1. Load Instruction Style Standards

Load {intentVsPrescriptive} to understand:

**Intent-Based (Default):**
- Use for: Most workflows - creative, exploratory, collaborative
- Step instruction describes goals and principles
- AI adapts conversation naturally
- More flexible and responsive
- Example: "Guide user to define requirements through open-ended discussion"

**Prescriptive (Exception):**
- Use for: Compliance, safety, legal, medical, regulated industries
- Step provides exact instructions
- More controlled and predictable
- Example: "Ask exactly: 'Do you currently experience fever, cough, or fatigue?'"

### 2. Determine Domain Type

From {workflowPlanFile}, identify the workflow domain:

**Intent-Based Domains (Default):**
- Creative work (writing, design, brainstorming)
- Personal development (planning, goals, reflection)
- Exploration (research, discovery)
- Collaboration (facilitation, coaching)

**Prescriptive Domains (Exception):**
- Legal/Compliance (contracts, regulations)
- Medical (health assessments, triage)
- Financial (tax, regulatory compliance)
- Safety (risk assessments, safety checks)

### 3. Check EACH Step's Instruction Style

**DO NOT BE LAZY - For EACH step file:**

1. Load the step
2. Read the instruction sections (MANDATORY SEQUENCE)
3. Classify style:

**Intent-Based Indicators:**
- ✅ Describes goals/outcomes, not exact wording
- ✅ Uses "think about" language
- ✅ Multi-turn conversation encouraged
- ✅ "Ask 1-2 questions at a time, not a laundry list"
- ✅ "Probe to understand deeper"
- ✅ Flexible: "guide user through..." not "say exactly..."

**Prescriptive Indicators:**
- Exact questions specified
- Specific wording required
- Sequence that must be followed precisely
- "Say exactly:" or "Ask precisely:"

**Mixed Style:**
- Some steps prescriptive (critical/required)
- Others intent-based (creative/facilitative)

### 4. Validate Appropriateness

**For Intent-Based Domains:**
- ✅ Instructions should be intent-based
- ❌ Prescriptive instructions inappropriate (unless specific section requires it)

**For Prescriptive Domains:**
- ✅ Instructions should be prescriptive where compliance matters
- ⚠️ May have intent-based sections for creative elements

### 5. Document Findings

```markdown
### Instruction Style Check Results

**Domain Type:** [Creative/Personal/Exploratory OR Legal/Medical/Compliance]

**Appropriate Style:** [Intent-based/Prescriptive/Mixed]

**Step Instruction Style Analysis:**
| Step | Style Type | Appropriate | Notes | Status |
|------|-----------|-------------|-------|--------|
| step-01-init.md | Intent-based | ✅ | Goals described, flexible | ✅ PASS |
| step-02-*.md | Intent-based | ✅ | "Think about response" | ✅ PASS |
| step-03-*.md | Prescriptive | ❌ | Domain is creative, too rigid | ⚠️ WARN |
| step-04-*.md | Intent-based | ✅ | Good facilitation language | ✅ PASS |
| step-05-*.md | Mixed | ✅ | Prescriptive for compliance, intent elsewhere | ✅ PASS |

**Issues Found:**

**Overly Prescriptive Steps:**
- [List steps that are too prescriptive for their domain]
- Example: "step-03-*.md says 'Ask exactly: X, Y, Z' but this is a creative workflow"

**Overly Flexible Steps (if prescriptive domain):**
- [List steps that should be more prescriptive]
- Example: "step-04-*.md is vague but this is a compliance workflow"

**Style Inconsistencies:**
- [List steps where style doesn't match domain]

**Good Examples Found:**
- [Highlight steps with excellent intent-based instructions]
- [Highlight steps with appropriate prescriptive language]

**Status:** ✅ PASS / ❌ FAIL / ⚠️ WARNINGS
```

### 6. Append to Report

Update {validationReportFile} - replace "## Instruction Style Check *Pending...*" with actual findings.

### 7. Save Report and Auto-Proceed

**CRITICAL:** Save the validation report BEFORE loading next step.

Then immediately load, read entire file, then execute {nextStepFile}.

**Display:**
"**Instruction Style check complete.** Proceeding to Collaborative Experience Check..."

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- EVERY step's instruction style reviewed
- Style validated against domain appropriateness
- Issues documented with specific examples
- Findings appended to report
- Report saved before proceeding
- Next validation step loaded

### ❌ SYSTEM FAILURE:

- Not checking every step's style
- Not validating against domain
- Not documenting style issues
- Not saving report before proceeding

**Master Rule:** Validation is systematic and thorough. DO NOT BE LAZY. Check EVERY step's instruction style. Auto-proceed through all validation steps.
