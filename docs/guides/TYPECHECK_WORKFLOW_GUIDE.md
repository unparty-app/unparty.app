# TypeCheck Workflow - Fixed and Enhanced

This document explains the fixes applied to the `typecheck.yml` workflow and how to use it.

## Issues Fixed

### 1. Missing `issues-to-create.txt` File Generation
**Problem**: The workflow wasn't generating the issues file, causing the issue creation step to skip.
**Solution**: 
- Added proper file initialization with `touch build-results/issues-to-create.txt`
- Fixed subshell issue in runtime error processing using process substitution
- Added validation steps to ensure file exists and has content

### 2. Complex Bash Parsing Failures
**Problem**: Complex regex parsing was failing silently and not handling edge cases.
**Solution**:
- Simplified and improved regex parsing with better error handling
- Added comprehensive validation for parsed components
- Enhanced debugging output to track parsing progress

### 3. No Debugging Visibility
**Problem**: No visibility into intermediate processing steps made troubleshooting impossible.
**Solution**:
- Added "Debug - Show intermediate files" step
- Added "Debug - Check issues file before creation" step
- Added extensive logging throughout all processing steps

### 4. GitHub Actions Syntax Conflicts
**Problem**: `${{ }}` syntax caused failures during local testing.
**Solution**:
- Added fallback values for all GitHub Actions variables
- Made workflow testable locally without GitHub Actions context

### 5. Pipe Delimiter Conflicts
**Problem**: Error messages containing pipe characters broke the pipe-delimited format.
**Solution**:
- Switched from pipe (`|`) to tab (`\t`) delimiters
- Used proper `printf` formatting for reliable output

### 6. Runtime Error Processing Subshell Issue
**Problem**: `grep | while` loop created subshell, preventing file writes from persisting.
**Solution**:
- Changed from `grep ... | while` to `while ... < <(grep ...)`
- Fixed variable scope issues in runtime error processing

## How to Test Locally

### Prerequisites
- Node.js and npm installed
- Repository cloned and dependencies installed (`npm install`)

### Quick Test
```bash
# Run a quick validation
cd /path/to/repository
npm run build > /tmp/build.log 2>&1
echo "Build exit code: $?"

# Check for TypeScript errors
grep -E "(Error|Warning):" /tmp/build.log | head -5
```

### Full Workflow Simulation
Create a test script to simulate the complete workflow:

