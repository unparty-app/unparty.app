# System Investigation Template (SIT)
**Based on IEEE 1044 Software Anomaly Classification Standards**

---

## Document Control
| Field | Value |
|-------|--------|
| **Investigation ID** | SIT-[YYYY-MM-DD]-[###] |
| **Investigator** | [Project Manager/Lead] |
| **Date Created** | [Date] |
| **Priority Level** | Critical / High / Medium / Low |
| **Build/System** | [System name and version] |
| **Investigation Status** | Open / In Progress / Completed |

---

## 1. Initial Anomaly Detection

### 1.1 Build Output Analysis
**Source:** [npm run build / mvn compile / cargo build / etc.]

```
[PASTE COMPLETE BUILD OUTPUT - DO NOT EDIT OR SUMMARIZE]
```

### 1.2 Anomaly Classification
| Type | Count | Severity | Pattern Detected |
|------|--------|-----------|------------------|
| Compilation Errors | [#] | Blocking | [Yes/No] |
| Warnings | [#] | Non-blocking | [Yes/No] |
| Linting Issues | [#] | Quality | [Yes/No] |
| Dependency Issues | [#] | Blocking | [Yes/No] |
| Other | [#] | [Level] | [Yes/No] |

### 1.3 Error Distribution Analysis
```
File Path                           | Error Count | Error Types
-----------------------------------|-------------|------------------
[file1]                            | [#]         | [type1, type2]
[file2]                            | [#]         | [type3]
```

---

## 2. Pattern Recognition (No Assumptions)

### 2.1 File Relationship Mapping
**Question:** Do errors cluster around related functionality?

**Methodology:** Analyze file paths and error locations
- [ ] **Single File Issues:** Isolated problems
- [ ] **Module-Wide Issues:** Related files affected
- [ ] **Cross-Module Issues:** Dependencies between modules
- [ ] **System-Wide Issues:** Configuration or infrastructure

**Observed Patterns:**
```
Pattern 1: [Description of what is observed, not interpreted]
Pattern 2: [Description of what is observed, not interpreted]
```

### 2.2 Error Type Clustering
**Question:** Are similar error types concentrated in specific areas?

| Error Type | File Locations | Frequency | Potential Relationships |
|------------|----------------|-----------|------------------------|
| [Type] | [Files] | [#] | [Observed only - no assumptions] |

### 2.3 Dependency Chain Analysis
**Question:** Are errors following import/dependency relationships?

**Investigation Required:**
- [ ] Check import statements in affected files
- [ ] Verify dependency tree structure
- [ ] Examine configuration files (tsconfig, package.json, etc.)

---

## 3. Risk Assessment Matrix

### 3.1 Business Impact
| Impact Category | Assessment | Justification |
|-----------------|------------|---------------|
| **Deployment Blocking** | Yes/No | [Build success required] |
| **User Experience** | High/Med/Low | [Runtime impact potential] |
| **Data Integrity** | High/Med/Low | [Data flow affected] |
| **Security** | High/Med/Low | [Security implications] |
| **Performance** | High/Med/Low | [Performance degradation risk] |

### 3.2 Technical Debt Indicators
- [ ] **Quick Fix Possible:** Can be resolved with simple changes
- [ ] **Architectural Issue:** Requires design review
- [ ] **Configuration Problem:** Environment/build setup issue
- [ ] **Systemic Problem:** Affects multiple subsystems

---

## 4. Investigation Scope Definition

### 4.1 Files Requiring Deep Investigation
**Based on error clustering analysis:**

| Priority | File Path | Reason for Investigation |
|----------|-----------|-------------------------|
| P1 | [file] | [Highest error concentration] |
| P2 | [file] | [Related to P1 files] |
| P3 | [file] | [Secondary effects] |

### 4.2 Investigation Questions
**For Technical Investigation Report (TIR):**

1. **Root Cause Analysis:** What is the fundamental cause of errors in [priority files]?
2. **Relationship Verification:** How do errors in [file A] relate to errors in [file B]?
3. **Solution Scope:** What is the minimum viable fix vs. comprehensive solution?
4. **Risk Analysis:** What are the implications of proposed changes?

### 4.3 Investigation Constraints
- **Timeline:** [Available time for investigation]
- **Resources:** [Available team members]
- **Environment:** [Available systems for testing]
- **Dependencies:** [External factors that could affect investigation]

---

## 5. Initial Hypothesis Framework

### 5.1 Potential Root Cause Categories
**Rank likelihood without investigation:**

- [ ] **Configuration Issues:** Build tools, linting rules, dependencies
- [ ] **Missing Dependencies:** Types, packages, imports
- [ ] **Architectural Debt:** Outdated patterns, incomplete refactoring  
- [ ] **Environment Issues:** Version mismatches, path problems
- [ ] **Developer Knowledge Gaps:** Incorrect usage of existing systems

### 5.2 Investigation Strategy
**Methodology to be followed:**

1. **Evidence Collection:** [What data to gather]
2. **Verification Process:** [How to validate findings]
3. **Documentation Standards:** [Required deliverables]
4. **Approval Gates:** [Review checkpoints]

---

## 6. Technical Investigation Request

### 6.1 Assignment Details
**Assigned To:** [Junior Developer Name]
**Expected Deliverable:** Technical Investigation Report (TIR)
**Due Date:** [Date and Time]

### 6.2 Investigation Parameters
```json
{
  "scope": {
    "files_to_investigate": ["file1", "file2", "file3"],
    "investigation_depth": "root_cause_analysis",
    "solution_requirement": "production_ready"
  },
  "constraints": {
    "time_limit": "[hours]",
    "breaking_changes": "requires_approval",
    "external_dependencies": "document_all"
  },
  "deliverables": {
    "format": "TIR_template",
    "approval_required": true,
    "implementation_plan": true
  }
}
```

### 6.3 Success Criteria
- [ ] **Root cause identified and documented**
- [ ] **Solution proposed with impact analysis**
- [ ] **Implementation plan with risk mitigation**
- [ ] **Test strategy defined**
- [ ] **Rollback plan provided**

---

## 7. Investigation Monitoring

### 7.1 Progress Checkpoints
| Checkpoint | Expected Time | Deliverable | Status |
|------------|---------------|-------------|--------|
| Initial Analysis | +2 hours | File inspection complete | Pending |
| Root Cause ID | +4 hours | Cause documented | Pending |
| Solution Design | +6 hours | Implementation plan | Pending |
| Final Report | +8 hours | TIR submitted | Pending |

### 7.2 Escalation Triggers
- [ ] **Timeline Exceeded:** Investigation taking longer than allocated
- [ ] **Scope Creep:** Issues more complex than initially assessed
- [ ] **Resource Constraints:** Additional expertise required
- [ ] **Critical Discovery:** Security or data integrity risks identified

---

## 8. System Investigation Summary

### 8.1 Key Findings
1. **Error Concentration:** [Where errors cluster]
2. **Relationship Patterns:** [How errors relate to each other]
3. **Risk Level:** [Assessment of business impact]
4. **Investigation Complexity:** [Simple fix vs. architectural review]

### 8.2 Recommendation
- [ ] **Proceed with TIR:** Standard investigation process
- [ ] **Escalate Immediately:** Critical/security issues identified
- [ ] **Architecture Review Required:** Systemic issues detected
- [ ] **External Consultation Needed:** Expertise gap identified

### 8.3 Approval for Investigation
**Project Manager:** _________________ **Date:** _________
**Technical Lead:** _________________ **Date:** _________

---

## Appendix A: Investigation Commands Reference
```bash
# File relationship analysis
find . -name "*.ext" | xargs grep -l "pattern"

# Dependency analysis  
npm ls --depth=0
yarn why package-name

# Configuration verification
cat tsconfig.json | jq .
cat package.json | jq .dependencies

# Error context extraction
sed -n 'start,end p' filename
grep -n -B5 -A5 "error_pattern" filename
```

## Appendix B: Emergency Escalation Contacts
| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Technical Lead | [Name] | [Contact] | [Hours] |
| Architecture Team | [Name] | [Contact] | [Hours] |
| DevOps Lead | [Name] | [Contact] | [Hours] |
| Security Team | [Name] | [Contact] | [Hours] |