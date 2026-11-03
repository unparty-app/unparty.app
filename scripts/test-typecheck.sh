#!/bin/bash

# Local TypeCheck Testing Script
# Tests the same logic used in the GitHub workflow

set -e

echo "🔍 TypeCheck Local Testing Script"
echo "================================="

# Create results directory
mkdir -p build-results
rm -f build-results/*

echo "📦 Installing dependencies..."
npm ci > /dev/null 2>&1

echo "🔧 Generating Prisma client..."
npx prisma generate > /dev/null 2>&1

echo "🏗️ Running build and capturing output..."

# Run build and capture all output
set +e  # Don't exit on error
npm run build > build-results/build-output.log 2>&1
BUILD_EXIT_CODE=$?
set -e

echo "Build exit code: $BUILD_EXIT_CODE"

# Parse TypeScript/ESLint errors and warnings - combine file paths with their warnings
awk '
/^\.\/.*$/ { file = $0; getline; if (/^[0-9]+:[0-9]+/) { print file ":" $0 } }
' build-results/build-output.log | grep -E "(Error|Warning):" > build-results/ts-errors.log || true

# Parse runtime errors
cat build-results/build-output.log | grep -A5 -B5 "Error:" | head -50 > build-results/runtime-errors.log || true

# Count errors
TS_ERROR_COUNT=$(cat build-results/ts-errors.log | wc -l || echo "0")
RUNTIME_ERROR_COUNT=$(cat build-results/runtime-errors.log | grep "Error:" | wc -l || echo "0")

echo "📊 Results:"
echo "  TypeScript errors: $TS_ERROR_COUNT"
echo "  Runtime errors: $RUNTIME_ERROR_COUNT"

if [[ "$TS_ERROR_COUNT" -gt 0 ]]; then
    echo ""
    echo "🚨 TypeScript Errors Found:"
    echo "-------------------------"
    
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            echo "Processing: $line"
            
            # Extract file path and line number from Next.js/ESLint format
            # Format: ./file:line:column  (Error|Warning): Message
            if [[ $line =~ ^(\./[^:]+):([0-9]+):([0-9]+)[[:space:]]+([^:]+):[[:space:]]*(.+)$ ]]; then
                FILE="${BASH_REMATCH[1]}"
                LINE_NUM="${BASH_REMATCH[2]}"
                COLUMN="${BASH_REMATCH[3]}"
                FULL_MSG="${BASH_REMATCH[4]}:${BASH_REMATCH[5]}"
                
                # Extract error type
                if [[ $FULL_MSG =~ ([[:space:]]*)(Error|Warning):[[:space:]]*(.+)$ ]]; then
                    ERROR_TYPE="${BASH_REMATCH[2]}"
                    ERROR_MSG="${BASH_REMATCH[3]}"
                else
                    ERROR_TYPE="Warning"
                    ERROR_MSG="$FULL_MSG"
                fi
                
                # Clean file path
                FILE=$(echo "$FILE" | sed 's/^\.\///')
                
                # Determine issue type
                if [[ "$ERROR_TYPE" == "Error" ]]; then
                    PRIORITY="🚨 BLOCKING"
                    LABEL_COLOR="2a1314"
                else
                    PRIORITY="⚠️ WARNING"
                    LABEL_COLOR="0d3868"
                fi
                
                echo ""
                echo "  📁 File: $FILE"
                echo "  📍 Line: $LINE_NUM:$COLUMN"
                echo "  🏷️ Type: $PRIORITY $ERROR_TYPE"
                echo "  💬 Message: $ERROR_MSG"
                echo "  🎨 Label Color: #$LABEL_COLOR"
                echo "  ---"
                
                # Save to issues file for GitHub CLI testing
                ISSUE_TITLE="$PRIORITY TypeScript $ERROR_TYPE in $FILE:$LINE_NUM"
                echo "$ISSUE_TITLE" >> build-results/potential-issues.txt
                
            else
                echo "  ❌ Could not parse: $line"
            fi
        fi
    done < build-results/ts-errors.log
fi

if [[ "$RUNTIME_ERROR_COUNT" -gt 0 ]]; then
    echo ""
    echo "⚡ Runtime Errors Found:"
    echo "----------------------"
    
    grep -n "Error:" build-results/runtime-errors.log | while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            ERROR_MSG=$(echo "$line" | sed 's/^[0-9]*://' | sed 's/Error: //')
            echo ""
            echo "  🚨 Runtime Error: $ERROR_MSG"
            echo "  🎨 Label Color: #2a1314"
            echo "  ---"
            
            ISSUE_TITLE="🚨 BLOCKING Runtime Error: $ERROR_MSG"
            echo "$ISSUE_TITLE" >> build-results/potential-issues.txt
        fi
    done
fi

echo ""
echo "📝 Full Build Output:"
echo "-------------------"
cat build-results/build-output.log

if [[ -f "build-results/potential-issues.txt" ]]; then
    ISSUE_COUNT=$(wc -l < build-results/potential-issues.txt)
    echo ""
    echo "🎫 Potential GitHub Issues: $ISSUE_COUNT"
    echo ""
    echo "Issue Titles:"
    cat build-results/potential-issues.txt | sed 's/^/  - /'
fi

echo ""
echo "✅ Testing complete! Check build-results/ for detailed logs."

if [[ "$BUILD_EXIT_CODE" -eq 0 ]]; then
    echo "🎉 Build passed - no issues would be created in GitHub!"
    exit 0
else
    echo "❌ Build failed - issues would be created in GitHub"
    exit 1
fi