```bash
#!/bin/bash
# Save this as test-typecheck-workflow.sh

cd /path/to/repository

echo "=== TypeCheck Workflow Simulation ==="

# Clean up
rm -rf build-results
mkdir -p build-results

# Step 1: Build and capture output
set +e
npm run build > build-results/build-output.log 2>&1
BUILD_EXIT_CODE=$?
set -e

# Step 2: Parse errors
awk '/^\.\/.*$/ { file = $0; getline; if (/^[0-9]+:[0-9]+/) { print file ":" $0 } }' \
  build-results/build-output.log | grep -E "(Error|Warning):" > build-results/ts-errors.log || true

cat build-results/build-output.log | grep -A5 -B5 "Error:" | head -50 > build-results/runtime-errors.log || true

# Step 3: Count errors
TS_ERROR_COUNT=$(cat build-results/ts-errors.log | wc -l || echo "0")
RUNTIME_ERROR_COUNT=$(cat build-results/runtime-errors.log | grep "Error:" | wc -l || echo "0")

echo "Build Exit Code: $BUILD_EXIT_CODE"
echo "TypeScript Errors: $TS_ERROR_COUNT"
echo "Runtime Errors: $RUNTIME_ERROR_COUNT"

# Step 4: Process TypeScript errors
if [[ "$TS_ERROR_COUNT" != "0" ]]; then
    touch build-results/issues-to-create.txt
    
    while IFS= read -r line; do
      if [[ -n "$line" && $line =~ ^(\./[^:]+):([0-9]+):([0-9]+)[[:space:]]+([^:]+):[[:space:]]*(.+)$ ]]; then
        FILE="${BASH_REMATCH[1]#./}"
        LINE_NUM="${BASH_REMATCH[2]}"
        COLUMN="${BASH_REMATCH[3]}"
        FULL_MSG="${BASH_REMATCH[4]}:${BASH_REMATCH[5]}"
        
        if [[ $FULL_MSG =~ ([[:space:]]*)(Error|Warning):[[:space:]]*(.+)$ ]]; then
          ERROR_TYPE="${BASH_REMATCH[2]}"
          ERROR_MSG="${BASH_REMATCH[3]}"
        else
          ERROR_TYPE="Warning"
          ERROR_MSG="$FULL_MSG"
        fi
        
        PRIORITY="$([ "$ERROR_TYPE" = "Error" ] && echo "🚨 BLOCKING" || echo "⚠️ WARNING")"
        ISSUE_TYPE="$([ "$ERROR_TYPE" = "Error" ] && echo "blocking" || echo "warning")"
        
        ISSUE_TITLE="$PRIORITY TypeScript $ERROR_TYPE in $FILE:$LINE_NUM"
        ISSUE_BODY="TypeScript Build $ERROR_TYPE in $FILE at line $LINE_NUM:$COLUMN - $ERROR_MSG"
        
        printf "%s\t%s\t%s\t%s\n" "$ISSUE_TITLE" "$ISSUE_BODY" "$ISSUE_TYPE" "0d3868" >> build-results/issues-to-create.txt
      fi
    done < build-results/ts-errors.log
fi

# Step 5: Process runtime errors
if [[ "$RUNTIME_ERROR_COUNT" != "0" ]]; then
    touch build-results/issues-to-create.txt
    
    while IFS= read -r line; do
      if [[ -n "$line" ]]; then
        ERROR_MSG=$(echo "$line" | sed 's/^[0-9]*://' | sed 's/Error: //')
        ISSUE_TITLE="🚨 BLOCKING Runtime Error: $ERROR_MSG"
        ISSUE_BODY="Runtime Build Error: $ERROR_MSG"
        
        printf "%s\t%s\t%s\t%s\n" "$ISSUE_TITLE" "$ISSUE_BODY" "blocking" "2a1314" >> build-results/issues-to-create.txt
      fi
    done < <(grep -n "Error:" build-results/runtime-errors.log)
fi

# Step 6: Validate results
if [[ -f "build-results/issues-to-create.txt" && -s "build-results/issues-to-create.txt" ]]; then
  echo "✅ Issues file created: $(wc -l < build-results/issues-to-create.txt) issues"
  
  # Validate parsing
  PARSED=0
  while IFS=$'\t' read -r title body type label_color; do
    [[ -n "$title" && -n "$body" && -n "$type" && -n "$label_color" ]] && ((PARSED++))
  done < build-results/issues-to-create.txt
  
  echo "✅ All $PARSED issues parse correctly"
  echo "Sample issues:"
  head -3 build-results/issues-to-create.txt | cut -f1 | sed 's/^/  /'
else
  echo "❌ No issues file generated"
fi

echo "=== Simulation Complete ==="
```

## Workflow Triggers

The workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch  
- Manual dispatch (`workflow_dispatch`)

## Issue Creation Behavior

### TypeScript/ESLint Issues
- **Title**: `⚠️ WARNING TypeScript Warning in [file]:[line]`
- **Labels**: `typecheck`, `warning`, `automated`
- **Priority**: Non-blocking warnings

### Runtime Errors  
- **Title**: `🚨 BLOCKING Runtime Error: [error message]`
- **Labels**: `typecheck`, `blocking`, `automated`
- **Priority**: Deployment blocking

### Duplicate Prevention
The workflow includes basic duplicate detection to avoid creating multiple issues for the same error.

## Debugging

If issues aren't being created:

1. **Check workflow logs** for the debug steps:
   - "Debug - Show intermediate files"
   - "Debug - Check issues file before creation"

2. **Verify file generation**:
   - `ts-errors.log` should contain parsed TypeScript errors
   - `runtime-errors.log` should contain runtime errors
   - `issues-to-create.txt` should contain tab-delimited issue data

3. **Check conditional logic**:
   - Verify `TS_ERROR_COUNT` and `RUNTIME_ERROR_COUNT` outputs
   - Ensure `hashFiles('build-results/issues-to-create.txt') != ''` condition

4. **Test locally** using the simulation script above

## File Formats

### TypeScript Errors Log (`ts-errors.log`)
```
./src/app/file.tsx:42:10  Warning: Error message here  rule-name
```

### Issues File (`issues-to-create.txt`) 
Tab-delimited format:
```
[title]	[body]	[type]	[label_color]
```

Example:
```
⚠️ WARNING TypeScript Warning in src/app/file.tsx:42	TypeScript Build Warning in src/app/file.tsx at line 42:10 - Error message	warning	0d3868
```

## Maintenance

- **Labels**: The workflow automatically creates required labels (`typecheck`, `blocking`, `warning`, `automated`)
- **Assignees**: Issues are assigned to the workflow trigger actor
- **Cleanup**: Build artifacts are excluded from git via `.gitignore`