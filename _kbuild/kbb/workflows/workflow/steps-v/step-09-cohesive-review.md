---
name: 'step-09-cohesive-review'
description: 'Cohesive ultra-think review - overall quality, does this workflow actually facilitate well?'

nextStepFile: './step-10-report-complete.md'
targetWorkflowPath: '{kbb_creations_output_folder}/workflows/{new_workflow_name}'
validationReportFile: '{targetWorkflowPath}/validation-report-{new_workflow_name}.md'
workflowPlanFile: '{targetWorkflowPath}/workflow-plan-{new_workflow_name}.md'
---

# Validation Step 9: Cohesive Review

## STEP GOAL:

To perform a cohesive "ultra-think" review of the entire workflow - walk through it as a whole, assess overall quality, does it actually facilitate well?

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 DO NOT BE LAZY - LOAD AND REVIEW EVERY FILE
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ✅ Validation does NOT stop for user input - auto-proceed through all validation steps

### Step-Specific Rules:

- 🎯 Review the workflow as a cohesive whole
- 🚫 DO NOT skip any aspect of the review
- 💬 Think deeply about quality and facilitation
- 🚪 This is the meta-review - overall assessment

## EXECUTION PROTOCOLS:

- 🎯 Walk through the ENTIRE workflow end-to-end
- 💾 Assess overall quality, not just individual components
- 📖 Think deeply: would this actually work well?
- 🚫 DO NOT halt for user input - validation runs to completion

## CONTEXT BOUNDARIES:

- This is the cohesive review - look at the workflow as a whole
- Consider user experience from start to finish
- Assess whether the workflow achieves its goal
- Be thorough and thoughtful

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip or shortcut.

### 1. Load the Entire Workflow

**DO NOT BE LAZY - Load EVERY step file:**

1. Load workflow.md
2. Load EVERY step file in steps-c/ in order
3. Read through each step
4. Understand the complete flow

### 2. Walk Through the Workflow Mentally

**Imagine you are a user running this workflow:**

- Starting from workflow.md
- Going through step-01
- Progressing through each step
- Experiencing the interactions
- Reaching the end

**Ask yourself:**
- Does this make sense?
- Is the flow logical?
- Would I feel guided or confused?
- Does it achieve its goal?

### 3. Assess Cohesiveness

**Check for:**

**✅ Cohesive Indicators:**
- Each step builds on previous work
- Clear progression toward goal
- Consistent voice and approach throughout
- User always knows where they are
- Satisfying completion

**❌ Incohesive Indicators:**
- Steps feel disconnected
- Jumps in logic or flow
- Inconsistent patterns
- User might be confused
- Abrupt or unclear ending

### 4. Assess Overall Quality

**Rate the workflow on:**

| Aspect | Rating (1-5) | Notes |
|--------|-------------|-------|
| Clear Goal | ⭐⭐⭐⭐⭐ | Is the purpose clear? |
| Logical Flow | ⭐⭐⭐⭐⭐ | Do steps progress logically? |
| Facilitation Quality | ⭐⭐⭐⭐⭐ | Does it facilitate well? |
| User Experience | ⭐⭐⭐⭐⭐ | Would users enjoy this? |
| Goal Achievement | ⭐⭐⭐⭐⭐ | Does it accomplish what it set out to? |
| Overall Quality | ⭐⭐⭐⭐⭐ | Total assessment |

### 5. Identify Strengths and Weaknesses

**Strengths:**
- What does this workflow do well?
- What makes it excellent?
- What should other workflows emulate?

**Weaknesses:**
- What could be improved?
- What doesn't work well?
- What would confuse users?

**Critical Issues:**
- Are there any show-stopper problems?
- Would this workflow fail in practice?

### 6. Provide Recommendation

**Overall Assessment:**
- ✅ **EXCELLENT** - Ready to use, exemplifies best practices
- ✅ **GOOD** - Solid workflow, minor improvements possible
- ⚠️ **NEEDS WORK** - Has issues that should be addressed
- ❌ **PROBLEMATIC** - Major issues, needs significant revision

**Recommendation:**
- [Ready for use / Ready with minor tweaks / Needs revision / Major rework needed]

### 7. Document Findings

```markdown
### Cohesive Review Results

**Overall Assessment:** [EXCELLENT/GOOD/NEEDS WORK/PROBLEMATIC]

**Quality Ratings:**
| Aspect | Rating | Notes |
|--------|--------|-------|
| Clear Goal | ⭐⭐⭐⭐⭐ | [Notes] |
| Logical Flow | ⭐⭐⭐⭐⭐ | [Notes] |
| Facilitation Quality | ⭐⭐⭐⭐⭐ | [Notes] |
| User Experience | ⭐⭐⭐⭐⭐ | [Notes] |
| Goal Achievement | ⭐⭐⭐⭐⭐ | [Notes] |
| **Overall Quality** | **⭐⭐⭐⭐⭐** | [Total assessment] |

**Cohesiveness Analysis:**

**Flow Assessment:**
- [Describe the overall flow - does it work?]
- [Are there any jarring transitions?]
- [Does each step connect to the next?]

**Progression Assessment:**
- [Does the workflow build toward its goal?]
- [Is there a clear arc?]
- [Would a user feel they're making progress?]

**Voice and Tone:**
- [Is the voice consistent throughout?]
- [Does the AI persona work well?]
- [Is the collaboration style appropriate?]

**Strengths:**
1. [Major strength #1]
2. [Major strength #2]
3. [What makes this workflow excellent]

**Weaknesses:**
1. [Issue #1 that could be improved]
2. [Issue #2 that could be improved]
3. [What doesn't work as well]

**Critical Issues (if any):**
- [List any show-stopper problems]
- [Or note: No critical issues]

**What Makes This Work Well:**
- [Describe the excellent elements]
- [What should other workflows learn from this?]

**What Could Be Improved:**
- [Specific actionable improvements]
- [Priority: High/Medium/Low]

**User Experience Forecast:**
- [How would a user experience this workflow?]
- [Would they feel: guided/confused/satisfied/frustrated?]

**Recommendation:**
- [Ready for use / Ready with minor tweaks / Needs revision / Major rework needed]

**Status:** ✅ EXCELLENT / ✅ GOOD / ⚠️ NEEDS WORK / ❌ PROBLEMATIC
```

### 8. Append to Report

Update {validationReportFile} - replace "## Cohesive Review *Pending...*" with actual findings.

### 9. Save Report and Auto-Proceed

**CRITICAL:** Save the validation report BEFORE loading next step.

Then immediately load, read entire file, then execute {nextStepFile}.

**Display:**
"**Cohesive Review complete.** Proceeding to finalize validation report..."

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- ENTIRE workflow reviewed end-to-end
- Quality assessed across multiple dimensions
- Strengths and weaknesses documented
- Thoughtful recommendation provided
- Findings appended to report
- Report saved before proceeding
- Next validation step loaded

### ❌ SYSTEM FAILURE:

- Not reviewing the entire workflow
- Superficial or lazy assessment
- Not documenting strengths/weaknesses
- Not providing clear recommendation
- Not saving report before proceeding

**Master Rule:** Validation is systematic and thorough. DO NOT BE LAZY. Review the ENTIRE workflow cohesively. Think deeply about quality. Auto-proceed through all validation steps.
